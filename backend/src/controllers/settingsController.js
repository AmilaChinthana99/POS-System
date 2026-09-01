const prisma = require('../config/db');
const { logActivity } = require('../middleware/logger');

async function getSettings(req, res) {
  try {
    let settings = await prisma.shopSettings.findFirst();
    if (!settings) {
      settings = await prisma.shopSettings.create({
        data: {
          shopName: 'EcoLife Plastic-Free Market',
          tagline: 'Sustainable & Eco-Friendly Goods',
          address: '123 Green Street, Colombo 03, Sri Lanka',
          phone: '+94 11 234 5678',
          email: 'contact@ecolifemarket.lk',
          taxNumber: 'VAT-987654321',
          currencySymbol: 'Rs.',
          currencyCode: 'LKR',
          receiptFooterText: 'Thank you for shopping green! Every step counts.',
          defaultTaxRate: 8.0,
          enableLoyalty: true,
        },
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

async function updateSettings(req, res) {
  try {
    const data = req.body;
    let settings = await prisma.shopSettings.findFirst();

    if (data.defaultTaxRate !== undefined) {
      data.defaultTaxRate = Number(data.defaultTaxRate);
    }

    if (!settings) {
      settings = await prisma.shopSettings.create({ data });
    } else {
      settings = await prisma.shopSettings.update({
        where: { id: settings.id },
        data,
      });
    }

    await logActivity(req.user.id, 'UPDATE_SETTINGS', 'Updated shop settings');
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
}

async function backupDatabase(req, res) {
  try {
    const [products, categories, users, customers, sales, expenses] = await Promise.all([
      prisma.product.findMany(),
      prisma.category.findMany(),
      prisma.user.findMany({ select: { id: true, username: true, email: true, role: true, name: true } }),
      prisma.customer.findMany(),
      prisma.sale.findMany({ include: { items: true, payments: true } }),
      prisma.expense.findMany(),
    ]);

    const dump = {
      backupTimestamp: new Date().toISOString(),
      shopName: 'EcoLife Plastic-Free Market',
      products,
      categories,
      users,
      customers,
      sales,
      expenses,
    };

    res.header('Content-Type', 'application/json');
    res.attachment(`ecopos_backup_${new Date().toISOString().slice(0, 10)}.json`);
    return res.send(JSON.stringify(dump, null, 2));
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate database backup' });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  backupDatabase,
};
