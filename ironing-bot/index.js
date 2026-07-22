const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());

// Razorpay webhook requires raw body for signature verification.
// We capture it before mounting general JSON parsers.
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists for storing cloth checking photos locally
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
// Pre-generate / Serve Price List PDF dynamically on-demand
const pdfService = require('./src/services/pdf');
const priceListPath = path.join(uploadsDir, 'price_list.pdf');

app.get('/uploads/price_list.pdf', async (req, res) => {
  try {
    await pdfService.generatePriceListPDF(priceListPath);
    res.sendFile(priceListPath);
  } catch (err) {
    console.error('[On-Demand Price PDF Error]:', err);
    res.status(500).send('Error generating price list PDF');
  }
});

app.use('/uploads', express.static(uploadsDir));

// SSE setup
let clients = [];

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push(res);
  
  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

global.emitSSE = (event, data) => {
  clients.forEach(client => client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
};

// Route Imports
const webhookRoutes = require('./src/routes/webhook');
const orderRoutes = require('./src/routes/orders');
const partnerRoutes = require('./src/routes/partners');
const partnerJobsRoutes = require('./src/routes/partnerJobs');
const paymentRoutes = require('./src/routes/payment');
const authRoutes = require('./src/routes/auth');
const ticketRoutes = require('./src/routes/tickets');
const catalogRoutes = require('./src/routes/catalog');
const customerRoutes = require('./src/routes/customers');
const settingsRoutes = require('./src/routes/settings');
const paymentsRoutes = require('./src/routes/payments');

// Mount routes
app.use('/webhook', webhookRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/partner/jobs', partnerJobsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentsRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot running on port ${PORT}`);
});

module.exports = app;
