const prisma = require('../config/db');
const { logActivity } = require('../middleware/logger');

async function getExpenses(req, res) {
  try {
    const { startDate, endDate, categoryId } = req.query;
    const where = {};

    if (categoryId) where.categoryId = categoryId;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) where.expenseDate.lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: true,
        user: { select: { name: true } },
      },
      orderBy: { expenseDate: 'desc' },
    });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
}

async function createExpense(req, res) {
  try {
    const { title, categoryId, amount, notes, expenseDate } = req.body;

    if (!title || !categoryId || !amount) {
      return res.status(400).json({ error: 'Title, Category, and Amount are required' });
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        categoryId,
        amount: Number(amount),
        notes,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        branchId: req.user.branchId,
        userId: req.user.id,
      },
      include: { category: true },
    });

    await logActivity(req.user.id, 'CREATE_EXPENSE', `Recorded expense "${title}" (Rs. ${amount})`);
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
}

async function getExpenseCategories(req, res) {
  try {
    const categories = await prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expense categories' });
  }
}

module.exports = {
  getExpenses,
  createExpense,
  getExpenseCategories,
};
