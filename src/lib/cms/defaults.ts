import { SITE } from "@/config/site";
import { SHOWREEL } from "@/content/showreel";
import { CATEGORIES } from "@/content/work";
import { SECTION_KEYS, type SiteSettings } from "./types";

/** Contenu par défaut : utilisé tant que la base n'est pas configurée ou qu'un réglage manque. */
export const DEFAULT_SETTINGS: SiteSettings = {
  brand: SITE.brand,
  creator: SITE.creator,
  headline: [SITE.headline[0], SITE.headline[1]],
  sections: SECTION_KEYS.map((key) => ({
    key,
    label: SITE.nav.find((n) => n.id === key)?.label ?? key,
    visible: true,
  })),
  background: { type: "world" },
  showreel: { src: SHOWREEL.src, poster: SHOWREEL.poster, title: SHOWREEL.title },
  about: "",
  contact: { email: SITE.social.email ?? "", phone: "", instagram: SITE.social.instagram ?? "", city: SITE.defaultLocation.label },
  business: { name: "", siret: "", address: "", mentions: "" },
};

export const DEFAULT_CATEGORIES = CATEGORIES.filter((c) => c.id !== "all").map((c) => ({ slug: c.id as string, name: c.label as string }));

/** Fusionne des réglages enregistrés (éventuellement partiels / anciens) avec les défauts. */
export function mergeSettings(raw: unknown): SiteSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<SiteSettings>;
  const d = DEFAULT_SETTINGS;
  const known = new Map((r.sections ?? []).filter((s) => SECTION_KEYS.includes(s.key)).map((s) => [s.key, s]));
  const sections = [...known.values(), ...d.sections.filter((s) => !known.has(s.key))];
  return {
    ...d,
    ...r,
    headline: r.headline?.length === 2 ? r.headline : d.headline,
    sections,
    background: r.background ?? d.background,
    showreel: { ...d.showreel, ...r.showreel },
    contact: { ...d.contact, ...r.contact },
    business: { ...d.business, ...r.business },
  };
}
