import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getAllowedEmails } from "@/lib/utils";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = (body?.email as string | undefined)?.trim().toLowerCase();
  const name = (body?.name as string | undefined)?.trim();
  const password = body?.password as string | undefined;

  if (!email || !name || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const allowedEmails = getAllowedEmails();
  if (allowedEmails.length === 0) {
    return NextResponse.json(
      { error: "Sign-up is not configured. Set ALLOWED_EMAILS on the server." },
      { status: 500 }
    );
  }

  if (!allowedEmails.includes(email)) {
    return NextResponse.json(
      { error: "This email is not allowed to sign up." },
      { status: 403 }
    );
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please log in instead." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ email, name, passwordHash });

  return NextResponse.json({ ok: true });
}
