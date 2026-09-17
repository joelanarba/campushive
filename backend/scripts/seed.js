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

  const foodCat = await prisma.serviceCategory.findFirst({ where: { tag: 'food' } });
  const techCat = await prisma.serviceCategory.findFirst({ where: { tag: 'tech' } });
  const beautyCat = await prisma.serviceCategory.findFirst({ where: { tag: 'beauty' } });
  const academicsCat = await prisma.serviceCategory.findFirst({ where: { tag: 'academics' } });

  console.log('Categories seeded.');

  const servicesCount = await prisma.service.count();
  if (servicesCount < 5) {
    console.log('Seeding KNUST providers and services...');
    
    // Waakye Palace
    const p1 = await prisma.user.create({ data: { email: 'waakye@ug.edu.gh', password_hash: 'dummy', full_name: 'Waakye Palace', role: ['entrepreneur'] } });
    const waakyeProvider = await prisma.entrepreneurProfile.create({ data: { user_id: p1.id, business_name: "Waakye Palace", description: 'Best Waakye in Ayeduase.', location: 'Ayeduase Gate', phone_number: '0551111111', verification_status: 'verified' } });
    
    await prisma.service.create({ data: { entrepreneur_id: waakyeProvider.id, category_id: foodCat.id, title: 'Waakye Deluxe Pack', description: 'Waakye with beef, egg, wele, and salad. Delivered hot.', location_type: 'customer_location', price: 45, duration_minutes: 30, is_active: true } });
    await prisma.service.create({ data: { entrepreneur_id: waakyeProvider.id, category_id: foodCat.id, title: 'Gob3 Special', description: 'Beans and plantain with egg.', location_type: 'customer_location', price: 25, duration_minutes: 30, is_active: true } });

    // Buymore Computers
    const p2 = await prisma.user.create({ data: { email: 'buymore@ug.edu.gh', password_hash: 'dummy', full_name: 'Buymore Computers', role: ['entrepreneur'] } });
    const techProvider = await prisma.entrepreneurProfile.create({ data: { user_id: p2.id, business_name: "Buymore Computers", description: 'Fast laptop repairs and software installation.', location: 'Tech Commercial Area', phone_number: '0552222222', verification_status: 'verified' } });
    
    await prisma.service.create({ data: { entrepreneur_id: techProvider.id, category_id: techCat.id, title: 'Laptop Dusting & Thermal Paste', description: 'Prevent overheating. Full clean.', location_type: 'provider_location', price: 80, duration_minutes: 60, is_active: true } });
    await prisma.service.create({ data: { entrepreneur_id: techProvider.id, category_id: techCat.id, title: 'Windows/OS Re-installation', description: 'Fresh OS install and driver setup.', location_type: 'provider_location', price: 100, duration_minutes: 120, is_active: true } });

    // Big Rich Atlanta Salon
    const p3 = await prisma.user.create({ data: { email: 'bigrich@ug.edu.gh', password_hash: 'dummy', full_name: 'Big Rich Salon', role: ['entrepreneur'] } });
    const beautyProvider = await prisma.entrepreneurProfile.create({ data: { user_id: p3.id, business_name: "Big Rich Atlanta Salon", description: 'Professional braiding and wig installation.', location: 'Ayeduase', phone_number: '0553333333', verification_status: 'verified' } });
    
    await prisma.service.create({ data: { entrepreneur_id: beautyProvider.id, category_id: beautyCat.id, title: 'Knotless Braids (Medium)', description: 'Neat medium knotless braids. Hair extensions not included.', location_type: 'provider_location', price: 180, duration_minutes: 240, is_active: true } });
    await prisma.service.create({ data: { entrepreneur_id: beautyProvider.id, category_id: beautyCat.id, title: 'Wig Installation', description: 'Frontal melting and styling.', location_type: 'provider_location', price: 120, duration_minutes: 90, is_active: true } });

    // Ace Tutors
    const p4 = await prisma.user.create({ data: { email: 'acetutors@ug.edu.gh', password_hash: 'dummy', full_name: 'Ace Tutors', role: ['entrepreneur'] } });
    const tutorsProvider = await prisma.entrepreneurProfile.create({ data: { user_id: p4.id, business_name: "KNUST Ace Tutors", description: 'A+ Engineering and Science Tutoring.', location: 'Brunei Complex', phone_number: '0554444444', verification_status: 'verified' } });
    
    await prisma.service.create({ data: { entrepreneur_id: tutorsProvider.id, category_id: academicsCat.id, title: 'Calculus II Crash Course', description: '1-on-1 intensive session for midsems.', location_type: 'online', price: 50, duration_minutes: 120, is_active: true } });
    await prisma.service.create({ data: { entrepreneur_id: tutorsProvider.id, category_id: academicsCat.id, title: 'Final Year Project Proofreading', description: 'Grammar, formatting, and structural checks.', location_type: 'online', price: 150, duration_minutes: 1440, is_active: true } });

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
