import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getSettings, getWorkBySlug } from "@/lib/cms/read";

/**
 * Page projet — prête pour les réalisations réelles (WORK).
 * Contenu géré dans l'admin (collections publiées). Slug inconnu → 404 : aucune page fictive.
 */

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [item, settings] = await Promise.all([getWorkBySlug(slug), getSettings()]);
  return { title: item ? `${item.title} — ${settings.brand}` : settings.brand, description: item?.context?.slice(0, 160) };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [item, categories] = await Promise.all([getWorkBySlug(slug), getCategories()]);
  if (!item) notFound();
  const LABEL = Object.fromEntries(categories.map((c) => [c.slug, c.name])) as Record<string, string>;

  return (
    <main style={{ padding: "calc(var(--header-h) + 8svh) var(--gutter) 12svh", color: "var(--ambient-text)" }}>
      <Link href="/#portfolio" style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>
        ← Portfolio
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 7vw, 120px)", lineHeight: 0.95, margin: "6svh 0 3svh", textTransform: "uppercase" }}>
        {item.title}
      </h1>
      <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ambient-muted)" }}>
        {item.categories.map((k) => LABEL[k] ?? k).join(" · ")}
        {item.year ? ` — ${item.year}` : ""}
        {item.client ? ` — ${item.client}` : ""}
        {item.location ? ` — ${item.location}` : ""}
      </p>
      {item.context ? <p style={{ maxWidth: "60ch", marginTop: "4svh", lineHeight: 1.6 }}>{item.context}</p> : null}
      <div style={{ display: "grid", gap: "4svh", marginTop: "8svh" }}>
        {(item.gallery.length ? item.gallery : item.cover ? [item.cover] : []).map((m, i) =>
          m.kind === "video" ? (
            <video key={i} src={m.url} poster={m.poster ?? undefined} controls playsInline style={{ width: "100%" }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={m.url} alt={m.caption || item.title} loading="lazy" style={{ width: "100%", height: "auto" }} />
          ),
        )}
      </div>
    </main>
  );
}
