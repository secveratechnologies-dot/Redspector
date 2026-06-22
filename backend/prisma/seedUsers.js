/**
 * Demo user seed script.
 * Creates a demo tenant and three seed users (admin, analyst, executive)
 * with the credentials shown on the login page.
 *
 * Run with:  node prisma/seedUsers.js
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_TENANT = {
  name: 'RedSpecter Demo',
  domain: 'redspecter.com',
};

const DEMO_USERS = [
  {
    email: 'admin@redspecter.com',
    password: 'admin123',
    fullName: 'Demo Admin',
    role: 'Tenant Admin',
  },
  {
    email: 'analyst@redspecter.com',
    password: 'analyst123',
    fullName: 'Demo Analyst',
    role: 'Security Analyst',
  },
  {
    email: 'executive@redspecter.com',
    password: 'executive123',
    fullName: 'Demo Executive',
    role: 'Viewer',
  },
];

async function main() {
  console.log('--- Seeding demo users ---\n');

  // Upsert the demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { domain: DEMO_TENANT.domain },
    update: { name: DEMO_TENANT.name },
    create: DEMO_TENANT,
  });
  console.log(`✓ Tenant: "${tenant.name}" (id: ${tenant.id})`);

  // Upsert demo users
  for (const u of DEMO_USERS) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(u.password, salt);

    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      // Update password in case it changed
      await prisma.user.update({
        where: { email: u.email },
        data: { password: hashed, role: u.role, fullName: u.fullName, tenantId: tenant.id },
      });
      console.log(`↻ Updated:  ${u.email}  (${u.role})`);
    } else {
      await prisma.user.create({
        data: {
          email: u.email,
          password: hashed,
          fullName: u.fullName,
          role: u.role,
          tenantId: tenant.id,
        },
      });
      console.log(`✓ Created:  ${u.email}  (${u.role})`);
    }
  }

  console.log('\nDemo credentials ready:');
  console.log('  admin@redspecter.com     / admin123');
  console.log('  analyst@redspecter.com   / analyst123');
  console.log('  executive@redspecter.com / executive123');
  console.log('\nMFA bypass code: 123456\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
