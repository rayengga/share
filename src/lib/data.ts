import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, files, fileReads, users } from "@/db/schema";

export async function getCategoryById(categoryId: number) {
  const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
  return category ?? null;
}

export async function ensureDefaultCategory() {
  const existing = await db.select({ id: categories.id }).from(categories).limit(1);
  if (existing.length === 0) {
    // The unique constraint on categories.name + onConflictDoNothing makes this
    // safe even if multiple requests race here concurrently (e.g. the layout
    // and the page both check "is the table empty?" at the same time).
    await db.insert(categories).values({ name: "General", emoji: "📁" }).onConflictDoNothing();
  }
}

export async function getCategoriesWithUnreadCounts(userId: number) {
  await ensureDefaultCategory();

  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      emoji: categories.emoji,
      color: categories.color,
      createdAt: categories.createdAt,
      fileCount: sql<number>`count(distinct ${files.id})`.mapWith(Number),
      unreadCount: sql<number>`count(distinct case when ${files.uploadedBy} != ${userId} and ${fileReads.userId} is null then ${files.id} end)`.mapWith(
        Number
      ),
    })
    .from(categories)
    .leftJoin(files, eq(files.categoryId, categories.id))
    .leftJoin(
      fileReads,
      and(eq(fileReads.fileId, files.id), eq(fileReads.userId, userId))
    )
    .groupBy(categories.id)
    .orderBy(asc(categories.createdAt));

  return rows;
}

export async function getUnreadSummary(userId: number) {
  const rows = await getCategoriesWithUnreadCounts(userId);
  const byCategory: Record<number, number> = {};
  let total = 0;
  for (const row of rows) {
    byCategory[row.id] = row.unreadCount;
    total += row.unreadCount;
  }
  return { total, byCategory };
}

export async function getFilesForCategory(categoryId: number, userId: number, search?: string) {
  const conditions = [eq(files.categoryId, categoryId)];
  if (search && search.trim()) {
    conditions.push(ilike(files.name, `%${search.trim()}%`));
  }

  const rows = await db
    .select({
      id: files.id,
      name: files.name,
      size: files.size,
      mimeType: files.mimeType,
      uploadedAt: files.uploadedAt,
      uploadedBy: files.uploadedBy,
      uploaderName: users.name,
      isRead: sql<boolean>`(${files.uploadedBy} = ${userId} or ${fileReads.userId} is not null)`.mapWith(
        Boolean
      ),
    })
    .from(files)
    .innerJoin(users, eq(users.id, files.uploadedBy))
    .leftJoin(
      fileReads,
      and(eq(fileReads.fileId, files.id), eq(fileReads.userId, userId))
    )
    .where(and(...conditions))
    .orderBy(desc(files.uploadedAt));

  return rows;
}
