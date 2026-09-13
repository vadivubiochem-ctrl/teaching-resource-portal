import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Video,
  Music,
  Image as ImageIcon,
  Archive,
  Code,
  File,
} from 'lucide-react';

export type FileCategory =
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'video'
  | 'audio'
  | 'image'
  | 'archive'
  | 'code'
  | 'other';

export interface FileFormatMeta {
  extension: string;
  category: FileCategory;
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeBg: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function getFileFormatMeta(
  fileNameOrExt: string,
  mimeType?: string,
  fallbackCategory?: string
): FileFormatMeta {
  let ext = '';
  if (fileNameOrExt.includes('.')) {
    ext = fileNameOrExt.split('.').pop()?.toLowerCase() || '';
  } else {
    ext = fileNameOrExt.toLowerCase();
  }

  // 1. PDF
  if (ext === 'pdf' || mimeType?.includes('pdf')) {
    return {
      extension: 'PDF',
      category: 'document',
      label: 'PDF Document',
      color: '#EF4444',
      bgClass: 'bg-red-500/10',
      borderClass: 'border-red-500/30',
      textClass: 'text-red-400',
      badgeBg: 'bg-red-600 text-white',
      icon: FileText,
    };
  }

  // 2. Word / Rich Text
  if (['doc', 'docx', 'rtf', 'odt'].includes(ext) || mimeType?.includes('word')) {
    return {
      extension: ext ? ext.toUpperCase() : 'DOCX',
      category: 'document',
      label: 'Word Document',
      color: '#2563EB',
      bgClass: 'bg-blue-500/10',
      borderClass: 'border-blue-500/30',
      textClass: 'text-blue-400',
      badgeBg: 'bg-blue-600 text-white',
      icon: FileText,
    };
  }

  // 3. Excel / Spreadsheet / CSV
  if (
    ['xls', 'xlsx', 'csv', 'tsv', 'ods'].includes(ext) ||
    mimeType?.includes('sheet') ||
    mimeType?.includes('excel') ||
    mimeType?.includes('csv')
  ) {
    return {
      extension: ext ? ext.toUpperCase() : 'XLSX',
      category: 'spreadsheet',
      label: ext === 'csv' ? 'CSV Dataset' : 'Excel Spreadsheet',
      color: '#10B981',
      bgClass: 'bg-emerald-500/10',
      borderClass: 'border-emerald-500/30',
      textClass: 'text-emerald-400',
      badgeBg: 'bg-emerald-600 text-white',
      icon: FileSpreadsheet,
    };
  }

  // 4. PowerPoint / Presentation
  if (['ppt', 'pptx', 'odp', 'key'].includes(ext) || mimeType?.includes('presentation')) {
    return {
      extension: ext ? ext.toUpperCase() : 'PPTX',
      category: 'presentation',
      label: 'Presentation Slides',
      color: '#EA580C',
      bgClass: 'bg-orange-500/10',
      borderClass: 'border-orange-500/30',
      textClass: 'text-orange-400',
      badgeBg: 'bg-orange-600 text-white',
      icon: Presentation,
    };
  }

  // 5. Video
  if (
    ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'm4v', '3gp'].includes(ext) ||
    mimeType?.startsWith('video/') ||
    fallbackCategory === 'video'
  ) {
    return {
      extension: ext ? ext.toUpperCase() : 'VIDEO',
      category: 'video',
      label: 'Video Recording',
      color: '#E11D48',
      bgClass: 'bg-rose-500/10',
      borderClass: 'border-rose-500/30',
      textClass: 'text-rose-400',
      badgeBg: 'bg-rose-600 text-white',
      icon: Video,
    };
  }

  // 6. Audio
  if (
    ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'wma'].includes(ext) ||
    mimeType?.startsWith('audio/') ||
    fallbackCategory === 'audio'
  ) {
    return {
      extension: ext ? ext.toUpperCase() : 'AUDIO',
      category: 'audio',
      label: 'Audio Lesson',
      color: '#8B5CF6',
      bgClass: 'bg-purple-500/10',
      borderClass: 'border-purple-500/30',
      textClass: 'text-purple-400',
      badgeBg: 'bg-purple-600 text-white',
      icon: Music,
    };
  }

  // 7. Image
  if (
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext) ||
    mimeType?.startsWith('image/') ||
    fallbackCategory === 'image'
  ) {
    return {
      extension: ext ? ext.toUpperCase() : 'IMG',
      category: 'image',
      label: 'Graphic / Photo',
      color: '#06B6D4',
      bgClass: 'bg-cyan-500/10',
      borderClass: 'border-cyan-500/30',
      textClass: 'text-cyan-400',
      badgeBg: 'bg-cyan-600 text-white',
      icon: ImageIcon,
    };
  }

  // 8. Archive / Compressed
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext) || mimeType?.includes('zip')) {
    return {
      extension: ext ? ext.toUpperCase() : 'ZIP',
      category: 'archive',
      label: 'Compressed Archive',
      color: '#F59E0B',
      bgClass: 'bg-amber-500/10',
      borderClass: 'border-amber-500/30',
      textClass: 'text-amber-400',
      badgeBg: 'bg-amber-600 text-white',
      icon: Archive,
    };
  }

  // 9. Code & Plain Text
  if (['txt', 'md', 'json', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py', 'sql'].includes(ext)) {
    return {
      extension: ext ? ext.toUpperCase() : 'CODE',
      category: 'code',
      label: 'Text / Code',
      color: '#6366F1',
      bgClass: 'bg-indigo-500/10',
      borderClass: 'border-indigo-500/30',
      textClass: 'text-indigo-400',
      badgeBg: 'bg-indigo-600 text-white',
      icon: Code,
    };
  }

  // Fallback
  return {
    extension: ext ? ext.toUpperCase().slice(0, 4) : 'FILE',
    category: 'other',
    label: 'Resource File',
    color: '#64748B',
    bgClass: 'bg-slate-500/10',
    borderClass: 'border-slate-500/30',
    textClass: 'text-slate-400',
    badgeBg: 'bg-slate-600 text-white',
    icon: File,
  };
}

interface DynamicFileIconProps {
  fileName?: string;
  extension?: string;
  mimeType?: string;
  fileType?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
}

export const DynamicFileIcon: React.FC<DynamicFileIconProps> = ({
  fileName = '',
  extension = '',
  mimeType,
  fileType,
  size = 'md',
  showBadge = true,
  className = '',
}) => {
  const meta = getFileFormatMeta(extension || fileName, mimeType, fileType);
  const IconComponent = meta.icon;

  const sizeConfigs = {
    sm: {
      container: 'w-7 h-7 rounded-lg',
      icon: 'w-4 h-4',
      badge: 'text-[9px] px-1 py-0.2',
    },
    md: {
      container: 'w-10 h-10 rounded-xl',
      icon: 'w-5 h-5',
      badge: 'text-[9px] px-1.5 py-0.5',
    },
    lg: {
      container: 'w-14 h-14 rounded-2xl',
      icon: 'w-7 h-7',
      badge: 'text-[10px] px-2 py-0.5',
    },
    xl: {
      container: 'w-20 h-20 rounded-2xl',
      icon: 'w-10 h-10',
      badge: 'text-xs px-2.5 py-1',
    },
  };

  const cfg = sizeConfigs[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 border ${cfg.container} ${meta.bgClass} ${meta.borderClass} ${meta.textClass} ${className} transition-transform group-hover:scale-105`}
      title={meta.label}
    >
      <IconComponent className={cfg.icon} />
      {showBadge && (
        <span
          className={`absolute -bottom-1 -right-1 font-mono font-bold tracking-tight rounded-md shadow-xs ${cfg.badge} ${meta.badgeBg}`}
        >
          {meta.extension}
        </span>
      )}
    </div>
  );
};
