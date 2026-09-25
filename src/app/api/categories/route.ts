import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { getCategoriesWithUnreadCounts } from "@/lib/data";
import { isUniqueViolation } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getCategoriesWithUnreadCounts(Number(session.user.id));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = (body?.name as string | undefined)?.trim();
  const emoji = (body?.emoji as string | undefined)?.trim() || null;
  const color = (body?.color as string | undefined)?.trim() || null;

  if (!name) {
    return NextResponse.json({ error: "Category name is required." }, { status: 400 });
  }
  if (name.length > 100) {
    return NextResponse.json({ error: "Category name is too long." }, { status: 400 });
  }

  try {
    const [created] = await db
      .insert(categories)
      .values({ name, emoji, color, createdBy: Number(session.user.id) })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "A category with this name already exists." },
        { status: 409 }
      );
    }
    throw error;
  }
}
