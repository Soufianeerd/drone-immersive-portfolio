import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE } from "@/config/site";
import { CATEGORIES, WORK } from "@/content/work";

/**
 * Page projet — prête pour les réalisations réelles (WORK).
 * Tant que WORK est vide, toute URL renvoie 404 : aucune page fictive.
 */

const LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<string, string>;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = WORK.find((w) => w.slug === slug);
  return { title: item ? `${item.title} — ${SITE.brand}` : SITE.brand };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = WORK.find((w) => w.slug === slug);
  if (!item) notFound();

  return (
    <main style={{ padding: "calc(var(--header-h) + 8svh) var(--gutter) 12svh", color: "var(--ambient-text)" }}>
      <Link href="/#portfolio" style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>
        ← Portfolio
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 7vw, 120px)", lineHeight: 0.95, margin: "6svh 0 3svh", textTransform: "uppercase" }}>
        {item.title}
      </h1>
      <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ambient-muted)" }}>
        {item.categories.map((k) => LABEL[k]).join(" · ")}
        {item.year ? ` — ${item.year}` : ""}
        {item.client ? ` — ${item.client}` : ""}
      </p>
      {item.context ? <p style={{ maxWidth: "60ch", marginTop: "4svh", lineHeight: 1.6 }}>{item.context}</p> : null}
      <div style={{ display: "grid", gap: "4svh", marginTop: "8svh" }}>
        {(item.gallery ?? (item.cover ? [item.cover] : [])).map((m, i) =>
          m.kind === "video" ? (
            <video key={i} src={m.src} poster={m.poster} controls playsInline style={{ width: "100%" }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={m.src} alt={m.alt} loading="lazy" style={{ width: "100%", height: "auto" }} />
          ),
        )}
      </div>
    </main>
  );
}
