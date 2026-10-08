import { NextResponse } from "next/server";
import { openMeteo } from "@/lib/environment/providers";

/**
 * GET /api/environment?lat=..&lon=..
 * Coordonnées arrondies (≈ 1 km), jamais stockées. Réponse mise en cache 15 min.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "coordonnées invalides" }, { status: 400 });
  }
  try {
    const data = await openMeteo(Math.round(lat * 100) / 100, Math.round(lon * 100) / 100);
    return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=900, max-age=600" } });
  } catch {
    return NextResponse.json({ error: "météo indisponible" }, { status: 503 });
  }
}
