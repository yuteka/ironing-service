const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../services/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_phrase';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const SUBADMIN_USERNAME = process.env.SUBADMIN_USERNAME || 'subadmin';
const SUBADMIN_PASSWORD = process.env.SUBADMIN_PASSWORD || 'subadmin123';

// POST /api/auth/admin/login
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const admin = await prisma.adminUser.findUnique({
      where: { username }
    });

    if (!admin || !admin.active) {
      return res.status(401).json({ error: 'Invalid admin credentials or inactive account' });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { 
        role: admin.role === 'SUPER_ADMIN' ? 'admin' : 'subadmin', 
        username: admin.username,
        adminId: admin.id
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    return res.json({ 
      token, 
      role: admin.role === 'SUPER_ADMIN' ? 'admin' : 'subadmin',
      name: admin.name,
      id: admin.id
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/partner/login
router.post('/partner/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const partner = await prisma.partner.findUnique({
      where: { username }
    });

    if (!partner || !partner.active) {
      return res.status(401).json({ error: 'Invalid partner credentials or inactive account' });
    }

    const match = await bcrypt.compare(password, partner.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid partner credentials' });
    }

    const token = jwt.sign(
      { role: 'partner', partnerId: partner.id, username: partner.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ token, role: 'partner', name: partner.name });
  } catch (error) {
    console.error('Partner login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
