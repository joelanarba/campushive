const { prisma } = require('../src/config/db');

async function main() {
  // Ensure ent@gmail.com exists
  let entUser = await prisma.user.findUnique({
    where: { email: 'ent@gmail.com' },
    include: { entrepreneur_profiles: { include: { services: true } } }
  });

  if (!entUser) {
    console.log("Creating ent@gmail.com");
  } else {
    console.log("Found ent@gmail.com");
    let profile = entUser.entrepreneur_profiles[0];
    if (!profile) {
      console.log("Creating entrepreneur profile for ent@gmail.com");
      profile = await prisma.entrepreneurProfile.create({
        data: {
          user_id: entUser.id,
          business_name: 'Ent Demo Services',
          description: 'A demo service for testing.',
          phone_number: '1234567890',
          location: 'Demo Campus',
          verification_status: 'verified'
        }
      });
    }

    if (!entUser.entrepreneur_profiles[0]?.services?.length && !profile.services?.length) {
      console.log("Creating service for ent@gmail.com");
      
      const cat = await prisma.serviceCategory.findFirst();
      await prisma.service.create({
        data: {
          entrepreneur_id: profile.id,
          category_id: cat.id,
          title: 'Demo Booking Service',
          description: 'Book this service to test the flow!',
          price: 50.00,
          duration_minutes: 60,
          location_type: 'online'
        }
      });
    }
  }

  // Now seed availability for ALL services
  const services = await prisma.service.findMany();
  console.log(`Seeding availability for ${services.length} services...`);

  // We want to add slots for tomorrow and the next day
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const tomorrowStart = new Date(tomorrow);
  tomorrowStart.setHours(9, 0, 0, 0); // 9:00 AM

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(10, 0, 0, 0); // 10:00 AM

  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 2);
  nextDay.setHours(0, 0, 0, 0);

  const nextDayStart = new Date(nextDay);
  nextDayStart.setHours(10, 0, 0, 0); // 10:00 AM

  const nextDayEnd = new Date(nextDay);
  nextDayEnd.setHours(11, 0, 0, 0); // 11:00 AM

  let slotsCreated = 0;
  for (const service of services) {
    // Delete future slots for this service to avoid unique constraint collisions
    await prisma.availabilitySlot.deleteMany({
      where: {
        service_id: service.id,
        slot_date: { gt: new Date() }
      }
    });

    // Create a slot for tomorrow
    await prisma.availabilitySlot.create({
      data: {
        service_id: service.id,
        slot_date: tomorrow,
        start_time: tomorrowStart,
        end_time: tomorrowEnd,
        is_active: true
      }
    });

    // Create a slot for next day
    await prisma.availabilitySlot.create({
      data: {
        service_id: service.id,
        slot_date: nextDay,
        start_time: nextDayStart,
        end_time: nextDayEnd,
        is_active: true
      }
    });
    slotsCreated += 2;
  }
  
  console.log(`Successfully created ${slotsCreated} slots.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
