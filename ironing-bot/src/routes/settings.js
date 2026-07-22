const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const prisma = require('../services/db');
const { authenticateAdmin } = require('../middleware/auth');

// Require Admin authorization
router.use(authenticateAdmin);

/**
 * GET /api/settings
 * Fetch the business metadata settings configuration (ID = 1).
 */
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.businessSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      // Create fallback default settings if not exists
      settings = await prisma.businessSettings.create({
        data: {
          id: 1,
          businessName: "Ironing Service",
          businessAddress: "123 Main St",
          gstNumber: "",
          gstPercentage: 5.0,
          razorpayKeyId: "",
          razorpayKeySecret: "",
          razorpayWebhookSecret: "",
          whatsappToken: "",
          supportPhone: "",
          supportEmail: ""
        }
      });
    }
    return res.json(settings);
  } catch (error) {
    console.error('[Settings API] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch business settings' });
  }
});

/**
 * PUT /api/settings
 * Update business settings (ID = 1).
 */
router.put('/', async (req, res) => {
  const {
    businessName,
    businessAddress,
    gstNumber,
    gstPercentage,
    razorpayKeyId,
    razorpayKeySecret,
    razorpayWebhookSecret,
    whatsappToken,
    whatsappPhoneId,
    supportPhone,
    supportEmail
  } = req.body;

  try {
    const updated = await prisma.businessSettings.update({
      where: { id: 1 },
      data: {
        businessName,
        businessAddress,
        gstNumber,
        gstPercentage: parseFloat(gstPercentage) || 0.0,
        razorpayKeyId: (razorpayKeyId || '').trim(),
        razorpayKeySecret: (razorpayKeySecret || '').trim(),
        razorpayWebhookSecret: (razorpayWebhookSecret || '').trim(),
        whatsappToken: (whatsappToken || '').trim(),
        whatsappPhoneId: (whatsappPhoneId || '').trim(),
        supportPhone: supportPhone || "",
        supportEmail: supportEmail || ""
      }
    });

    console.log('[Settings API] Business settings updated successfully.');
    
    // Dynamically update process.env variables so they take effect instantly in the running backend
    if (whatsappToken) process.env.WHATSAPP_TOKEN = whatsappToken.trim();
    if (whatsappPhoneId) process.env.PHONE_ID = whatsappPhoneId.trim();
    if (razorpayKeyId) process.env.RAZORPAY_KEY_ID = razorpayKeyId.trim();
    if (razorpayKeySecret) process.env.RAZORPAY_KEY_SECRET = razorpayKeySecret.trim();
    if (razorpayWebhookSecret) process.env.RAZORPAY_WEBHOOK_SECRET = razorpayWebhookSecret.trim();

    return res.json(updated);
  } catch (error) {
    console.error('[Settings API] Update error:', error);
    return res.status(500).json({ error: 'Failed to update business settings' });
  }
});

/**
 * GET /api/settings/admins
 * Retrieve list of all administrators (excluding passwords).
 */
router.get('/admins', async (req, res) => {
  try {
    const admins = await prisma.adminUser.findMany({
      orderBy: { role: 'asc' },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        createdAt: true
      }
    });
    return res.json(admins);
  } catch (error) {
    console.error('[Settings API] Fetch admins error:', error);
    return res.status(500).json({ error: 'Failed to fetch administrators' });
  }
});

/**
 * POST /api/settings/admins
 * Register a new sub-admin user.
 */
router.post('/admins', async (req, res) => {
  const { username, password, name, role } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Username, password, and name are required' });
  }

  try {
    const existing = await prisma.adminUser.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const requestedRole = role || 'SUB_ADMIN';

    // Enforce 1 Super Admin and 1 Sub Admin account limit
    const existingRoleCount = await prisma.adminUser.count({
      where: { role: requestedRole }
    });

    if (existingRoleCount >= 1) {
      const roleLabel = requestedRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Sub Admin';
      return res.status(400).json({ 
        error: `${roleLabel} account already exists. Please delete the existing ${roleLabel} account to add a new one.` 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await prisma.adminUser.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: requestedRole,
        active: true
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true
      }
    });

    console.log(`[Settings API] New Admin account created: ${username}`);
    return res.status(214).json(newAdmin);
  } catch (error) {
    console.error('[Settings API] Create admin error:', error);
    return res.status(500).json({ error: 'Failed to register administrator' });
  }
});

/**
 * PUT /api/settings/admins/:id/toggle
 * Toggle active/inactive status of a sub-admin.
 */
router.put('/admins/:id/toggle', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const admin = await prisma.adminUser.findUnique({ where: { id } });
    if (!admin) {
      return res.status(404).json({ error: 'Administrator not found' });
    }

    if (admin.role === 'SUPER_ADMIN') {
      return res.status(400).json({ error: 'Cannot deactivate Super Admin accounts' });
    }

    const updated = await prisma.adminUser.update({
      where: { id },
      data: { active: !admin.active },
      select: { id: true, username: true, active: true }
    });

    console.log(`[Settings API] Admin ${admin.username} active status toggled to: ${updated.active}`);
    return res.json(updated);
  } catch (error) {
    console.error('[Settings API] Toggle admin status error:', error);
    return res.status(500).json({ error: 'Failed to update admin account status' });
  }
});

/**
 * DELETE /api/settings/admins/:id
 * Permanently delete a sub-admin/staff member.
 */
router.delete('/admins/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const admin = await prisma.adminUser.findUnique({ where: { id } });
    if (!admin) {
      return res.status(404).json({ error: 'Staff member not found' });
    }



    await prisma.adminUser.delete({
      where: { id }
    });

    console.log(`[Settings API] Staff member ${admin.username} permanently deleted.`);
    return res.json({ success: true });
  } catch (error) {
    console.error('[Settings API] Delete staff error:', error);
    return res.status(500).json({ error: 'Failed to delete staff member account' });
  }
});

/**
 * PUT /api/settings/admins/:id
 * Update administrator account details (name, username, optional password).
 */
router.put('/admins/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, username, password } = req.body;

  if (!name || !username) {
    return res.status(400).json({ error: 'Name and Username are required' });
  }

  try {
    const admin = await prisma.adminUser.findUnique({ where: { id } });
    if (!admin) {
      return res.status(404).json({ error: 'Administrator not found' });
    }

    // Check username conflict with others
    const existing = await prisma.adminUser.findFirst({
      where: {
        username,
        NOT: { id }
      }
    });
    if (existing) {
      return res.status(400).json({ error: 'Username already taken by another account' });
    }

    const updateData = {
      name,
      username
    };

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.adminUser.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    console.log(`[Settings API] Admin ID ${id} account updated: ${username}`);
    return res.json(updated);
  } catch (error) {
    console.error('[Settings API] Update admin error:', error);
    return res.status(500).json({ error: 'Failed to update administrator account' });
  }
});

module.exports = router;
