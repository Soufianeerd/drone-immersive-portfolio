import { Fragment } from "react";
import About from "@/components/about/About";
import Contact from "@/components/contact/Contact";
import SiteBackground from "@/components/environment/SiteBackground";
import Gear from "@/components/gear/Gear";
import Portfolio from "@/components/portfolio/Portfolio";
import HeroScene from "@/components/scene/HeroScene";
import WorldCanvas from "@/components/environment/WorldCanvas";
import Showreel from "@/components/showreel/Showreel";
import SiteHeader from "@/components/site/SiteHeader";
import SmoothScroll from "@/components/site/SmoothScroll";
import { getCategories, getSettings, getWork } from "@/lib/cms/read";
import type { SectionKey } from "@/lib/cms/types";

/** Le contenu vient de l'admin (Neon). Chaque enregistrement dans l'admin régénère la page. */
export const revalidate = 300;

export default async function Home() {
  const [settings, categories, work] = await Promise.all([getSettings(), getCategories(), getWork()]);
  const sections = settings.sections.filter((s) => s.visible);
  const render: Record<SectionKey, () => React.ReactNode> = {
    showreel: () => <Showreel reel={settings.showreel} />,
    portfolio: () => <Portfolio categories={categories} work={work} />,
    gear: () => <Gear />,
    about: () => <About creator={settings.creator} text={settings.about} />,
    contact: () => <Contact brand={settings.brand} contact={settings.contact} />,
  };
  return (
    <>
      <SmoothScroll />
      <SiteHeader brand={settings.brand} nav={sections.map((s) => ({ id: s.key, label: s.label }))} />
      {settings.background.type === "world" ? <WorldCanvas /> : <SiteBackground background={settings.background} />}
      <main>
        <HeroScene brand={settings.brand} headline={settings.headline} />
        {sections.map((s) => (
          <Fragment key={s.key}>{render[s.key]()}</Fragment>
        ))}
      </main>
    </>
  );
}
