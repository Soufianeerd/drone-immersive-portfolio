# drone-immersive-portfolio

Portfolio audiovisuel immersif d'Anass (drone FPV, photo, vidéo). Front-end uniquement, construit scène par scène.

- État courant et handoff : [`PROJECT_STATE.md`](PROJECT_STATE.md)
- Direction artistique et règles de mouvement : [`DESIGN.md`](DESIGN.md)
- Inventaire des visuels DJI Avata 2 : [`public/assets/avata2/ASSETS.md`](public/assets/avata2/ASSETS.md)

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind CSS 4 · GSAP 3 · Lenis (installé, non utilisé pour l'instant). Gestionnaire : Bun (`bun.lock`).

> Next.js 16 diffère des versions précédentes : consulter `node_modules/next/dist/docs/` avant d'écrire du code (voir `AGENTS.md`).

## Commandes

```bash
bun install
bun dev          # http://localhost:3000
bun run lint
bunx tsc --noEmit
bun run build
```

## Structure

```
src/app/                      layout, page, tokens (globals.css)
src/components/hero/          scène 01 — DJI Avata 2
  AvataHero.tsx               états idle / hover / focused, chorégraphie GSAP
  AvataHero.module.css        géométrie de la scène
  avata2Calibration.ts        recalage mesuré des deux rendus + silhouette de hit-test
public/assets/avata2/         30 rendus DJI Avata 2 (ne pas modifier)
docs/reviews/scene-XX/        preuves visuelles des scènes validées
```

## Règles de travail

- GitHub (`origin/main`) est la source de vérité. Un commit + push par unité de travail cohérente, jamais de force-push sur `main`.
- Aucun secret versionné (`.env*` ignorés).
- Les assets source ne sont ni modifiés ni renommés ; les versions dérivées éventuelles vont dans un dossier séparé.
