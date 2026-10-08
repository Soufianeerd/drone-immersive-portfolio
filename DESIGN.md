# DESIGN — NADRA / Anass, portfolio audiovisuel immersif

## Direction (Phase 4 — référence officielle : maquette NADRA)
Univers cinématographique vivant : paysage montagne plein écran, rocher au premier plan, setup FPV (Goggles 3 · Avata 2 · Remote Controller 3) physiquement posé, nom NADRA géant entre ciel et montagnes.
Palette : CHARCOAL #0E0E0E · OLIVE #4A5A46 · STONE #C9C2B5 · SAND #F5F3EE ; accent de lumière piloté par l'Environment Engine.
Typo : Michroma (marque, titres), Geist (texte), Geist Mono (labels).
Parcours : Hero → Showreel → Portfolio → Gear → À propos → Contact. Pas de numérotation décorative, pas de « scroll to explore ».
Les médias du portfolio ne reçoivent jamais l'étalonnage d'ambiance.

---

_Historique (phases précédentes) :_


## Direction
Le site vend d'abord ANASS : son univers, son travail, ses réalisations photo / film / drone, ses compétences — le matériel ensuite.
Cinématique, éditorial, premium, technique. Le setup FPV renforce la crédibilité ; il n'est jamais le sujet principal.

Refusé : SaaS, template, catalogue / fiche DJI, cartes partout, glassmorphism, gros dégradés, chiffres / clients / avis inventés.

## Hiérarchie de la home
1. Hero — « Filmer le mouvement. » + composition du setup FPV (Goggles 3 · Avata 2 · Remote Controller 3).
2. 02 / Selected Work — sujet principal après le hero (`src/content/work.ts`).
3. 03 / Services — Photo · Vidéo · Drone FPV.
4. 04 / Gear — futur Gear Lab (expérience Avata conservée dans `src/components/gear/avata/`).
5. 05 / About · 06 / Contact — à construire.

## Tokens (`src/app/globals.css`)
| Rôle | Valeur |
|---|---|
| Fond (`--ink`) | `#0a0a0b` |
| Graphite / lumière de sol (`--floor`) | `#1b1b1e` |
| Texte (`--fg`) | `#ececea` |
| Secondaire (`--soft`) / légendes (`--muted`) | `#a6a6a3` / `#8a8a88` |
| Accent (`--accent`) | `#ea6e02` — ponctuel : point du titre, filets, index |

Typo : Geist 600 en capitales très serrées (`-0.05em`) pour les titres ; Geist Mono capitales espacées pour index, navigation, légendes.

## Mouvement
- GSAP + ScrollTrigger, défilement inertiel Lenis (désactivé en reduced-motion).
- Un calque = un propriétaire (sortie au scroll / parallaxe / apparition / survol-sélection / respiration).
- Hero : apparition courte, respiration de l'Avata, micro-parallaxe + léger mouvement caméra au curseur.
- Survol : réaction discrète + nom ; clic : objet mis en avant (nom + rôle), jamais de fiche plein écran.
- Hero → Work : le hero reste en place, les outils s'écartent, la scène s'éteint, Selected Work monte par-dessus.
- `prefers-reduced-motion` : fondus uniquement.

## Copy
Français sobre et factuel. Aucune affirmation sur Anass (clients, chiffres, lieux) sans source fournie.
Les emplacements de Selected Work sont explicitement signalés « Média à venir ».
