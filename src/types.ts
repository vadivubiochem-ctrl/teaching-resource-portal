export type UserRole = 'admin' | 'teacher';

export interface School {
  id: string; // Unique tenant identifier, e.g. "SCH_PANNAIPURAM"
  code: string; // School registration code, e.g. "STATE-405"
  name: string; // e.g. "Govt Hr Sec School Pannaipuram"
  address?: string;
  contact_email?: string;
  created_at: string;
  storage_quota_bytes: number; // Institutional storage limit (e.g. 200 GB)
  admin_id?: string;
}

export interface TeacherPermissions {
  can_upload: boolean;        // Upload documents, videos, audio, images
  can_delete: boolean;        // Delete files or move to trash
  can_share: boolean;         // Share resources with other teachers or generate links
  can_create_folder: boolean; // Create new folders and organize curriculum
  can_download: boolean;      // Download educational resources to local device
  can_rename: boolean;        // Rename files and folders
}

export const DEFAULT_TEACHER_PERMISSIONS: TeacherPermissions = {
  can_upload: true,
  can_delete: true,
  can_share: true,
  can_create_folder: true,
  can_download: true,
  can_rename: true,
};

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended';
  schoolId: string; // Multi-school tenant identifier
  school_name?: string;
  school_code?: string;
  avatar_url?: string;
  department?: string;
  storage_used: number; // in bytes
  storage_limit: number; // in bytes
  created_at: string;
  permissions?: TeacherPermissions;
  password?: string;
}

export type FileCategory = 'video' | 'audio' | 'document' | 'image' | 'other';

export interface TeachingFile {
  id: string;
  schoolId?: string; // Multi-school tenant isolation
  user_id: string;
  folder_id: string | null;
  file_name: string;
  file_type: FileCategory;
  file_extension: string;
  file_size: number; // in bytes
  storage_path: string;
  device: string; // e.g. "Mobile (Android)", "Mobile (iPhone)", "Desktop (Windows)", "Desktop (Mac)"
  uploaded_at: string;
  updated_at: string;
  is_favorite: boolean;
  is_trashed: boolean;
  mime_type: string;
  shared_mode: 'private' | 'shared_users' | 'all_teachers' | 'admin_only';
  duration?: number; // for audio/video in seconds
  thumbnail_url?: string;
  owner_name?: string;
  owner_email?: string;
  server_file_id?: string;
  content_base64?: string;
}

export interface Folder {
  id: string;
  schoolId?: string; // Multi-school tenant isolation
  user_id: string;
  parent_folder_id: string | null;
  folder_name: string;
  created_at: string;
  color?: string;
  file_count?: number;
}

export interface SharingRecord {
  id: string;
  schoolId?: string;
  file_id: string;
  owner_id: string;
  shared_user_id: string;
  permission: 'view' | 'edit';
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalFiles: number;
  totalFolders: number;
  totalVideos: number;
  totalAudio: number;
  totalDocuments: number;
  totalImages: number;
  totalOther: number;
  totalStorageUsed: number;
  storageLimit: number;
  todayUploads: number;
  schoolId?: string;
  schoolName?: string;
  schoolCode?: string;
}

export interface AuditLog {
  id: string;
  schoolId?: string; // Multi-school tenant isolation
  user_id: string;
  username: string;
  action: string;
  target_type: 'file' | 'folder' | 'user' | 'auth' | 'school';
  target_name: string;
  device: string;
  ip: string;
  timestamp: string;
  details?: string;
}

export interface InstitutionalAnalytics {
  school: School;
  teacherCount: number;
  activeTeacherCount: number;
  totalFilesCount: number;
  totalFoldersCount: number;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  usagePercentage: number;
  categoryBreakdown: {
    videoBytes: number;
    videoCount: number;
    audioBytes: number;
    audioCount: number;
    documentBytes: number;
    documentCount: number;
    imageBytes: number;
    imageCount: number;
    otherBytes: number;
    otherCount: number;
  };
  departmentBreakdown: Array<{
    department: string;
    teacherCount: number;
    storageUsedBytes: number;
    filesCount: number;
  }>;
  topTeachers: Array<{
    user: User;
    filesCount: number;
    storageUsedBytes: number;
  }>;
}

export interface UploadProgressItem {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedBytes: number;
  percentage: number;
  speed: string; // e.g., "14.2 MB/s"
  remainingTime: string; // e.g., "3s remaining"
  status: 'uploading' | 'completed' | 'failed' | 'paused';
  errorMessage?: string;
}
