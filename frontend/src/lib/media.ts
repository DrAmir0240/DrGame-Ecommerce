/**
 * Helper to resolve media URLs (local /media/... or external URLs).
 * If the URL starts with /media/, it is prepended with the backend API domain.
 */
export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('/media')) {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://62.60.191.67:8000/api').replace(/\/api\/?$/, '');
    return `${apiBase}${url}`;
  }
  return url;
}
