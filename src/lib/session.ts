import { jwtVerify, SignJWT } from "jose";

/** Jeton de session (utilisable dans le proxy et côté serveur). AUTH_SECRET : variable serveur, 32 caractères minimum. */
export const SESSION_COOKIE = "nadra_session";

function key() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET manquant ou trop court (32 caractères minimum).");
  return new TextEncoder().encode(s);
}

export async function signSession(userId: number) {
  return new SignJWT({ sub: String(userId) }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(key());
}

export async function verifySession(token?: string): Promise<number | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}
