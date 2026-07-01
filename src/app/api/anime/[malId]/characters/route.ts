import { NextResponse } from "next/server";
import { getAnimeCharacters } from "@/lib/jikan";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ malId: string }> }
) {
  const { malId } = await params;
  const id = Number(malId);

  try {
    const data = await getAnimeCharacters(id);
    return NextResponse.json({ data });
  } catch (e) {
    console.warn(`[api/anime/${id}/characters] Jikan failed:`, (e as Error).message);
    return NextResponse.json({ data: [], error: (e as Error).message }, { status: 502 });
  }
}
