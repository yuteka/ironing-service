const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const prisma = require('../services/db');
const whatsapp = require('../services/whatsapp');
const razorpay = require('../services/razorpay');
const { authenticatePartner } = require('../middleware/auth');
const { generateOrderHash } = require('../utils/securityToken');

// Protect all routes with Partner JWT validation
router.use(authenticatePartner);

/**
 * GET /api/partner/jobs
 * Lists active assigned orders for the logged-in partner.
 */
router.get('/', async (req, res) => {
  const partnerId = req.partnerId;

  try {
    const jobs = await prisma.order.findMany({
      where: {
        partnerId: partnerId,
        status: { in: ['PICKUP_ASSIGNED', 'OUT_FOR_DELIVERY'] }
      },
      include: {
        customer: true,
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(jobs);
  } catch (error) {
    console.error('[Partner Jobs API] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

/**
 * GET /api/partner/jobs/profile
 * Returns the logged-in partner's own details.
 */
router.get('/profile', async (req, res) => {
  const partnerId = req.partnerId;
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    });
    if (!partner) {
      return res.status(404).json({ error: 'Partner profile not found.' });
    }
    const { password, ...sanitized } = partner;
    return res.json(sanitized);
  } catch (error) {
    console.error('[Partner Jobs API] Profile fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch partner details' });
  }
});

/**
 * PUT /api/partner/jobs/status/toggle
 * Allows the partner to toggle their own active status.
 * If toggling inactive (going on leave), reassigns their active orders.
 */
router.put('/status/toggle', async (req, res) => {
  const partnerId = req.partnerId;
  const { active } = req.body;

  if (active === undefined) {
    return res.status(400).json({ error: 'Active state is required.' });
  }

  try {
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found.' });
    }

    // 1. Update active status
    const updatedPartner = await prisma.partner.update({
      where: { id: partnerId },
      data: { active }
    });

    const results = { reassigned: [], backToPool: [] };

    // 2. If turning inactive (going off-duty), reassign their active orders
    if (!active) {
      const activeOrders = await prisma.order.findMany({
        where: {
          partnerId: partnerId,
          status: { notIn: ['DELIVERED', 'CANCELLED'] }
        },
        include: { customer: true }
      });

      for (const order of activeOrders) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            partnerId: null,
            status: 'REASSIGNMENT_NEEDED',
            clothCheckNote: `Partner ${partner.name} marked offline. Needs reassignment. ${order.clothCheckNote || ''}`
          }
        });
        results.backToPool.push({ orderId: order.id });
      }

      if (global.emitSSE) {
        global.emitSSE('orders_updated', { message: 'Partner went offline, orders need reassignment' });
      }
    }

    return res.json({
      success: true,
      active: updatedPartner.active,
      reassigned: results.reassigned,
      backToPool: results.backToPool
    });
  } catch (error) {
    console.error('[Partner Jobs API] Error self-toggling status:', error);
    return res.status(500).json({ error: 'Failed to update your status' });
  }
});

/**
 * GET /api/partner/jobs/:id
 * Fetches status/details of a specific job (used for live payment polling).
 */
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const partnerId = req.partnerId;

  try {
    const order = await prisma.order.findFirst({
      where: { id, partnerId },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    return res.json(order);
  } catch (error) {
    console.error('[Partner Jobs API] Fetch single job error:', error);
    return res.status(500).json({ error: 'Failed to fetch job details' });
  }
});

/**
 * PUT /api/partner/jobs/:id/reached
 * Registers Reached checkpoint timestamp.
 */
router.put('/:id/reached', async (req, res) => {
  const id = parseInt(req.params.id);
  const partnerId = req.partnerId;

  try {
    const order = await prisma.order.findFirst({
      where: { id, partnerId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        reachedAt: new Date()
      }
    });

    console.log(`[Partner Jobs API] Partner ID ${partnerId} reached Order #${id}`);
    return res.json(updated);
  } catch (error) {
    console.error('[Partner Jobs API] Reached checkpoint error:', error);
    return res.status(500).json({ error: 'Failed to update reached status' });
  }
});

/**
 * POST /api/partner/jobs/:id/cloth-check
 * Submit cloth condition checklist (Button missing/Torn/Stain/Burnt/Faded/Other) and photo.
 */
router.post('/:id/cloth-check', async (req, res) => {
  const id = parseInt(req.params.id);
  const partnerId = req.partnerId;
  const { issues = [], note = '', photoBase64 = '' } = req.body;

  try {
    const order = await prisma.order.findFirst({
      where: { id, partnerId },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    let clothCheckStatus = 'None';
    let clothPhotoUrl = null;

    // Process photo upload if base64 encoded image string is provided
    if (photoBase64) {
      const matches = photoBase64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const ext = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileName = `cloth_check_${order.id}_${Date.now()}.${ext}`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, buffer);
        clothPhotoUrl = `/uploads/${fileName}`;
      }
    }

    let issueDescription = '';
    if (issues.length > 0) {
      clothCheckStatus = 'IssuesFound';
      issueDescription = issues.join(', ');
      if (note) issueDescription += ` (${note})`;

      // Update order state
      const updated = await prisma.order.update({
        where: { id },
        data: {
          clothCheckStatus,
          clothCheckNote: issueDescription,
          clothPhotoUrl
        }
      });

      console.log(`[Partner Jobs API] Issues found on Order #${id}: ${issueDescription}. Waiting for customer confirmation.`);

      // Send WhatsApp condition template: cloth_check_issue
      // Template Variables: {{1}}=order_id, {{2}}=issue_description
      await whatsapp.sendTemplate(
        order.customerPhone,
        'cloth_check_issue',
        [order.id.toString(), issueDescription]
      );

      return res.json(updated);
    } else {
      // Bypasses customer acceptance when no damages are ticked
      const updated = await prisma.order.update({
        where: { id },
        data: {
          clothCheckStatus: 'None',
          clothCheckNote: note ? note : 'No issues found',
          clothPhotoUrl: clothPhotoUrl || null
        }
      });
      console.log(`[Partner Jobs API] No issues found on Order #${id}. Bypassing customer confirmation.`);
      return res.json(updated);
    }
  } catch (error) {
    console.error('[Partner Jobs API] Cloth check error:', error);
    return res.status(500).json({ error: 'Failed to process cloth check' });
  }
});

/**
 * POST /api/partner/jobs/:id/count
 * Submit itemized cloth count quantities, compute bill, and trigger checkout link.
 */
router.post('/:id/count', async (req, res) => {
  const id = parseInt(req.params.id);
  const partnerId = req.partnerId;
  const { items = [], damageNotes = '' } = req.body; // Array of { itemType, quantity, rate }

  if (items.length === 0) {
    return res.status(400).json({ error: 'At least one item is required.' });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id, partnerId },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    // Delete existing items if resubmitted
    await prisma.orderItem.deleteMany({
      where: { orderId: id }
    });

    let totalAmount = 0;
    const orderItemsData = items.map(item => {
      const subtotal = item.quantity * item.rate;
      totalAmount += subtotal;
      return {
        orderId: id,
        itemType: item.itemType,
        quantity: item.quantity,
        rate: parseFloat(item.rate),
        subtotal,
        note: item.note || null
      };
    });

    // Bulk create order items
    await prisma.orderItem.createMany({
      data: orderItemsData
    });

    // Create payment checkout link (Razorpay SDK wrapper)
    let paymentLinkUrl = '';
    try {
      paymentLinkUrl = await razorpay.createPaymentLink(
        order.id,
        totalAmount,
        order.customer.phone,
        order.customer.name
      );
    } catch (razorError) {
      console.warn('[Partner Jobs API] Razorpay link generation failed (falling back to mock checkout):', razorError.message || razorError);
      const backendUrl = (process.env.BACKEND_URL || 'https://ironing-service.onrender.com').trim().replace(/\/$/, '');
      paymentLinkUrl = `${backendUrl}/pay/${generateOrderHash(order.id, 'pay')}`;
    }

    // Save total amount, notes, and verify status back to order record
    const updated = await prisma.order.update({
      where: { id },
      data: {
        totalAmount,
        clothCheckNote: damageNotes ? damageNotes : (order.clothCheckNote || 'No issues found'),
        clothCheckStatus: damageNotes ? 'IssuesFound' : (order.clothCheckStatus || 'None')
      },
      include: {
        items: true
      }
    });

    console.log(`[Partner Jobs API] Clothes count logged for Order #${id}. Total: ₹${totalAmount}. Payment Link sent.`);

    // Format custom template-free WhatsApp bill breakdown (includes Razorpay Link only)
    let breakdownText = `Order #${order.id}\n\n`;
    orderItemsData.forEach(item => {
      breakdownText += `${item.itemType} × ${item.quantity} = ₹${item.subtotal}\n`;
    });
    breakdownText += `─────────────\nTotal: ₹${totalAmount}\n\n`;
    breakdownText += `👉 Pay here: ${paymentLinkUrl}`;

    await whatsapp.sendMessage(order.customerPhone, breakdownText);

    return res.json({ order: updated, paymentLink: paymentLinkUrl });
  } catch (error) {
    console.error('[Partner Jobs API] Clothes count submit error:', error);
    return res.status(500).json({ error: 'Failed to record clothes count' });
  }
});

/**
 * POST /api/partner/jobs/:id/cash-received
 * Mark manual cash transaction. Unlocks status transition.
 */
router.post('/:id/cash-received', async (req, res) => {
  const id = parseInt(req.params.id);
  const partnerId = req.partnerId;

  try {
    const order = await prisma.order.findFirst({
      where: { id, partnerId },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'Paid',
        paymentMethod: 'Cash'
      }
    });

    console.log(`[Partner Jobs API] Partner logged cash collection for Order #${id}. Payment unlocked.`);
    
    if (global.emitSSE) {
      global.emitSSE('orders_updated', { message: `Order #${id} payment received` });
    }

    // Send Thank You confirmation & Tax Invoice PDF upon successful payment
    const backendUrl = (process.env.BACKEND_URL || 'https://ironing-service.onrender.com').trim().replace(/\/$/, '');
    await whatsapp.sendMessage(
      order.customerPhone,
      `Thank you so much for your payment! Your order will be processed shortly. We'll notify you once it is ready! ✨\n\n✨ Whenever you need us next, simply send a "hi"! We are always here to help you. 😊`
    ).catch(e => console.error('[CashReceived] WhatsApp Notify Error:', e));

    await whatsapp.sendMessage(
      order.customerPhone,
      `📄 Here is your Tax Invoice (INV-2026-${order.id}):\n${backendUrl}/invoice/${generateOrderHash(order.id, 'invoice')}`
    ).catch(e => console.error('[CashReceived] WhatsApp Invoice Notify Error:', e));

    return res.json(updated);
  } catch (error) {
    console.error('[Partner Jobs API] Cash confirmation error:', error);
    return res.status(500).json({ error: 'Failed to record cash payment' });
  }
});

/**
 * PUT /api/partner/jobs/:id/picked
 * Transition status to Collected. Requires paymentStatus = 'Paid'.
 */
router.put('/:id/picked', async (req, res) => {
  const id = parseInt(req.params.id);
  const partnerId = req.partnerId;

  try {
    const order = await prisma.order.findFirst({
      where: { id, partnerId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    // Picked lock check: Returns 403 if unpaid
    if (order.paymentStatus !== 'Paid') {
      return res.status(403).json({ error: 'Cannot mark as Picked until payment is confirmed.' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: 'COLLECTED',
        pickedAt: new Date(),
        pickedByPartnerId: partnerId
      },
      include: { customer: true }
    });

    console.log(`[Partner Jobs API] Order #${id} successfully marked as Collected.`);

    if (global.emitSSE) {
      global.emitSSE('orders_updated', { message: `Order #${id} collected` });
    }

    if (updated.customer) {
      await whatsapp.sendMessage(
        updated.customer.phone,
        `Hello ${updated.customer.name},\n\nYour clothes for Order #${id} have been successfully collected by our pickup partner. 🧺\nWe will begin processing them shortly!`
      ).catch(e => console.error('[Picked] WhatsApp Notify Error:', e));
    }

    return res.json(updated);
  } catch (error) {
    console.error('[Partner Jobs API] Picked completion error:', error);
    return res.status(500).json({ error: 'Failed to complete collection' });
  }
});

router.put('/:id/cant-make-it', async (req, res) => {
  const id = parseInt(req.params.id);
  const partnerId = req.partnerId;

  try {
    const order = await prisma.order.findFirst({
      where: { id, partnerId },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    });

    const updated = await prisma.order.update({
      where: { id },
      data: {
        partnerId: null,
        status: 'REASSIGNMENT_NEEDED',
        partnerReleaseNote: `Assignment released by partner: ${partner ? partner.name : 'Unknown'} (ID: ${partnerId}) on ${new Date().toLocaleString()}.`
      }
    });

    console.log(`[Partner Jobs API] Partner ID ${partnerId} released Order #${id}. Marked as REASSIGNMENT_NEEDED.`);

    if (global.emitSSE) {
      global.emitSSE('orders_updated', { message: 'Order needs reassignment' });
    }

    return res.json(updated);
  } catch (error) {
    console.error('[Partner Jobs API] Assignment cancel error:', error);
    return res.status(500).json({ error: 'Failed to cancel assignment' });
  }
});

/**
 * PUT /api/partner/jobs/:id/reschedule
 * Reschedules the pickup date & slot for an order.
 */
router.put('/:id/reschedule', async (req, res) => {
  const id = parseInt(req.params.id);
  const partnerId = req.partnerId;
  const { newDate, newSlot } = req.body;

  if (!newDate) {
    return res.status(400).json({ error: 'newDate is required.' });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id, partnerId },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    });

    const slotVal = newSlot || order.pickupSlot;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        pickupDate: newDate,
        pickupSlot: slotVal,
        clothCheckNote: `Rescheduled by partner ${partner ? partner.name : 'Unknown'}: set to [${newDate}] on ${new Date().toLocaleString()}`
      }
    });

    console.log(`[Partner Jobs API] Order #${id} rescheduled to ${newDate} by partner ID ${partnerId}`);

    // Notify customer on WhatsApp
    await whatsapp.sendMessage(
      order.customerPhone,
      `Hello ${order.customer.name},\n\nOur pickup partner ${partner ? partner.name : ''} has rescheduled your clothes collection for Order #${order.id}.\n📅 New Scheduled Date: ${newDate}`
    ).catch(e => console.error('[Reschedule] WhatsApp Notify Error:', e));

    return res.json(updated);
  } catch (error) {
    console.error('[Partner Jobs API] Reschedule error:', error);
    return res.status(500).json({ error: 'Failed to reschedule order' });
  }
});

/**
 * PUT /api/partner/jobs/:id/not-available
 * Log customer unavailable check. Leaves order assigned to reschedule.
 */
router.put('/:id/not-available', async (req, res) => {
  const id = parseInt(req.params.id);
  const partnerId = req.partnerId;

  try {
    const order = await prisma.order.findFirst({
      where: { id, partnerId },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    // Keep order assigned but notify customer
    console.log(`[Partner Jobs API] Order #${id} logged as Customer Not Home.`);
    
    await whatsapp.sendMessage(
      order.customerPhone,
      `Hello ${order.customer.name}, our pickup partner reached your location but could not contact you. We will try reaching you again later.`
    );

    return res.json({ success: true, order });
  } catch (error) {
    console.error('[Partner Jobs API] Customer unavailable error:', error);
    return res.status(500).json({ error: 'Failed to log status' });
  }
});

/**
 * PUT /api/partner/jobs/:id/delivered
 * Transition status to Delivered. Only allowed if status is Out for Delivery.
 */
router.put('/:id/delivered', async (req, res) => {
  const id = parseInt(req.params.id);
  const partnerId = req.partnerId;
  const { otp } = req.body;

  try {
    const order = await prisma.order.findFirst({
      where: { id, partnerId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    if (order.status === 'DELIVERED') {
      console.log(`[Partner Jobs API] Order #${id} is already Delivered. Bypassing double-click.`);
      return res.json(order);
    }

    if (order.status !== 'OUT_FOR_DELIVERY') {
      return res.status(400).json({ error: 'Cannot deliver order unless it is Out for Delivery.' });
    }

    // Verify Delivery OTP!
    if (!otp || otp !== order.deliveryOtp) {
      return res.status(400).json({ error: 'Invalid Delivery OTP. Please check the OTP with the customer and try again.' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        deliveredByPartnerId: partnerId
      },
      include: {
        customer: true,
        items: true,
        Partner_Order_pickedByPartnerIdToPartner: true,
        Partner_Order_deliveredByPartnerIdToPartner: true
      }
    });

    console.log(`[Partner Jobs API] Order #${id} successfully marked as Delivered.`);

    // Build and save Invoice PDF on Delivery
    const path = require('path');
    const fs = require('fs');
    const pdfService = require('../services/pdf');
    const invoicesDir = path.join(__dirname, '..', '..', 'uploads', 'invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }
    
    const invoicePath = path.join(invoicesDir, `invoice_${order.id}.pdf`);
    await pdfService.generateInvoicePDF(updated, invoicePath);

    // Dynamic backend url
    const backendUrl = (process.env.BACKEND_URL || 'https://ironing-service.onrender.com').trim().replace(/\/$/, '');
    const invoiceUrl = `${backendUrl}/uploads/invoices/invoice_${order.id}.pdf`;

    await whatsapp.sendMessage(
      updated.customerPhone,
      `Greetings! Your neatly ironed clothes for Order #${updated.id} have been successfully delivered to your doorstep. 🧺✨\n\nIt has been an absolute pleasure serving you! Thank you so much for choosing Ironing Service. We sincerely hope you are delighted with our service today. ❤️\n\n📄 Download Invoice: ${invoiceUrl}\n\n✨ Whenever you need us next, simply send a "hi"! We are always here to help you. 😊`
    ).catch(e => console.error('[Delivered] WhatsApp Notify Error:', e));

    if (global.emitSSE) {
      global.emitSSE('orders_updated', { message: `Order #${id} delivered` });
    }

    return res.json(updated);
  } catch (error) {
    console.error('[Partner Jobs API] Delivery completion error:', error);
    return res.status(500).json({ error: 'Failed to complete delivery' });
  }
});

module.exports = router;
