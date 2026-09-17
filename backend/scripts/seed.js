require('dotenv').config();
const { prisma } = require('../src/config/db');

async function seed() {
  console.log('Seeding categories...');
  const categories = [
    { category_name: 'Beauty', tag: 'beauty', description: 'Haircuts, braids, makeup, and aesthetics' },
    { category_name: 'Food', tag: 'food', description: 'Homecooked meals, snacks, and catering' },
    { category_name: 'Tech', tag: 'tech', description: 'Repairs, software, and IT help' },
    { category_name: 'Academics', tag: 'academics', description: 'Tutoring, proofreading, and notes' },
  ];

  for (const cat of categories) {
    const existing = await prisma.serviceCategory.findFirst({ where: { tag: cat.tag } });
    if (!existing) {
      await prisma.serviceCategory.create({ data: cat });
    }
  }

  console.log('Categories seeded.');

  const servicesCount = await prisma.service.count();
  if (servicesCount === 0) {
    console.log('No services found. Creating dummy provider and services...');
    
    const user = await prisma.user.create({
      data: {
        email: 'demo_provider@ug.edu.gh',
        password_hash: 'dummy',
        full_name: 'Demo Provider',
        role: ['entrepreneur'],
      }
    });

    const provider = await prisma.entrepreneurProfile.create({
      data: {
        user_id: user.id,
        business_name: "Kwame's Barber Studio",
        description: 'The best cuts on campus.',
        location: 'Commonwealth Hall, Block C',
        phone_number: '0551234567',
        verification_status: 'verified',
      }
    });

    const beautyCat = await prisma.serviceCategory.findFirst({ where: { tag: 'beauty' } });
    
    await prisma.service.create({
      data: {
        entrepreneur_id: provider.id,
        category_id: beautyCat.id,
        title: 'Skin Fade + Line-up',
        description: 'Precision fade with a sharp line-up finish.',
        location_type: 'provider_location',
        price: 35,
        duration_minutes: 40,
        is_active: true,
      }
    });

    await prisma.service.create({
      data: {
        entrepreneur_id: provider.id,
        category_id: beautyCat.id,
        title: 'Beard Trim',
        description: 'Shape-up and beard oil finish.',
        location_type: 'provider_location',
        price: 15,
        duration_minutes: 20,
        is_active: true,
      }
    });
    console.log('Dummy services seeded.');
  }

  console.log('Seeding complete.');
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});

