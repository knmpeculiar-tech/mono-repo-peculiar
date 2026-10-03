// One-off/reusable script to create an admin account: a Supabase Auth user
// plus a Profile row with role ADMIN. Usage:
//   pnpm --filter api exec tsx scripts/create-admin.ts <email> [password]
// If no password is given, a random one is generated and printed once.
import { randomBytes } from "node:crypto";
import { prisma } from "../src/lib/prisma";
import { supabaseAdmin } from "../src/lib/supabase";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: tsx scripts/create-admin.ts <email> [password]");
    process.exit(1);
  }
  const password = process.argv[3] ?? randomBytes(9).toString("base64url");

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    console.error("Failed to create Supabase user:", error?.message);
    process.exit(1);
  }

  await prisma.profile.upsert({
    where: { id: data.user.id },
    update: { role: "ADMIN", email },
    create: { id: data.user.id, email, role: "ADMIN" },
  });

  console.log("Admin account created:");
  console.log("  email:   ", email);
  console.log("  password:", password);
  console.log("  user id: ", data.user.id);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
