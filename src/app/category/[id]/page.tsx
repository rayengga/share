import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getCategoryById, getFilesForCategory } from "@/lib/data";
import { CategoryClient } from "@/components/CategoryClient";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) notFound();

  const session = await auth();
  const userId = Number(session!.user.id);

  const category = await getCategoryById(categoryId);
  if (!category) notFound();

  const initialFiles = await getFilesForCategory(categoryId, userId);

  return (
    <div>
      <Link href="/" className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
        ← All categories
      </Link>
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
          style={{ backgroundColor: `${category.color ?? "#3b5bdb"}1a` }}
        >
          {category.emoji || "📁"}
        </div>
        <h1 className="text-xl font-semibold text-gray-900">{category.name}</h1>
      </div>

      <CategoryClient categoryId={categoryId} initialFiles={initialFiles} currentUserId={userId} />
    </div>
  );
}
