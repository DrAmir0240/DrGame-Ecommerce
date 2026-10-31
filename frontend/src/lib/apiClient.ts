/**
 * Centralized API client with automated auth token headers and unified error handling.
 * Uses secure in-memory and cookie-based authentication (NO localStorage credentials for customers).
 */

import { getAccessToken, getAdminToken, clearAdminTokens, getCookie } from './authTokens';
import { i18n } from '@/i18n';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://62.60.191.67:8000/api';

/** Active UI locale, sent to the API so dynamic content comes back localized. */
function activeLocale(): string {
  if (typeof window === 'undefined') return 'fa';
  return localStorage.getItem('drgame_lang') || getCookie('drgame_lang') || i18n.language || 'fa';
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  // Determine if this is an administrative request
  const isAdminEndpoint =
    cleanEndpoint.startsWith('/admin') ||
    cleanEndpoint.includes('/admin/') ||
    cleanEndpoint.startsWith('/home/admin');

  // Public authentication endpoints should never send an Authorization header
  const isPublicAuthEndpoint =
    cleanEndpoint === '/auth/login' ||
    cleanEndpoint === '/auth/register' ||
    cleanEndpoint === '/auth/otp/send' ||
    cleanEndpoint === '/auth/login/console' ||
    cleanEndpoint === '/admin/auth/login';

  // Read appropriate token securely without touching customer localStorage
  let token: string | null = null;
  if (!isPublicAuthEndpoint && typeof window !== 'undefined') {
    const isAdminPage = window.location.pathname.startsWith('/admin');

    if (isAdminEndpoint || isAdminPage) {
      token = getAdminToken();
    } else {
      token = getAccessToken();
    }
  }

  // Build headers safely supporting Headers object, FormData, and custom headers
  const requestHeaders = new Headers(options.headers);

  if (!requestHeaders.has('Content-Type') && !(options.body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (token && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  // Tell the API which locale to render dynamic content in (games, genres, blog, banners…)
  if (!requestHeaders.has('Accept-Language')) {
    requestHeaders.set('Accept-Language', activeLocale());
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: requestHeaders,
    });
  } catch (netErr: any) {
    throw new ApiError(0, netErr?.message || i18n.t('common.errors.network'));
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // If admin token is invalid/forbidden on admin pages, cleanly clear and redirect to /admin/login
    if (typeof window !== 'undefined' && (response.status === 401 || response.status === 403)) {
      const isAdminPage = window.location.pathname.startsWith('/admin');
      if ((isAdminEndpoint || isAdminPage) && window.location.pathname !== '/admin/login' && !isPublicAuthEndpoint) {
        clearAdminTokens();
        window.location.href = '/admin/login';
      }
    }

    // Safely extract human-readable error message from backend response
    let errorMsg = i18n.t('common.errors.generic');
    if (typeof data.detail === 'string') {
      errorMsg = data.detail;
    } else if (Array.isArray(data.detail) && data.detail.length > 0) {
      errorMsg = data.detail
        .map((item: any) => (item.msg ? `${item.msg} (${item.loc ? item.loc.join('.') : ''})` : JSON.stringify(item)))
        .join(' | ');
    } else if (typeof data.message === 'string') {
      errorMsg = data.message;
    }

    throw new ApiError(response.status, errorMsg, data);
  }

  return data as T;
}
