import PasswordForm from "@/components/admin/PasswordForm";
import SaveButton from "@/components/admin/SaveButton";
import { getSettings } from "@/lib/cms/read";
import { saveBusinessAction } from "../../actions";
import styles from "../../admin.module.css";

export default async function SettingsPage() {
  const b = (await getSettings()).business;
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.h1}>Réglages</h1>
          <p className={styles.lede}>Tes informations professionnelles (pour les devis) et ton mot de passe.</p>
        </div>
      </div>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Informations pour les devis</h2>
        <p className={styles.hint}>Affichées uniquement sur tes devis, jamais sur le site.</p>
        <form action={saveBusinessAction}>
          <div className={styles.grid2}>
            <label className={styles.field}>
              <span>Nom / raison sociale</span>
              <input name="name" defaultValue={b.name} />
            </label>
            <label className={styles.field}>
              <span>SIRET</span>
              <input name="siret" defaultValue={b.siret} />
            </label>
          </div>
          <label className={styles.field}>
            <span>Adresse</span>
            <textarea name="address" defaultValue={b.address} style={{ minHeight: 60 }} />
          </label>
          <label className={styles.field}>
            <span>Mention sous le total (ex. « TVA non applicable, art. 293 B du CGI »)</span>
            <input name="mentions" defaultValue={b.mentions} />
          </label>
          <SaveButton />
        </form>
      </section>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Mot de passe</h2>
        <PasswordForm />
      </section>
    </>
  );
}
