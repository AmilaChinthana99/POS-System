const prisma = require('../config/db');
const { calculateSaleTotals } = require('../utils/calculation');
const { logActivity } = require('../middleware/logger');

function generateInvoiceNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${randomSuffix}`;
}

async function createSale(req, res) {
  try {
    const {
      items,
      customerId,
      overallDiscountPercent = 0,
      overallDiscountAmount = 0,
      payments = [],
      isHeld = false,
      holdReference,
      notes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart must contain at least one item' });
    }

    // Fetch settings for default tax rate
    const settings = await prisma.shopSettings.findFirst();
    const defaultTaxRate = settings ? settings.defaultTaxRate : 8.0;

    // Calculate totals
    const calculation = calculateSaleTotals({
      items,
      overallDiscountPercent,
      overallDiscountAmount,
      defaultTaxRate,
    });

    // Validate payments if not held
    let paidTotal = 0;
    if (!isHeld) {
      paidTotal = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      if (paidTotal < calculation.grandTotal) {
        return res.status(400).json({
          error: `Insufficient payment. Grand total is Rs. ${calculation.grandTotal.toFixed(2)}, but total paid is Rs. ${paidTotal.toFixed(2)}`,
        });
      }
    }

    const changeAmount = !isHeld ? Math.max(0, paidTotal - calculation.grandTotal) : 0;
    const invoiceNumber = generateInvoiceNumber();

    // Determine primary payment method label
    let primaryPaymentMethod = 'CASH';
    if (payments.length > 1) {
      primaryPaymentMethod = 'SPLIT';
    } else if (payments.length === 1) {
      primaryPaymentMethod = payments[0].paymentMethod || 'CASH';
    }

    // Execute Prisma transaction for atomic execution
    const newSale = await prisma.$transaction(async (tx) => {
      // 1. Create Sale Record
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          branchId: req.user.branchId,
          cashierId: req.user.id,
          customerId: customerId || null,
          subtotal: calculation.subtotal,
          discountAmount: calculation.discountAmount,
          taxAmount: calculation.taxAmount,
          grandTotal: calculation.grandTotal,
          paidAmount: paidTotal,
          changeAmount,
          paymentStatus: isHeld ? 'HELD' : 'COMPLETED',
          paymentMethod: primaryPaymentMethod,
          isHeld,
          holdReference: isHeld ? holdReference || `Held ${new Date().toLocaleTimeString()}` : null,
          notes,
        },
      });

      // 2. Create Sale Items & Deduct Product Stock (if not held)
      for (const item of calculation.processedItems) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.id || item.productId,
            productName: item.name || item.productName,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice,
            taxRate: item.taxRate !== undefined ? item.taxRate : defaultTaxRate,
            quantity: item.quantity,
            discountAmount: item.discountAmount,
            subtotal: item.subtotal,
            total: item.total,
          },
        });

        if (!isHeld) {
          await tx.product.update({
            where: { id: item.id || item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      // 3. Record Payment Breakdowns
      if (!isHeld && payments.length > 0) {
        for (const p of payments) {
          await tx.salePayment.create({
            data: {
              saleId: sale.id,
              paymentMethod: p.paymentMethod,
              amount: Number(p.amount),
              referenceNumber: p.referenceNumber || null,
            },
          });
        }
      }

      // 4. Update Customer Loyalty Points & Total Spent (if customer assigned & completed)
      if (!isHeld && customerId) {
        const pointsEarned = Math.floor(calculation.grandTotal / 100); // 1 point per 100 LKR
        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: { increment: pointsEarned },
            totalSpent: { increment: calculation.grandTotal },
          },
        });
      }

      return sale;
    });

    await logActivity(
      req.user.id,
      isHeld ? 'PARK_SALE' : 'COMPLETE_SALE',
      `Invoice ${invoiceNumber} (${isHeld ? 'Held' : 'Completed'}) - Grand Total: Rs. ${calculation.grandTotal}`
    );

    // Fetch full sale with items and cashier details for receipt response
    const fullSale = await prisma.sale.findUnique({
      where: { id: newSale.id },
      include: {
        cashier: { select: { name: true, username: true } },
        customer: true,
        items: { include: { product: true } },
        payments: true,
        branch: true,
      },
    });

    res.status(201).json(fullSale);
  } catch (error) {
    console.error('POS Sale creation error:', error);
    res.status(500).json({ error: 'Failed to process sale: ' + error.message });
  }
}

async function getHeldSales(req, res) {
  try {
    const heldSales = await prisma.sale.findMany({
      where: { isHeld: true },
      include: {
        cashier: { select: { name: true } },
        customer: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(heldSales);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch held sales' });
  }
}

async function deleteHeldSale(req, res) {
  try {
    const { id } = req.params;
    await prisma.sale.delete({ where: { id } });
    await logActivity(req.user.id, 'DELETE_HELD_SALE', `Deleted parked sale ID: ${id}`);
    res.json({ message: 'Parked sale deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete parked sale' });
  }
}

async function voidSale(req, res) {
  try {
    const { id } = req.params;
    const { reason, managerAuthPassword } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required to void a sale' });
    }

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) return res.status(404).json({ error: 'Sale transaction not found' });

    if (sale.paymentStatus === 'VOIDED') {
      return res.status(400).json({ error: 'Transaction is already voided' });
    }

    // Revert stock quantities & set status to VOIDED atomically
    await prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
          },
        });
      }

      await tx.sale.update({
        where: { id },
        data: {
          paymentStatus: 'VOIDED',
          voidReason: reason,
          voidedByUserId: req.user.id,
        },
      });
    });

    await logActivity(req.user.id, 'VOID_SALE', `Voided invoice ${sale.invoiceNumber} with reason: ${reason}`);

    res.json({ message: `Invoice ${sale.invoiceNumber} has been voided and inventory restored.` });
  } catch (error) {
    console.error('Void sale error:', error);
    res.status(500).json({ error: 'Failed to void transaction' });
  }
}

async function getSalesHistory(req, res) {
  try {
    const { search, status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      where.paymentStatus = status;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search.trim() } },
        { customer: { name: { contains: search.trim() } } },
        { customer: { phone: { contains: search.trim() } } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [sales, totalCount] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          cashier: { select: { name: true, username: true } },
          customer: { select: { name: true, phone: true } },
          items: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.sale.count({ where }),
    ]);

    res.json({
      sales,
      totalCount,
      totalPages: Math.ceil(totalCount / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales history' });
  }
}

async function getSaleDetails(req, res) {
  try {
    const { id } = req.params;
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        cashier: { select: { name: true, username: true } },
        customer: true,
        items: { include: { product: true } },
        payments: true,
        branch: true,
        returns: { include: { items: true } },
      },
    });

    if (!sale) return res.status(404).json({ error: 'Sale invoice not found' });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sale details' });
  }
}

async function syncOfflineSales(req, res) {
  try {
    const { offlineSales = [] } = req.body;
    const syncedInvoices = [];

    for (const saleData of offlineSales) {
      // Process each sale locally through createSale format logic
      const { items, customerId, overallDiscountPercent, overallDiscountAmount, payments, notes } = saleData;

      const settings = await prisma.shopSettings.findFirst();
      const defaultTaxRate = settings ? settings.defaultTaxRate : 8.0;

      const calculation = calculateSaleTotals({
        items,
        overallDiscountPercent,
        overallDiscountAmount,
        defaultTaxRate,
      });

      const paidTotal = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const changeAmount = Math.max(0, paidTotal - calculation.grandTotal);
      const invoiceNumber = saleData.invoiceNumber || generateInvoiceNumber();

      const synced = await prisma.$transaction(async (tx) => {
        const sale = await tx.sale.create({
          data: {
            invoiceNumber,
            branchId: req.user.branchId,
            cashierId: req.user.id,
            customerId: customerId || null,
            subtotal: calculation.subtotal,
            discountAmount: calculation.discountAmount,
            taxAmount: calculation.taxAmount,
            grandTotal: calculation.grandTotal,
            paidAmount: paidTotal,
            changeAmount,
            paymentStatus: 'COMPLETED',
            paymentMethod: payments.length > 1 ? 'SPLIT' : payments[0]?.paymentMethod || 'CASH',
            notes: notes ? `[OFFLINE SYNC] ${notes}` : '[OFFLINE SYNC]',
          },
        });

        for (const item of calculation.processedItems) {
          await tx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: item.id || item.productId,
              productName: item.name || item.productName,
              unitPrice: item.unitPrice,
              costPrice: item.costPrice,
              taxRate: item.taxRate !== undefined ? item.taxRate : defaultTaxRate,
              quantity: item.quantity,
              discountAmount: item.discountAmount,
              subtotal: item.subtotal,
              total: item.total,
            },
          });

          await tx.product.update({
            where: { id: item.id || item.productId },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        }

        for (const p of payments) {
          await tx.salePayment.create({
            data: {
              saleId: sale.id,
              paymentMethod: p.paymentMethod,
              amount: Number(p.amount),
              referenceNumber: p.referenceNumber || null,
            },
          });
        }

        return sale;
      });

      syncedInvoices.push(synced.invoiceNumber);
    }

    await logActivity(req.user.id, 'SYNC_OFFLINE_SALES', `Synced ${syncedInvoices.length} offline transactions`);

    res.json({ message: `Successfully synced ${syncedInvoices.length} offline transactions`, syncedInvoices });
  } catch (error) {
    console.error('Offline sync error:', error);
    res.status(500).json({ error: 'Failed to sync offline sales' });
  }
}

module.exports = {
  createSale,
  getHeldSales,
  deleteHeldSale,
  voidSale,
  getSalesHistory,
  getSaleDetails,
  syncOfflineSales,
};
