"use client";

import { useState } from "react";
import { SITE } from "@/config/site";
import styles from "./Contact.module.css";

const TYPES = [
  { id: "mariage", label: "Mariage" },
  { id: "evenement", label: "Événement" },
  { id: "portrait", label: "Portrait" },
  { id: "drone", label: "Drone FPV" },
  { id: "video", label: "Vidéo" },
  { id: "photo", label: "Photo" },
  { id: "autre", label: "Autre" },
];

type Status = "idle" | "sending" | "sent" | "invalid" | "not_configured" | "error";

const MESSAGES: Record<Exclude<Status, "idle" | "sending">, string> = {
  sent: "Message envoyé. Réponse rapide.",
  invalid: "Vérifiez le nom, l’e-mail, le type de projet et le message (10 caractères minimum).",
  not_configured: "L’envoi en ligne n’est pas encore activé : votre message n’a pas été transmis.",
  error: "L’envoi a échoué. Réessayez dans un instant.",
};

/**
 * CONTACT + footer. Envoi via /api/contact (inactif tant que le webhook n'est pas configuré).
 * Les liens sociaux n'apparaissent que s'ils sont renseignés dans SITE.social.
 */
export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const ok =
      String(data.name ?? "").trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(data.email ?? "").trim()) &&
      data.type &&
      String(data.message ?? "").trim().length >= 10;
    if (!ok) return setStatus("invalid");
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (json.ok) {
        setStatus("sent");
        form.reset();
      } else setStatus(json.error === "invalid" ? "invalid" : json.error === "not_configured" ? "not_configured" : "error");
    } catch {
      setStatus("error");
    }
  };

  const links = [
    SITE.social.instagram ? { label: "Instagram", href: SITE.social.instagram } : null,
    SITE.social.email ? { label: SITE.social.email, href: `mailto:${SITE.social.email}` } : null,
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <section id="contact" className={styles.section} aria-labelledby="contact-title">
      {/* Le monde (WorldCanvas) reste visible derrière : seul un voile de lisibilité. */}
      <div className={styles.bg} aria-hidden />

      <div className={styles.inner}>
        <h2 id="contact-title" className={styles.title}>
          <span>Un projet ?</span>
          <span>Racontons-le.</span>
        </h2>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <div className={styles.pair}>
            <label className={styles.field}>
              <span>Nom</span>
              <input name="name" type="text" autoComplete="name" required maxLength={120} />
            </label>
            <label className={styles.field}>
              <span>E-mail</span>
              <input name="email" type="email" autoComplete="email" required maxLength={200} />
            </label>
          </div>
          <label className={styles.field}>
            <span>Type de projet</span>
            <select name="type" required defaultValue="">
              <option value="" disabled>
                Choisir…
              </option>
              {TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Message</span>
            <textarea name="message" rows={5} required minLength={10} maxLength={5000} />
          </label>
          <label className={styles.trap} aria-hidden>
            Site web
            <input name="website" type="text" tabIndex={-1} autoComplete="off" />
          </label>

          <div className={styles.actions}>
            <button type="submit" className={styles.send} disabled={status === "sending"}>
              {status === "sending" ? "Envoi…" : "Envoyer"}
              <span aria-hidden>→</span>
            </button>
            <p className={styles.status} role="status" data-status={status}>
              {status !== "idle" && status !== "sending" ? MESSAGES[status] : ""}
            </p>
          </div>
        </form>
      </div>

      <footer className={styles.footer}>
        <span className={styles.brand}>{SITE.brand}</span>
        <span>{SITE.disciplines.join(" · ")}</span>
        {links.length ? (
          <ul className={styles.links}>
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </section>
  );
}
