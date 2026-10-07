# PROJECT_STATE — handoff Claude / ChatGPT / Soufiane

_Court et factuel. Mis à jour à chaque checkpoint Git qui change l'état du projet._

## État actuel
- Front-end Next.js 16 / React 19 / TS / Tailwind 4 / GSAP. Aucun backend, aucun déploiement.
- Page `/` : header du site + hero setup FPV (avec mode Détails Avata) + amorce de la section 02 Projets.
- Repo : https://github.com/Soufianeerd/drone-immersive-portfolio — branche `main`.

## Voir le site
- Local : `bun install` (une fois) puis `bun dev` → http://localhost:3000
- Aperçu en ligne (export statique, privé) : artifact Claude « Portfolio Anass », mis à jour à chaque étape.

## Roadmap
1. Scène Avata — base motion : **validée**.
2. Hero à trois objets : implémenté.
3. Hero intégré au site : `f75b75d` **non validé** (proportions, ANASS, Détails inactif).
4. **Passe corrective + parcours Détails Avata : implémentée, en attente de validation.**
5. Ensuite (après validation seulement) : section 02 Projets avec les vrais contenus.

## Parcours à tester
Landing → survol / clic Avata → fiche → « Détails » → décomposition (capot ouvert → éclaté moyen → éclaté complet) → écran technique (5 composants) → panneau composant → « ← Vue éclatée » → « ← Retour au drone » → « Fermer » → landing. ANASS ramène à la landing depuis n'importe quel état.

## Ce que montre la page
- Header : ANASS (`resetToHome()` dans `src/lib/home.ts` : ferme Détails et focus, remonte en haut, nettoie le hash) + un seul lien réel « Projets ». Navigation masquée pendant focus / Détails.
- Hero : Goggles · Avata · télécommande, proportions normalisées sur l'alpha réel (Avata 1 ; Goggles ≈ 0,69 ; télécommande ≈ 0,59), légendes centrées sous chaque silhouette.
- Machine d'états `idle / hover / focused / details` (+ composant ouvert), réversible. Escape remonte d'un niveau à la fois.
- Mode Détails : trois rendus recalés sur le module caméra (`avata2Details.ts`), fondu / échelle / flou léger, pas de 3D. Étiquettes HTML/SVG (aucun texte incrusté) ; mobile : points numérotés + liste.
- Panneaux composants : rendus `*-dark.png`, textes repris des rendus annotés DJI.
- Section 02 : titre + phrase uniquement.
- Checks : lint, tsc, build ; axe 0 violation (1440 / 390, idle, focus, détails, composant) ; pas d'overflow ; aucune erreur console ; clavier et reduced-motion parcourus de bout en bout.

## Défauts connus
1. Rendus Avata 1254 px : légère douceur en focus / Détails sur Retina → versions ≥ 2400 px souhaitées.
2. Écart de quelques px entre rendus Avata (contours carénages ; étapes de décomposition), masqué par les fondus.
3. PNG télécommande : inscriptions secondaires non conformes à la photo réelle. Ne jamais les utiliser comme information factuelle.
4. `avata2-electronics-exploded-dark.png` contient des annotations incrustées (anglais/français) dans l'image du panneau Électronique.
5. Textes à valider : titre du hero, fiche Avata, textes des composants, phrase de la section 02.
6. Tablette portrait (768–1024 px) : composition desktop réduite, espace vide sous les objets.

## Prochaine étape prévue
Validation par Soufiane du parcours Landing → Avata → Détails → Décomposition → Retour → Landing. Rien d'autre n'est construit avant.

## Dernier checkpoint
- Date : 2026-10-07
- Commit : feat: complete Avata details flow and refine FPV hero (parent `f75b75d`)
