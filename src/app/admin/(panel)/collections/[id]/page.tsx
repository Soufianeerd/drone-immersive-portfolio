import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmButton from "@/components/admin/ConfirmButton";
import MediaManager from "@/components/admin/MediaManager";
import SaveButton from "@/components/admin/SaveButton";
import { requireDb, schema } from "@/db";
import { FORMATS, KINDS } from "@/lib/cms/labels";
import { addMediaAction, deleteCollectionAction, updateCollectionAction } from "../../../actions";
import styles from "../../../admin.module.css";

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const d = requireDb();
  const c = Number.isFinite(id) ? await d.query.collections.findFirst({ where: eq(schema.collections.id, id) }) : undefined;
  if (!c) notFound();
  const [cats, items] = await Promise.all([
    d.select().from(schema.categories).orderBy(asc(schema.categories.position)),
    d.select().from(schema.media).where(eq(schema.media.collectionId, id)).orderBy(asc(schema.media.position), asc(schema.media.id)),
  ]);
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <Link href="/admin/collections" style={{ color: "var(--a-muted)" }}>
            ← Photos & vidéos
          </Link>
          <h1 className={styles.h1}>{c.title}</h1>
        </div>
        {c.published ? (
          <Link href={`/portfolio/${c.slug}`} target="_blank" className={styles.btnGhost}>
            Voir sur le site ↗
          </Link>
        ) : (
          <span className={styles.badge}>Brouillon — pas encore visible</span>
        )}
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Fichiers</h2>
        <p className={styles.hint}>La première photo ajoutée sert de couverture ; tu peux en choisir une autre. Les flèches changent l&apos;ordre.</p>
        <MediaManager
          items={items.map((m) => ({ id: m.id, kind: m.kind, url: m.url, caption: m.caption }))}
          coverId={c.coverMediaId}
          blob={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
          add={addMediaAction.bind(null, c.id)}
        />
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Informations</h2>
        <form action={updateCollectionAction}>
          <input type="hidden" name="id" value={c.id} />
          <div className={styles.row} style={{ gap: 22, marginBottom: 14 }}>
            <label className={styles.check}>
              <input type="checkbox" name="published" defaultChecked={c.published} /> <b>En ligne</b>
            </label>
            <label className={styles.check}>
              <input type="checkbox" name="featured" defaultChecked={c.featured} /> Mettre en avant (en premier)
            </label>
          </div>
          <div className={styles.grid2}>
            <label className={styles.field}>
              <span>Titre</span>
              <input name="title" defaultValue={c.title} required />
            </label>
            <label className={styles.field}>
              <span>Adresse de la page (/portfolio/…)</span>
              <input name="slug" defaultValue={c.slug} />
            </label>
            <label className={styles.field}>
              <span>Type</span>
              <select name="kind" defaultValue={c.kind}>
                {Object.entries(KINDS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Catégorie</span>
              <select name="categoryId" defaultValue={c.categoryId ?? ""}>
                <option value="">— Aucune —</option>
                {cats.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Date</span>
              <input name="eventDate" type="date" defaultValue={c.eventDate ?? ""} />
            </label>
            <label className={styles.field}>
              <span>Lieu</span>
              <input name="location" defaultValue={c.location} />
            </label>
            <label className={styles.field}>
              <span>Client (affiché sur le site)</span>
              <input name="clientName" defaultValue={c.clientName} />
            </label>
            <label className={styles.field}>
              <span>Format de la vignette</span>
              <select name="format" defaultValue={c.format}>
                {Object.entries(FORMATS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={styles.field}>
            <span>Texte</span>
            <textarea name="description" defaultValue={c.description} placeholder="Le contexte, l'histoire du projet…" />
          </label>
          <SaveButton />
        </form>
      </section>

      <form action={deleteCollectionAction} className={styles.noPrint}>
        <input type="hidden" name="id" value={c.id} />
        <ConfirmButton message="Supprimer cette collection et tous ses fichiers du site ?" small={false}>
          Supprimer la collection
        </ConfirmButton>
      </form>
    </>
  );
}
