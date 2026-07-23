const Razorpay = require('razorpay');
const prisma = require('./db');
require('dotenv').config();

async function getRazorpayClient() {
  let keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  let keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  try {
    const dbSettings = await prisma.businessSettings.findUnique({ where: { id: 1 } });
    if (dbSettings) {
      if (dbSettings.razorpayKeyId) keyId = dbSettings.razorpayKeyId.trim();
      if (dbSettings.razorpayKeySecret) keySecret = dbSettings.razorpayKeySecret.trim();
    }
  } catch (e) {
    console.error('[Razorpay Service] Error reading DB settings:', e.message);
  }

  const isMock = !keyId || !keySecret || keyId.startsWith('your_') || keyId === 'test_key';

  if (isMock) {
    return { client: null, keyId, isMock: true };
  }

  try {
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    return { client, keyId, isMock: false };
  } catch (err) {
    console.error('[Razorpay Service] Failed to initialize Razorpay SDK:', err.message);
    return { client: null, keyId, isMock: true };
  }
}

/**
 * Creates a Razorpay payment link for an order.
 * @param {number|string} orderId - Unique order identifier.
 * @param {number} amount - Bill total in INR.
 * @param {string} customerPhone - Customer contact number.
 * @param {string} customerName - Customer display name.
 * @returns {Promise<string>} The checkout link URL.
 */
const { generateOrderHash } = require('../utils/securityToken');

async function createPaymentLink(orderId, amount, customerPhone, customerName) {
  const { client, keyId, isMock } = await getRazorpayClient();
  const backendUrl = (process.env.BACKEND_URL || 'https://ironing-service.onrender.com').trim().replace(/\/$/, '');

  if (isMock || !client) {
    console.log(`[Razorpay Service] Operating in Mock mode for Order #${orderId}`);
    return `${backendUrl}/pay/${generateOrderHash(orderId, 'pay')}`;
  }

  // Standardize Indian phone number format for Razorpay
  const contactNumeric = (customerPhone || '').replace(/\D/g, '');
  const contactFormatted = contactNumeric.length === 10 ? `91${contactNumeric}` : (contactNumeric || '919876543210');

  try {
    const paymentLink = await client.paymentLink.create({
      amount: Math.round(amount * 100), // Razorpay takes amount in paise (1 INR = 100 Paise)
      currency: 'INR',
      description: `Ironing Service - Booking #BK2026${String(orderId).padStart(4, '0')}`,
      customer: {
        name: customerName || 'Customer',
        contact: contactFormatted
      },
      notify: {
        sms: false,
        email: false
      },
      callback_url: `${backendUrl}/api/payment/success-callback`,
      callback_method: 'get'
    });

    console.log(`[Razorpay API] Real Payment Link created: ${paymentLink.short_url}`);
    return paymentLink.short_url;
  } catch (error) {
    console.error('[Razorpay API Error] Payment link creation failed:', error.response ? error.response.data : error.message);
    // Fallback to local mock checkout if Razorpay API fails (e.g. invalid test key credentials)
    return `${backendUrl}/pay/${generateOrderHash(orderId, 'pay')}`;
  }
}

module.exports = {
  createPaymentLink,
  getRazorpayClient
};
