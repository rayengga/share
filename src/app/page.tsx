import { auth } from "@/auth";
import { getCategoriesWithUnreadCounts } from "@/lib/data";
import { CategoryGrid } from "@/components/CategoryGrid";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const categories = await getCategoriesWithUnreadCounts(Number(session!.user.id));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Categories</h1>
      </div>
      <CategoryGrid initialCategories={categories} />
    </div>
  );
}
