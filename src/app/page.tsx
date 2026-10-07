import AvataHero from "@/components/hero/AvataHero";
import ProjectsTeaser from "@/components/site/ProjectsTeaser";
import SiteHeader from "@/components/site/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="top">
        <AvataHero />
        <ProjectsTeaser />
      </main>
    </>
  );
}
