"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";
import styles from "@/app/admin/admin.module.css";

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action}>
      <label className={styles.field}>
        <span>Email</span>
        <input name="email" type="email" autoComplete="username" required defaultValue={state?.email ?? ""} key={state?.email ?? ""} />
      </label>
      <label className={styles.field}>
        <span>Mot de passe</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state?.error ? <p className={styles.error}>{state.error}</p> : null}
      <button className={styles.btn} disabled={pending} style={{ width: "100%", marginTop: 6 }}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
