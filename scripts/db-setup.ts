/**
 * Prépare la base Neon : crée / met à jour les tables, puis ajoute les catégories et réglages par défaut.
 * Usage : bun run db:setup   (lit DATABASE_URL dans .env.local)
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "../src/db/schema";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquant dans .env.local");
  process.exit(1);
}
const local = /localhost|127\.0\.0\.1/.test(url);
const pool = new Pool({ connectionString: url, ssl: local ? undefined : { rejectUnauthorized: true } });
const db = drizzle(pool, { schema });

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("✓ Tables à jour");

const cats = [
  ["Mariages", "mariage"],
  ["Événements", "evenement"],
  ["Portraits", "portrait"],
  ["Drone FPV", "drone"],
  ["Vidéo", "video"],
  ["Photo", "photo"],
  ["Projets personnels", "perso"],
] as const;
const existing = await db.select().from(schema.categories);
if (!existing.length) {
  await db.insert(schema.categories).values(cats.map(([name, slug], position) => ({ name, slug, position })));
  console.log("✓ Catégories par défaut ajoutées");
}
const s = await db.select().from(schema.settings);
if (!s.length) {
  await db.insert(schema.settings).values({ id: 1, data: {} });
  console.log("✓ Réglages initialisés");
}
await pool.end();
console.log("Base prête.");
