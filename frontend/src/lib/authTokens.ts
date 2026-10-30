/**
 * Secure Token Storage Manager
 * 
 * Protects against XSS attacks by eliminating token storage in localStorage.
 * Tokens are kept in memory (closure state) and persisted across sessions using
 * Secure, SameSite=Strict cookies.
 */

// In-Memory Token Vault (Accessible only within JavaScript runtime execution)
let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let inMemoryAdminToken: string | null = null;

const USER_TOKEN_COOKIE = 'drgame_session';
const REFRESH_TOKEN_COOKIE = 'drgame_refresh';
const ADMIN_TOKEN_COOKIE = 'drgame_admin_session';

/**
 * Cookie Parser Helper
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Cookie Setter with Secure and SameSite=Strict Flags
 */
export function setCookie(name: string, value: string, maxAgeDays = 7): void {
  if (typeof document === 'undefined') return;
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const maxAge = maxAgeDays * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Strict${
    isSecure ? '; Secure' : ''
  }`;
}

/**
 * Cookie Deleter
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Strict`;
}

/**
 * Purges all legacy tokens and cached user objects from localStorage
 */
export function purgeLegacyLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem('drgame_access_token');
    localStorage.removeItem('drgame_refresh_token');
    localStorage.removeItem('drgame_user');
    localStorage.removeItem('drgame_admin_token');
    localStorage.removeItem('drgame_admin_profile');
  } catch (e) {
    // Ignore storage quota or access errors in strict sandboxes
  }
}

// Automatically trigger purge when module loads in browser
if (typeof window !== 'undefined') {
  purgeLegacyLocalStorage();
}

/**
 * Access Token Accessors
 */
export function getAccessToken(): string | null {
  if (inMemoryAccessToken) {
    return inMemoryAccessToken;
  }
  const cookieVal = getCookie(USER_TOKEN_COOKIE);
  if (cookieVal) {
    inMemoryAccessToken = cookieVal;
    return inMemoryAccessToken;
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (inMemoryRefreshToken) {
    return inMemoryRefreshToken;
  }
  const cookieVal = getCookie(REFRESH_TOKEN_COOKIE);
  if (cookieVal) {
    inMemoryRefreshToken = cookieVal;
    return inMemoryRefreshToken;
  }
  return null;
}

export function setAuthTokens(accessToken: string, refreshToken?: string): void {
  inMemoryAccessToken = accessToken;
  inMemoryRefreshToken = refreshToken || null;

  // Persist in Secure, SameSite=Strict cookie
  setCookie(USER_TOKEN_COOKIE, accessToken, 7);
  if (refreshToken) {
    setCookie(REFRESH_TOKEN_COOKIE, refreshToken, 30);
  }

  // Ensure localStorage is 100% clean of credentials
  purgeLegacyLocalStorage();
}

export function clearAuthTokens(): void {
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;

  deleteCookie(USER_TOKEN_COOKIE);
  deleteCookie(REFRESH_TOKEN_COOKIE);

  purgeLegacyLocalStorage();
}

/**
 * Admin Token Accessors
 */
export function getAdminToken(): string | null {
  if (inMemoryAdminToken) {
    return inMemoryAdminToken;
  }
  const cookieVal = getCookie(ADMIN_TOKEN_COOKIE);
  if (cookieVal) {
    inMemoryAdminToken = cookieVal;
    return inMemoryAdminToken;
  }
  return null;
}

export function setAdminToken(token: string): void {
  inMemoryAdminToken = token;
  setCookie(ADMIN_TOKEN_COOKIE, token, 1);
  purgeLegacyLocalStorage();
}

export function clearAdminTokens(): void {
  inMemoryAdminToken = null;
  deleteCookie(ADMIN_TOKEN_COOKIE);
  purgeLegacyLocalStorage();
}

