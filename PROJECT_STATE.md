# PROJECT_STATE — handoff Claude / ChatGPT / Soufiane

_Court et factuel. Mis à jour à chaque checkpoint qui change l'état du projet._

## État actuel — Phase 4 « NADRA » (locale, non commitée, en attente de validation visuelle)
- Référence visuelle officielle : maquette NADRA (paysage montagne, rocher au premier plan, setup FPV posé dessus, nom géant dans le paysage). L'ancienne direction « noir tech / catalogue DJI » est abandonnée.
- Parcours : Hero (paysage + Goggles / Avata / Controller sur le rocher, survol, focus, vue éclatée Avata) → Showreel → Portfolio → Gear → À propos → Contact.
- Environment Engine : heure locale + lever/coucher réels + météo (Open-Meteo, `/api/environment`, cache 15 min) + saison → variables CSS `--ambient-*` et étalonnage du paysage. Test : `?phase=night&weather=rain&season=winter`.
- Repo : https://github.com/Soufianeerd/drone-immersive-portfolio — branche `main`. Rien de cette phase n'est commité ni poussé.

## Voir le site
`bun dev` → http://localhost:3017 (port fixé dans package.json).

## Architecture
- `src/components/scene/` : HeroScene (machine d'états home/focus/explore/part) + `turntable.ts` (vues multi-angles réelles).
- `src/components/environment/` : Landscape (master + masque de crête, étoiles, teinte, brume), WeatherCanvas (pluie/neige).
- `src/lib/environment/` : types, solar, resolve, providers, theme, EnvironmentProvider.
- `src/components/{showreel,portfolio,gear,about,contact}/`, `src/app/portfolio/[slug]`, `src/app/api/{environment,contact}`.
- Contenu : `src/config/site.ts` (marque, nav, réseaux), `src/content/{setup,showreel,work,gear}.ts`.
- Assets paysage : `public/environment/master/` (variantes alignées à venir : `public/environment/{season}/`, manifeste `ENVIRONMENT_VARIANTS`).

## En attente de contenus réels
- Vidéo du showreel (`src/content/showreel.ts`) — état « en montage » affiché tant que `src` est null.
- Médias portfolio (`src/content/work.ts`) — emplacements neutres « Projet à venir » en attendant.
- PNG HD détourés multi-angles Goggles 3 / Remote Controller 3 (turntable ; l'Avata utilise déjà ses vues réelles).
- Variantes photographiques alignées du paysage (aube, jour, nuit, saisons).
- Logo final, liens Instagram / e-mail, webhook du formulaire (`CONTACT_WEBHOOK_URL`, côté serveur).
