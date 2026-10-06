# PROJECT_STATE — handoff Claude / ChatGPT / Soufiane

_Court et factuel. Mis à jour à chaque checkpoint Git qui change l'état du projet._

## État actuel
- Front-end Next.js 16 / React 19 / TS / Tailwind 4 / GSAP. Aucun backend, aucun déploiement.
- Une seule page (`/`) contenant la scène Avata (`src/components/hero/`).
- Repo : https://github.com/Soufianeerd/drone-immersive-portfolio — branche `main`.

## Roadmap
1. **Scène Avata — base motion : VALIDÉE** (base d'interaction et de motion, **pas le hero final**).
2. **Hero final à trois objets : PROCHAINE ÉTAPE — bloquée en attente des assets** Goggles 3 + contrôleur FPV.
3. Ensuite seulement : mode Détails / vues éclatées (non commencé, ne pas démarrer avant l'étape 2).

## 1. Base Avata validée — à conserver absolument
- Idle vivant : flottement lent, respiration de l'ombre, micro-parallaxe curseur.
- Hover (hit-test sur la silhouette réelle) : levée + rapprochement, activation des hélices.
- Calibration idle → hélices (`avata2Calibration.ts`, affine mesurée) : ne pas modifier sans re-mesure.
- Focus au clic/tap/Entrée : drone en gros plan vers la gauche, fiche éditoriale à droite (bouton Détails inactif).
- Retour réversible : Échap, Fermer, clic hors fiche. Variantes tactile et `prefers-reduced-motion`.

## 2. Hero final — cible
- Setup FPV cohérent : **Avata au centre, légèrement dominant** ; contrôleur d'un côté, Goggles 3 de l'autre.
- Objets secondaires : présence premium, sans concurrencer le drone.
- Au hover/clic Avata : les deux objets secondaires reculent / s'effacent subtilement pendant que l'Avata prend le focus existant.
- L'idle actuel « drone seul » n'est **pas** une composition définitive.
- Corrections à intégrer dans cette étape :
  - apparition initiale plus immédiate ;
  - focus clavier orange beaucoup plus discret.
- **Prérequis bloquant** : assets réels Goggles 3 et contrôleur (modèle exact à confirmer : RC Motion 3 ou FPV Remote Controller 3), détourés, même éclairage / angle que les rendus Avata. **Aucun faux asset, aucune implémentation avant leur disponibilité.**

## Défauts connus (base Avata)
1. Rendus sources 1254 px : légère douceur en focus sur écran Retina → versions ≥ 2400 px souhaitées.
2. Écart de quelques px sur le contour des carénages entre les deux rendus (masqué par le fondu).
3. Mobile : en focus, le drone touche le bord droit.
4. Texte de la fiche à valider (caractéristiques reprises des visuels fournis).

## Dernier checkpoint
- Date : 2026-10-06
- Code : `f163fe3` — feat: bootstrap immersive portfolio and build Avata hero scene 01 (synchronisé sur origin/main via `cec8f23`)
