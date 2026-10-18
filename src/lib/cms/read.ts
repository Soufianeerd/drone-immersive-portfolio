import "server-only";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, mergeSettings } from "./defaults";
import type { PublicCategory, PublicMedia, PublicWork, SiteSettings } from "./types";

/** Lecture publique du contenu. Toute erreur de base retombe sur le contenu par défaut : le site reste en ligne. */

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const d = db();
  if (!d) return DEFAULT_SETTINGS;
  try {
    const row = await d.query.settings.findFirst({ where: eq(schema.settings.id, 1) });
    return mergeSettings(row?.data);
  } catch (e) {
    console.error("[cms] settings", e);
    return DEFAULT_SETTINGS;
  }
});

export const getCategories = cache(async (): Promise<PublicCategory[]> => {
  const d = db();
  if (!d) return DEFAULT_CATEGORIES;
  try {
    const rows = await d.select().from(schema.categories).where(eq(schema.categories.visible, true)).orderBy(asc(schema.categories.position), asc(schema.categories.id));
    return rows.map((c) => ({ slug: c.slug, name: c.name }));
  } catch (e) {
    console.error("[cms] categories", e);
    return DEFAULT_CATEGORIES;
  }
});

const toMedia = (m: typeof schema.media.$inferSelect): PublicMedia => ({
  kind: m.kind === "video" ? "video" : "image",
  url: m.url,
  poster: m.posterUrl,
  caption: m.caption,
});

export const getWork = cache(async (): Promise<PublicWork[]> => {
  const d = db();
  if (!d) return [];
  try {
    const cols = await d
      .select({ c: schema.collections, cat: schema.categories.slug })
      .from(schema.collections)
      .leftJoin(schema.categories, eq(schema.collections.categoryId, schema.categories.id))
      .where(eq(schema.collections.published, true))
      .orderBy(desc(schema.collections.featured), asc(schema.collections.position), desc(schema.collections.eventDate), desc(schema.collections.id));
    if (!cols.length) return [];
    const ids = cols.map((r) => r.c.id);
    const all = await d.select().from(schema.media).where(inArray(schema.media.collectionId, ids)).orderBy(asc(schema.media.position), asc(schema.media.id));
    return cols.map(({ c, cat }) => {
      const gallery = all.filter((m) => m.collectionId === c.id).map(toMedia);
      const coverRow = all.find((m) => m.id === c.coverMediaId) ?? all.find((m) => m.collectionId === c.id);
      return {
        slug: c.slug,
        title: c.title,
        kind: c.kind,
        categories: cat ? [cat] : [],
        format: (["wide", "landscape", "portrait", "tall", "square"].includes(c.format) ? c.format : "landscape") as PublicWork["format"],
        year: c.eventDate ? Number(c.eventDate.slice(0, 4)) : undefined,
        client: c.clientName || undefined,
        context: c.description || undefined,
        location: c.location || undefined,
        cover: coverRow ? toMedia(coverRow) : undefined,
        gallery,
        featured: c.featured,
      };
    });
  } catch (e) {
    console.error("[cms] work", e);
    return [];
  }
});

export async function getWorkBySlug(slug: string) {
  return (await getWork()).find((w) => w.slug === slug) ?? null;
}

