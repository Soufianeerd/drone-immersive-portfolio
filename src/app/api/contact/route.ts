import { NextResponse } from "next/server";

/**
 * Formulaire de contact.
 * L'envoi réel n'est actif que si CONTACT_WEBHOOK_URL est défini côté serveur (.env.local, jamais versionné).
 * Sans configuration : réponse 501 explicite — l'interface l'indique honnêtement, rien n'est simulé.
 */

const TYPES = new Set(["mariage", "evenement", "portrait", "drone", "video", "photo", "autre"]);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  // Pot de miel anti-robots.
  if (typeof body.website === "string" && body.website.length > 0) return NextResponse.json({ ok: true });

  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().slice(0, 200);
  const type = String(body.type ?? "").trim();
  const message = String(body.message ?? "").trim().slice(0, 5000);
  if (!name || !EMAIL.test(email) || !TYPES.has(type) || message.length < 10) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });
  }

  const hook = process.env.CONTACT_WEBHOOK_URL;
  if (!hook) return NextResponse.json({ ok: false, error: "not_configured" });

  try {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, type, message, at: new Date().toISOString() }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(String(res.status));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
  }
}
