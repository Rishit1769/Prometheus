import { prisma } from "./client.js";

try {
  await prisma.$queryRaw`SELECT 1`;
  const [{ extname }] = await prisma.$queryRaw<{ extname: string }[]>`
    SELECT extname FROM pg_extension WHERE extname = 'vector'
  `;
  const tables = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('User', 'Account', 'Session', 'VerificationToken')
    ORDER BY table_name
  `;
  console.log(JSON.stringify({ connected: true, pgvector: Boolean(extname), tables: tables.map(({ table_name }) => table_name) }));
} finally {
  await prisma.$disconnect();
}
