"use client";

import Link from "next/link";
import { useState } from "react";
import type { Category } from "@/lib/types";

export function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const color = category.color ?? "#3b5bdb";

  return (
    <div className="group relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      {category.unreadCount > 0 && (
        <span className="absolute -right-2 -top-2 inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white shadow">
          {category.unreadCount}
        </span>
      )}

      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="absolute right-2 top-2 rounded-md px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        aria-label="Category options"
      >
        ⋯
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-2 top-9 z-20 w-32 rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg">
            <button
              onClick={() => {
                setMenuOpen(false);
                onEdit();
              }}
              className="block w-full px-3 py-1.5 text-left text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="block w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </>
      )}

      <Link href={`/category/${category.id}`} className="block">
        <div
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
          style={{ backgroundColor: `${color}1a` }}
        >
          {category.emoji || "📁"}
        </div>
        <h3 className="truncate pr-6 font-medium text-gray-900">{category.name}</h3>
        <p className="mt-0.5 text-sm text-gray-500">
          {category.fileCount} {category.fileCount === 1 ? "file" : "files"}
        </p>
      </Link>
    </div>
  );
}
