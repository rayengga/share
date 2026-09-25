export type Category = {
  id: number;
  name: string;
  emoji: string | null;
  color: string | null;
  createdAt: string | Date;
  fileCount: number;
  unreadCount: number;
};

export type FileItem = {
  id: number;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: string | Date;
  uploadedBy: number;
  uploaderName: string;
  isRead: boolean;
};
