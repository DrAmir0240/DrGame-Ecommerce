/**
 * Centralized API client with automated auth token headers and unified error handling.
 * Uses secure in-memory and cookie-based authentication (NO localStorage credentials).
 */

import { getAccessToken, getAdminToken, clearAdminTokens } from './authTokens';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://62.60.191.67:8000/api';

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
  const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  // Determine if this is an administrative request
  const isAdminEndpoint =
    endpoint.startsWith('/admin') ||
    endpoint.startsWith('admin') ||
    endpoint.includes('/admin/') ||
    endpoint.startsWith('/home/admin') ||
    endpoint.startsWith('home/admin');

  // Read access token securely without touching localStorage
  let token: string | null = null;
  if (typeof window !== 'undefined') {
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

  const response = await fetch(url, {
    ...options,
    headers: requestHeaders,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // If admin token is invalid/expired/forbidden on admin pages, cleanly clear and redirect to /admin/login
    if (typeof window !== 'undefined' && (response.status === 401 || response.status === 403)) {
      const isAdminPage = window.location.pathname.startsWith('/admin');
      if ((isAdminEndpoint || isAdminPage) && window.location.pathname !== '/admin/login') {
        clearAdminTokens();
        window.location.href = '/admin/login';
      }
    }

    const errorMsg = data.message || data.detail || 'خطایی در ارتباط با سرور رخ داد.';
    throw new ApiError(response.status, errorMsg, data);
  }

  return data as T;
}
