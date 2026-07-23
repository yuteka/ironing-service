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
            `📄 Here is your Tax Invoice (INV-2026-${order.id}):\n${backendUrl}/invoice/${order.id}`
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
      `📄 Here is your Tax Invoice (INV-2026-${order.id}):\n${backendUrl}/invoice/${order.id}`
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
        <title>Razorpay Checkout - Ironing Service</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body {
            background: #e2e8f0;
            margin: 0;
            padding: 12px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .rzp-container {
            background: #ffffff;
            border-radius: 16px;
            width: 100%;
            max-width: 410px;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
            overflow: hidden;
            border: 1px solid #cbd5e1;
          }
          .rzp-header {
            background: #0284c7;
            color: white;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .rzp-header-left { display: flex; align-items: center; gap: 12px; }
          .rzp-logo {
            width: 38px; height: 38px; background: rgba(255,255,255,0.2);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-weight: 800; font-size: 1.1rem;
          }
          .rzp-title { font-size: 1.05rem; font-weight: 700; }
          .rzp-badge { font-size: 0.68rem; background: rgba(255,255,255,0.25); padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-top: 2px; display: inline-block; }

          .rzp-body { padding: 16px; }

          .section-label { font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-bottom: 10px; }

          .offer-banner {
            background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px;
            padding: 8px 12px; font-size: 0.75rem; color: #334155; font-weight: 600;
            display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
          }

          .upi-apps-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px;
          }
          .upi-app-btn {
            background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px;
            padding: 12px 10px; display: flex; align-items: center; gap: 10px;
            cursor: pointer; transition: all 0.15s ease; text-align: left;
          }
          .upi-app-btn:hover { border-color: #0284c7; background: #f0f9ff; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.15); }
          .upi-app-icon { width: 24px; height: 24px; object-fit: contain; flex-shrink: 0; }
          .upi-app-name { font-size: 0.82rem; font-weight: 700; color: #1e293b; }

          .input-label { font-size: 0.78rem; font-weight: 700; color: #64748b; margin-bottom: 6px; display: block; }
          .upi-input-box {
            width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 10px;
            font-size: 0.9rem; margin-bottom: 16px; outline: none; transition: border-color 0.2s;
          }
          .upi-input-box:focus { border-color: #0284c7; }

          .other-options-title { font-size: 0.8rem; font-weight: 700; color: #64748b; margin: 18px 0 8px 0; }
          .other-opt-row {
            border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px;
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 8px; cursor: pointer; background: #fafafa;
          }
          .other-opt-row:hover { background: #f1f5f9; }
          .other-opt-text { font-size: 0.85rem; font-weight: 700; color: #334155; }

          .rzp-footer {
            background: #ffffff; border-top: 1px solid #e2e8f0; padding: 12px 16px;
            display: flex; align-items: center; justify-content: space-between;
          }
          .amount-disp { font-size: 1.2rem; font-weight: 900; color: #0f172a; }
          .btn-continue {
            background: #0f172a; color: white; border: none; padding: 12px 28px;
            border-radius: 8px; font-weight: 800; font-size: 0.95rem; cursor: pointer;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2); transition: background 0.2s;
          }
          .btn-continue:hover { background: #0284c7; }
        </style>
      </head>
      <body>
        <div class="rzp-container">
          <div class="rzp-header">
            <div class="rzp-header-left">
              <div class="rzp-logo">I</div>
              <div>
                <div class="rzp-title">Ironing Service</div>
                <div class="rzp-badge">🛡️ Razorpay Trusted Business</div>
              </div>
            </div>
          </div>

          <div class="rzp-body">
            <div class="section-label">UPI</div>

            <div class="offer-banner">
              <span>🎟️</span>
              <span>UPTO ₹200 Cashback on CRED / GPay</span>
            </div>

            <!-- UPI Apps Section -->
            <label class="input-label">UPI Apps</label>
            <div class="upi-apps-grid">
              <div class="upi-app-btn" onclick="payViaUPI('Google Pay')">
                <svg width="22" height="22" viewBox="0 0 24 24" style="flex-shrink:0;"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/></svg>
                <span class="upi-app-name">Google Pay</span>
              </div>
              <div class="upi-app-btn" onclick="payViaUPI('PhonePe')">
                <div style="width:24px; height:24px; background:#5f259f; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:900; font-size:12px; flex-shrink:0;">पे</div>
                <span class="upi-app-name">PhonePe</span>
              </div>
              <div class="upi-app-btn" onclick="payViaUPI('Paytm')">
                <div style="width:24px; height:24px; background:#002e6e; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#00baf2; font-weight:900; font-size:8px; flex-shrink:0;">Paytm</div>
                <span class="upi-app-name">PayTM</span>
              </div>
              <div class="upi-app-btn" onclick="payViaUPI('BHIM UPI')">
                <div style="width:24px; height:24px; background:linear-gradient(135deg, #ff9933, #ffffff, #138808); border-radius:6px; display:flex; align-items:center; justify-content:center; color:#000080; font-weight:900; font-size:8px; border:1px solid #cbd5e1; flex-shrink:0;">BHIM</div>
                <span class="upi-app-name">BHIM UPI</span>
              </div>
            </div>

            <!-- UPI ID / Number Input -->
            <label class="input-label">UPI ID / Number</label>
            <input type="text" id="upiIdInput" class="upi-input-box" value="yuteka@okicicibank" placeholder="example@okicicibank" />

            <div class="other-options-title">More Payment Options</div>
            <div class="other-opt-row" onclick="payViaUPI('Credit/Debit Card')">
              <span class="other-opt-text">💳 Cards (Visa, Mastercard, RuPay)</span>
              <span>›</span>
            </div>
            <div class="other-opt-row" onclick="payViaUPI('NetBanking')">
              <span class="other-opt-text">🏦 Netbanking (Baroda, SBI, HDFC)</span>
              <span>›</span>
            </div>
          </div>

          <div class="rzp-footer">
            <div>
              <div style="font-size:0.68rem; color:#64748b; font-weight:600;">Booking #BK2026${String(id).padStart(4, '0')}</div>
              <div class="amount-disp">₹${parseFloat(order.totalAmount || 0).toFixed(2)}</div>
            </div>
            <button class="btn-continue" onclick="submitUPIForm()">Continue</button>
          </div>
        </div>

        <div id="processingOverlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.95); flex-direction:column; align-items:center; justify-content:center; z-index:9999;">
          <div style="width:48px; height:48px; border:4px solid #e2e8f0; border-top-color:#0284c7; border-radius:50%; animation:spin 0.8s linear infinite; margin-bottom:16px;"></div>
          <div id="processingText" style="font-size:1.1rem; font-weight:800; color:#0f172a;">Processing Payment...</div>
          <div style="font-size:0.85rem; color:#64748b; margin-top:6px;">Connecting securely to Razorpay</div>
        </div>

        <style>
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>

        <script>
          function payViaUPI(appName) {
            executePayment(appName);
          }

          function submitUPIForm() {
            var vpa = document.getElementById('upiIdInput').value || 'success@razorpay';
            executePayment('UPI ID (' + vpa + ')');
          }

          function executePayment(methodName) {
            var overlay = document.getElementById('processingOverlay');
            var text = document.getElementById('processingText');
            if (overlay && text) {
              text.innerText = 'Processing Payment via ' + methodName + '...';
              overlay.style.display = 'flex';
            }

            fetch('/api/payment/mock-pay/${id}', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentMethod: methodName })
            }).then(function() {
              document.body.innerHTML = \`
                <div style="background:#ffffff; border-radius:20px; padding:40px 30px; text-align:center; max-width:400px; width:100%; box-shadow:0 20px 40px rgba(0,0,0,0.1); border:1px solid #e2e8f0; margin:auto;">
                  <div style="width:64px; height:64px; background:#dcfce7; color:#166534; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2rem; margin:0 auto 16px auto;">✓</div>
                  <h2 style="color:#0f172a; font-weight:900; margin:0 0 8px 0; font-size:1.4rem;">Payment Successful!</h2>
                  <p style="color:#64748b; font-size:0.9rem; margin:0 0 20px 0;">Booking #BK2026${String(id).padStart(4, '0')} has been marked as <strong>Paid</strong> via \${methodName}.</p>
                  <div style="background:#f8fafc; border-radius:12px; padding:12px; font-size:0.85rem; color:#334155; margin-bottom:20px;">
                    ✨ A WhatsApp confirmation with your Tax Invoice PDF has been sent to your phone!
                  </div>
                  <button onclick="window.close()" style="background:#0f172a; color:white; border:none; padding:12px 24px; border-radius:10px; font-weight:700; cursor:pointer; width:100%;">Close Window</button>
                </div>
              \`;
            }).catch(function(err) {
              if (overlay) overlay.style.display = 'none';
            });
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
