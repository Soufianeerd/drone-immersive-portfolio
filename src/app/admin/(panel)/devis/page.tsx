import { asc, desc, eq } from "drizzle-orm";
import Link from "next/link";
import SaveButton from "@/components/admin/SaveButton";
import { requireDb, schema } from "@/db";
import { QUOTE_STATUS } from "@/lib/cms/labels";
import { euro, quoteTotal } from "@/lib/cms/quote";
import { createQuoteAction } from "../../actions";
import styles from "../../admin.module.css";

export default async function QuotesPage() {
  const d = requireDb();
  const [clients, rows] = await Promise.all([
    d.select({ id: schema.clients.id, name: schema.clients.name }).from(schema.clients).orderBy(asc(schema.clients.name)),
    d
      .select({ q: schema.quotes, client: schema.clients.name })
      .from(schema.quotes)
      .leftJoin(schema.clients, eq(schema.quotes.clientId, schema.clients.id))
      .orderBy(desc(schema.quotes.createdAt)),
  ]);
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.h1}>Devis</h1>
          <p className={styles.lede}>Crée un devis, ajoute tes lignes, puis imprime-le ou enregistre-le en PDF pour l&apos;envoyer.</p>
        </div>
      </div>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Nouveau devis</h2>
        <form action={createQuoteAction} className={styles.row}>
          <input className={styles.input} name="title" placeholder="Objet (ex. Mariage — reportage photo + drone)" style={{ flex: 2, minWidth: 220 }} />
          <select className={styles.input} name="clientId" defaultValue="" style={{ flex: 1, minWidth: 160 }}>
            <option value="">— Client —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <SaveButton>Créer</SaveButton>
        </form>
      </section>
      <section className={styles.card}>
        {rows.length ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Objet</th>
                <th>Client</th>
                <th>Statut</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ q, client }) => (
                <tr key={q.id}>
                  <td>
                    <Link href={`/admin/devis/${q.id}`}>
                      <b>{q.number}</b>
                    </Link>
                  </td>
                  <td>{q.title || "—"}</td>
                  <td>{client ?? "—"}</td>
                  <td>
                    <span className={q.status === "accepte" ? styles.badgeOk : q.status === "refuse" ? styles.badgeWarn : styles.badge}>{QUOTE_STATUS[q.status]}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>{euro(quoteTotal(q.lines))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.empty}>Aucun devis pour l&apos;instant.</p>
        )}
      </section>
    </>
  );
}
