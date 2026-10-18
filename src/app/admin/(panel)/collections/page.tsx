import { asc, count, desc, eq } from "drizzle-orm";
import Link from "next/link";
import SaveButton from "@/components/admin/SaveButton";
import { requireDb, schema } from "@/db";
import { createCollectionAction, moveCollectionAction } from "../../actions";
import styles from "../../admin.module.css";
import { KINDS } from "@/lib/cms/labels";


export default async function CollectionsPage() {
  const d = requireDb();
  const [cats, rows] = await Promise.all([
    d.select().from(schema.categories).orderBy(asc(schema.categories.position)),
    d
      .select({ c: schema.collections, cat: schema.categories.name, n: count(schema.media.id) })
      .from(schema.collections)
      .leftJoin(schema.categories, eq(schema.collections.categoryId, schema.categories.id))
      .leftJoin(schema.media, eq(schema.media.collectionId, schema.collections.id))
      .groupBy(schema.collections.id, schema.categories.name)
      .orderBy(desc(schema.collections.featured), asc(schema.collections.position), desc(schema.collections.id)),
  ]);
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.h1}>Photos & vidéos</h1>
          <p className={styles.lede}>Chaque collection est un projet, un événement ou une série. Crée-la, ajoute tes fichiers, puis coche « En ligne ».</p>
        </div>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Nouvelle collection</h2>
        <form action={createCollectionAction} className={styles.row}>
          <input className={styles.input} name="title" placeholder="Titre (ex. Mariage Sarah & Yanis)" required style={{ flex: 2, minWidth: 220 }} />
          <select className={styles.input} name="kind" style={{ flex: 1, minWidth: 140 }} defaultValue="photo">
            {Object.entries(KINDS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select className={styles.input} name="categoryId" style={{ flex: 1, minWidth: 160 }} defaultValue="">
            <option value="">— Catégorie —</option>
            {cats.map((c) => (
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
                <th>Ordre</th>
                <th>Titre</th>
                <th>Type</th>
                <th>Catégorie</th>
                <th>Fichiers</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, cat, n }, i) => (
                <tr key={c.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {(["up", "down"] as const).map((dir) => (
                      <form key={dir} action={moveCollectionAction} style={{ display: "inline", marginRight: 4 }}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="dir" value={dir} />
                        <button className={`${styles.btnGhost} ${styles.btnSmall}`} disabled={dir === "up" ? i === 0 : i === rows.length - 1} aria-label={dir === "up" ? "Monter" : "Descendre"}>
                          {dir === "up" ? "↑" : "↓"}
                        </button>
                      </form>
                    ))}
                  </td>
                  <td>
                    <Link href={`/admin/collections/${c.id}`}>
                      <b>{c.title}</b>
                    </Link>
                    {c.featured ? <span className={styles.badge} style={{ marginLeft: 8 }}>★ en avant</span> : null}
                  </td>
                  <td>{KINDS[c.kind] ?? c.kind}</td>
                  <td>{cat ?? "—"}</td>
                  <td>{n}</td>
                  <td>{c.published ? <span className={styles.badgeOk}>En ligne</span> : <span className={styles.badge}>Brouillon</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.empty}>Aucune collection pour l&apos;instant. Crée la première juste au-dessus.</p>
        )}
      </section>
    </>
  );
}
