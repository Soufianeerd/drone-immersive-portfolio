import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

/** Jeton d'envoi direct navigateur → Vercel Blob (gros fichiers vidéo compris). Admin uniquement. */
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        if (!(await currentUser())) throw new Error("unauthorized");
        return {
          allowedContentTypes: ["image/*", "video/*"],
          maximumSizeInBytes: 2 * 1024 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
