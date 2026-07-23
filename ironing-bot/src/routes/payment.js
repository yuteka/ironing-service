const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const prisma = require('../services/db');
const razorpay = require('../services/razorpay');
const whatsapp = require('../services/whatsapp');
const { authenticateJWT } = require('../middleware/auth');
require('dotenv').config();

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_secret';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_KEY_SECRET;

/**
 * POST /api/payment/create-link
 * Request a short checkout link for a specific order.
 */
router.post('/create-link', authenticateJWT(), async (req, res) => {
  const { orderId, amount } = req.body;
  if (!orderId || !amount) {
    return res.status(400).json({ error: 'orderId and amount are required' });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const shortUrl = await razorpay.createPaymentLink(
      order.id,
      amount,
      order.customer.phone,
      order.customer.name
    );

    // Save total amount back to the order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        totalAmount: parseFloat(amount)
      }
    });

    return res.json({ shortUrl });
  } catch (error) {
    console.error('[Payment API Error] Failed to create checkout link:', error);
    return res.status(500).json({ error: 'Failed to create payment link' });
  }
});

/**
 * POST /api/payment/webhook
 * Razorpay callback triggered upon successful invoice checkout.
 * Expects raw body parser to be registered on this route (configured in index.js).
 */
router.post('/webhook', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    console.warn('[Razorpay Webhook] Received webhook payload without signature header.');
    return res.sendStatus(400);
  }

  // Verify HMAC signature to protect against spoofing attacks
  const expectedSignature = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('[Razorpay Webhook] HMAC Signature verification failed.');
    return res.sendStatus(400);
  }

  let payload;
  try {
    // req.body is a raw buffer, parse it as JSON
    payload = JSON.parse(req.body.toString());
  } catch (e) {
    console.error('[Razorpay Webhook] Failed to parse request payload as JSON.');
    return res.sendStatus(400);
  }

  console.log(`[Razorpay Webhook] Received webhook event: ${payload.event}`);

  if (payload.event === 'payment_link.paid') {
    const paymentLinkEntity = payload.payload?.payment_link?.entity;
    if (paymentLinkEntity) {
      const description = paymentLinkEntity.description || '';
      // Parse Order ID from description "Ironing Service - Order #ID"
      const match = description.match(/#(\d+)/);
      if (match) {
        const orderId = parseInt(match[1]);
        try {
          const order = await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'Paid',
              paymentMethod: 'Razorpay',
              razorpayPaymentId: paymentLinkEntity.id || 'pay_unknown'
            },
            include: { customer: true }
          });

          console.log(`[Razorpay Webhook] Order #${orderId} marked as Paid. Transaction Reference: ${paymentLinkEntity.id}`);

    const backendUrl = (process.env.BACKEND_URL || 'https://ironing-service.onrender.com').trim().replace(/\/$/, '');

          // 1. Thank you & status message
          await whatsapp.sendMessage(
            order.customerPhone,
            `Thank you so much for your payment! Your order will be processed shortly. We'll notify you once it is ready! ✨\n\n✨ Whenever you need us next, simply send a "hi"! We are always here to help you. 😊`
          );

          // 2. Tax Invoice PDF link message sent after payment confirmation
          await whatsapp.sendMessage(
            order.customerPhone,
            `📄 Here is your Tax Invoice (INV-2026-${order.id}):\n${backendUrl}/api/orders/${order.id}/invoice`
          );
        } catch (error) {
          console.error('[Razorpay Webhook Error] Failed to update order status:', error);
        }
      }
    }
  }

  return res.sendStatus(200);
});

/**
 * POST /api/payment/mock-pay/:id
 * Development utility endpoint to simulate successful payment webhook completion.
 */
router.post('/mock-pay/:id', async (req, res) => {
  const orderId = parseInt(req.params.id);
  const { paymentMethod = 'Razorpay' } = req.body;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const mockPayId = `pay_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'Paid',
        paymentMethod: paymentMethod,
        razorpayPaymentId: mockPayId
      }
    });

    console.log(`[Razorpay Mock Pay] Order #${orderId} marked Paid via mock trigger.`);

    const backendUrl = (process.env.BACKEND_URL || 'https://ironing-service.onrender.com').trim().replace(/\/$/, '');

    // 1. Thank you & status message
    await whatsapp.sendMessage(
      order.customerPhone,
      `Thank you so much for your payment! Your order will be processed shortly. We'll notify you once it is ready! ✨\n\n✨ Whenever you need us next, simply send a "hi"! We are always here to help you. 😊`
    );

    // 2. Tax Invoice PDF link message sent after payment confirmation
    await whatsapp.sendMessage(
      order.customerPhone,
      `📄 Here is your Tax Invoice (INV-2026-${order.id}):\n${backendUrl}/api/orders/${order.id}/invoice`
    );

    // If it's a browser submit form POST, redirect them to success
    if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
      return res.send(`
        <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #10B981;">Demo Payment Success!</h2>
          <p>The order status has been updated to Paid and a WhatsApp confirmation has been dispatched. You can close this tab now.</p>
        </body>
        </html>
      `);
    }

    return res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('[Mock Pay Error] Failed to process mock transaction:', error);
    return res.status(500).json({ error: 'Failed to process mock payment' });
  }
});

/**
 * GET /api/payment/mock-checkout/:id
 * Simple page showing invoice amount and a button to pay to mock checkouts
 */
router.get('/mock-checkout/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: true }
    });
    if (!order) return res.send('Order not found');

    const { client, keyId, isMock } = await razorpay.getRazorpayClient();
    const amountInPaise = Math.round((order.totalAmount || 0) * 100);

    let razorpayOrderId = null;
    if (client && !isMock && amountInPaise > 0) {
      try {
        const rzpOrder = await client.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `order_rcpt_${id}`
        });
        razorpayOrderId = rzpOrder.id;
      } catch (err) {
        console.error('[Razorpay Checkout Error] Order create failed:', err.message);
      }
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Razorpay Checkout - Booking #BK2026${String(id).padStart(4, '0')}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #f0f7ff, #e0f2fe);
            margin: 0;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 36px 30px;
            box-shadow: 0 15px 35px rgba(15, 23, 42, 0.1);
            width: 100%;
            max-width: 420px;
            text-align: center;
          }
          .logo { font-size: 1.3rem; font-weight: 800; color: #0F172A; margin-bottom: 6px; }
          .sub { color: #64748b; font-size: 0.85rem; font-weight: 600; }
          .amount { font-size: 2.4rem; font-weight: 900; color: #0284c7; margin: 24px 0; }
          .btn-pay {
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            color: white;
            border: none;
            padding: 16px 28px;
            font-size: 1.05rem;
            font-weight: 700;
            border-radius: 12px;
            cursor: pointer;
            width: 100%;
            box-shadow: 0 4px 14px rgba(14, 165, 233, 0.3);
            transition: transform 0.2s;
          }
          .btn-pay:hover { transform: translateY(-2px); }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">Ironing Service</div>
          <div class="sub">Booking #BK2026${String(id).padStart(4, '0')} • ${order.customer?.name || 'Customer'}</div>

          <div class="amount">₹${parseFloat(order.totalAmount || 0).toFixed(2)}</div>

          <button id="rzp-button" className="btn-pay" class="btn-pay">Pay with Razorpay</button>
        </div>

        <script>
          var options = {
            "key": "${keyId || 'rzp_test_TGVvt5inYvcxJg'}",
            "amount": "${amountInPaise || 23400}",
            "currency": "INR",
            "name": "Ironing Service",
            "description": "Booking #BK2026${String(id).padStart(4, '0')}",
            ${razorpayOrderId ? `"order_id": "${razorpayOrderId}",` : ''}
            "prefill": {
              "name": "${(order.customer?.name || '').replace(/"/g, '')}",
              "contact": "${(order.customerPhone || '').replace(/\D/g, '')}"
            },
            "theme": {
              "color": "#0284c7"
            },
            "handler": function (response) {
              fetch('/api/payment/mock-pay/${id}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentMethod: 'Razorpay Official' })
              }).then(function() {
                alert('Payment Successful! Thank you.');
                window.location.reload();
              });
            }
          };

          var rzp1 = new Razorpay(options);
          document.getElementById('rzp-button').onclick = function(e){
            rzp1.open();
            e.preventDefault();
          }

          // Auto open checkout widget
          window.onload = function() {
            rzp1.open();
          };
        </script>
      </body>
      </html>
    `;
    return res.send(html);
  } catch (error) {
    console.error('Checkout page error:', error);
    return res.status(500).send('Error loading checkout page');
  }
});

module.exports = router;
