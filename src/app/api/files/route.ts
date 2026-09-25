import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, files } from "@/db/schema";
import { ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE } from "@/lib/utils";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const categoryId = Number(body?.categoryId);
  const name = (body?.name as string | undefined)?.trim();
  const blobUrl = body?.blobUrl as string | undefined;
  const size = Number(body?.size);
  const mimeType = (body?.mimeType as string | undefined) || "application/octet-stream";

  if (!Number.isInteger(categoryId) || !name || !blobUrl || !Number.isFinite(size)) {
    return NextResponse.json({ error: "Missing or invalid file fields." }, { status: 400 });
  }
  if (size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds the 10 MB limit." }, { status: 400 });
  }
  if (!blobUrl.startsWith("https://")) {
    return NextResponse.json({ error: "Invalid file URL." }, { status: 400 });
  }
  if (!ALLOWED_CONTENT_TYPES.includes(mimeType)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId)).limit(1);
  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const [created] = await db
    .insert(files)
    .values({
      categoryId,
      name,
      blobUrl,
      size,
      mimeType,
      uploadedBy: Number(session.user.id),
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
