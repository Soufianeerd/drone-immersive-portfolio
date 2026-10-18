import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmButton from "@/components/admin/ConfirmButton";
import QuoteEditor from "@/components/admin/QuoteEditor";
import { requireDb, schema } from "@/db";
import { deleteQuoteAction } from "../../../actions";
import styles from "../../../admin.module.css";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const d = requireDb();
  const q = Number.isFinite(id) ? await d.query.quotes.findFirst({ where: eq(schema.quotes.id, id) }) : undefined;
  if (!q) notFound();
  const clients = await d.select({ id: schema.clients.id, name: schema.clients.name }).from(schema.clients).orderBy(asc(schema.clients.name));
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <Link href="/admin/devis" style={{ color: "var(--a-muted)" }}>
            ← Devis
          </Link>
          <h1 className={styles.h1}>Devis {q.number}</h1>
        </div>
        <Link href={`/admin/imprimer/${q.id}`} target="_blank" className={styles.btnGhost}>
          Imprimer / PDF ↗
        </Link>
      </div>
      <QuoteEditor
        quote={{ id: q.id, title: q.title, clientId: q.clientId, status: q.status, lines: q.lines, notes: q.notes, eventDate: q.eventDate, validUntil: q.validUntil }}
        clients={clients}
      />
      <form action={deleteQuoteAction} style={{ marginTop: 8 }}>
        <input type="hidden" name="id" value={q.id} />
        <ConfirmButton message="Supprimer ce devis ?" small={false}>
          Supprimer le devis
        </ConfirmButton>
      </form>
    </>
  );
}
