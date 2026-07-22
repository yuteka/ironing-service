const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing all existing database records...');
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.partner.deleteMany({});
  await prisma.supportTicket.deleteMany({});
  await prisma.priceCatalog.deleteMany({});
  await prisma.adminUser.deleteMany({});
  await prisma.businessSettings.deleteMany({});

  console.log('Seeding fresh Business Settings...');
  await prisma.businessSettings.create({
    data: {
      id: 1,
      businessName: "Ironing Service",
      businessAddress: "11/2, Industrial Estate, KK Nagar, Chennai",
      gstNumber: "33AAAAA1111A1Z1",
      gstPercentage: 5.0,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mock",
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "mock_secret",
      razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "mock_webhook_secret",
      whatsappToken: process.env.WHATSAPP_TOKEN || "mock_token"
    }
  });

  console.log('Seeding fresh Admin Users...');
  const adminHash = await bcrypt.hash('admin123', 10);
  const subadminHash = await bcrypt.hash('subadmin123', 10);
  
  await prisma.adminUser.create({
    data: { 
      username: 'admin', 
      password: adminHash, 
      name: 'Yutheka (Super Admin)', 
      role: 'SUPER_ADMIN', 
      active: true 
    }
  });

  await prisma.adminUser.create({
    data: { 
      username: 'subadmin', 
      password: subadminHash, 
      name: 'Shop Manager (Sub Admin)', 
      role: 'SUB_ADMIN', 
      active: true 
    }
  });

  console.log('Seeding fresh Price Catalog...');
  const catalog = [
    { itemName: 'Shirt', rate: 15 },
    { itemName: 'Pant', rate: 20 },
    { itemName: 'Saree', rate: 40 },
    { itemName: 'T-Shirt', rate: 15 },
    { itemName: 'Coat', rate: 50 },
  ];
  
  for (const item of catalog) {
    await prisma.priceCatalog.create({ data: item });
  }

  console.log('Seeding fresh Active Pickup Partners...');
  const abiHash = await bcrypt.hash('Abi123', 10);
  const neoHash = await bcrypt.hash('Neo123', 10);
  
  await prisma.partner.create({
    data: { 
      name: 'Abi', 
      phone: '919876543210', 
      username: 'Abi', 
      password: abiHash, 
      active: true 
    }
  });

  await prisma.partner.create({
    data: { 
      name: 'Neo', 
      phone: '919876543211', 
      username: 'Neo', 
      password: neoHash, 
      active: true 
    }
  });

  console.log('Database Seeding successfully completed! Records are cleaned and ready for fresh testing.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
