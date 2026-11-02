/**
 * Helper to resolve media URLs (local /media/... or external URLs).
 * If the URL starts with /media/, it is prepended with the backend API domain.
 * Also proxies any raw Liara S3 .liara.site URLs through backend /media/ to bypass browser 404 blocking.
 */
export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://62.60.191.67:8000/api').replace(/\/api\/?$/, '');

  if (url.startsWith('/media')) {
    return `${apiBase}${url}`;
  }

  // Rewrite Liara S3 default URLs that return 404 on browser user-agents
  if (url.includes('.storage.c2.liara.site/')) {
    const s3Path = url.split('.storage.c2.liara.site/')[1];
    return `${apiBase}/media/${s3Path}`;
  }
  if (url.includes('storage.c2.liara.site/')) {
    const parts = url.split('storage.c2.liara.site/')[1] || '';
    const s3Path = parts.replace(/^[^/]+\//, ''); // remove bucket name if present
    return `${apiBase}/media/${s3Path}`;
  }

  return url;
}
