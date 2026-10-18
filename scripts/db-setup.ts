/**
 * Prépare la base Neon : crée / met à jour les tables, puis ajoute les catégories et réglages par défaut.
 * Usage : bun run db:setup   (lit DATABASE_URL dans .env.local)
 */
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { scriptDb } from "./db";

const { db, local } = scriptDb();
if (local) await migratePg(db, { migrationsFolder: "./drizzle" });
else await migrateNeon(db as unknown as NeonHttpDatabase<typeof schema>, { migrationsFolder: "./drizzle" });
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
console.log("Base prête.");
