import "server-only";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireDb, schema } from "@/db";
import { SESSION_COOKIE, signSession, verifySession } from "./session";

/** Connexion admin : email + mot de passe (hash bcrypt), session signée dans un cookie httpOnly. */

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

export async function login(email: string, password: string) {
  const user = await requireDb().query.users.findFirst({ where: eq(schema.users.email, email.trim().toLowerCase()) });
  // Même temps de réponse que l'utilisateur existe ou non.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? "$2b$12$R6OUwnb/tx/3RtIHxS9l1uN6PwtOMak4m4F8lWgY5Ga6Ov8Lvi6q2");
  if (!user || !ok) return false;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const id = await verifySession(token);
  if (!id) return null;
  const user = await requireDb().query.users.findFirst({ where: eq(schema.users.id, id) });
  return user ? { id: user.id, email: user.email, name: user.name } : null;
}

/** À appeler en tête de chaque page et action admin. */
export async function requireAdmin() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  return user;
}
