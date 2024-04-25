import { PrismaClient } from "@prisma/client";

type GlobalThis = typeof globalThis & {
  prisma: PrismaClient;
};

let db: PrismaClient;
if (process.env.NODE_ENV === "production") {
  db = new PrismaClient();
} else {
  const globalWithPrisma = global as GlobalThis;
  if (!globalWithPrisma.prisma) globalWithPrisma.prisma = new PrismaClient();
  db = globalWithPrisma.prisma;
}

export default db;
