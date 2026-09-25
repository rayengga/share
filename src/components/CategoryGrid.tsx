"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/types";
import { CategoryCard } from "./CategoryCard";
import { CategoryModal, type CategoryFormValue } from "./CategoryModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { useUnread } from "./UnreadProvider";

export function CategoryGrid({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const { refresh } = useUnread();

  const [categories, setCategories] = useState(initialCategories);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reloadCategories() {
    const res = await fetch("/api/categories", { cache: "no-store" });
    if (res.ok) setCategories(await res.json());
    refresh();
    router.refresh();
  }

  async function handleCreate(value: CategoryFormValue) {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to create category.");
      return;
    }
    setCreateOpen(false);
    await reloadCategories();
  }

  async function handleEdit(value: CategoryFormValue) {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/categories/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to update category.");
      return;
    }
    setEditing(null);
    await reloadCategories();
  }

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    const res = await fetch(`/api/categories/${deleting.id}`, { method: "DELETE" });
    setSaving(false);
    if (res.ok) {
      setDeleting(null);
      await reloadCategories();
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onEdit={() => {
              setEditing(category);
              setError(null);
            }}
            onDelete={() => setDeleting(category)}
          />
        ))}

        <button
          onClick={() => {
            setCreateOpen(true);
            setError(null);
          }}
          className="flex h-full min-h-[128px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-brand-400 hover:text-brand-600"
        >
          <span className="text-2xl">+</span>
          <span className="text-sm font-medium">New category</span>
        </button>
      </div>

      {createOpen && (
        <CategoryModal
          key="create"
          open={createOpen}
          title="New category"
          submitLabel="Create"
          loading={saving}
          error={error}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      )}

      {editing && (
        <CategoryModal
          key={editing.id}
          open={!!editing}
          title="Edit category"
          submitLabel="Save"
          loading={saving}
          error={error}
          initial={{ name: editing.name, emoji: editing.emoji ?? "", color: editing.color ?? "" }}
          onSubmit={handleEdit}
          onCancel={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        message={
          deleting && deleting.fileCount > 0
            ? `This category contains ${deleting.fileCount} file${deleting.fileCount === 1 ? "" : "s"}. Deleting it will permanently delete all of those files too. This can't be undone.`
            : "This category has no files. This can't be undone."
        }
        confirmLabel="Delete"
        danger
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
