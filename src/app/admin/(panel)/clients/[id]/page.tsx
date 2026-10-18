import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmButton from "@/components/admin/ConfirmButton";
import SaveButton from "@/components/admin/SaveButton";
import { requireDb, schema } from "@/db";
import { QUOTE_STATUS } from "@/lib/cms/labels";
import { quoteTotal } from "@/lib/cms/quote";
import { createQuoteAction, deleteClientAction, updateClientAction } from "../../../actions";
import styles from "../../../admin.module.css";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const d = requireDb();
  const c = Number.isFinite(id) ? await d.query.clients.findFirst({ where: eq(schema.clients.id, id) }) : undefined;
  if (!c) notFound();
  const qs = await d.select().from(schema.quotes).where(eq(schema.quotes.clientId, id)).orderBy(desc(schema.quotes.createdAt));
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <Link href="/admin/clients" style={{ color: "var(--a-muted)" }}>
            ← Clients
          </Link>
          <h1 className={styles.h1}>{c.name}</h1>
        </div>
        <form action={createQuoteAction}>
          <input type="hidden" name="clientId" value={c.id} />
          <SaveButton>+ Devis pour ce client</SaveButton>
        </form>
      </div>
      <section className={styles.card}>
        <form action={updateClientAction}>
          <input type="hidden" name="id" value={c.id} />
          <div className={styles.grid2}>
            {(
              [
                ["name", "Nom", c.name],
                ["company", "Entreprise", c.company],
                ["email", "Email", c.email],
                ["phone", "Téléphone", c.phone],
              ] as const
            ).map(([n, l, v]) => (
              <label key={n} className={styles.field}>
                <span>{l}</span>
                <input name={n} defaultValue={v} required={n === "name"} />
              </label>
            ))}
          </div>
          <label className={styles.field}>
            <span>Adresse</span>
            <textarea name="address" defaultValue={c.address} style={{ minHeight: 60 }} />
          </label>
          <label className={styles.field}>
            <span>Notes</span>
            <textarea name="notes" defaultValue={c.notes} />
          </label>
          <SaveButton />
        </form>
      </section>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Devis</h2>
        {qs.length ? (
          <table className={styles.table}>
            <tbody>
              {qs.map((q) => (
                <tr key={q.id}>
                  <td>
                    <Link href={`/admin/devis/${q.id}`}>
                      <b>{q.number}</b>
                    </Link>{" "}
                    {q.title}
                  </td>
                  <td>{QUOTE_STATUS[q.status]}</td>
                  <td style={{ textAlign: "right" }}>{quoteTotal(q.lines).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.empty}>Aucun devis.</p>
        )}
      </section>
      <form action={deleteClientAction}>
        <input type="hidden" name="id" value={c.id} />
        <ConfirmButton message="Supprimer ce client ? Ses devis restent, sans client." small={false}>
          Supprimer le client
        </ConfirmButton>
      </form>
    </>
  );
}
