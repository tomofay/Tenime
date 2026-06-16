import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validation";
import { withRateLimit } from "@/lib/api-utils";

const REGISTER_LIMIT = { windowMs: 60_000, maxRequests: 5 };

export async function POST(request: Request) {
  const rateLimit = withRateLimit(request, REGISTER_LIMIT);
  if (rateLimit) return rateLimit;
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { username, email, password } = parsed.data;

    const existingUser = await db.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email or username already taken" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: { username, email, passwordHash },
    });

    return NextResponse.json(
      { id: user.id, username: user.username, email: user.email },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
