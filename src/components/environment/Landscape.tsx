import type { ReactNode } from "react";
import WeatherCanvas from "./WeatherCanvas";
import styles from "./Landscape.module.css";

/**
 * Paysage maître (cadrage fixe) en « cover », piloté par l'Environment Engine — et VIVANT.
 *
 * Empilement :
 *   ciel + montagnes (base) → étoiles → ciel dérivant (les vrais nuages du ciel glissent
 *   derrière les sommets) → `behind` (grand nom) → premier plan découpé (montagnes + rocher)
 *   → brume qui coule sur la mer de nuages (deux vitesses) → lumière qui respire
 *   → voiles (teinte de phase, brume, voile météo) → particules météo.
 * Une dérive de caméra très lente porte l'ensemble.
 * Le calque `[data-scene-focus]` reçoit flou / assombrissement lors d'un focus produit (hero).
 */
export default function Landscape({ behind, children, focusable = true }: { behind?: ReactNode; children?: ReactNode; focusable?: boolean }) {
  return (
    <div className={styles.root} aria-hidden="true">
      <div data-scene-focus={focusable ? "" : undefined} className={styles.focus}>
        <div className={styles.drift}>
          <div className={styles.grade}>
            <div className={`${styles.box} ${styles.base}`} />
            <div className={`${styles.box} ${styles.stars}`} />
            <div className={`${styles.box} ${styles.skyMask}`}>
              <div className={styles.skyPan} />
            </div>
            <div className={styles.box}>{behind}</div>
            <div className={`${styles.box} ${styles.front}`} />
            <div className={`${styles.box} ${styles.seaMask}`}>
              <div className={`${styles.mist} ${styles.mistA}`} />
              <div className={`${styles.mist} ${styles.mistB}`} />
            </div>
            <div className={`${styles.box} ${styles.bandMask}`}>
              <div className={`${styles.mist} ${styles.mistC}`} />
            </div>
            <div className={`${styles.box} ${styles.glow}`} />
            <div className={`${styles.box} ${styles.tint}`} />
            <div className={`${styles.box} ${styles.fog}`}>
              <span />
              <span />
            </div>
            <div className={styles.veil} />
          </div>
        </div>
        <WeatherCanvas className={styles.weather} />
      </div>
      {children}
    </div>
  );
}
