"use client";

import { useCallback, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { MAX_FILE_SIZE, formatBytes } from "@/lib/utils";

type UploadTask = {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
};

export function UploadArea({
  categoryId,
  onUploaded,
}: {
  categoryId: number;
  onUploaded: () => void;
}) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);

      for (const file of incoming) {
        const id = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;

        if (file.size > MAX_FILE_SIZE) {
          setTasks((t) => [
            ...t,
            {
              id,
              fileName: file.name,
              fileSize: file.size,
              progress: 0,
              status: "error",
              error: "File exceeds the 10 MB limit.",
            },
          ]);
          continue;
        }

        setTasks((t) => [
          ...t,
          { id, fileName: file.name, fileSize: file.size, progress: 0, status: "uploading" },
        ]);

        try {
          const blob = await upload(file.name, file, {
            access: "private",
            handleUploadUrl: "/api/files/upload-url",
            onUploadProgress: ({ percentage }) => {
              setTasks((t) =>
                t.map((task) => (task.id === id ? { ...task, progress: percentage } : task))
              );
            },
          });

          const res = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              categoryId,
              name: file.name,
              blobUrl: blob.url,
              size: file.size,
              mimeType: file.type || "application/octet-stream",
            }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Failed to save file.");
          }

          setTasks((t) =>
            t.map((task) => (task.id === id ? { ...task, status: "done", progress: 100 } : task))
          );
          onUploaded();
        } catch (err) {
          setTasks((t) =>
            t.map((task) =>
              task.id === id
                ? {
                    ...task,
                    status: "error",
                    error: err instanceof Error ? err.message : "Upload failed.",
                  }
                : task
            )
          );
        }
      }
    },
    [categoryId, onUploaded]
  );

  function dismissTask(id: string) {
    setTasks((t) => t.filter((task) => task.id !== id));
  }

  return (
    <div className="mb-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          dragActive ? "border-brand-500 bg-brand-50" : "border-gray-300 bg-white"
        }`}
      >
        <p className="text-sm text-gray-600">Drag and drop files here, or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          Choose files
        </button>
        <p className="text-xs text-gray-400">Max 10 MB per file. Documents, PDFs, images, spreadsheets.</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {tasks.length > 0 && (
        <div className="mt-3 space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-gray-800">{task.fileName}</span>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{formatBytes(task.fileSize)}</span>
                  {(task.status === "done" || task.status === "error") && (
                    <button onClick={() => dismissTask(task.id)} className="text-gray-400 hover:text-gray-600">
                      ✕
                    </button>
                  )}
                </div>
              </div>
              {task.status === "uploading" && (
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-brand-500 transition-all"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              )}
              {task.status === "done" && <p className="mt-1 text-xs text-green-600">Uploaded</p>}
              {task.status === "error" && <p className="mt-1 text-xs text-red-600">{task.error}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
