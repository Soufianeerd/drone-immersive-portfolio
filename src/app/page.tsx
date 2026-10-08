import About from "@/components/about/About";
import Contact from "@/components/contact/Contact";
import Gear from "@/components/gear/Gear";
import Portfolio from "@/components/portfolio/Portfolio";
import HeroScene from "@/components/scene/HeroScene";
import WorldBackdrop from "@/components/environment/WorldBackdrop";
import Showreel from "@/components/showreel/Showreel";
import SiteHeader from "@/components/site/SiteHeader";
import SmoothScroll from "@/components/site/SmoothScroll";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <SiteHeader />
      <WorldBackdrop />
      <main>
        <HeroScene />
        <Showreel />
        <Portfolio />
        <Gear />
        <About />
        <Contact />
      </main>
    </>
  );
}
