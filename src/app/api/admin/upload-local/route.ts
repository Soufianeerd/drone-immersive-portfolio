import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { slugify } from "@/lib/cms/slug";

/**
 * Développement uniquement (pas de BLOB_READ_WRITE_TOKEN) : enregistre le fichier dans public/uploads.
 * En production, les fichiers passent par Vercel Blob (route /api/admin/upload).
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" || process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }
  if (!(await currentUser())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
  if (!/^(image|video)\//.test(file.type)) return NextResponse.json({ error: "type" }, { status: 415 });
  const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "");
  const name = `${slugify(path.basename(file.name, ext))}-${Date.now().toString(36)}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` });
}
