import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PrintButton from "@/components/admin/PrintButton";
import { requireDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/cms/read";
import { euro, quoteTotal } from "@/lib/cms/quote";

export const metadata: Metadata = { title: "Devis", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const fr = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "");

/** Devis imprimable (Imprimer → Enregistrer en PDF). */
export default async function PrintQuote({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  const d = requireDb();
  const q = Number.isFinite(id) ? await d.query.quotes.findFirst({ where: eq(schema.quotes.id, id) }) : undefined;
  if (!q) notFound();
  const [client, s] = await Promise.all([q.clientId ? d.query.clients.findFirst({ where: eq(schema.clients.id, q.clientId) }) : null, getSettings()]);
  const b = s.business;
  const cell = { padding: "10px 8px", borderBottom: "1px solid #e5e5e5" } as const;
  return (
    <div className="print-root" style={{ position: "fixed", inset: 0, zIndex: 100, overflow: "auto", background: "#fff", color: "#111", fontFamily: "var(--font-geist-sans), system-ui, sans-serif", fontSize: 13 }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 40px" }}>
        <PrintButton />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24, marginBottom: 48 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "0.06em" }}>{s.brand}</div>
            <div style={{ whiteSpace: "pre-line", marginTop: 8, color: "#555" }}>
              {[b.name || s.creator, b.address, s.contact.email, s.contact.phone, b.siret ? `SIRET ${b.siret}` : ""].filter(Boolean).join("\n")}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 26, fontWeight: 600 }}>Devis</div>
            <div>N° {q.number}</div>
            <div style={{ color: "#555" }}>Le {q.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</div>
            {q.validUntil ? <div style={{ color: "#555" }}>Valable jusqu&apos;au {fr(q.validUntil)}</div> : null}
          </div>
        </div>
        {client ? (
          <div style={{ marginLeft: "auto", width: 280, marginBottom: 36, whiteSpace: "pre-line" }}>
            <b>{client.name}</b>
            {"\n"}
            {[client.company, client.address, client.email, client.phone].filter(Boolean).join("\n")}
          </div>
        ) : null}
        {q.title ? (
          <p>
            <b>Objet :</b> {q.title}
            {q.eventDate ? ` — ${fr(q.eventDate)}` : ""}
          </p>
        ) : null}
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "18px 0" }}>
          <thead>
            <tr style={{ textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666" }}>
              <th style={cell}>Description</th>
              <th style={{ ...cell, textAlign: "right" }}>Qté</th>
              <th style={{ ...cell, textAlign: "right" }}>Prix unitaire</th>
              <th style={{ ...cell, textAlign: "right" }}>Montant</th>
            </tr>
          </thead>
          <tbody>
            {q.lines.map((l, i) => (
              <tr key={i}>
                <td style={cell}>{l.label}</td>
                <td style={{ ...cell, textAlign: "right" }}>{l.qty}</td>
                <td style={{ ...cell, textAlign: "right" }}>{euro(l.price)}</td>
                <td style={{ ...cell, textAlign: "right" }}>{euro(l.qty * l.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ textAlign: "right", fontSize: 18, fontWeight: 600 }}>Total : {euro(quoteTotal(q.lines))}</div>
        {b.mentions ? <p style={{ textAlign: "right", color: "#555", marginTop: 4 }}>{b.mentions}</p> : null}
        {q.notes ? <p style={{ whiteSpace: "pre-wrap", marginTop: 36 }}>{q.notes}</p> : null}
        <div style={{ marginTop: 56, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 260, borderTop: "1px solid #999", paddingTop: 8, color: "#555" }}>Bon pour accord — date et signature</div>
        </div>
      </div>
    </div>
  );
}
