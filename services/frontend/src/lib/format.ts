import { formatDistanceToNowStrict } from "date-fns";

export const relativeTime = (date: string | Date) =>
  Math.abs(Date.now() - new Date(date).getTime()) < 45_000
    ? "just now"
    : formatDistanceToNowStrict(new Date(date), { addSuffix: true });

export const absoluteTime = (date: string | Date) =>
  new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  });

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  if (minutes < 60) return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

export const percent = (value: number) => `${Math.round(value * 100)}%`;
