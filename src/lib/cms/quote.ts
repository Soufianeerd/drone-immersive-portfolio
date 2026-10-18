import type { QuoteLine } from "@/db/schema";

export const quoteTotal = (lines: QuoteLine[]) => lines.reduce((t, l) => t + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);
export const euro = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
