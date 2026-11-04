/**
 * Helper to resolve media URLs (custom S3 storage domain or external URLs).
 * Maps games assets to the fast, custom storage CDN (https://storage.gamedr.ir).
 */
export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  const storageBase = (process.env.NEXT_PUBLIC_STORAGE_URL || 'https://storage.gamedr.ir').replace(/\/+$/, '');

  // 1. If already on custom storage domain, return as-is
  if (url.startsWith('https://storage.gamedr.ir') || url.startsWith('http://storage.gamedr.ir')) {
    return url;
  }

  // 2. If it's a relative path like /media/games/... or games/...
  if (url.startsWith('/media/games/')) {
    const cleanPath = url.replace(/^\/media\//, '');
    return `${storageBase}/${cleanPath}`;
  }
  if (url.startsWith('games/')) {
    return `${storageBase}/${url}`;
  }

  // 3. Rewrite old Liara S3 default URLs to custom domain
  if (url.includes('.storage.c2.liara.site/')) {
    const s3Path = url.split('.storage.c2.liara.site/')[1];
    return `${storageBase}/${s3Path}`;
  }
  if (url.includes('storage.c2.liara.site/')) {
    const parts = url.split('storage.c2.liara.site/')[1] || '';
    const s3Path = parts.replace(/^[^/]+\//, ''); // remove bucket name if present
    return `${storageBase}/${s3Path}`;
  }

  // 4. Any other /media/ relative path
  if (url.startsWith('/media/')) {
    const cleanPath = url.replace(/^\/media\//, '');
    return `${storageBase}/${cleanPath}`;
  }

  return url;
}
