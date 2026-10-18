import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";
import styles from "../admin.module.css";

export const metadata: Metadata = { title: "Connexion", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  const ready = Boolean(process.env.DATABASE_URL && process.env.AUTH_SECRET);
  return (
    <div className={styles.login}>
      <div className={`${styles.card} ${styles.loginCard}`}>
        <h1 className={styles.h1} style={{ marginBottom: 4 }}>
          Espace admin
        </h1>
        <p className={styles.hint}>Connecte-toi pour gérer ton site.</p>
        {ready ? <LoginForm /> : <p className={styles.error}>La base de données n&apos;est pas encore configurée (DATABASE_URL / AUTH_SECRET).</p>}
      </div>
    </div>
  );
}
