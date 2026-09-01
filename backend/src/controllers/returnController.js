const prisma = require('../config/db');
const { logActivity } = require('../middleware/logger');

function generateReturnNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `RET-${dateStr}-${randomSuffix}`;
}

async function processReturn(req, res) {
  try {
    const { saleId, items, refundMethod = 'CASH', reason } = req.body;

    if (!saleId || !items || !Array.isArray(items) || items.length === 0 || !reason) {
      return res.status(400).json({ error: 'Sale invoice ID, return items list, and reason are required' });
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true, customer: true },
    });

    if (!sale) return res.status(404).json({ error: 'Original sale invoice not found' });

    if (sale.paymentStatus === 'VOIDED') {
      return res.status(400).json({ error: 'Cannot process return against a voided invoice' });
    }

    let totalRefundAmount = 0;
    const returnNumber = generateReturnNumber();

    const returnRecord = await prisma.$transaction(async (tx) => {
      // 1. Create Return Header
      const newReturn = await tx.return.create({
        data: {
          returnNumber,
          saleId,
          customerId: sale.customerId || null,
          processedById: req.user.id,
          branchId: req.user.branchId,
          totalRefundAmount: 0, // updated after item calculation
          refundMethod,
          reason,
        },
      });

      for (const item of items) {
        const { saleItemId, quantity, returnToStock = true } = item;
        const saleItem = sale.items.find((si) => si.id === saleItemId);

        if (!saleItem) {
          throw new Error(`Sale item ID ${saleItemId} not found on invoice ${sale.invoiceNumber}`);
        }

        if (quantity > saleItem.quantity) {
          throw new Error(`Return quantity (${quantity}) exceeds purchased quantity (${saleItem.quantity}) for ${saleItem.productName}`);
        }

        const refundPerUnit = saleItem.total / saleItem.quantity;
        const itemRefund = Math.round(refundPerUnit * quantity * 100) / 100;
        totalRefundAmount += itemRefund;

        // Create ReturnItem record
        await tx.returnItem.create({
          data: {
            returnId: newReturn.id,
            saleItemId,
            productId: saleItem.productId,
            quantity: Number(quantity),
            refundAmount: itemRefund,
            returnToStock,
          },
        });

        // Replenish product inventory if returnToStock is true
        if (returnToStock) {
          await tx.product.update({
            where: { id: saleItem.productId },
            data: {
              stockQuantity: { increment: Number(quantity) },
            },
          });
        }
      }

      // Update Return total refund amount
      const updatedReturn = await tx.return.update({
        where: { id: newReturn.id },
        data: { totalRefundAmount },
      });

      // Update original sale status (REFUNDED or PARTIALLY_REFUNDED)
      await tx.sale.update({
        where: { id: saleId },
        data: {
          paymentStatus: 'REFUNDED',
        },
      });

      return updatedReturn;
    });

    await logActivity(
      req.user.id,
      'PROCESS_RETURN',
      `Processed return ${returnNumber} for invoice ${sale.invoiceNumber} (Refund: Rs. ${totalRefundAmount})`
    );

    const result = await prisma.return.findUnique({
      where: { id: returnRecord.id },
      include: {
        sale: { select: { invoiceNumber: true } },
        processedBy: { select: { name: true } },
        items: { include: { product: true } },
      },
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Process return error:', error);
    res.status(500).json({ error: error.message || 'Failed to process return' });
  }
}

async function getReturns(req, res) {
  try {
    const returns = await prisma.return.findMany({
      include: {
        sale: { select: { invoiceNumber: true } },
        customer: { select: { name: true, phone: true } },
        processedBy: { select: { name: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(returns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch returns history' });
  }
}

module.exports = {
  processReturn,
  getReturns,
};
