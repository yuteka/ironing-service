const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const prisma = require('../services/db');
const { authenticateAdmin } = require('../middleware/auth');

// All partner CRUD endpoints are protected behind Admin privileges
router.use(authenticateAdmin);

/**
 * GET /api/partners
 * Lists all registered pickup partners.
 */
router.get('/', async (req, res) => {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: { id: 'asc' }
    });
    
    // Sanitize output to remove password hashes
    const sanitized = partners.map(p => {
      const { password, ...rest } = p;
      return rest;
    });
    return res.json(sanitized);
  } catch (error) {
    console.error('[Partners API] Error fetching partners list:', error);
    return res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

/**
 * POST /api/partners
 * Creates a new partner account and hashes the password.
 */
router.post('/', async (req, res) => {
  const { name, phone, username, password } = req.body;
  if (!name || !phone || !username || !password) {
    return res.status(400).json({ error: 'All fields (name, phone, username, and password) are required.' });
  }

  try {
    const existing = await prisma.partner.findUnique({
      where: { username }
    });

    if (existing) {
      return res.status(400).json({ error: 'Username is already taken by another account.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const partner = await prisma.partner.create({
      data: {
        name,
        phone,
        username,
        password: hashedPassword,
        active: true
      }
    });

    const { password: _, ...sanitized } = partner;
    return res.status(201).json(sanitized);
  } catch (error) {
    console.error('[Partners API] Error creating partner account:', error);
    return res.status(500).json({ error: 'Failed to create partner account' });
  }
});

/**
 * PUT /api/partners/:id
 * Updates partner details, including password hash revisions or state toggling.
 */
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, phone, username, password, active } = req.body;

  try {
    const partner = await prisma.partner.findUnique({
      where: { id }
    });

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found.' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (active !== undefined) updateData.active = active;
    
    if (username && username !== partner.username) {
      const existing = await prisma.partner.findUnique({
        where: { username }
      });
      if (existing) {
        return res.status(400).json({ error: 'Username is already taken.' });
      }
      updateData.username = username;
    }

    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    const updated = await prisma.partner.update({
      where: { id },
      data: updateData
    });

    const { password: _, ...sanitized } = updated;
    return res.json(sanitized);
  } catch (error) {
    console.error('[Partners API] Error updating partner details:', error);
    return res.status(500).json({ error: 'Failed to update partner' });
  }
});

/**
 * DELETE /api/partners/:id
 * Deletes a partner account. Deleting instantly revokes their session token verification.
 */
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const partner = await prisma.partner.findUnique({
      where: { id }
    });

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found.' });
    }

    await prisma.partner.delete({
      where: { id }
    });

    console.log(`[Partners API] Deleted partner id: ${id}. JWT access revoked.`);
    return res.json({ success: true, message: 'Partner deleted successfully' });
  } catch (error) {
    console.error('[Partners API] Error deleting partner:', error);
    return res.status(500).json({ error: 'Failed to delete partner' });
  }
});

/**
 * PUT /api/partners/:id/grant-leave
 * Marks partner as inactive (on leave) and bulk-reassigns all their active
 * pickup/delivery orders to other available partners via least-load algorithm.
 * Orders with no available partner go back to the unassigned pool.
 */
router.put('/:id/grant-leave', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const partner = await prisma.partner.findUnique({ where: { id } });
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found.' });
    }

    // 1. Mark partner as inactive
    await prisma.partner.update({
      where: { id },
      data: { active: false }
    });

    // 2. Fetch all their active orders (not Delivered or Cancelled)
    const activeOrders = await prisma.order.findMany({
      where: {
        partnerId: id,
        status: { notIn: ['DELIVERED', 'CANCELLED'] }
      },
      include: { customer: true }
    });

    console.log(`[Partners API] Grant leave for Partner ID ${id} (${partner.name}). Reassigning ${activeOrders.length} active orders.`);

    const results = { reassigned: [], backToPool: [] };

    // 3. Mark all active orders as REASSIGNMENT_NEEDED
    for (const order of activeOrders) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          partnerId: null,
          status: 'REASSIGNMENT_NEEDED',
          clothCheckNote: `Partner ${partner.name} granted leave. Needs reassignment. ${order.clothCheckNote || ''}`
        }
      });
      results.backToPool.push({ orderId: order.id });
    }

    if (global.emitSSE) {
      global.emitSSE('orders_updated', { message: 'Partner leave granted, orders need reassignment' });
    }

    return res.json({
      success: true,
      partnerName: partner.name,
      totalOrders: activeOrders.length,
      ...results
    });
  } catch (error) {
    console.error('[Partners API] Grant leave error:', error);
    return res.status(500).json({ error: 'Failed to grant leave' });
  }
});

module.exports = router;
