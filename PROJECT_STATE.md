# PROJECT_STATE — handoff Claude / ChatGPT / Soufiane

_Court et factuel. Mis à jour à chaque checkpoint Git qui change l'état du projet._

## État actuel
- Front-end Next.js 16 / React 19 / TS / Tailwind 4 / GSAP. Aucun backend, aucun déploiement.
- Page `/` : header + hero setup FPV (3 objets interactifs + mode Détails Avata) + amorce de la section 02.
- Repo : https://github.com/Soufianeerd/drone-immersive-portfolio — branche `main`.
- **Rien n'est poussé** depuis `d56c87c` : `f75b75d`, `13cd36f` et la refonte ci-dessous restent locaux tant que Soufiane n'a pas validé visuellement.

## Voir le site
- Local : `bun install` (une fois) puis `bun dev` → http://localhost:3000

## Roadmap
1. Scène Avata — base motion : validée.
2. `f75b75d`, `13cd36f` : **non validés** (images coupées au zoom, décomposition qui saute entre 3 rendus, seul l'Avata interactif, retours peu fiables).
3. **Refonte de l'expérience hero : implémentée, en attente de validation visuelle.**
4. Rien d'autre n'est construit avant validation (projets, services, à propos, contact, footer : gelés).

## Parcours à valider
- Home → Goggles → « ← Retour au setup » → Home
- Home → Controller → ANASS → Home
- Home → Avata → Détails → composant → « ← Vue éclatée » → « ← Retour au drone » → « ← Retour au setup » → Home
- Échap : composant → vue éclatée → fiche Avata → Home

## Architecture
- Une seule source de vérité : `ExperienceState` = home | focus(produit) | avata-details | avata-part(composant) (`AvataHero.tsx`).
- `resetToHome()` (`src/lib/home.ts`, logo ANASS) : tue toute timeline, referme tout, efface toutes les transformations, restaure les 3 objets, remonte en haut, rend le focus clavier.
- « ← Retour au setup » visible dans tous les états hors accueil.
- Composition : boîtes = silhouettes alpha réelles (`setupProducts.ts`), tailles en unités de conteneur (cqw/cqh) ; aucun overflow ne coupe un produit. Présence mesurée : Avata 1 · Goggles 0,70 · Controller 0,60.
- Détails : scène fixe dédiée sous le header ; vue éclatée = `avata2-exploded-full.png` seul, découpé en 10 calques par masques (`public/assets/avata2/exploded-masks/`). Caméra = ancre : le drone se pose exactement sur la caméra de la vue éclatée, puis les pièces s'écartent. `open-electronics` et `exploded-medium` ne sont plus utilisés.

## Vérifications faites (navigateur)
- 1280×720, 1440×900, 1920×1080, zoom 125/150/200 %, 768×1024, 390×844 : aucun produit coupé, pas d'overflow horizontal.
- Parcours ci-dessus + ANASS depuis la section 02 + ANASS pendant une transition : retour propre, zéro transformation résiduelle.
- Clavier, toucher, prefers-reduced-motion ; axe 0 violation (accueil, focus, Détails, composant, desktop et mobile) ; console sans erreur ; lint, tsc, build OK.

## Défauts connus
1. Rendus Avata 1254 px : douceur sur Retina en focus / Détails.
2. Recomposition (retour au drone) : le cadre passe brièvement par un état intermédiaire peu lisible (fondu court).
3. Découpe des calques de la vue éclatée faite à la main : quelques pixels du châssis bougent avec la caméra / les hélices pendant le mouvement (invisible au repos).
4. PNG télécommande : inscriptions non conformes à la photo réelle, plus visibles en focus (gros plan).
5. Textes Goggles 3 et Remote Controller 3 rédigés prudemment, à valider ; idem titre hero et textes composants.
6. Image du panneau Électronique : annotations incrustées dans le PNG.

## Dernier checkpoint
- Date : 2026-10-07
- Commit : fix: rebuild FPV hero experience (state machine, three interactive products, anchored Avata explode) — local, non poussé.
