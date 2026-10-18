/** Sections de la page d'accueil que l'admin peut réordonner / masquer (le hero reste toujours en tête). */
export const SECTION_KEYS = ["showreel", "portfolio", "gear", "about", "contact"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  showreel: "Showreel / teaser",
  portfolio: "Portfolio",
  gear: "Matériel (setup)",
  about: "À propos",
  contact: "Contact",
};

export type SiteBackground =
  | { type: "world" }
  | { type: "image"; url: string }
  | { type: "video"; url: string; poster?: string; mode: "loop" | "boomerang" };

export type SiteSettings = {
  brand: string;
  creator: string;
  headline: [string, string];
  sections: { key: SectionKey; label: string; visible: boolean }[];
  background: SiteBackground;
  showreel: { src: string | null; poster: string | null; title: string };
  about: string;
  contact: { email: string; phone: string; instagram: string; city: string };
  /** Infos professionnelles pour les devis (jamais affichées sur le site). */
  business: { name: string; siret: string; address: string; mentions: string };
};

export type PublicCategory = { slug: string; name: string };

export type PublicMedia = { kind: "image" | "video"; url: string; poster?: string | null; caption: string };

export type PublicWork = {
  slug: string;
  title: string;
  kind: string;
  categories: string[]; // slugs
  format: "wide" | "landscape" | "portrait" | "tall" | "square";
  year?: number;
  client?: string;
  context?: string;
  location?: string;
  cover?: PublicMedia;
  gallery: PublicMedia[];
  featured: boolean;
};
