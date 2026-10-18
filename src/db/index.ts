import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Connexion Neon (Postgres). DATABASE_URL vient de .env.local / des variables Vercel, jamais du code.
 * Sans DATABASE_URL, `db()` renvoie null : le site public reste servi avec son contenu par défaut.
 */
type DB = NodePgDatabase<typeof schema>;
const g = globalThis as unknown as { __nadraDb?: DB };

export function db(): DB | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!g.__nadraDb) {
    const local = /localhost|127\.0\.0\.1/.test(url);
    const pool = new Pool({ connectionString: url, max: 5, ssl: local ? undefined : { rejectUnauthorized: true } });
    g.__nadraDb = drizzle(pool, { schema });
  }
  return g.__nadraDb;
}

export function requireDb(): DB {
  const d = db();
  if (!d) throw new Error("DATABASE_URL manquant : configure la base Neon dans .env.local.");
  return d;
}

export { schema };
