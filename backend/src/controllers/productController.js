const prisma = require('../config/db');
const { logActivity } = require('../middleware/logger');
const { Parser } = require('json2csv');

async function getProducts(req, res) {
  try {
    const { search, categoryId, lowStock, isActive = 'true' } = req.query;

    const where = {};
    if (isActive !== 'all') {
      where.isActive = isActive === 'true';
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { barcode: { contains: q } },
      ];
    }

    let products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    if (lowStock === 'true') {
      products = products.filter((p) => p.stockQuantity <= p.minStockThreshold);
    }

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

async function getProductByBarcode(req, res) {
  try {
    const { barcode } = req.params;
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ barcode: barcode.trim() }, { sku: barcode.trim() }],
        isActive: true,
      },
      include: { category: true },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found with barcode ' + barcode });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Barcode lookup failed' });
  }
}

async function createProduct(req, res) {
  try {
    const {
      name,
      sku,
      barcode,
      categoryId,
      costPrice,
      sellingPrice,
      taxRate,
      stockQuantity,
      minStockThreshold,
      unit,
      imageUrl,
    } = req.body;

    if (!name || !sku || !barcode || !categoryId) {
      return res.status(400).json({ error: 'Name, SKU, Barcode, and Category are required' });
    }

    // Check duplicate SKU or barcode
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ sku: sku.trim() }, { barcode: barcode.trim() }],
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Product SKU or Barcode already exists' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku: sku.trim(),
        barcode: barcode.trim(),
        categoryId,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        taxRate: Number(taxRate) || 0,
        stockQuantity: Number(stockQuantity) || 0,
        minStockThreshold: Number(minStockThreshold) || 5,
        unit: unit || 'pcs',
        imageUrl,
      },
      include: { category: true },
    });

    await logActivity(req.user.id, 'CREATE_PRODUCT', `Created product ${product.name} (SKU: ${product.sku})`);

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.costPrice !== undefined) data.costPrice = Number(data.costPrice);
    if (data.sellingPrice !== undefined) data.sellingPrice = Number(data.sellingPrice);
    if (data.taxRate !== undefined) data.taxRate = Number(data.taxRate);
    if (data.stockQuantity !== undefined) data.stockQuantity = Number(data.stockQuantity);
    if (data.minStockThreshold !== undefined) data.minStockThreshold = Number(data.minStockThreshold);

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });

    await logActivity(req.user.id, 'UPDATE_PRODUCT', `Updated product ${product.name}`);

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    // Check if product is referenced in sales
    const salesCount = await prisma.saleItem.count({ where: { productId: id } });
    if (salesCount > 0) {
      // Soft delete by setting isActive to false
      const updated = await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      await logActivity(req.user.id, 'DEACTIVATE_PRODUCT', `Deactivated product ${updated.name}`);
      return res.json({ message: 'Product has transaction history. Deactivated instead of permanently deleting.', product: updated });
    }

    const deleted = await prisma.product.delete({ where: { id } });
    await logActivity(req.user.id, 'DELETE_PRODUCT', `Deleted product ${deleted.name}`);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

async function createCategory(req, res) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existing) return res.status(400).json({ error: 'Category already exists' });

    const category = await prisma.category.create({
      data: { name: name.trim(), description },
    });

    await logActivity(req.user.id, 'CREATE_CATEGORY', `Created category ${category.name}`);

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
}

async function adjustStock(req, res) {
  try {
    const { productId, quantityChange, type, reason, notes } = req.body;

    if (!productId || quantityChange === undefined || !type || !reason) {
      return res.status(400).json({ error: 'productId, quantityChange, type, and reason are required' });
    }

    const changeVal = Math.abs(Number(quantityChange));
    const delta = type === 'ADD' ? changeVal : -changeVal;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const newStock = Math.max(0, product.stockQuantity + delta);

    const [updatedProduct, adjustment] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: newStock },
      }),
      prisma.stockAdjustment.create({
        data: {
          productId,
          branchId: req.user.branchId,
          userId: req.user.id,
          quantityChange: delta,
          type,
          reason,
          notes,
        },
      }),
    ]);

    await logActivity(
      req.user.id,
      'STOCK_ADJUSTMENT',
      `Stock adjusted for ${product.name}: ${delta > 0 ? '+' : ''}${delta} (${reason})`
    );

    res.json({ product: updatedProduct, adjustment });
  } catch (error) {
    console.error('Stock adjustment error:', error);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
}

async function exportCSV(req, res) {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    const fields = [
      'name',
      'sku',
      'barcode',
      { label: 'Category', value: 'category.name' },
      'costPrice',
      'sellingPrice',
      'taxRate',
      'stockQuantity',
      'minStockThreshold',
      'unit',
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(products);

    res.header('Content-Type', 'text/csv');
    res.attachment('products_export.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
}

module.exports = {
  getProducts,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  adjustStock,
  exportCSV,
};
