import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo user
  const hashedPassword = await bcryptjs.hash("password123", 12);

  const user = await db.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@example.com",
      password: hashedPassword,
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create demo workspace
  const workspace = await db.workspace.upsert({
    where: { slug: "demo-workspace" },
    update: {},
    create: {
      name: "Demo Workspace",
      slug: "demo-workspace",
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  console.log(`Created workspace: ${workspace.name}`);
  console.log("\nSeed complete!");
  console.log("Login with: demo@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
