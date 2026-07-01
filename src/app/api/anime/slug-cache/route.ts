import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const malId = searchParams.get("malId");

  if (malId) {
    const num = Number(malId);
    if (isNaN(num)) {
      return NextResponse.json({ error: "Invalid malId" }, { status: 400 });
    }
    await db.animeSlugMapping.deleteMany({ where: { malId: num } });
    return NextResponse.json({ ok: true, deleted: malId });
  }

  await db.animeSlugMapping.deleteMany();
  return NextResponse.json({ ok: true, deleted: "all" });
}
