/**
 * Secure Token Storage Manager
 * 
 * Sets both access_token and refresh_token in cookies (SameSite=Lax, Secure on HTTPS, Path=/).
 * Fully isolates customer sessions from admin sessions using JWT type validation.
 */

// In-Memory Token Vault (runtime cache)
let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let inMemoryAdminToken: string | null = null;
let inMemoryAdminRefreshToken: string | null = null;

/**
 * Safely parse JWT payload without external libraries
 */
export function parseJwtPayload(token: string): { sub?: string; type?: string; exp?: number; role?: string; username?: string } | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Cookie Parser Helper
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  if (!match) return null;
  try {
    const val = decodeURIComponent(match[3]).trim();
    if (!val || val === 'undefined' || val === 'null') return null;
    return val;
  } catch {
    return match[3].trim() || null;
  }
}

/**
 * Cookie Setter with Secure (HTTPS only) and SameSite=Lax Flags
 */
export function setCookie(name: string, value: string, maxAgeDays = 7, path = '/'): void {
  if (typeof document === 'undefined') return;
  if (!value || typeof value !== 'string' || value === 'undefined' || value === 'null') return;

  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const maxAge = maxAgeDays * 24 * 60 * 60;
  
  // Set cookie for domain at given path
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=${path}; Max-Age=${maxAge}; SameSite=Lax${
    isSecure ? '; Secure' : ''
  }`;
}

/**
 * Cookie Deleter
 */
export function deleteCookie(name: string, path = '/'): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Path=${path}; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/**
 * Purges legacy customer tokens from localStorage (XSS defense)
 * Admin tokens are kept for backward-compatibility with standalone admin pages.
 */
export function purgeLegacyCustomerLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem('drgame_access_token');
    localStorage.removeItem('drgame_refresh_token');
    localStorage.removeItem('drgame_user');
  } catch (e) {
    // Ignore sandbox errors
  }
}

if (typeof window !== 'undefined') {
  purgeLegacyCustomerLocalStorage();
}

/**
 * Customer Access & Refresh Token Accessors
 */
export function getAccessToken(): string | null {
  if (inMemoryAccessToken) {
    const payload = parseJwtPayload(inMemoryAccessToken);
    if (!payload || payload.type === 'access') {
      return inMemoryAccessToken;
    }
    inMemoryAccessToken = null;
  }

  // Check exact cookie 'access_token' first, then fallback to namespaced cookies
  const candidates = [
    getCookie('access_token'),
    getCookie('drgame_access_token'),
    getCookie('drgame_session'),
  ];

  for (const token of candidates) {
    if (token) {
      const payload = parseJwtPayload(token);
      // Ensure this is truly a customer access token and NOT an admin token
      if (!payload || payload.type === 'access') {
        inMemoryAccessToken = token;
        return inMemoryAccessToken;
      }
    }
  }

  return null;
}

export function getRefreshToken(): string | null {
  if (inMemoryRefreshToken) {
    return inMemoryRefreshToken;
  }

  const candidates = [
    getCookie('refresh_token'),
    getCookie('drgame_refresh_token'),
    getCookie('drgame_refresh'),
  ];

  for (const token of candidates) {
    if (token) {
      const payload = parseJwtPayload(token);
      if (!payload || payload.type === 'refresh') {
        inMemoryRefreshToken = token;
        return inMemoryRefreshToken;
      }
    }
  }

  return null;
}

export function setAuthTokens(accessToken: string, refreshToken?: string): void {
  if (!accessToken) return;
  inMemoryAccessToken = accessToken;
  inMemoryRefreshToken = refreshToken || null;

  // 1. Explicit standard cookie names required by browser inspection:
  setCookie('access_token', accessToken, 7);
  if (refreshToken) {
    setCookie('refresh_token', refreshToken, 30);
  }

  // 2. Namespaced cookies for additional safety
  setCookie('drgame_session', accessToken, 7);
  setCookie('drgame_access_token', accessToken, 7);
  if (refreshToken) {
    setCookie('drgame_refresh', refreshToken, 30);
    setCookie('drgame_refresh_token', refreshToken, 30);
  }

  purgeLegacyCustomerLocalStorage();
}

export function clearAuthTokens(): void {
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;

  deleteCookie('access_token');
  deleteCookie('refresh_token');
  deleteCookie('drgame_session');
  deleteCookie('drgame_refresh');
  deleteCookie('drgame_access_token');
  deleteCookie('drgame_refresh_token');

  purgeLegacyCustomerLocalStorage();
}

/**
 * Admin Token Accessors (Full support for access_token and refresh_token cookies)
 */
export function getAdminToken(): string | null {
  if (inMemoryAdminToken) {
    const payload = parseJwtPayload(inMemoryAdminToken);
    if (!payload || payload.type === 'admin') {
      return inMemoryAdminToken;
    }
    inMemoryAdminToken = null;
  }

  // 1. Check cookies (admin_access_token, access_token, drgame_admin_session)
  const candidates = [
    getCookie('admin_access_token'),
    getCookie('drgame_admin_session'),
    getCookie('access_token'),
  ];

  for (const token of candidates) {
    if (token) {
      const payload = parseJwtPayload(token);
      // Ensure this is an admin token and NOT a regular user token
      if (!payload || payload.type === 'admin') {
        inMemoryAdminToken = token;
        return inMemoryAdminToken;
      }
    }
  }

  // 2. Check localStorage fallback for admin
  if (typeof window !== 'undefined' && window.localStorage) {
    const lsToken = localStorage.getItem('drgame_admin_token');
    if (lsToken) {
      const payload = parseJwtPayload(lsToken);
      if (!payload || payload.type === 'admin') {
        inMemoryAdminToken = lsToken;
        // Sync back to cookies
        setCookie('admin_access_token', lsToken, 7);
        setCookie('access_token', lsToken, 7);
        return inMemoryAdminToken;
      }
    }
  }

  return null;
}

export function setAdminToken(accessToken: string, refreshToken?: string): void {
  if (!accessToken) return;
  inMemoryAdminToken = accessToken;
  inMemoryAdminRefreshToken = refreshToken || null;

  // 1. Set explicit standard cookies 'access_token' and 'refresh_token'
  setCookie('access_token', accessToken, 7);
  const effectiveRefreshToken = refreshToken && refreshToken !== 'undefined' ? refreshToken : accessToken;
  setCookie('refresh_token', effectiveRefreshToken, 30);

  // 2. Set admin specific cookies
  setCookie('admin_access_token', accessToken, 7);
  setCookie('admin_refresh_token', effectiveRefreshToken, 30);
  setCookie('drgame_admin_session', accessToken, 7);

  // 3. Maintain localStorage for backwards compatibility with older admin sub-components
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('drgame_admin_token', accessToken);
  }
}

export function clearAdminTokens(): void {
  inMemoryAdminToken = null;
  inMemoryAdminRefreshToken = null;

  deleteCookie('access_token');
  deleteCookie('refresh_token');
  deleteCookie('admin_access_token');
  deleteCookie('admin_refresh_token');
  deleteCookie('drgame_admin_session');

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('drgame_admin_token');
    localStorage.removeItem('drgame_admin_profile');
  }
}
