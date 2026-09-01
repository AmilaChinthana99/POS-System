const prisma = require('../config/db');
const { logActivity } = require('../middleware/logger');

async function getCustomers(req, res) {
  try {
    const { search } = req.query;
    const where = {};
    if (search) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: { select: { sales: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
}

async function createCustomer(req, res) {
  try {
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Customer Name and Phone Number are required' });
    }

    const existing = await prisma.customer.findUnique({ where: { phone: phone.trim() } });
    if (existing) {
      return res.status(400).json({ error: 'Customer with this phone number already exists' });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: phone.trim(),
        email: email ? email.trim() : null,
        address,
      },
    });

    await logActivity(req.user.id, 'CREATE_CUSTOMER', `Added new customer ${customer.name} (${customer.phone})`);

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
}

async function updateCustomer(req, res) {
  try {
    const { id } = req.params;
    const { name, phone, email, address, loyaltyPoints } = req.body;

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(loyaltyPoints !== undefined && { loyaltyPoints: Number(loyaltyPoints) }),
      },
    });

    await logActivity(req.user.id, 'UPDATE_CUSTOMER', `Updated customer ${updated.name}`);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
}

async function getCustomerHistory(req, res) {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
        returns: true,
      },
    });

    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer purchase history' });
  }
}

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  getCustomerHistory,
};
