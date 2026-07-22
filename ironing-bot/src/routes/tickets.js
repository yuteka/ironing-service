const express = require('express');
const router = express.Router();
const prisma = require('../services/db');
const { authenticateAdmin } = require('../middleware/auth');

// All tickets endpoints are protected behind Admin privileges
router.use(authenticateAdmin);

/**
 * GET /api/tickets
 * Lists all registered support tickets.
 */
router.get('/', async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    const ticketsWithCustomer = await Promise.all(tickets.map(async (ticket) => {
      const customer = await prisma.customer.findUnique({
        where: { phone: ticket.customerPhone }
      });
      return {
        ...ticket,
        customer
      };
    }));

    return res.json(ticketsWithCustomer);
  } catch (error) {
    console.error('[Tickets API] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

/**
 * PUT /api/tickets/:id/resolve
 * Marks a specific support ticket as Resolved.
 */
router.put('/:id/resolve', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found.' });
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: { status: 'Resolved' }
    });

    console.log(`[Tickets API] Ticket #${id} marked as Resolved.`);
    return res.json(updated);
  } catch (error) {
    console.error('[Tickets API] Resolve error:', error);
    return res.status(500).json({ error: 'Failed to resolve support ticket' });
  }
});

module.exports = router;
