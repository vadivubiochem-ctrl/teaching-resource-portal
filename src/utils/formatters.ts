export function formatBytes(bytes?: number | null, decimals: number = 1): string {
  if (bytes === undefined || bytes === null || isNaN(Number(bytes)) || Number(bytes) <= 0) return '0 B';
  const numBytes = Number(bytes);
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  const safeIndex = Math.max(0, Math.min(i, sizes.length - 1));
  return parseFloat((numBytes / Math.pow(k, safeIndex)).toFixed(dm)) + ' ' + sizes[safeIndex];
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
