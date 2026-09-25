"use client";

import { useState } from "react";

const COLOR_PRESETS = [
  "#3b5bdb",
  "#e8590c",
  "#2f9e44",
  "#ae3ec9",
  "#e03131",
  "#0c8599",
  "#f08c00",
  "#495057",
];

export type CategoryFormValue = {
  name: string;
  emoji: string;
  color: string;
};

export function CategoryModal({
  open,
  title,
  initial,
  submitLabel = "Save",
  loading = false,
  error,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  title: string;
  initial?: Partial<CategoryFormValue>;
  submitLabel?: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (value: CategoryFormValue) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "📁");
  const [color, setColor] = useState(initial?.color ?? COLOR_PRESETS[0]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), emoji, color });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
        <h2 className="mb-4 text-base font-semibold text-gray-900">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="w-20">
              <label className="mb-1 block text-sm font-medium text-gray-700">Emoji</label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
                className="w-full rounded-md border border-gray-300 px-2 py-2 text-center text-lg outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="📁"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full ring-offset-2"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? `0 0 0 2px ${c}` : undefined,
                  }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {loading ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
