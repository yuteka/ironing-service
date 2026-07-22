const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const prisma = require('../services/db');
const whatsapp = require('../services/whatsapp');
const pdfService = require('../services/pdf');
const { authenticateAdmin } = require('../middleware/auth');

const ORDER_INCLUDE = {
  customer: true,
  partner: true,
  items: true,
  Partner_Order_pickedByPartnerIdToPartner: true,
  Partner_Order_deliveredByPartnerIdToPartner: true
};

// Public invoice generation & serving route (Must sit above auth middleware)
/**
 * GET /api/orders/:id/invoice
 * On-demand generation and serving of PDF receipt.
 */
router.get('/:id/invoice', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: true, items: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Invoice ID & PDF are strictly generated only after payment is Paid
    if (order.paymentStatus !== 'Paid') {
      return res.status(403).send(`
        <html>
          <body style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 60px 20px; background-color: #f8fafc; color: #1e293b;">
            <div style="max-width: 440px; margin: 0 auto; background: white; padding: 32px; borderRadius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
              <div style="font-size: 40px; margin-bottom: 12px;">🔒</div>
              <h2 style="color: #ef4444; margin: 0 0 8px 0; font-size: 1.25rem;">Invoice Pending</h2>
              <p style="font-size: 0.9rem; color: #64748b; margin: 0 0 20px 0;">Tax Invoice ID (INV-2026-${order.id}) and PDF receipt are generated only after the payment of ₹${order.totalAmount?.toFixed(2) || '0.00'} is completed.</p>
            </div>
          </body>
        </html>
      `);
    }

    const invoicesDir = path.join(__dirname, '..', '..', 'uploads', 'invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const invoicePath = path.join(invoicesDir, `invoice_${order.id}.pdf`);
    
    // Always generate/regenerate to ensure details are current
    await pdfService.generateInvoicePDF(order, invoicePath);

    return res.sendFile(invoicePath);
  } catch (error) {
    console.error('[Orders Admin API] Invoice error:', error);
    return res.status(500).json({ error: 'Failed to retrieve invoice PDF' });
  }
});

// All endpoints in this router require Administrative privileges
router.use(authenticateAdmin);

/**
 * POST /api/orders/auto-assign
 * Deprecated. Returns success without doing anything.
 */
router.post('/auto-assign', async (req, res) => {
  return res.json({ message: 'Auto-assignment is disabled.', count: 0 });
});

/**
 * GET /api/orders
 * List orders with optional status, partnerId, and customerPhone query filtering.
 */
router.get('/', async (req, res) => {
  const { status, partnerId, customerPhone } = req.query;
  const where = {};

  if (status) where.status = status;
  if (partnerId) where.partnerId = parseInt(partnerId);
  if (customerPhone) where.customerPhone = customerPhone;

  try {
    const orders = await prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });
    return res.json(orders);
  } catch (error) {
    console.error('[Orders Admin API] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/orders/:id
 * Retrieve order details, including ordered items list and assigned partner.
 */
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json(order);
  } catch (error) {
    console.error('[Orders Admin API] Fetch detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

/**
 * PUT /api/orders/:id/assign
 * Assigns a pickup or delivery partner to an order.
 */
router.put('/:id/assign', async (req, res) => {
  const id = parseInt(req.params.id);
  const { partnerId } = req.body;

  if (!partnerId) {
    return res.status(400).json({ error: 'partnerId is required.' });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const partner = await prisma.partner.findUnique({
      where: { id: parseInt(partnerId) }
    });

    if (!partner || !partner.active) {
      return res.status(400).json({ error: 'Selected partner is invalid or inactive.' });
    }

    const isProcessingPhase = order.status === 'COLLECTED' || (order.status === 'REASSIGNMENT_NEEDED' && order.readyAt == null && order.pickedAt != null);

    if (isProcessingPhase) {
      return res.status(400).json({ error: 'Order must be verified and marked as READY before assigning a delivery partner.' });
    }

    const isDeliveryPhase = ['READY', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) || (order.status === 'REASSIGNMENT_NEEDED' && order.readyAt != null);
    
    let updateData = {
      partnerId: partner.id
    };

    if (isDeliveryPhase) {
      updateData.status = 'OUT_FOR_DELIVERY';
      updateData.assignedDeliveryAt = new Date();
      if (!order.deliveryOtp) {
        updateData.deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
      }
    } else {
      updateData.status = 'PICKUP_ASSIGNED';
      updateData.assignedPickupAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: ORDER_INCLUDE
    });

    console.log(`[Orders Admin API] Order #${id} assigned to Partner ${partner.name} (${isDeliveryPhase ? 'Delivery' : 'Pickup'} Phase)`);

    // Send appropriate WhatsApp message
    if (isDeliveryPhase) {
      const otpValue = updateData.deliveryOtp || order.deliveryOtp || Math.floor(1000 + Math.random() * 9000).toString();
      await whatsapp.sendMessage(
        order.customerPhone,
        `Hello ${order.customer.name},\n\nOur delivery partner ${partner.name} has been assigned to deliver your clothes for Order #${order.id}.\n\n🔑 Secure Delivery OTP: ${otpValue}\nPlease share this OTP with our partner upon delivery. 😊`
      ).catch(e => console.error('[AssignPartner] WhatsApp delivery Notify Error:', e));
    } else {
      const timeSlotStr = `${order.pickupDate} (${order.pickupSlot})`;
      await whatsapp.sendMessage(
        order.customerPhone,
        `Hello ${order.customer.name},\n\nOur pickup partner ${partner.name} has been assigned to collect your clothes for Order #${order.id}.\n📅 Scheduled Time: ${timeSlotStr}`
      ).catch(e => console.error('[AssignPartner] WhatsApp pickup Notify Error:', e));
    }

    if (global.emitSSE) {
      global.emitSSE('orders_updated', { message: 'Order assigned' });
    }

    return res.json(updatedOrder);
  } catch (error) {
    console.error('[Orders Admin API] Assignment error:', error);
    return res.status(500).json({ error: 'Failed to assign partner' });
  }
});

/**
 * PUT /api/orders/:id/status
 * Manually update order progress status and dispatch template notifications.
 */
router.put('/:id/status', async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;

  const validStatuses = [
    'CONFIRMED', 'PICKUP_ASSIGNED', 'COLLECTED', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REASSIGNMENT_NEEDED'
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    let targetStatus = status;
    let deliveryOtp = order.deliveryOtp;
    let updateData = { status: targetStatus };

    // Record timestamps based on status transitions
    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
      updateData.deliveredByPartnerId = order.partnerId;
    } else if (status === 'COLLECTED') {
      updateData.pickedAt = new Date();
      updateData.pickedByPartnerId = order.partnerId;
    } else if (status === 'PICKUP_ASSIGNED') {
      updateData.assignedPickupAt = new Date();
    } else if (status === 'READY') {
      updateData.readyAt = new Date();
      targetStatus = 'READY';
      updateData.status = 'READY';
      updateData.partnerId = null;
    } else if (status === 'OUT_FOR_DELIVERY') {
      updateData.assignedDeliveryAt = new Date();
      if (!deliveryOtp) {
        deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
        updateData.deliveryOtp = deliveryOtp;
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: ORDER_INCLUDE
    });

    console.log(`[Orders Admin API] Order #${id} status updated to: ${targetStatus}`);

    // Map status updates to template-free custom messages
    if (targetStatus === 'OUT_FOR_DELIVERY') {
      const assignedPartner = updatedOrder.partner?.name || 'our delivery partner';
      await whatsapp.sendMessage(
        order.customerPhone,
        `Greetings! Your ironed clothes for Order #${order.id} are out for delivery with ${assignedPartner}. 🧺✨\n\n🔑 Secure Delivery OTP: ${deliveryOtp}\n\nPlease share this OTP with our partner to collect your clothes. 😊`
      ).catch(e => console.error('[StatusUpdate] WhatsApp delivery Notify Error:', e));
    } else if (targetStatus === 'DELIVERED') {
      const invoicesDir = path.join(__dirname, '..', '..', 'uploads', 'invoices');
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }
      
      const invoicePath = path.join(invoicesDir, `invoice_${order.id}.pdf`);
      await pdfService.generateInvoicePDF(updatedOrder, invoicePath);

      const host = req.get('host');
      const invoiceUrl = `http://${host}/uploads/invoices/invoice_${order.id}.pdf`;
      await whatsapp.sendMessage(
        order.customerPhone,
        `Greetings! Your neatly ironed clothes for Order #${order.id} have been successfully delivered to your doorstep. 🧺✨\n\nIt has been an absolute pleasure serving you! Thank you so much for choosing Ironing Service. We sincerely hope you are delighted with our service today. ❤️\n\n📄 Download Invoice: ${invoiceUrl}\n\n✨ Whenever you need us next, simply send a "hi"! We are always here to help you. 😊`
      ).catch(e => console.error('[StatusUpdate] WhatsApp delivery complete Notify Error:', e));
    } else if (targetStatus === 'READY') {
      await whatsapp.sendMessage(
        order.customerPhone,
        `Good news! Your clothes for Order #${order.id} are ironed and ready! We will notify you as soon as a delivery partner is on the way. 🧺`
      ).catch(e => console.error('[StatusUpdate] WhatsApp ready Notify Error:', e));
    }

    if (global.emitSSE) {
      global.emitSSE('orders_updated', { message: 'Order status updated' });
    }

    return res.json(updatedOrder);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * PUT /api/orders/:id/cancel
 * Cancels an order. Only allowed if status is 'CONFIRMED' or 'PICKUP_ASSIGNED'.
 */
router.put('/:id/cancel', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Cannot cancel order once a pickup partner has been assigned.' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: ORDER_INCLUDE
    });

    await whatsapp.sendMessage(
      order.customerPhone,
      `Your Order #${order.id} has been cancelled by the admin. Please contact support if you have any questions.`
    ).catch(e => console.error('[Cancel] WhatsApp Notify Error:', e));

    return res.json(updatedOrder);
  } catch (error) {
    console.error('[Orders Admin API] Cancel error:', error);
    return res.status(500).json({ error: 'Failed to cancel order' });
  }
});

/**
 * POST /api/orders/bulk-ready
 * Marks multiple orders as 'Ready' at once.
 */
router.post('/bulk-ready', async (req, res) => {
  const { orderIds } = req.body;

  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({ error: 'orderIds must be a non-empty array.' });
  }

  try {
    const results = [];

    for (const id of orderIds) {
      const order = await prisma.order.findUnique({
        where: { id: parseInt(id) },
        include: ORDER_INCLUDE
      });

      if (order && order.status !== 'CANCELLED' && order.status !== 'DELIVERED') {
        let updateData = { readyAt: new Date(), status: 'READY', partnerId: null };

        const updated = await prisma.order.update({
          where: { id: order.id },
          data: updateData,
          include: ORDER_INCLUDE
        });
        
        results.push(updated);

        await whatsapp.sendMessage(
          order.customerPhone,
          `Good news! Your clothes for Order #${order.id} are ironed and ready! We will notify you as soon as a delivery partner is on the way. 🧺`
        ).catch(e => console.error('[BulkReady] WhatsApp ready Notify Error:', e));
      }
    }

    if (global.emitSSE) {
      global.emitSSE('orders_updated', { message: 'Bulk ready updated' });
    }

    return res.json({ success: true, updatedCount: results.length, orders: results });
  } catch (error) {
    console.error('[Orders Admin API] Bulk ready error:', error);
    return res.status(500).json({ error: 'Failed to process bulk status updates' });
  }
});


/**
 * POST /api/orders/:id/send-invoice
 * Admin endpoint to manually push an invoice copy to the customer via WhatsApp
 */
router.post('/:id/send-invoice', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    const host = req.get('host');
    const invoiceUrl = `http://${host}/api/orders/${order.id}/invoice`;

    await whatsapp.sendMessage(
      order.customerPhone,
      `Hello! 📄 Here is your requested Invoice copy for Order #${order.id}.\n\n📥 Download Invoice: ${invoiceUrl}\n\nThank you for choosing Ironing Service!`
    );

    return res.json({ success: true, message: 'Invoice sent successfully via WhatsApp' });
  } catch (error) {
    console.error('[Orders Admin API] Send invoice error:', error);
    return res.status(500).json({ error: 'Failed to send invoice via WhatsApp' });
  }
});

module.exports = router;
