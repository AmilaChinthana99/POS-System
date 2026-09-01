const prisma = require('../config/db');
const { Parser } = require('json2csv');

async function getDashboardSummary(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Fetch Today's sales metrics
    const todaySales = await prisma.sale.aggregate({
      where: {
        createdAt: { gte: today },
        paymentStatus: 'COMPLETED',
      },
      _sum: { grandTotal: true, subtotal: true },
      _count: { id: true },
    });

    // Fetch Month's sales metrics
    const monthSales = await prisma.sale.aggregate({
      where: {
        createdAt: { gte: firstDayOfMonth },
        paymentStatus: 'COMPLETED',
      },
      _sum: { grandTotal: true },
      _count: { id: true },
    });

    const totalRevenueToday = todaySales._sum.grandTotal || 0;
    const totalTransactionsToday = todaySales._count.id || 0;
    const averageSaleValue = totalTransactionsToday > 0 ? totalRevenueToday / totalTransactionsToday : 0;
    const totalRevenueMonth = monthSales._sum.grandTotal || 0;

    // Fetch Low Stock Count & Products
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: { select: { name: true } } },
    });

    const lowStockProducts = allProducts.filter((p) => p.stockQuantity <= p.minStockThreshold);

    // Fetch Top Selling Products (grouped by saleItem quantity)
    const saleItems = await prisma.saleItem.groupBy({
      by: ['productId', 'productName'],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    // Fetch Recent 10 Transactions
    const recentTransactions = await prisma.sale.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        cashier: { select: { name: true } },
        customer: { select: { name: true } },
      },
    });

    // Daily Sales chart data (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const daySales = await prisma.sale.aggregate({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
          paymentStatus: 'COMPLETED',
        },
        _sum: { grandTotal: true },
        _count: { id: true },
      });

      last7Days.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: daySales._sum.grandTotal || 0,
        transactions: daySales._count.id || 0,
      });
    }

    res.json({
      summary: {
        totalRevenueToday,
        totalTransactionsToday,
        averageSaleValue,
        totalRevenueMonth,
        lowStockCount: lowStockProducts.length,
      },
      lowStockProducts: lowStockProducts.slice(0, 5),
      topSellingProducts: saleItems.map((item) => ({
        id: item.productId,
        name: item.productName,
        totalQty: item._sum.quantity,
        totalRevenue: item._sum.total,
      })),
      recentTransactions,
      salesChartData: last7Days,
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Failed to generate dashboard summary' });
  }
}

async function getSalesReport(req, res) {
  try {
    const { startDate, endDate, cashierId, paymentMethod } = req.query;

    const where = { paymentStatus: 'COMPLETED' };
    if (cashierId) where.cashierId = cashierId;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        cashier: { select: { name: true } },
        customer: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totals = sales.reduce(
      (acc, s) => {
        acc.subtotal += s.subtotal;
        acc.discountAmount += s.discountAmount;
        acc.taxAmount += s.taxAmount;
        acc.grandTotal += s.grandTotal;
        return acc;
      },
      { subtotal: 0, discountAmount: 0, taxAmount: 0, grandTotal: 0 }
    );

    res.json({ sales, totals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate sales report' });
  }
}

async function getProfitLossReport(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const dateWhere = {};
    if (startDate || endDate) {
      dateWhere.createdAt = {};
      if (startDate) dateWhere.createdAt.gte = new Date(startDate);
      if (endDate) dateWhere.createdAt.lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }

    // Fetch Completed Sales
    const sales = await prisma.sale.findMany({
      where: { ...dateWhere, paymentStatus: 'COMPLETED' },
      include: { items: true },
    });

    let totalRevenue = 0;
    let totalCostOfGoodsSold = 0;
    let totalDiscountsGiven = 0;
    let totalTaxCollected = 0;

    sales.forEach((s) => {
      totalRevenue += s.grandTotal;
      totalDiscountsGiven += s.discountAmount;
      totalTaxCollected += s.taxAmount;

      s.items.forEach((item) => {
        totalCostOfGoodsSold += (item.costPrice || 0) * item.quantity;
      });
    });

    // Fetch Expenses in date range
    const expenseWhere = {};
    if (startDate || endDate) {
      expenseWhere.expenseDate = {};
      if (startDate) expenseWhere.expenseDate.gte = new Date(startDate);
      if (endDate) expenseWhere.expenseDate.lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }

    const expenses = await prisma.expense.aggregate({
      where: expenseWhere,
      _sum: { amount: true },
    });

    const totalOperatingExpenses = expenses._sum.amount || 0;
    const grossProfit = totalRevenue - totalCostOfGoodsSold;
    const netProfit = grossProfit - totalOperatingExpenses;

    res.json({
      totalRevenue,
      totalCostOfGoodsSold,
      grossProfit,
      totalOperatingExpenses,
      netProfit,
      totalDiscountsGiven,
      totalTaxCollected,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate profit and loss report' });
  }
}

async function getStockReport(req, res) {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    const totalStockValueCost = products.reduce((sum, p) => sum + p.costPrice * p.stockQuantity, 0);
    const totalStockValueRetail = products.reduce((sum, p) => sum + p.sellingPrice * p.stockQuantity, 0);

    const adjustments = await prisma.stockAdjustment.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, sku: true } },
        user: { select: { name: true } },
      },
    });

    res.json({
      products,
      totalProductsCount: products.length,
      totalStockValueCost,
      totalStockValueRetail,
      recentStockAdjustments: adjustments,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate stock report' });
  }
}

module.exports = {
  getDashboardSummary,
  getSalesReport,
  getProfitLossReport,
  getStockReport,
};
