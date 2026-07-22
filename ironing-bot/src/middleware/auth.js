const jwt = require('jsonwebtoken');
const prisma = require('../services/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_phrase';

function authenticateJWT(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Access token is required' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Malformed authorization token' });
    }

    const token = parts[1];

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      if (allowedRoles && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: `Access denied` });
      }

      req.user = decoded;
      if (decoded.role === 'partner') {
        req.partnerId = decoded.partnerId;
        
        // Verify partner is active in the database
        try {
          const partner = await prisma.partner.findUnique({
            where: { id: decoded.partnerId }
          });
          if (!partner || !partner.active) {
            return res.status(403).json({ error: 'Partner account is inactive or on leave' });
          }
        } catch (dbErr) {
          console.error('[Auth Middleware] Database check error:', dbErr);
          return res.status(500).json({ error: 'Database check failed' });
        }
      }
      next();
    });
  };
}

module.exports = {
  authenticateJWT,
  authenticateAdmin: authenticateJWT(['admin', 'subadmin']),
  authenticateSuperAdmin: authenticateJWT(['admin']),
  authenticatePartner: authenticateJWT(['partner'])
};
