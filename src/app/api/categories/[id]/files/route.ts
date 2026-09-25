import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFilesForCategory } from "@/lib/data";

export async function GET(
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

  const search = new URL(request.url).searchParams.get("search") ?? undefined;
  const rows = await getFilesForCategory(categoryId, Number(session.user.id), search);

  return NextResponse.json(rows);
}
