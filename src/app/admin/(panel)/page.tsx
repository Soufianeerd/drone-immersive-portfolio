import { count, desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { requireDb, schema } from "@/db";
import styles from "../admin.module.css";

export default async function Dashboard() {
  const d = requireDb();
  const [[pub], [all], [unread], [open], recent] = await Promise.all([
    d.select({ n: count() }).from(schema.collections).where(eq(schema.collections.published, true)),
    d.select({ n: count() }).from(schema.media),
    d.select({ n: count() }).from(schema.messages).where(eq(schema.messages.read, false)),
    d.select({ n: count() }).from(schema.quotes).where(inArray(schema.quotes.status, ["brouillon", "envoye"])),
    d.select().from(schema.messages).orderBy(desc(schema.messages.createdAt)).limit(5),
  ]);
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.h1}>Bonjour</h1>
          <p className={styles.lede}>Tout ce que tu modifies ici apparaît directement sur ton site.</p>
        </div>
        <div className={styles.row}>
          <Link href="/admin/collections" className={styles.btn}>
            + Ajouter des photos / vidéos
          </Link>
          <Link href="/admin/devis" className={styles.btnGhost}>
            + Nouveau devis
          </Link>
        </div>
      </div>

      <div className={styles.stats}>
        <Link href="/admin/collections" className={styles.stat}>
          <b>{pub.n}</b>
          <span>collections en ligne</span>
        </Link>
        <Link href="/admin/collections" className={styles.stat}>
          <b>{all.n}</b>
          <span>photos et vidéos</span>
        </Link>
        <Link href="/admin/messages" className={styles.stat}>
          <b>{unread.n}</b>
          <span>messages non lus</span>
        </Link>
        <Link href="/admin/devis" className={styles.stat}>
          <b>{open.n}</b>
          <span>devis en cours</span>
        </Link>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Derniers messages</h2>
        {recent.length ? (
          <table className={styles.table}>
            <tbody>
              {recent.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Link href="/admin/messages">
                      {m.read ? m.name : <b>{m.name}</b>}
                    </Link>
                  </td>
                  <td style={{ color: "var(--a-muted)" }}>{m.body.slice(0, 90)}</td>
                  <td style={{ whiteSpace: "nowrap", color: "var(--a-muted)" }}>{m.createdAt.toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.empty}>Aucun message pour l&apos;instant. Les demandes du formulaire de contact arriveront ici.</p>
        )}
      </section>
    </>
  );
}
