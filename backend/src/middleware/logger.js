const prisma = require('../config/db');

async function logActivity(userId, action, details = null, ipAddress = null) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

module.exports = { logActivity };
