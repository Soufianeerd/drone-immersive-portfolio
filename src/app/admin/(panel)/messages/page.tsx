import { desc } from "drizzle-orm";
import Link from "next/link";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { requireDb, schema } from "@/db";
import { createClientAction, messageAction } from "../../actions";
import styles from "../../admin.module.css";

export default async function MessagesPage() {
  const rows = await requireDb().select().from(schema.messages).orderBy(desc(schema.messages.createdAt)).limit(200);
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.h1}>Messages</h1>
          <p className={styles.lede}>Les demandes envoyées depuis le formulaire de contact de ton site.</p>
        </div>
      </div>
      {rows.length ? (
        rows.map((m) => (
          <section key={m.id} className={styles.card} style={m.read ? undefined : { borderColor: "var(--a-text)" }}>
            <div className={styles.row} style={{ justifyContent: "space-between" }}>
              <div>
                <b>{m.name}</b> · <a href={`mailto:${m.email}`}>{m.email}</a> {m.type ? <span className={styles.badge}>{m.type}</span> : null}{" "}
                {m.read ? null : <span className={styles.badgeWarn}>Nouveau</span>}
              </div>
              <span style={{ color: "var(--a-muted)" }}>{m.createdAt.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</span>
            </div>
            <p style={{ whiteSpace: "pre-wrap", margin: "12px 0" }}>{m.body}</p>
            <div className={styles.row}>
              <a className={`${styles.btn} ${styles.btnSmall}`} href={`mailto:${m.email}?subject=${encodeURIComponent("Votre demande")}`}>
                Répondre
              </a>
              {m.clientId ? (
                <Link className={`${styles.btnGhost} ${styles.btnSmall}`} href={`/admin/clients/${m.clientId}`}>
                  Fiche client
                </Link>
              ) : (
                <form action={createClientAction}>
                  <input type="hidden" name="messageId" value={m.id} />
                  <input type="hidden" name="name" value={m.name} />
                  <input type="hidden" name="email" value={m.email} />
                  <input type="hidden" name="notes" value={`Demande du ${m.createdAt.toLocaleDateString("fr-FR")} (${m.type}) :\n${m.body}`} />
                  <button className={`${styles.btnGhost} ${styles.btnSmall}`}>Créer le client</button>
                </form>
              )}
              <form action={messageAction}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="op" value={m.read ? "unread" : "read"} />
                <button className={`${styles.btnGhost} ${styles.btnSmall}`}>{m.read ? "Marquer non lu" : "Marquer lu"}</button>
              </form>
              <form action={messageAction}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="op" value="delete" />
                <ConfirmButton message="Supprimer ce message ?" />
              </form>
            </div>
          </section>
        ))
      ) : (
        <section className={styles.card}>
          <p className={styles.empty}>Aucun message pour l&apos;instant.</p>
        </section>
      )}
    </>
  );
}
