import { desc } from "drizzle-orm";
import Link from "next/link";
import SaveButton from "@/components/admin/SaveButton";
import { requireDb, schema } from "@/db";
import { createClientAction } from "../../actions";
import styles from "../../admin.module.css";

export default async function ClientsPage() {
  const rows = await requireDb().select().from(schema.clients).orderBy(desc(schema.clients.createdAt));
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.h1}>Clients</h1>
          <p className={styles.lede}>Ton carnet de clients. Un client peut avoir plusieurs devis.</p>
        </div>
      </div>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Nouveau client</h2>
        <form action={createClientAction} className={styles.row}>
          <input className={styles.input} name="name" placeholder="Nom" required style={{ flex: 2, minWidth: 180 }} />
          <input className={styles.input} name="email" type="email" placeholder="Email" style={{ flex: 2, minWidth: 180 }} />
          <input className={styles.input} name="phone" placeholder="Téléphone" style={{ flex: 1, minWidth: 140 }} />
          <SaveButton>Ajouter</SaveButton>
        </form>
      </section>
      <section className={styles.card}>
        {rows.length ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Entreprise</th>
                <th>Email</th>
                <th>Téléphone</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/clients/${c.id}`}>
                      <b>{c.name}</b>
                    </Link>
                  </td>
                  <td>{c.company || "—"}</td>
                  <td>{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : "—"}</td>
                  <td>{c.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.empty}>Aucun client pour l&apos;instant.</p>
        )}
      </section>
    </>
  );
}
