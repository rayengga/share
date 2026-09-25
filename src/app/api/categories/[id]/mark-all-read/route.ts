import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { files, fileReads } from "@/db/schema";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = Number(session.user.id);

  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) {
    return NextResponse.json({ error: "Invalid category id." }, { status: 400 });
  }

  const unreadFiles = await db
    .select({ id: files.id })
    .from(files)
    .where(and(eq(files.categoryId, categoryId), ne(files.uploadedBy, userId)));

  if (unreadFiles.length > 0) {
    await db
      .insert(fileReads)
      .values(unreadFiles.map((f) => ({ userId, fileId: f.id })))
      .onConflictDoNothing();
  }

  return NextResponse.json({ ok: true });
}
