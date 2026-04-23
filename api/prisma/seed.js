import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@spike.local';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) return;

  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
  await prisma.user.create({
    data: {
      name: 'SPIKE Admin',
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
