"use client";

import type { FileItem } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";

function iconFor(mimeType: string) {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📕";
  if (mimeType.includes("spreadsheet") || mimeType === "text/csv" || mimeType.includes("excel")) return "📊";
  if (mimeType.includes("word") || mimeType === "text/plain" || mimeType.includes("opendocument.text")) return "📄";
  if (mimeType.includes("presentation")) return "📽️";
  return "📎";
}

export function FileRow({
  file,
  currentUserId,
  onOpen,
  onDelete,
}: {
  file: FileItem;
  currentUserId: number;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const isUnread = !file.isRead && file.uploadedBy !== currentUserId;

  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50">
      <span className="text-xl">{iconFor(file.mimeType)}</span>

      <a
        href={`/api/files/${file.id}/download`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onOpen}
        className="min-w-0 flex-1"
      >
        <div className="flex items-center gap-1.5">
          {isUnread && (
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label="Unread" />
          )}
          <span className="truncate font-medium text-gray-900">{file.name}</span>
        </div>
        <div className="mt-0.5 truncate text-xs text-gray-500">
          {formatBytes(file.size)} · {file.uploaderName} · {formatDate(file.uploadedAt)}
        </div>
      </a>

      <button
        onClick={onDelete}
        className="shrink-0 rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600"
        aria-label="Delete file"
      >
        Delete
      </button>
    </div>
  );
}
