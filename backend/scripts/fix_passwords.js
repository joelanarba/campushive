require('dotenv').config();
const { prisma } = require('../src/config/db');

async function fixPasswords() {
  const hash = '$2b$10$s8X0T83el93nGjYTkCbd4ecqfYG7/.8Ty6KqIKnoyaAiqE57CjSEG';
  
  await prisma.user.updateMany({
    where: { email: { in: ['waakye@ug.edu.gh', 'buymore@ug.edu.gh', 'bigrich@ug.edu.gh', 'acetutors@ug.edu.gh'] } },
    data: { password_hash: hash }
  });
  
  console.log('Passwords fixed.');
}

fixPasswords().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
