const express = require('express');
const router = express.Router();
const prisma = require('../services/db');
const { authenticateAdmin } = require('../middleware/auth');

const { generateOrderHash } = require('../utils/securityToken');

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

    const backendUrl = (process.env.BACKEND_URL || 'https://ironing-service.onrender.com').trim().replace(/\/$/, '');
    const enriched = payments.map(o => ({
      ...o,
      paymentLink: `${backendUrl}/pay/${generateOrderHash(o.id, 'pay')}`,
      invoiceUrl: `${backendUrl}/invoice/${generateOrderHash(o.id, 'invoice')}`
    }));

    return res.json(enriched);
  } catch (error) {
    console.error('[Payments API] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch payment records' });
  }
});

module.exports = router;
