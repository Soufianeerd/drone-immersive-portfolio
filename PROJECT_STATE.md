# PROJECT_STATE — handoff Claude / ChatGPT / Soufiane

_Court et factuel. Mis à jour à chaque checkpoint Git qui change l'état du projet._

## État actuel
- Front-end Next.js 16 / React 19 / TS / Tailwind 4 / GSAP. Aucun backend, aucun déploiement.
- Une seule page (`/`) contenant la scène 01.
- Repo : https://github.com/Soufianeerd/drone-immersive-portfolio — branche `main`.

## Scène en cours
**Scène 01 — DJI Avata 2 (hero)** : implémentée, **en attente de validation** par Soufiane.
Hors périmètre volontaire : Goggles 3, radiocommande, mode Détails / vues éclatées, showreel, prestations, projets, setup final, footer.

## Fonctionnalités présentes
- Idle : flottement lent, respiration de l'ombre, micro-parallaxe curseur.
- Hover (souris/stylet, hit-test sur la silhouette réelle) : levée + rapprochement, passage `clean-3q-front` → `propellers-motion` recalé par transformation affine mesurée (`avata2Calibration.ts`), ombre resserrée.
- Focus au clic/tap/Entrée : drone en gros plan à gauche, fiche à droite (DJI Avata 2, description, bouton Détails inactif), scène assombrie.
- Retour : Échap, bouton Fermer, clic hors fiche ; chorégraphie inversée.
- Mobile : tap → focus, drone en haut / texte en bas. `prefers-reduced-motion` : fondus uniquement.
- Checks passés : lint, typecheck, build, axe (0 violation idle/focus/retour), pas d'overflow 390/1440 px.

## Défauts connus
1. Rendus sources 1254 px : légère douceur en focus sur écran Retina (agrandissement ~1,4×) → besoin de versions ≥ 2400 px.
2. Écart de quelques px sur le contour des carénages entre les deux rendus (masqué par le fondu).
3. Trait orange de focus clavier visible sous le drone après Échap (comportement a11y, à arbitrer).
4. Mobile : en focus, le drone touche le bord droit.
5. Texte de la fiche à valider (caractéristiques reprises des visuels fournis).
6. Bouton « Détails » sans action (prévu).

## Prochaine étape prévue
Validation visuelle de la scène 01 par Soufiane, corrections éventuelles, puis archivage des preuves dans `docs/reviews/scene-01/`. Ensuite seulement : mode Détails (vues éclatées).

## Dernier checkpoint
- Date : 2026-10-06
- Commit : `f163fe3` — feat: bootstrap immersive portfolio and build Avata hero scene 01
