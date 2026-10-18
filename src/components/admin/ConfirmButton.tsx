"use client";

import styles from "@/app/admin/admin.module.css";

/** Bouton de suppression : demande confirmation avant d'envoyer le formulaire. */
export default function ConfirmButton({ children = "Supprimer", message = "Supprimer définitivement ?", small = true }: { children?: React.ReactNode; message?: string; small?: boolean }) {
  return (
    <button
      className={`${styles.btnDanger} ${small ? styles.btnSmall : ""}`}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
