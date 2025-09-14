import { PrismaClient } from "@prisma/client";

// Extend the global object to hold a Prisma instance in development
declare global {
  // This lets TypeScript know about our custom global property
  var prismaGlobal: PrismaClient | undefined;
}

// Create a single PrismaClient instance in dev to avoid hot-reload issues
const prisma =
  global.prismaGlobal ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"], // Optional: helpful for debugging
  });

// Assign to global only in development
if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}

export default prisma;
