import type { Metadata } from "next";
import { and, count, eq } from "drizzle-orm";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/cms/read";
import { logoutAction } from "../actions";
import styles from "../admin.module.css";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const settings = await getSettings();
  const [{ unread }] = await db()!.select({ unread: count() }).from(schema.messages).where(and(eq(schema.messages.read, false)));
  return (
    <div className={styles.shell}>
      <aside className={styles.side}>
        <div className={styles.brand}>
          {settings.brand}
          <small>Espace admin</small>
        </div>
        <AdminNav unread={Number(unread)} />
        <div className={styles.sideFoot}>
          <Link href="/" target="_blank" className={styles.btnGhost}>
            Voir mon site ↗
          </Link>
          <span>{user.email}</span>
          <form action={logoutAction}>
            <button className={`${styles.btnDanger} ${styles.btnSmall}`} style={{ paddingLeft: 0 }}>
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
