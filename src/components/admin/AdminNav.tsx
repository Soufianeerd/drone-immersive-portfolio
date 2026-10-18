"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

const GROUPS: { title: string; links: { href: string; label: string }[] }[] = [
  { title: "", links: [{ href: "/admin", label: "Accueil" }] },
  {
    title: "Mon site",
    links: [
      { href: "/admin/mise-en-page", label: "Mise en page" },
      { href: "/admin/collections", label: "Photos & vidéos" },
      { href: "/admin/categories", label: "Catégories" },
    ],
  },
  {
    title: "Mon activité",
    links: [
      { href: "/admin/messages", label: "Messages" },
      { href: "/admin/clients", label: "Clients" },
      { href: "/admin/devis", label: "Devis" },
    ],
  },
  { title: "Compte", links: [{ href: "/admin/reglages", label: "Réglages" }] },
];

export default function AdminNav({ unread }: { unread: number }) {
  const path = usePathname();
  return (
    <>
      {GROUPS.map((g) => (
        <div key={g.title || "home"} style={{ display: "contents" }}>
          {g.title ? <div className={styles.navGroup}>{g.title}</div> : null}
          {g.links.map((l) => {
            const on = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={styles.navLink} aria-current={on ? "page" : undefined}>
                {l.label}
                {l.href === "/admin/messages" && unread > 0 ? <span className={styles.badge}>{unread}</span> : null}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}
