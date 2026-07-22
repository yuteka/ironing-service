const express = require('express');
const router = express.Router();
const prisma = require('../services/db');
const { authenticateAdmin, authenticateJWT } = require('../middleware/auth');

/**
 * GET /api/catalog
 * Retrieve active price list catalog items from the database.
 * Accessible by both admin and subadmin roles.
 */
router.get('/', authenticateJWT(), (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'subadmin' && req.user.role !== 'partner') {
    return res.status(403).json({ error: 'Access denied: unauthorized role' });
  }
  next();
}, async (req, res) => {
  try {
    const items = await prisma.priceCatalog.findMany({
      where: { active: true },
      orderBy: { itemName: 'asc' }
    });
    return res.json(items);
  } catch (error) {
    console.error('[Catalog API] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch catalog items' });
  }
});

/**
 * PUT /api/catalog
 * Update multiple price list catalog item rates.
 */
router.put('/', authenticateAdmin, async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'items must be a valid array' });
  }

  try {
    // Extract existing IDs from the incoming payload
    const incomingIds = items
      .filter(item => item.id && typeof item.id === 'number' && item.id > 0)
      .map(item => parseInt(item.id));

    // Deactivate catalog items not present in the incoming update payload
    await prisma.priceCatalog.updateMany({
      where: {
        id: { notIn: incomingIds }
      },
      data: {
        active: false
      }
    });

    for (const item of items) {
      const isExisting = item.id && typeof item.id === 'number' && item.id > 0;
      if (isExisting) {
        await prisma.priceCatalog.update({
          where: { id: parseInt(item.id) },
          data: {
            itemName: item.itemName,
            rate: parseFloat(item.rate)
          }
        });
      } else {
        await prisma.priceCatalog.create({
          data: {
            itemName: item.itemName,
            rate: parseFloat(item.rate),
            active: true
          }
        });
      }
    }

    console.log('[Catalog API] Catalog items updated and synced successfully.');
    return res.json({ success: true });
  } catch (error) {
    console.error('[Catalog API] Sync/Update error:', error);
    return res.status(500).json({ error: 'Failed to sync catalog items' });
  }
});

module.exports = router;
