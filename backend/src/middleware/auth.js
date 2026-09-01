const { verifyToken } = require('../config/jwt');
const prisma = require('../config/db');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired authentication token' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { branch: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account is inactive or not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication server error', details: error.message });
  }
}

module.exports = { authenticateToken };
