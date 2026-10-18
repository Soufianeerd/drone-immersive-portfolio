/**
 * Crée (ou réinitialise) un compte admin.
 * Usage : bun run admin:create email@exemple.com "MotDePasse" "Prénom"
 */
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";

const [email, password, name = ""] = process.argv.slice(2);
if (!email || !password || password.length < 10) {
  console.error('Usage : bun run admin:create email "mot de passe (10 caractères min.)" "Prénom"');
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquant dans .env.local");
  process.exit(1);
}
const local = /localhost|127\.0\.0\.1/.test(url);
const pool = new Pool({ connectionString: url, ssl: local ? undefined : { rejectUnauthorized: true } });
const db = drizzle(pool, { schema });
const passwordHash = await bcrypt.hash(password, 12);
await db
  .insert(schema.users)
  .values({ email: email.trim().toLowerCase(), name, passwordHash })
  .onConflictDoUpdate({ target: schema.users.email, set: { passwordHash, name } });
await pool.end();
console.log(`✓ Compte admin prêt : ${email}`);
