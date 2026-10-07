# PROJECT_STATE — handoff Claude / ChatGPT / Soufiane

_Court et factuel. Mis à jour à chaque checkpoint Git qui change l'état du projet._

## État actuel
- Front-end Next.js 16 / React 19 / TS / Tailwind 4 / GSAP. Aucun backend, aucun déploiement.
- Page `/` : header du site + hero setup FPV + amorce de la section 02 Projets.
- Repo : https://github.com/Soufianeerd/drone-immersive-portfolio — branche `main`.

## Voir le site
- Local : `bun install` (une fois) puis `bun dev` → http://localhost:3000
- Aperçu en ligne (export statique, privé) : artifact Claude « Portfolio Anass », mis à jour à chaque étape.

## Roadmap
1. Scène Avata — base motion : **validée**.
2. Hero à trois objets : **implémenté** (DJI Goggles 3 · DJI Avata 2 · DJI FPV Remote Controller 3).
3. **Hero intégré au site : implémenté, en attente de validation** (header, cadrage éditorial, scroll, amorce 02).
4. Ensuite : section 02 Projets (contenus réels), puis mode Détails / vues éclatées.

## Ce que montre la page
- Header fixe : ANASS + Projets / Services / À propos / Contact (menu plein écran sur mobile). Navigation masquée pendant le focus Avata.
- Hero : « 01 / Setup FPV », titre « Filmer au plus près du mouvement. », « Créateur d’images — Photo · Vidéo · Drone FPV », légendes des trois objets, indication « Défiler ».
- Setup FPV : Goggles · Avata (seul objet interactif) · télécommande ; hover, focus, fiche, retour inchangés.
- Défilement : la scène s'éloigne plus lentement que la page, le texte s'efface ; un défilement pendant le focus referme la fiche.
- Section 02 « Projets » : titre, phrase « sélection en cours de montage », index 03 Services / 04 À propos / 05 Contact (ancres du header, mentionnés « À venir »).
- Checks : lint, tsc, build, axe 0 violation (1440 / 390 px, haut, bas de page, focus), pas d'overflow.

## Défauts connus
1. Rendus Avata 1254 px : légère douceur en focus sur écran Retina → versions ≥ 2400 px souhaitées.
2. Écart de quelques px sur le contour des carénages entre les deux rendus Avata (masqué par le fondu).
3. PNG télécommande : inscriptions secondaires non conformes à la photo réelle (« HOLD/RTH » au lieu de « START/STOP », commutateur « N S W » au lieu de « N S M »). Peu lisibles à la taille du hero ; à retoucher avant tout usage en gros plan. Ne jamais les utiliser comme information factuelle.
4. Textes à valider : titre du hero, fiche Avata, phrase de la section 02.
5. Tablette portrait (768–1024 px) : composition desktop réduite, beaucoup d'espace vide sous les objets.
6. Services / À propos / Contact pointent vers l'index « À venir » de la section 02, pas encore vers de vraies sections.

## Prochaine étape prévue
Validation du hero intégré au site par Soufiane. Ensuite : section 02 Projets avec les vrais contenus.

## Dernier checkpoint
- Date : 2026-10-07
- Commit précédent : `d56c87c` — feat: integrate three-object FPV hero composition
