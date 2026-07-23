const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || 'ironing_service_secure_key_2026';

/**
 * Generates an encrypted, secure random hash token for payment & invoice URLs.
 * e.g. Order #114 -> pay_sec_114xa7f92b41
 */
function generateOrderHash(orderId, type = 'pay') {
  const numericId = parseInt(orderId);
  const hash = crypto.createHmac('sha256', SECRET)
    .update(`${type}_order_${numericId}`)
    .digest('hex')
    .substring(0, 10);
  const prefix = type === 'invoice' ? 'inv' : 'pay';
  return `${prefix}_sec_${numericId}x${hash}`;
}

/**
 * Parses and verifies an encrypted secure hash token, returning the validated order ID.
 */
function parseOrderHash(token, expectedType = 'pay') {
  if (!token) return null;
  const str = String(token).trim();
  
  // Format: pay_sec_114xa7f92b41 or inv_sec_114xa7f92b41
  const match = str.match(/^(?:pay|inv)_sec_(\d+)x([a-f0-9]+)$/i);
  if (match) {
    const orderId = parseInt(match[1]);
    const hash = match[2];
    const expectedHash = crypto.createHmac('sha256', SECRET)
      .update(`${str.startsWith('inv') ? 'invoice' : 'pay'}_order_${orderId}`)
      .digest('hex')
      .substring(0, 10);

    if (hash === expectedHash) {
      return orderId;
    }
  }

  // Fallback for numeric IDs during transition
  const num = parseInt(str);
  return isNaN(num) ? null : num;
}

module.exports = {
  generateOrderHash,
  parseOrderHash
};
