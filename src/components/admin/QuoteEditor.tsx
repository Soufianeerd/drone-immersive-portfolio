"use client";

import { useActionState, useState } from "react";
import { updateQuoteAction } from "@/app/admin/actions";
import styles from "@/app/admin/admin.module.css";
import type { QuoteLine } from "@/db/schema";
import { QUOTE_STATUS } from "@/lib/cms/labels";
import { euro, quoteTotal } from "@/lib/cms/quote";

type Q = { id: number; title: string; clientId: number | null; status: string; lines: QuoteLine[]; notes: string; eventDate: string | null; validUntil: string | null };

export default function QuoteEditor({ quote, clients }: { quote: Q; clients: { id: number; name: string }[] }) {
  const [lines, setLines] = useState<QuoteLine[]>(quote.lines.length ? quote.lines : [{ label: "", qty: 1, price: 0 }]);
  const [state, action, pending] = useActionState(updateQuoteAction, null);
  const set = (i: number, patch: Partial<QuoteLine>) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  return (
    <form action={action}>
      <input type="hidden" name="id" value={quote.id} />
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      <section className={styles.card}>
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span>Objet</span>
            <input name="title" defaultValue={quote.title} />
          </label>
          <label className={styles.field}>
            <span>Client</span>
            <select name="clientId" defaultValue={quote.clientId ?? ""}>
              <option value="">— Aucun —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Statut</span>
            <select name="status" defaultValue={quote.status}>
              {Object.entries(QUOTE_STATUS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Date de la prestation</span>
            <input type="date" name="eventDate" defaultValue={quote.eventDate ?? ""} />
          </label>
          <label className={styles.field}>
            <span>Valable jusqu&apos;au</span>
            <input type="date" name="validUntil" defaultValue={quote.validUntil ?? ""} />
          </label>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Prestations</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ width: 90 }}>Qté</th>
              <th style={{ width: 130 }}>Prix unitaire €</th>
              <th style={{ width: 120, textAlign: "right" }}>Montant</th>
              <th style={{ width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td>
                  <input className={styles.input} value={l.label} onChange={(e) => set(i, { label: e.target.value })} placeholder="ex. Captation drone FPV — demi-journée" />
                </td>
                <td>
                  <input className={styles.input} type="number" min={0} step="0.5" value={l.qty} onChange={(e) => set(i, { qty: Number(e.target.value) })} />
                </td>
                <td>
                  <input className={styles.input} type="number" min={0} step="0.01" value={l.price} onChange={(e) => set(i, { price: Number(e.target.value) })} />
                </td>
                <td style={{ textAlign: "right" }}>{euro((l.qty || 0) * (l.price || 0))}</td>
                <td>
                  <button type="button" className={`${styles.btnDanger} ${styles.btnSmall}`} onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))} aria-label="Retirer la ligne">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.row} style={{ justifyContent: "space-between", marginTop: 12 }}>
          <button type="button" className={`${styles.btnGhost} ${styles.btnSmall}`} onClick={() => setLines((ls) => [...ls, { label: "", qty: 1, price: 0 }])}>
            + Ajouter une ligne
          </button>
          <b style={{ fontSize: 18 }}>Total : {euro(quoteTotal(lines))}</b>
        </div>
      </section>

      <section className={styles.card}>
        <label className={styles.field}>
          <span>Notes (conditions, acompte, délais…)</span>
          <textarea name="notes" defaultValue={quote.notes} />
        </label>
        <div className={styles.row}>
          <button className={styles.btn} disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer le devis"}
          </button>
          {state?.ok && !pending ? <span className={styles.ok}>Enregistré ✓</span> : null}
        </div>
      </section>
    </form>
  );
}
