import { asc, count, eq } from "drizzle-orm";
import ConfirmButton from "@/components/admin/ConfirmButton";
import SaveButton from "@/components/admin/SaveButton";
import { requireDb, schema } from "@/db";
import { createCategoryAction, deleteCategoryAction, moveCategoryAction, updateCategoryAction } from "../../actions";
import styles from "../../admin.module.css";

export default async function CategoriesPage() {
  const d = requireDb();
  const rows = await d
    .select({ c: schema.categories, n: count(schema.collections.id) })
    .from(schema.categories)
    .leftJoin(schema.collections, eq(schema.collections.categoryId, schema.categories.id))
    .groupBy(schema.categories.id)
    .orderBy(asc(schema.categories.position), asc(schema.categories.id));
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.h1}>Catégories</h1>
          <p className={styles.lede}>Les filtres du portfolio (Mariages, Drone, Corporate…). Crée celles qui correspondent à ton travail, dans l&apos;ordre que tu veux.</p>
        </div>
      </div>

      <section className={styles.card}>
        <form action={createCategoryAction} className={styles.row}>
          <input className={styles.input} name="name" placeholder="Nouvelle catégorie (ex. Corporate)" required style={{ flex: 1, minWidth: 200 }} />
          <SaveButton>+ Ajouter</SaveButton>
        </form>
      </section>

      <section className={styles.card}>
        {rows.length ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ordre</th>
                <th>Nom</th>
                <th>Collections</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, n }, i) => (
                <tr key={c.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <form action={moveCategoryAction} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="dir" value="up" />
                      <button className={`${styles.btnGhost} ${styles.btnSmall}`} disabled={i === 0} aria-label="Monter">
                        ↑
                      </button>
                    </form>{" "}
                    <form action={moveCategoryAction} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="dir" value="down" />
                      <button className={`${styles.btnGhost} ${styles.btnSmall}`} disabled={i === rows.length - 1} aria-label="Descendre">
                        ↓
                      </button>
                    </form>
                  </td>
                  <td>
                    <form action={updateCategoryAction} className={styles.row}>
                      <input type="hidden" name="id" value={c.id} />
                      <input className={styles.input} name="name" defaultValue={c.name} required style={{ maxWidth: 260 }} />
                      <label className={styles.check}>
                        <input type="checkbox" name="visible" defaultChecked={c.visible} /> Visible
                      </label>
                      <SaveButton ghost small />
                    </form>
                  </td>
                  <td>{n}</td>
                  <td style={{ textAlign: "right" }}>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <ConfirmButton message={`Supprimer « ${c.name} » ? Les collections restent, sans catégorie.`} />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.empty}>Aucune catégorie.</p>
        )}
      </section>
    </>
  );
}
