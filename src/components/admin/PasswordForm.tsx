"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/admin/actions";
import styles from "@/app/admin/admin.module.css";

export default function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null);
  return (
    <form action={action} style={{ maxWidth: 420 }}>
      <label className={styles.field}>
        <span>Nouveau mot de passe (10 caractères minimum)</span>
        <input name="password" type="password" autoComplete="new-password" required minLength={10} />
      </label>
      <label className={styles.field}>
        <span>Confirmer</span>
        <input name="confirm" type="password" autoComplete="new-password" required minLength={10} />
      </label>
      {state?.error ? <p className={styles.error}>{state.error}</p> : null}
      {state?.ok ? <p className={styles.ok}>{state.ok}</p> : null}
      <button className={styles.btn} disabled={pending}>
        {pending ? "…" : "Changer le mot de passe"}
      </button>
    </form>
  );
}
