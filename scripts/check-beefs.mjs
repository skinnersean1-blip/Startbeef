import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  const allBeefs = await prisma.beef.findMany({
    select: {
      id: true,
      claim: true,
      status: true,
      endsAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  console.log('\n=== Recent Beefs ===');
  allBeefs.forEach(beef => {
    const expired = beef.endsAt && new Date(beef.endsAt) < new Date();
    console.log(`
ID: ${beef.id}
Claim: ${beef.claim.substring(0, 60)}...
Status: ${beef.status}
Created: ${beef.createdAt.toISOString()}
Ends: ${beef.endsAt?.toISOString() || 'N/A'}
Expired: ${expired ? 'YES' : 'NO'}
---`);
  });

  const liveBeefs = await prisma.beef.findMany({
    where: { status: 'LIVE' },
    select: {
      id: true,
      claim: true,
      endsAt: true,
    },
  });

  console.log(`\n=== LIVE Beefs: ${liveBeefs.length} ===`);

  const expiredLive = liveBeefs.filter(b => b.endsAt && new Date(b.endsAt) < new Date());
  console.log(`Expired LIVE beefs (need judging): ${expiredLive.length}`);

  if (expiredLive.length > 0) {
    expiredLive.forEach(beef => {
      console.log(`- ${beef.id}: "${beef.claim.substring(0, 40)}..." (ended ${beef.endsAt?.toISOString()})`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
