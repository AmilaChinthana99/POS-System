const prisma = require('../config/db');
const { logActivity } = require('../middleware/logger');

function generatePONumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `PO-${dateStr}-${randomSuffix}`;
}

async function getSuppliers(req, res) {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: { select: { purchaseOrders: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
}

async function createSupplier(req, res) {
  try {
    const { name, contactPerson, phone, email, address } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Supplier Name and Phone are required' });

    const supplier = await prisma.supplier.create({
      data: { name, contactPerson, phone, email, address },
    });

    await logActivity(req.user.id, 'CREATE_SUPPLIER', `Created supplier ${supplier.name}`);
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create supplier' });
  }
}

async function getPurchaseOrders(req, res) {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(pos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
}

async function createPurchaseOrder(req, res) {
  try {
    const { supplierId, items = [], notes } = req.body;

    if (!supplierId || items.length === 0) {
      return res.status(400).json({ error: 'Supplier and PO items list are required' });
    }

    let totalAmount = 0;
    const poNumber = generatePONumber();

    const po = await prisma.$transaction(async (tx) => {
      const createdPO = await tx.purchaseOrder.create({
        data: {
          poNumber,
          supplierId,
          branchId: req.user.branchId,
          status: 'PENDING',
          totalAmount: 0,
          notes,
        },
      });

      for (const item of items) {
        const lineTotal = Number(item.quantityOrdered) * Number(item.unitCost);
        totalAmount += lineTotal;

        await tx.purchaseOrderItem.create({
          data: {
            purchaseOrderId: createdPO.id,
            productId: item.productId,
            quantityOrdered: Number(item.quantityOrdered),
            unitCost: Number(item.unitCost),
            totalCost: lineTotal,
          },
        });
      }

      return tx.purchaseOrder.update({
        where: { id: createdPO.id },
        data: { totalAmount },
      });
    });

    await logActivity(req.user.id, 'CREATE_PO', `Created Purchase Order ${poNumber} (Total: Rs. ${totalAmount})`);
    res.status(201).json(po);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
}

async function receiveGoods(req, res) {
  try {
    const { id } = req.params; // PO ID
    const { items = [] } = req.body;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!po) return res.status(404).json({ error: 'Purchase Order not found' });
    if (po.status === 'RECEIVED') return res.status(400).json({ error: 'PO has already been received' });

    await prisma.$transaction(async (tx) => {
      for (const recItem of items) {
        const qtyRec = Number(recItem.quantityReceived || 0);

        await tx.purchaseOrderItem.update({
          where: { id: recItem.id },
          data: { quantityReceived: qtyRec },
        });

        // Auto-replenish stock
        await tx.product.update({
          where: { id: recItem.productId },
          data: {
            stockQuantity: { increment: qtyRec },
          },
        });

        // Log stock adjustment
        await tx.stockAdjustment.create({
          data: {
            productId: recItem.productId,
            branchId: req.user.branchId,
            userId: req.user.id,
            quantityChange: qtyRec,
            type: 'ADD',
            reason: 'RESTOCK',
            notes: `GRN received for PO ${po.poNumber}`,
          },
        });
      }

      await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: 'RECEIVED',
          receivedAt: new Date(),
        },
      });
    });

    await logActivity(req.user.id, 'RECEIVE_GRN', `Goods received (GRN) for Purchase Order ${po.poNumber}`);
    res.json({ message: `Goods received and stock replenished for PO ${po.poNumber}` });
  } catch (error) {
    console.error('Receive goods error:', error);
    res.status(500).json({ error: 'Failed to process goods received note' });
  }
}

module.exports = {
  getSuppliers,
  createSupplier,
  getPurchaseOrders,
  createPurchaseOrder,
  receiveGoods,
};
