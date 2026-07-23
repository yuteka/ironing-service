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
      <html lang="en">
      <head>
        <title>Razorpay Payment - Booking #BK2026${String(id).padStart(4, '0')}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
          * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body {
            background: #f1f5f9;
            margin: 0;
            padding: 16px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .checkout-container {
            background: #ffffff;
            border-radius: 20px;
            width: 100%;
            max-width: 440px;
            box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.15);
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }
          .header {
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            color: white;
            padding: 24px 20px;
            text-align: center;
          }
          .header h2 { margin: 0 0 4px 0; font-size: 1.25rem; font-weight: 800; }
          .header p { margin: 0; font-size: 0.85rem; opacity: 0.9; }
          .amount-banner {
            background: #f8fafc;
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e2e8f0;
          }
          .amount-label { font-size: 0.85rem; color: #64748b; font-weight: 600; }
          .amount-value { font-size: 1.6rem; font-weight: 900; color: #0284c7; }
          
          .section-title {
            font-size: 0.78rem;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 16px 20px 8px 20px;
          }
          
          .option-card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            margin: 0 20px 12px 20px;
            padding: 14px 16px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .option-card:hover { border-color: #0284c7; background: #f0f9ff; }
          .option-left { display: flex; alignItems: center; gap: 12px; }
          .option-icon { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; flex-shrink: 0; }
          .icon-upi { background: #dcfce7; color: #166534; }
          .icon-card { background: #e0f2fe; color: #0369a1; }
          .icon-nb { background: #fef3c7; color: #92400e; }
          .option-title { font-size: 0.92rem; font-weight: 700; color: #0f172a; }
          .option-desc { font-size: 0.75rem; color: #64748b; margin-top: 2px; }
          
          .btn-pay-action {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
            border-radius: 10px;
            padding: 10px 16px;
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);
          }

          .footer-note {
            text-align: center;
            padding: 16px 20px;
            font-size: 0.75rem;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
          }
        </style>
      </head>
      <body>
        <div class="checkout-container">
          <div class="header">
            <h2>Ironing Service</h2>
            <p>Booking #BK2026${String(id).padStart(4, '0')} • ${order.customer?.name || 'Customer'}</p>
          </div>

          <div class="amount-banner">
            <span class="amount-label">Total Payable Amount</span>
            <span class="amount-value">₹${parseFloat(order.totalAmount || 0).toFixed(2)}</span>
          </div>

          <div class="section-title">Select Payment Method (Test Mode)</div>

          <!-- OPTION 1: UPI / GPay / PhonePe / Paytm -->
          <div class="option-card" onclick="processPayment('UPI (GPay / PhonePe / Paytm)')">
            <div class="option-left">
              <div class="option-icon icon-upi">📱</div>
              <div>
                <div class="option-title">UPI / GPay / PhonePe / Paytm</div>
                <div class="option-desc">Google Pay, PhonePe, Paytm, BHIM UPI</div>
              </div>
            </div>
            <button class="btn-pay-action">Pay Now</button>
          </div>

          <!-- OPTION 2: Credit / Debit Cards -->
          <div class="option-card" onclick="processPayment('Credit / Debit Card (Visa/Mastercard)')">
            <div class="option-left">
              <div class="option-icon icon-card">💳</div>
              <div>
                <div class="option-title">Credit & Debit Cards</div>
                <div class="option-desc">Visa, Mastercard, RuPay Cards</div>
              </div>
            </div>
            <button class="btn-pay-action">Pay Now</button>
          </div>

          <!-- OPTION 3: NetBanking -->
          <div class="option-card" onclick="processPayment('NetBanking (Baroda/Canara/SBI/HDFC)')">
            <div class="option-left">
              <div class="option-icon icon-nb">🏦</div>
              <div>
                <div class="option-title">NetBanking & Wallets</div>
                <div class="option-desc">All Major Indian Banks & E-Wallets</div>
              </div>
            </div>
            <button class="btn-pay-action">Pay Now</button>
          </div>

          <!-- OPTION 4: Official Razorpay Popup Launcher -->
          <div style="margin: 16px 20px 20px 20px;">
            <button id="rzp-button" style="width: 100%; background: #0284c7; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 700; font-size: 0.88rem; cursor: pointer;">
              Open Standard Razorpay Popup ➔
            </button>
          </div>

          <div class="footer-note">
            🔒 256-Bit SSL Encrypted • Powered by Razorpay Sandbox
          </div>
        </div>

        <script>
          function processPayment(method) {
            if (confirm('Complete Test Payment of ₹${parseFloat(order.totalAmount || 0).toFixed(2)} via ' + method + '?')) {
              fetch('/api/payment/mock-pay/${id}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentMethod: method })
              }).then(function() {
                alert('Payment Successful via ' + method + '! Check your WhatsApp for confirmation.');
                window.location.reload();
              });
            }
          }

          var options = {
            "key": "${keyId || 'rzp_test_TGVvt5inYvcxJg'}",
            "amount": "${amountInPaise || 20000}",
            "currency": "INR",
            "name": "Ironing Service",
            "description": "Booking #BK2026${String(id).padStart(4, '0')}",
            ${razorpayOrderId ? `"order_id": "${razorpayOrderId}",` : ''}
            "prefill": {
              "name": "${(order.customer?.name || '').replace(/"/g, '')}",
              "contact": "${(order.customerPhone || '').replace(/\D/g, '')}"
            },
            "theme": { "color": "#0284c7" },
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
