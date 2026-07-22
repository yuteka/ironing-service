const express = require('express');
const router = express.Router();
const prisma = require('../services/db');
const { authenticateAdmin } = require('../middleware/auth');

// Require Admin authorization
router.use(authenticateAdmin);

/**
 * GET /api/customers
 * Retrieve all registered customers, their total order counts, and historical orders.
 */
router.get('/', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            partner: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Map to include totalOrders count explicitly
    const data = customers.map(c => ({
      ...c,
      totalOrders: c.orders.length
    }));

    return res.json(data);
  } catch (error) {
    console.error('[Customers API] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch customers list' });
  }
});

module.exports = router;
