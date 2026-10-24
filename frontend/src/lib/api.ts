/**
 * DrGame API Client
 * Centralized HTTP client for backend communication with JWT handling
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("drgame_token") || sessionStorage.getItem("drgame_token");
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path.startsWith("http") ? path : `${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async request<T = any>(path: string, options: RequestOptions = {}): Promise<{ data: T; status: number }> {
    const { params, headers = {}, ...rest } = options;
    const url = this.buildUrl(path, params);

    const token = this.getAuthToken();
    const finalHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(headers as Record<string, string>),
    };

    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...rest,
      headers: finalHeaders,
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const error: any = new Error(data?.message || `HTTP ${response.status}: Request failed`);
      error.response = { data, status: response.status };
      throw error;
    }

    return { data, status: response.status };
  }

  async get<T = any>(path: string, options?: RequestOptions): Promise<{ data: T; status: number }> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  async post<T = any>(path: string, body?: any, options?: RequestOptions): Promise<{ data: T; status: number }> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = any>(path: string, body?: any, options?: RequestOptions): Promise<{ data: T; status: number }> {
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = any>(path: string, options?: RequestOptions): Promise<{ data: T; status: number }> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient(API_BASE_URL);
