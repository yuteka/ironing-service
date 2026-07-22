const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Generates an invoice PDF for a given order and saves it to the specified filePath.
 * @param {Object} order - Order details from database including items and customer.
 * @param {string} filePath - Absolute file path to save the generated PDF.
 * @returns {Promise<void>}
 */
async function generateInvoicePDF(order, filePath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      
      doc.pipe(writeStream);
      
      // Top Primary Accent Banner
      doc.rect(0, 0, 612, 100).fill('#0ea5e9');
      
      // Invoice Brand Header
      doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('IRONING SERVICE', 50, 30);
      doc.fontSize(10).font('Helvetica').text('Professional Garment Care & Finishing', 50, 58);
      doc.fontSize(16).font('Helvetica-Bold').text('INVOICE', 450, 40, { align: 'right', width: 112 });
      
      // Format Date
      const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Customer Billed-To details (Left Column)
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('BILLED TO:', 50, 130);
      doc.font('Helvetica').fillColor('#475569');
      doc.text(order.customer.name, 50, 146);
      doc.text(order.customer.phone, 50, 160);
      doc.text(order.customer.address, 50, 174, { width: 240 });
      if (order.customer.landmark) {
        doc.text(`Landmark: ${order.customer.landmark}`, 50, 204);
      }
      
      // Invoice metadata details (Right Column)
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('INVOICE DETAILS:', 350, 130);
      doc.font('Helvetica').fillColor('#475569');
      doc.text(`Invoice No: INV-2026-${order.id}`, 350, 146);
      doc.text(`Date: ${formattedDate}`, 350, 160);
      doc.text(`Payment Mode: ${order.paymentMethod || 'Pending'}`, 350, 174);
      
      // Payment status with color code
      doc.fillColor('#0F172A').text('Status: ', 350, 188);
      const isPaid = order.paymentStatus === 'Paid';
      doc.fillColor(isPaid ? '#059669' : '#d97706')
         .font('Helvetica-Bold')
         .text(order.paymentStatus.toUpperCase(), 390, 188);
      
      // Table Header Shading
      doc.rect(50, 236, 512, 24).fill('#f1f5f9');
      
      // Table Column Titles
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold');
      doc.text('GARMENT ITEM', 62, 244);
      doc.text('QTY', 260, 244, { width: 50, align: 'center' });
      doc.text('RATE (INR)', 360, 244, { width: 80, align: 'right' });
      doc.text('TOTAL (INR)', 460, 244, { width: 90, align: 'right' });
      
      // Render Table rows
      let currentY = 268;
      doc.fontSize(9).font('Helvetica');
      
      order.items.forEach((item, index) => {
        // Zebra striping
        if (index % 2 === 0) {
          doc.rect(50, currentY - 4, 512, 22).fill('#f8fafc');
        }
        
        doc.fillColor('#334155');
        doc.text(item.itemType, 62, currentY);
        doc.text(item.quantity.toString(), 260, currentY, { width: 50, align: 'center' });
        doc.text(`₹${item.rate.toFixed(2)}`, 360, currentY, { width: 80, align: 'right' });
        doc.text(`₹${item.subtotal.toFixed(2)}`, 460, currentY, { width: 90, align: 'right' });
        
        currentY += 22;
      });
      
      // Horizontal separation line
      doc.moveTo(50, currentY + 5).lineTo(562, currentY + 5).strokeColor('#e2e8f0').lineWidth(1).stroke();
      
      // Calculate Subtotal & Tax values
      const totalAmount = order.totalAmount || 0;
      const gstPercentage = 5.0;
      const taxAmount = totalAmount - (totalAmount / (1 + (gstPercentage / 100)));
      const subtotalAmount = totalAmount - taxAmount;
      
      // Summary Card
      const summaryY = currentY + 20;
      doc.rect(320, summaryY, 242, 72).fill('#f8fafc');
      doc.rect(320, summaryY, 242, 72).strokeColor('#e2e8f0').lineWidth(1).stroke();
      
      doc.fillColor('#475569').fontSize(9).font('Helvetica');
      doc.text('Subtotal:', 336, summaryY + 12);
      doc.text(`₹${subtotalAmount.toFixed(2)}`, 450, summaryY + 12, { width: 96, align: 'right' });
      
      doc.text(`GST (${gstPercentage.toFixed(1)}%):`, 336, summaryY + 28);
      doc.text(`₹${taxAmount.toFixed(2)}`, 450, summaryY + 28, { width: 96, align: 'right' });
      
      doc.fillColor('#0f172a').font('Helvetica-Bold');
      doc.text('Grand Total:', 336, summaryY + 48);
      doc.text(`₹${totalAmount.toFixed(2)}`, 450, summaryY + 48, { width: 96, align: 'right' });
      
      // Footer Branding Notes
      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Oblique');
      doc.text('This is a computer-generated invoice. No physical signature is required.', 50, 700, { align: 'center', width: 512 });
      doc.text('Thank you for choosing Ironing Service! Enjoy fresh, professionally finished garments.', 50, 714, { align: 'center', width: 512 });
      
      doc.end();
      
      writeStream.on('finish', () => {
        resolve();
      });
      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generates a clean price list catalog PDF.
 */
async function generatePriceListPDF(filePath) {
  const prisma = require('./db');
  
  // Fetch active items from database catalog
  let items = [];
  try {
    items = await prisma.priceCatalog.findMany({ where: { active: true } });
  } catch (err) {
    console.error('Failed to load dynamic price catalog for PDF:', err);
  }

  // Fallback if database is empty
  if (!items || items.length === 0) {
    items = [
      { itemName: 'Shirt', rate: 10 },
      { itemName: 'Pant', rate: 10 },
      { itemName: 'Saree', rate: 40 },
      { itemName: 'T-Shirt', rate: 15 },
      { itemName: 'Coat', rate: 50 }
    ];
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      
      doc.pipe(writeStream);
      
      // Top Primary Accent Banner
      doc.rect(0, 0, 612, 100).fill('#0ea5e9');
      
      // Catalog Brand Header
      doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('IRONING SERVICE', 50, 30);
      doc.fontSize(10).font('Helvetica').text('Professional Garment Care & Finishing', 50, 58);
      doc.fontSize(16).font('Helvetica-Bold').text('PRICING CATALOG', 400, 40, { align: 'right', width: 162 });
      
      // Catalog Metadata
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('OFFICIAL RATE CARD:', 50, 130);
      doc.font('Helvetica').fillColor('#475569');
      doc.text('Standard pricing checklist for all ironing and laundering items.', 50, 146);
      doc.text(`Effective Date: ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`, 50, 160);
      
      // Table Header Shading
      doc.rect(50, 196, 512, 24).fill('#f1f5f9');
      
      // Table Column Titles
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold');
      doc.text('GARMENT ITEM', 62, 204);
      doc.text('RATE PER ITEM (INR)', 360, 204, { width: 190, align: 'right' });
      
      // Render Catalog rows
      let currentY = 228;
      doc.fontSize(9).font('Helvetica');
      
      items.forEach((item, index) => {
        // Zebra striping
        if (index % 2 === 0) {
          doc.rect(50, currentY - 4, 512, 22).fill('#f8fafc');
        }
        
        doc.fillColor('#334155');
        doc.text(item.itemName, 62, currentY);
        doc.text(`₹${item.rate.toFixed(2)}`, 360, currentY, { width: 190, align: 'right' });
        
        currentY += 22;
      });
      
      // Horizontal separation line
      doc.moveTo(50, currentY + 5).lineTo(562, currentY + 5).strokeColor('#e2e8f0').lineWidth(1).stroke();
      
      // Footer Branding Notes
      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Oblique');
      doc.text('Prices are subject to standard store business terms. For bulk orders, contact admin.', 50, 700, { align: 'center', width: 512 });
      doc.text('Thank you for choosing Ironing Service! Enjoy fresh, professionally finished garments.', 50, 714, { align: 'center', width: 512 });
      
      doc.end();
      
      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateInvoicePDF,
  generatePriceListPDF
};
