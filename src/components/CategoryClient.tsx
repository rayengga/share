"use client";

import { useCallback, useEffect, useState } from "react";
import type { FileItem } from "@/lib/types";
import { UploadArea } from "./UploadArea";
import { FileRow } from "./FileRow";
import { ConfirmDialog } from "./ConfirmDialog";
import { useUnread } from "./UnreadProvider";

const POLL_INTERVAL_MS = 10_000;

export function CategoryClient({
  categoryId,
  initialFiles,
  currentUserId,
}: {
  categoryId: number;
  initialFiles: FileItem[];
  currentUserId: number;
}) {
  const { refresh: refreshUnread } = useUnread();
  const [files, setFiles] = useState(initialFiles);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<FileItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadFiles = useCallback(
    async (query: string) => {
      const url = `/api/categories/${categoryId}/files${query ? `?search=${encodeURIComponent(query)}` : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) setFiles(await res.json());
    },
    [categoryId]
  );

  useEffect(() => {
    const handle = setTimeout(() => loadFiles(search), 250);
    return () => clearTimeout(handle);
  }, [search, loadFiles]);

  useEffect(() => {
    const interval = setInterval(() => loadFiles(search), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [search, loadFiles]);

  async function handleMarkAllRead() {
    await fetch(`/api/categories/${categoryId}/mark-all-read`, { method: "POST" });
    await loadFiles(search);
    refreshUnread();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    await fetch(`/api/files/${deleting.id}`, { method: "DELETE" });
    setDeleteLoading(false);
    setDeleting(null);
    await loadFiles(search);
    refreshUnread();
  }

  const unreadCount = files.filter((f) => !f.isRead && f.uploadedBy !== currentUserId).length;

  return (
    <div>
      <UploadArea categoryId={categoryId} onUploaded={() => loadFiles(search)} />

      <div className="mb-3 flex items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files by name..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="shrink-0 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {files.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            {search ? "No files match your search." : "No files yet. Upload one above."}
          </p>
        ) : (
          files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              currentUserId={currentUserId}
              onOpen={() => {
                setFiles((fs) => fs.map((f) => (f.id === file.id ? { ...f, isRead: true } : f)));
                setTimeout(refreshUnread, 500);
              }}
              onDelete={() => setDeleting(file)}
            />
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        message="This will permanently delete the file for both of you. This can't be undone."
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
