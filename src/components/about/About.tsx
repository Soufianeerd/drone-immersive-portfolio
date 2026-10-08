import { SITE } from "@/config/site";
import styles from "./About.module.css";

/**
 * À PROPOS — volontairement court tant que le portrait et le parcours réels ne sont pas fournis.
 */
export default function About() {
  return (
    <section id="about" className={styles.section} aria-labelledby="about-title">
      <h2 id="about-title" className={styles.kicker}>
        À propos
      </h2>
      <p className={styles.statement}>
        {SITE.creator} filme et photographie le mouvement — au sol, à la main, ou en vol FPV, au plus près de l’action.
      </p>
      <p className={styles.note}>Portrait et parcours à venir.</p>
    </section>
  );
}
