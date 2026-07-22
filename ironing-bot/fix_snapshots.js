const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { pickupAddress: null },
        { customerNameSnapshot: null }
      ]
    },
    include: {
      customer: true
    }
  });

  console.log(`Found ${orders.length} orders missing snapshots.`);

  let updatedCount = 0;
  for (const order of orders) {
    if (order.customer) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          customerNameSnapshot: order.customer.name,
          pickupAddress: order.customer.address,
          pickupLandmark: order.customer.landmark
        }
      });
      updatedCount++;
    }
  }

  console.log(`Successfully backfilled snapshots for ${updatedCount} legacy orders.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
