import { createDb } from "../src/db/client";

export function scriptDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL manquant dans .env.local");
    process.exit(1);
  }
  return { db: createDb(url), local: /@(localhost|127\.0\.0\.1)[:/]/.test(url) };
}
