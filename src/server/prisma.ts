import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let databaseUrl = process.env.DATABASE_URL || "file:./dev.db";

if (process.env.VERCEL) {
  const destPath = "/tmp/dev.db";
  if (!fs.existsSync(destPath)) {
    try {
      const srcPath = path.join(process.cwd(), "prisma", "dev.db");
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        fs.chmodSync(destPath, 0o666);
      }
    } catch (e) {
      console.error("Failed to copy database to /tmp:", e);
    }
  }
  databaseUrl = "file:/tmp/dev.db";
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
