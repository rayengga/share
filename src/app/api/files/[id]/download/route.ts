import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { files, fileReads } from "@/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = Number(session.user.id);

  const { id } = await params;
  const fileId = Number(id);
  if (!Number.isInteger(fileId)) {
    return NextResponse.json({ error: "Invalid file id." }, { status: 400 });
  }

  const [file] = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  await db.insert(fileReads).values({ userId, fileId }).onConflictDoNothing();

  const blobResponse = await fetch(file.blobUrl);
  if (!blobResponse.ok || !blobResponse.body) {
    return NextResponse.json({ error: "Could not retrieve the file." }, { status: 502 });
  }

  const safeName = file.name.replace(/"/g, "'");
  const encodedName = encodeURIComponent(file.name);

  return new NextResponse(blobResponse.body, {
    status: 200,
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${safeName}"; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, no-store",
    },
  });
}
