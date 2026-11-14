/**
 * Centralized API client with automated auth token headers and unified error handling.
 * Uses secure in-memory and cookie-based authentication (NO localStorage credentials for customers).
 */

import {
  getAccessToken,
  getAdminToken,
  getDepartmentAdminToken,
  clearAdminTokens,
  clearDepartmentAdminToken,
  getCookie,
  DepartmentType,
} from './authTokens';
import { i18n } from '@/i18n';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.gamedr.ir/api';

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

  // Public authentication endpoints should never send an Authorization header
  const isPublicAuthEndpoint =
    cleanEndpoint === '/auth/login' ||
    cleanEndpoint === '/auth/login/otp' ||
    cleanEndpoint === '/auth/register' ||
    cleanEndpoint === '/auth/otp/send' ||
    cleanEndpoint === '/auth/login/console' ||
    cleanEndpoint === '/admin/auth/login' ||
    cleanEndpoint.endsWith('/auth/login');

  const isAdminEndpoint =
    cleanEndpoint.startsWith('/admin') ||
    cleanEndpoint.includes('/admin/') ||
    cleanEndpoint.startsWith('/home/admin');

  // Read appropriate token securely without touching customer localStorage
  let token: string | null = null;
  let matchedDept: DepartmentType | null = null;
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const departments: DepartmentType[] = ['content', 'finance', 'support', 'report', 'referral'];
    for (const d of departments) {
      if (cleanEndpoint.startsWith(`/admin-${d}`) || pathname.startsWith(`/admin/${d}`)) {
        matchedDept = d;
        break;
      }
    }

    if (!isPublicAuthEndpoint) {
      if (matchedDept) {
        token = getDepartmentAdminToken(matchedDept);
      } else {
        const isAdminPage = pathname.startsWith('/admin');
        if (isAdminEndpoint || isAdminPage) {
          token = getAdminToken();
        } else {
          token = getAccessToken();
        }
      }
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
      credentials: options.credentials || 'include',
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
    // Only 401 Unauthorized means missing/expired credentials -> clear token and redirect to proper login page.
    // Never clear tokens or redirect on 403 Forbidden (e.g., read_only staff blocked from a write action).
    if (typeof window !== 'undefined' && response.status === 401 && !isPublicAuthEndpoint) {
      const pathname = window.location.pathname;
      if (matchedDept) {
        const deptLoginPath = `/admin/${matchedDept}/login`;
        if (pathname !== deptLoginPath) {
          clearDepartmentAdminToken(matchedDept);
          window.location.href = deptLoginPath;
        }
      } else {
        const isAdminPage = pathname.startsWith('/admin');
        if ((isAdminEndpoint || isAdminPage) && pathname !== '/admin/login') {
          clearAdminTokens();
          window.location.href = '/admin/login';
        }
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
