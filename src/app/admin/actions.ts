"use server";

import { and, asc, desc, eq, gt, lt, sql } from "drizzle-orm";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDb, schema } from "@/db";
import { hashPassword, login, logout, requireAdmin } from "@/lib/auth";
import { mergeSettings } from "@/lib/cms/defaults";
import { slugify } from "@/lib/cms/slug";
import { SECTION_KEYS, type SiteBackground, type SiteSettings } from "@/lib/cms/types";
import type { QuoteLine } from "@/db/schema";

/** Toutes les actions de l'admin. Chacune vérifie la session, enregistre, puis régénère le site public. */

const str = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? "").trim().slice(0, max);
const num = (f: FormData, k: string) => Number(f.get(k));
const bool = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";
const dateOrNull = (f: FormData, k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(str(f, k)) ? str(f, k) : null);
const publish = () => revalidatePath("/", "layout");

async function uniqueSlug(table: typeof schema.collections | typeof schema.categories, base: string, exceptId?: number) {
  const d = requireDb();
  let slug = slugify(base);
  for (let i = 2; ; i++) {
    const hit = await d.select({ id: table.id }).from(table).where(eq(table.slug, slug)).limit(1);
    if (!hit.length || hit[0].id === exceptId) return slug;
    slug = `${slugify(base)}-${i}`;
  }
}

/* ---------------------------------- Session ---------------------------------- */

export async function loginAction(_: unknown, f: FormData) {
  await new Promise((r) => setTimeout(r, 400)); // freine les essais en rafale
  const email = str(f, "email", 200);
  const ok = await login(email, String(f.get("password") ?? ""));
  if (!ok) return { error: "Identifiant ou mot de passe incorrect.", email };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

export async function changePasswordAction(_: unknown, f: FormData) {
  const user = await requireAdmin();
  const pw = String(f.get("password") ?? "");
  if (pw.length < 10) return { error: "10 caractères minimum." };
  if (pw !== String(f.get("confirm") ?? "")) return { error: "Les deux mots de passe sont différents." };
  await requireDb().update(schema.users).set({ passwordHash: await hashPassword(pw) }).where(eq(schema.users.id, user.id));
  return { ok: "Mot de passe modifié." };
}

/* ---------------------------------- Réglages / page d'accueil ---------------------------------- */

async function readSettings(): Promise<SiteSettings> {
  const row = await requireDb().query.settings.findFirst({ where: eq(schema.settings.id, 1) });
  return mergeSettings(row?.data);
}
async function writeSettings(next: SiteSettings) {
  await requireDb()
    .insert(schema.settings)
    .values({ id: 1, data: next })
    .onConflictDoUpdate({ target: schema.settings.id, set: { data: next, updatedAt: new Date() } });
  publish();
}

export async function saveIdentityAction(f: FormData) {
  await requireAdmin();
  const s = await readSettings();
  await writeSettings({
    ...s,
    brand: str(f, "brand", 60) || s.brand,
    creator: str(f, "creator", 80) || s.creator,
    headline: [str(f, "headline1", 120), str(f, "headline2", 120)],
    about: str(f, "about", 3000),
    contact: { email: str(f, "email", 200), phone: str(f, "phone", 40), instagram: str(f, "instagram", 200), city: str(f, "city", 80) },
  });
}

export async function saveSectionsAction(f: FormData) {
  await requireAdmin();
  const s = await readSettings();
  const order = String(f.get("order") ?? "").split(",").filter((k): k is SiteSettings["sections"][number]["key"] => (SECTION_KEYS as readonly string[]).includes(k));
  const sections = order.map((key) => ({
    key,
    label: str(f, `label_${key}`, 40) || s.sections.find((x) => x.key === key)?.label || key,
    visible: bool(f, `visible_${key}`),
  }));
  await writeSettings({ ...s, sections });
}

export async function saveBackgroundAction(f: FormData) {
  await requireAdmin();
  const s = await readSettings();
  const type = str(f, "type", 10);
  const url = str(f, "url", 1000);
  let background: SiteBackground = { type: "world" };
  if (type === "image" && url) background = { type: "image", url };
  if (type === "video" && url) background = { type: "video", url, poster: str(f, "poster", 1000) || undefined, mode: str(f, "mode") === "boomerang" ? "boomerang" : "loop" };
  await writeSettings({ ...s, background });
}

export async function saveBusinessAction(f: FormData) {
  await requireAdmin();
  const s = await readSettings();
  await writeSettings({ ...s, business: { name: str(f, "name", 160), siret: str(f, "siret", 40), address: str(f, "address", 400), mentions: str(f, "mentions", 2000) } });
}

export async function saveShowreelAction(f: FormData) {
  await requireAdmin();
  const s = await readSettings();
  await writeSettings({ ...s, showreel: { src: str(f, "src", 1000) || null, poster: str(f, "poster", 1000) || null, title: str(f, "title", 80) || "Showreel" } });
}

/* ---------------------------------- Catégories ---------------------------------- */

export async function createCategoryAction(f: FormData) {
  await requireAdmin();
  const name = str(f, "name", 60);
  if (!name) return;
  const d = requireDb();
  const [{ max }] = await d.select({ max: sql<number>`coalesce(max(${schema.categories.position}), -1)` }).from(schema.categories);
  await d.insert(schema.categories).values({ name, slug: await uniqueSlug(schema.categories, name), position: Number(max) + 1 });
  publish();
}

export async function updateCategoryAction(f: FormData) {
  await requireAdmin();
  const id = num(f, "id");
  const name = str(f, "name", 60);
  if (!id || !name) return;
  await requireDb().update(schema.categories).set({ name, visible: bool(f, "visible") }).where(eq(schema.categories.id, id));
  publish();
}

export async function deleteCategoryAction(f: FormData) {
  await requireAdmin();
  await requireDb().delete(schema.categories).where(eq(schema.categories.id, num(f, "id")));
  publish();
}

export async function moveCategoryAction(f: FormData) {
  await requireAdmin();
  await swapPosition(schema.categories, num(f, "id"), str(f, "dir") === "up" ? "up" : "down");
}

async function swapPosition(table: typeof schema.categories | typeof schema.collections, id: number, dir: "up" | "down") {
  const d = requireDb();
  const rows = await d.select({ id: table.id, position: table.position }).from(table).orderBy(asc(table.position), asc(table.id));
  // Normalise puis échange avec le voisin.
  const i = rows.findIndex((r) => r.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  await Promise.all(rows.map((r, k) => d.update(table).set({ position: k }).where(eq(table.id, r.id))));
  publish();
}

/* ---------------------------------- Collections (projets, événements, séries) ---------------------------------- */

export async function createCollectionAction(f: FormData) {
  await requireAdmin();
  const title = str(f, "title", 120) || "Nouvelle collection";
  const d = requireDb();
  const [row] = await d
    .insert(schema.collections)
    .values({ title, slug: await uniqueSlug(schema.collections, title), kind: str(f, "kind", 20) || "photo", categoryId: num(f, "categoryId") || null })
    .returning({ id: schema.collections.id });
  redirect(`/admin/collections/${row.id}`);
}

export async function updateCollectionAction(f: FormData) {
  await requireAdmin();
  const id = num(f, "id");
  const title = str(f, "title", 120);
  if (!id || !title) return;
  await requireDb()
    .update(schema.collections)
    .set({
      title,
      slug: await uniqueSlug(schema.collections, str(f, "slug", 80) || title, id),
      kind: str(f, "kind", 20) || "photo",
      categoryId: num(f, "categoryId") || null,
      description: str(f, "description", 5000),
      location: str(f, "location", 120),
      clientName: str(f, "clientName", 120),
      eventDate: dateOrNull(f, "eventDate"),
      format: str(f, "format", 20) || "landscape",
      featured: bool(f, "featured"),
    })
    .where(eq(schema.collections.id, id));
  publish();
}

export async function togglePublishAction(f: FormData) {
  await requireAdmin();
  const d = requireDb();
  const id = num(f, "id");
  const c = await d.query.collections.findFirst({ where: eq(schema.collections.id, id) });
  if (!c) return;
  await d.update(schema.collections).set({ published: !c.published }).where(eq(schema.collections.id, id));
  publish();
}

export async function deleteCollectionAction(f: FormData) {
  await requireAdmin();
  await requireDb().delete(schema.collections).where(eq(schema.collections.id, num(f, "id")));
  publish();
  redirect("/admin/collections");
}

export async function moveCollectionAction(f: FormData) {
  await requireAdmin();
  await swapPosition(schema.collections, num(f, "id"), str(f, "dir") === "up" ? "up" : "down");
}

/** Enregistre des fichiers déjà envoyés (Blob ou local) dans une collection. */
export async function addMediaAction(collectionId: number, files: { url: string; kind: "image" | "video"; name: string }[]) {
  await requireAdmin();
  const d = requireDb();
  const [{ max }] = await d
    .select({ max: sql<number>`coalesce(max(${schema.media.position}), -1)` })
    .from(schema.media)
    .where(eq(schema.media.collectionId, collectionId));
  const rows = await d
    .insert(schema.media)
    .values(files.map((x, i) => ({ collectionId, url: x.url, kind: x.kind, caption: "", position: Number(max) + 1 + i })))
    .returning({ id: schema.media.id });
  const col = await d.query.collections.findFirst({ where: eq(schema.collections.id, collectionId) });
  if (col && !col.coverMediaId && rows[0]) await d.update(schema.collections).set({ coverMediaId: rows[0].id }).where(eq(schema.collections.id, collectionId));
  publish();
}

export async function mediaAction(f: FormData) {
  await requireAdmin();
  const d = requireDb();
  const id = num(f, "id");
  const op = str(f, "op", 20);
  const m = await d.query.media.findFirst({ where: eq(schema.media.id, id) });
  if (!m?.collectionId) return;
  if (op === "delete") {
    await d.delete(schema.media).where(eq(schema.media.id, id));
    // Le fichier est aussi retiré du stockage (Vercel Blob) pour ne pas payer un fichier orphelin.
    if (process.env.BLOB_READ_WRITE_TOKEN && /\.blob\.vercel-storage\.com\//.test(m.url)) await del(m.url).catch(() => undefined);
    await d.update(schema.collections).set({ coverMediaId: null }).where(and(eq(schema.collections.id, m.collectionId), eq(schema.collections.coverMediaId, id)));
  } else if (op === "cover") {
    await d.update(schema.collections).set({ coverMediaId: id }).where(eq(schema.collections.id, m.collectionId));
  } else if (op === "caption") {
    await d.update(schema.media).set({ caption: str(f, "caption", 300) }).where(eq(schema.media.id, id));
  } else if (op === "up" || op === "down") {
    const cmp = op === "up" ? lt : gt;
    const [nb] = await d
      .select()
      .from(schema.media)
      .where(and(eq(schema.media.collectionId, m.collectionId), cmp(schema.media.position, m.position)))
      .orderBy(op === "up" ? desc(schema.media.position) : asc(schema.media.position))
      .limit(1);
    if (nb) {
      await d.update(schema.media).set({ position: nb.position }).where(eq(schema.media.id, m.id));
      await d.update(schema.media).set({ position: m.position }).where(eq(schema.media.id, nb.id));
    }
  }
  publish();
}

/* ---------------------------------- Clients ---------------------------------- */

function clientFields(f: FormData) {
  return {
    name: str(f, "name", 120),
    company: str(f, "company", 120),
    email: str(f, "email", 200),
    phone: str(f, "phone", 40),
    address: str(f, "address", 400),
    notes: str(f, "notes", 5000),
  };
}

export async function createClientAction(f: FormData) {
  await requireAdmin();
  const v = clientFields(f);
  if (!v.name) return;
  const [row] = await requireDb().insert(schema.clients).values(v).returning({ id: schema.clients.id });
  const fromMessage = num(f, "messageId");
  if (fromMessage) await requireDb().update(schema.messages).set({ clientId: row.id, read: true }).where(eq(schema.messages.id, fromMessage));
  redirect(`/admin/clients/${row.id}`);
}

export async function updateClientAction(f: FormData) {
  await requireAdmin();
  const v = clientFields(f);
  if (!v.name) return;
  await requireDb().update(schema.clients).set(v).where(eq(schema.clients.id, num(f, "id")));
  revalidatePath("/admin", "layout");
}

export async function deleteClientAction(f: FormData) {
  await requireAdmin();
  await requireDb().delete(schema.clients).where(eq(schema.clients.id, num(f, "id")));
  redirect("/admin/clients");
}

/* ---------------------------------- Devis ---------------------------------- */

export async function createQuoteAction(f: FormData) {
  await requireAdmin();
  const d = requireDb();
  const year = new Date().getFullYear();
  const [{ n }] = await d.select({ n: sql<number>`count(*)` }).from(schema.quotes).where(sql`${schema.quotes.number} like ${`D${year}-%`}`);
  const number = `D${year}-${String(Number(n) + 1).padStart(3, "0")}`;
  const valid = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const [row] = await d
    .insert(schema.quotes)
    .values({ number, clientId: num(f, "clientId") || null, title: str(f, "title", 160), validUntil: valid, lines: [{ label: "", qty: 1, price: 0 }] })
    .returning({ id: schema.quotes.id });
  redirect(`/admin/devis/${row.id}`);
}

export async function updateQuoteAction(_: unknown, f: FormData) {
  await requireAdmin();
  let lines: QuoteLine[] = [];
  try {
    lines = (JSON.parse(String(f.get("lines") ?? "[]")) as QuoteLine[])
      .map((l) => ({ label: String(l.label ?? "").slice(0, 300), qty: Math.max(0, Number(l.qty) || 0), price: Math.round((Number(l.price) || 0) * 100) / 100 }))
      .filter((l) => l.label || l.price)
      .slice(0, 100);
  } catch {
    /* lignes illisibles : on garde une liste vide */
  }
  const status = ["brouillon", "envoye", "accepte", "refuse"].includes(str(f, "status")) ? str(f, "status") : "brouillon";
  await requireDb()
    .update(schema.quotes)
    .set({
      title: str(f, "title", 160),
      clientId: num(f, "clientId") || null,
      status,
      lines,
      notes: str(f, "notes", 5000),
      eventDate: dateOrNull(f, "eventDate"),
      validUntil: dateOrNull(f, "validUntil"),
    })
    .where(eq(schema.quotes.id, num(f, "id")));
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteQuoteAction(f: FormData) {
  await requireAdmin();
  await requireDb().delete(schema.quotes).where(eq(schema.quotes.id, num(f, "id")));
  redirect("/admin/devis");
}

/* ---------------------------------- Messages ---------------------------------- */

export async function messageAction(f: FormData) {
  await requireAdmin();
  const id = num(f, "id");
  const op = str(f, "op", 20);
  const d = requireDb();
  if (op === "delete") await d.delete(schema.messages).where(eq(schema.messages.id, id));
  else await d.update(schema.messages).set({ read: op === "read" }).where(eq(schema.messages.id, id));
  revalidatePath("/admin", "layout");
}
