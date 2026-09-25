import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, files } from "@/db/schema";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) {
    return NextResponse.json({ error: "Invalid category id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const updates: Partial<{ name: string; emoji: string | null; color: string | null }> = {};

  if (typeof body?.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Category name cannot be empty." }, { status: 400 });
    updates.name = name;
  }
  if ("emoji" in (body ?? {})) {
    updates.emoji = (body.emoji as string | null)?.trim() || null;
  }
  if ("color" in (body ?? {})) {
    updates.color = (body.color as string | null)?.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const [updated] = await db
    .update(categories)
    .set(updates)
    .where(eq(categories.id, categoryId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) {
    return NextResponse.json({ error: "Invalid category id." }, { status: 400 });
  }

  const categoryFiles = await db
    .select({ blobUrl: files.blobUrl })
    .from(files)
    .where(eq(files.categoryId, categoryId));

  await Promise.allSettled(categoryFiles.map((f) => del(f.blobUrl)));

  const [deleted] = await db.delete(categories).where(eq(categories.id, categoryId)).returning();

  if (!deleted) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
