import "server-only";
import { createDb, type DB } from "./client";
import * as schema from "./schema";

/**
 * Connexion Neon. DATABASE_URL vient de .env.local / des variables Vercel, jamais du code.
 * Sans DATABASE_URL, `db()` renvoie null : le site public reste servi avec son contenu par défaut.
 */
const g = globalThis as unknown as { __nadraDb?: DB };

export function db(): DB | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  g.__nadraDb ??= createDb(url);
  return g.__nadraDb;
}

export function requireDb(): DB {
  const d = db();
  if (!d) throw new Error("DATABASE_URL manquant : configure la base Neon dans .env.local.");
  return d;
}

export { schema };
