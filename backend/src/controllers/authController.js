const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateToken } = require('../config/jwt');
const { logActivity } = require('../middleware/logger');

async function login(req, res) {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail.toLowerCase().trim() },
          { email: usernameOrEmail.toLowerCase().trim() },
        ],
      },
      include: { branch: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'User account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    const ipAddress = req.ip || req.connection.remoteAddress;

    await logActivity(user.id, 'USER_LOGIN', `Logged in from IP: ${ipAddress}`, ipAddress);

    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
}

async function getMe(req, res) {
  try {
    const { passwordHash, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

async function createUser(req, res) {
  try {
    const { username, email, password, name, role, branchId } = req.body;

    if (!username || !email || !password || !name || !role) {
      return res.status(400).json({ error: 'All fields (username, email, password, name, role) are required' });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: username.toLowerCase().trim() }, { email: email.toLowerCase().trim() }],
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Username or Email already exists' });
    }

    let targetBranchId = branchId;
    if (!targetBranchId) {
      const mainBranch = await prisma.branch.findFirst({ where: { isMain: true } });
      targetBranchId = mainBranch ? mainBranch.id : req.user.branchId;
    }

    const hash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        passwordHash: hash,
        name,
        role,
        branchId: targetBranchId,
        status: 'ACTIVE',
      },
      include: { branch: true },
    });

    await logActivity(req.user.id, 'CREATE_USER', `Created new user ${newUser.username} (${newUser.role})`);

    const { passwordHash, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, role, status, password } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (password && password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { branch: true },
    });

    await logActivity(req.user.id, 'UPDATE_USER', `Updated user ${updatedUser.username}`);

    const { passwordHash, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
}

async function getActivityLogs(req, res) {
  try {
    const logs = await prisma.activityLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { username: true, name: true, role: true },
        },
      },
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
}

module.exports = {
  login,
  getMe,
  getUsers,
  createUser,
  updateUser,
  getActivityLogs,
};
