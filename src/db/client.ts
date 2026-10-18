import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Neon : pilote HTTP serverless (recommandé sur Vercel, passe partout, aucune connexion à garder ouverte).
 * Postgres local (localhost) : pilote node-postgres classique, pour développer sans Neon.
 */
export type DB = NodePgDatabase<typeof schema>;

export function createDb(url: string): DB {
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  if (local) return drizzlePg(new Pool({ connectionString: url, max: 5 }), { schema });
  // Même API de requêtes que node-postgres (select / insert / returning / query.*) : un seul type pour l'app.
  return drizzleNeon(neon(url), { schema }) as unknown as DB;
}
