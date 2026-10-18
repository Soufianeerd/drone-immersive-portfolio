# PROJECT_STATE — handoff Claude / ChatGPT / Soufiane

_Court et factuel. Mis à jour à chaque checkpoint qui change l'état du projet._

## État actuel — site NADRA + espace admin
- Site public : Hero (paysage vivant WebGL ou fond perso, setup FPV en rotation continue au survol) → sections réordonnables depuis l'admin (Showreel, Portfolio, Gear, À propos, Contact).
- Monde vivant : heure / soleil réels, météo (Open-Meteo), saison, voyage de 10 paysages (`src/config/world.ts`, `WorldCanvas`).
- Admin `/admin` (Neon + Vercel Blob, email + mot de passe) : mise en page (ordre / visibilité / noms des sections), fond du site (paysage, photo ou vidéo en boucle / boomerang), showreel / teaser, textes, catégories, collections (photos, vidéos, événements) avec envoi de fichiers, messages du formulaire, clients, devis (impression / PDF), réglages.
- Repo : https://github.com/Soufianeerd/drone-immersive-portfolio — branche `main`.

## Lancer en local
1. `cp .env.example .env.local`, puis remplir `DATABASE_URL` (Neon) et `AUTH_SECRET` (`openssl rand -base64 48`).
2. `bun install && bun run db:setup` (tables + catégories par défaut).
3. `bun run admin:create email@exemple.com "MotDePasseLong" "Anass"`.
4. `bun dev` → http://localhost:3017 et http://localhost:3017/admin.
Sans `BLOB_READ_WRITE_TOKEN`, les fichiers envoyés en local vont dans `public/uploads/` (non versionné).
Sans `DATABASE_URL`, le site public tourne avec son contenu par défaut.

## Mise en ligne (Vercel)
Variables : `DATABASE_URL`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN` (Storage → Blob), optionnel `CONTACT_WEBHOOK_URL`.

## Architecture
- `src/db/` : schéma Drizzle (Neon / Postgres), migrations dans `drizzle/`, scripts dans `scripts/`.
- `src/lib/cms/` : lecture publique avec repli sur le contenu par défaut, types, libellés.
- `src/lib/auth.ts`, `src/lib/session.ts`, `src/proxy.ts` : sessions admin.
- `src/app/admin/` : pages admin (`(panel)/…`), actions serveur (`actions.ts`), styles.
- `src/components/scene/` : HeroScene + `turntable.ts` (rotation continue à partir des vraies photos).
- `src/components/environment/` : WorldCanvas (WebGL), SiteBackground (fond perso), WeatherCanvas.

## Reste à faire
- Finitions : SEO, vitesse, tests mobile, nom de domaine.
- Plus tard : grande scène « setup » avant le footer, mode Détails / vue éclatée dans Gear.
