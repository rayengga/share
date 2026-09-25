import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUnreadSummary } from "@/lib/data";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await getUnreadSummary(Number(session.user.id));
  return NextResponse.json(summary);
}
