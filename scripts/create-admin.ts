/**
 * Crée (ou réinitialise) un compte admin.
 * Usage : bun run admin:create email@exemple.com "MotDePasse" "Prénom"
 */
import bcrypt from "bcryptjs";
import * as schema from "../src/db/schema";
import { scriptDb } from "./db";

const [email, password, name = ""] = process.argv.slice(2);
if (!email || !password || password.length < 10) {
  console.error('Usage : bun run admin:create email "mot de passe (10 caractères min.)" "Prénom"');
  process.exit(1);
}
const { db } = scriptDb();
const passwordHash = await bcrypt.hash(password, 12);
await db
  .insert(schema.users)
  .values({ email: email.trim().toLowerCase(), name, passwordHash })
  .onConflictDoUpdate({ target: schema.users.email, set: { passwordHash, name } });
console.log(`✓ Compte admin prêt : ${email}`);
