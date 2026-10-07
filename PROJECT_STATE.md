# PROJECT_STATE — handoff Claude / ChatGPT / Soufiane

_Court et factuel. Mis à jour à chaque checkpoint Git qui change l'état du projet._

## État actuel
- Front-end Next.js 16 / React 19 / TS / Tailwind 4 / GSAP. Aucun backend, aucun déploiement.
- Une seule page (`/`) : hero setup FPV (`src/components/hero/`).
- Repo : https://github.com/Soufianeerd/drone-immersive-portfolio — branche `main`.

## Roadmap
1. Scène Avata — base motion : **validée**.
2. **Hero final à trois objets : implémenté, en attente de validation** (DJI Goggles 3 · DJI Avata 2 · DJI FPV Remote Controller 3).
3. Ensuite seulement : mode Détails / vues éclatées (non commencé).

## Hero actuel
- Matériel réel d'Anass : DJI Goggles 3, DJI Avata 2, DJI FPV Remote Controller 3 (références photo : IMG_3287, IMG_3291).
- Assets : `public/assets/avata2/` (calibration inchangée), `public/assets/goggles3/goggles3-hero-3q.png`, `public/assets/fpv-remote-controller-3/fpv-remote-controller-3-hero-3q.png`.
- Idle : Goggles à gauche, Avata au centre (dominant, flottant), télécommande à droite ; sol, lumière et ombres de contact en CSS ; parallaxe par profondeur. Apparition courte (~0,5 s après chargement des images).
- Hover Avata (seul objet interactif) : moteurs actifs, levée, rapprochement ; Goggles + télécommande reculent et s'atténuent.
- Focus clic/tap/Entrée : Avata en gros plan à gauche, fiche à droite (Détails inactif) ; secondaires reculent et s'effacent pendant l'avancée.
- Retour (Échap / Fermer / clic extérieur) : timeline inversée, chaque objet retrouve sa position.
- Mobile : secondaires derrière et au-dessus du drone ; tap → focus. `prefers-reduced-motion` : fondus uniquement.
- Checks : lint, tsc, build, axe (0 violation idle/focus/retour, 1440 et 390 px), pas d'overflow.

## Défauts connus
1. Rendus Avata 1254 px : légère douceur en focus sur écran Retina → versions ≥ 2400 px souhaitées.
2. Écart de quelques px sur le contour des carénages entre les deux rendus Avata (masqué par le fondu).
3. PNG télécommande : inscriptions secondaires non conformes à la photo réelle (« HOLD/RTH » au lieu de « START/STOP », commutateur « N S W » au lieu de « N S M »). Peu lisibles à la taille du hero ; à retoucher avant tout usage en gros plan. Ne jamais les utiliser comme information factuelle.
4. Texte de la fiche Avata à valider (caractéristiques reprises des visuels fournis).

## Prochaine étape prévue
Validation visuelle du hero à trois objets par Soufiane, puis archivage des preuves dans `docs/reviews/`. Ensuite : mode Détails.

## Dernier checkpoint
- Date : 2026-10-07
- Commit : voir `git log -1` — feat: integrate three-object FPV hero composition (le hash est reporté au checkpoint suivant)
