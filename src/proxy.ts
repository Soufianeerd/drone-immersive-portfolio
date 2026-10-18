import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

/** Garde rapide de l'admin : sans session valide → page de connexion. (Chaque page revérifie côté serveur.) */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const id = await verifySession(req.cookies.get(SESSION_COOKIE)?.value).catch(() => null);
  if (id) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.redirect(new URL("/admin/login", req.url));
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
