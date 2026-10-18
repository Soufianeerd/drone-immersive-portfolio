"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import styles from "@/app/admin/admin.module.css";

/** Bouton d'enregistrement : état « en cours », puis confirmation brève. */
export default function SaveButton({ children = "Enregistrer", ghost = false, small = false }: { children?: React.ReactNode; ghost?: boolean; small?: boolean }) {
  const { pending } = useFormStatus();
  const [saved, setSaved] = useState(false);
  const was = useRef(false);
  useEffect(() => {
    if (was.current && !pending) {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 1800);
      was.current = pending;
      return () => clearTimeout(t);
    }
    was.current = pending;
  }, [pending]);
  return (
    <button className={`${ghost ? styles.btnGhost : styles.btn} ${small ? styles.btnSmall : ""}`} disabled={pending}>
      {pending ? "Enregistrement…" : saved ? "Enregistré ✓" : children}
    </button>
  );
}
