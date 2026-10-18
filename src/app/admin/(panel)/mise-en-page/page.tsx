import BackgroundEditor from "@/components/admin/BackgroundEditor";
import MediaField from "@/components/admin/MediaField";
import SaveButton from "@/components/admin/SaveButton";
import SectionsEditor from "@/components/admin/SectionsEditor";
import { getSettings } from "@/lib/cms/read";
import { saveBackgroundAction, saveIdentityAction, saveSectionsAction, saveShowreelAction } from "../../actions";
import styles from "../../admin.module.css";

export default async function LayoutPage() {
  const s = await getSettings();
  const blob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.h1}>Mise en page</h1>
          <p className={styles.lede}>L&apos;ordre des sections, le fond du site, le teaser et tes textes.</p>
        </div>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Ordre des sections</h2>
        <p className={styles.hint}>Monte ou descends une section avec les flèches. Décoche « Visible » pour la cacher. Le nom sert aussi dans le menu du site.</p>
        <form action={saveSectionsAction}>
          <SectionsEditor initial={s.sections} />
          <div style={{ marginTop: 14 }}>
            <SaveButton />
          </div>
        </form>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Fond du site</h2>
        <p className={styles.hint}>Garde le paysage vivant, ou mets ta propre photo ou vidéo derrière tout le site.</p>
        <form action={saveBackgroundAction}>
          <BackgroundEditor initial={s.background} blob={blob} />
          <SaveButton />
        </form>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Showreel / teaser</h2>
        <p className={styles.hint}>La grande vidéo qui suit l&apos;accueil. Format conseillé : MP4, 30 à 60 secondes.</p>
        <form action={saveShowreelAction}>
          <div className={styles.grid2}>
            <MediaField name="src" label="Vidéo" accept="video/*" blob={blob} defaultValue={s.showreel.src} />
            <MediaField name="poster" label="Image d'attente (facultatif)" accept="image/*" blob={blob} defaultValue={s.showreel.poster} />
          </div>
          <label className={styles.field}>
            <span>Titre</span>
            <input name="title" defaultValue={s.showreel.title} />
          </label>
          <SaveButton />
        </form>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Textes et coordonnées</h2>
        <form action={saveIdentityAction}>
          <div className={styles.grid2}>
            <label className={styles.field}>
              <span>Nom affiché (logo)</span>
              <input name="brand" defaultValue={s.brand} required />
            </label>
            <label className={styles.field}>
              <span>Prénom</span>
              <input name="creator" defaultValue={s.creator} required />
            </label>
            <label className={styles.field}>
              <span>Phrase d&apos;accroche — ligne 1</span>
              <input name="headline1" defaultValue={s.headline[0]} />
            </label>
            <label className={styles.field}>
              <span>Phrase d&apos;accroche — ligne 2</span>
              <input name="headline2" defaultValue={s.headline[1]} />
            </label>
          </div>
          <label className={styles.field}>
            <span>À propos</span>
            <textarea name="about" defaultValue={s.about} placeholder="Quelques lignes sur toi, ton parcours, ta façon de travailler." />
          </label>
          <div className={styles.grid2}>
            <label className={styles.field}>
              <span>Email public</span>
              <input name="email" type="email" defaultValue={s.contact.email} />
            </label>
            <label className={styles.field}>
              <span>Téléphone</span>
              <input name="phone" defaultValue={s.contact.phone} />
            </label>
            <label className={styles.field}>
              <span>Instagram (@compte ou lien)</span>
              <input name="instagram" defaultValue={s.contact.instagram} />
            </label>
            <label className={styles.field}>
              <span>Ville</span>
              <input name="city" defaultValue={s.contact.city} />
            </label>
          </div>
          <SaveButton />
        </form>
      </section>
    </>
  );
}
