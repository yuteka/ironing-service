const express = require('express');
const router = express.Router();
const prisma = require('../services/db');
const { authenticateAdmin } = require('../middleware/auth');

// Require Admin authorization
router.use(authenticateAdmin);

/**
 * GET /api/payments
 * Retrieve all orders that have been Paid, showing recent transactions first.
 */
router.get('/', async (req, res) => {
  try {
    const payments = await prisma.order.findMany({
      where: {
        paymentStatus: 'Paid'
      },
      include: {
        customer: true,
        partner: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return res.json(payments);
  } catch (error) {
    console.error('[Payments API] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch payment records' });
  }
});

module.exports = router;
