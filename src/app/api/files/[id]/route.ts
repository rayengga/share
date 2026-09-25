import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { auth } from "@/auth";
import { db } from "@/db";
import { files } from "@/db/schema";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const fileId = Number(id);
  if (!Number.isInteger(fileId)) {
    return NextResponse.json({ error: "Invalid file id." }, { status: 400 });
  }

  const [file] = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  await del(file.blobUrl).catch(() => {
    // If the blob is already gone, still remove the database row below.
  });
  await db.delete(files).where(eq(files.id, fileId));

  return NextResponse.json({ ok: true });
}
