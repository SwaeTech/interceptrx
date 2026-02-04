import { prisma } from "../lib/prisma";

async function main() {
  console.log("Starting seed...");

  // Hash the default password, just use plain text for ease of testing
  const hashedPassword = "password";

  // Create default users based on auth config
  const users = [
    {
      id: "1",
      email: "admin1@example.com",
      name: "Admin User",
      password: hashedPassword,
      scopes: ["admin", "org:org1"],
      orgId: "org1",
    },
    {
      id: "2",
      email: "admin2@example.com",
      name: "Admin User",
      password: hashedPassword,
      scopes: ["admin", "org:org2"],
      orgId: "org2",
    },
    {
      id: "3",
      email: "manager@example.com",
      name: "Manager User",
      password: hashedPassword,
      scopes: ["manager", "org:org1"],
      orgId: "org1",
    },
    {
      id: "4",
      email: "viewer@example.com",
      name: "Viewer User",
      password: hashedPassword,
      scopes: ["viewer", "org:org1"],
      orgId: "org1",
    },
  ];

  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    console.log(`Created/Updated user: ${created.email}`);
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
