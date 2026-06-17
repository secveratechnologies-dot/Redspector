import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const threatIntelData = [
  {
    cveId: 'CVE-2021-44228',
    description: 'Apache Log4j2 JNDI features do not protect against attacker controlled LDAP and other JNDI related endpoints.',
    cvss: 10.0,
    epss: 0.97,
    isKev: true,
    mitreAttack: ['T1190 - Exploit Public-Facing Application']
  },
  {
    cveId: 'CVE-2023-38606',
    description: 'An issue in the Apple macOS/iOS kernel may allow a malicious application to modify sensitive kernel state.',
    cvss: 7.8,
    epss: 0.85,
    isKev: true,
    mitreAttack: ['T1068 - Exploitation for Privilege Escalation']
  },
  {
    cveId: 'CVE-2023-23397',
    description: 'Microsoft Outlook Elevation of Privilege Vulnerability allowing access to NetNTLM hash.',
    cvss: 9.8,
    epss: 0.92,
    isKev: true,
    mitreAttack: ['T1210 - Exploitation of Remote Services']
  },
  {
    cveId: 'CVE-2024-21626',
    description: 'runc container breakout vulnerability via file descriptor leak allowing host filesystem access.',
    cvss: 8.6,
    epss: 0.05,
    isKev: false,
    mitreAttack: ['T1611 - Escape to Host']
  },
  {
    cveId: 'CVE-2023-49103',
    description: 'ownCloud phpinfo disclosure leading to exposure of admin credentials and environment variables.',
    cvss: 10.0,
    epss: 0.72,
    isKev: true,
    mitreAttack: ['T1592 - Gather Victim Host Information', 'T1190 - Exploit Public-Facing Application']
  }
];

async function main() {
  console.log('Seeding threat intelligence catalog...');
  for (const cve of threatIntelData) {
    await prisma.cve.upsert({
      where: { cveId: cve.cveId },
      update: cve,
      create: cve
    });
  }
  console.log(`Seeded ${threatIntelData.length} threat intelligence entries.`);
}

main()
  .catch((e) => {
    console.error('Error seeding threat intelligence:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
