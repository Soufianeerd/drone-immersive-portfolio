# DESIGN — Anass, portfolio immersif

## Direction
Studio de nuit : un seul objet éclairé sur un plateau graphite. Le matériel est le sujet, le texte est rare.
Cinématique, technique, minimaliste. Le « wow » vient du comportement des objets, pas de la décoration.

Refusé : cartes, glassmorphism, dégradés décoratifs, HUD/OSD envahissant, sections SaaS, chiffres ou avis inventés.

## Tokens (`src/app/globals.css`)
| Rôle | Valeur |
|---|---|
| Fond (`--ink`) | `#0a0a0b` |
| Lumière de sol (`--floor`) | `#1b1b1e` — seule « lumière », sous l'objet, support de l'ombre |
| Texte (`--fg`) | `#ececea` |
| Texte secondaire (`--soft`) | `#a6a6a3` |
| Légendes (`--muted`) | `#8a8a88` |
| Filets (`--line`) | blanc 16 % |
| Accent (`--accent`) | `#ea6e02` — orange des protections de l'Avata 2, uniquement en filet / focus |

Typo : Geist (titres, texte), Geist Mono en capitales espacées pour les légendes. Titres serrés (`-0.045em`).

## Mouvement
Un principe : **l'objet est physique**. Il flotte, s'allume, se rapproche de la caméra.
- Orchestrateur unique : GSAP. Aucune transition CSS sur un calque animé par GSAP.
- Un calque = un propriétaire (parallaxe / focus / flottement / levée / ombre).
- `transform` et `opacity` uniquement.
- Courbes : `sine.inOut` (vie au repos), `expo.out` (activation), `expo.inOut` (déplacements de caméra).
- `prefers-reduced-motion` : ni flottement ni parallaxe, déplacements remplacés par des fondus.
- Tactile : pas de hover, un tap ouvre directement la fiche.

## Copy
Français, sobre, factuel. Caractéristiques produit tirées des visuels fournis.
Aucune affirmation sur Anass (clients, chiffres, lieux) sans source fournie.
