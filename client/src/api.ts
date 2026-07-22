import type { AiDraft, Customer, MatchPreferences, PageMeta } from './types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const TOKEN_KEY = 'tdc_access_token';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload as T;
}

export async function login(username: string, password: string) {
  const payload = await request<{ token: string }>('/auth/login', {
    method: 'POST', body: JSON.stringify({ username, password }),
  });
  sessionStorage.setItem(TOKEN_KEY, payload.token);
}

export const logout = () => sessionStorage.removeItem(TOKEN_KEY);
export const hasToken = () => Boolean(sessionStorage.getItem(TOKEN_KEY));

export const getCustomers = (page: number, search: string) =>
  request<{ data: Customer[]; meta: PageMeta }>(`/customers?page=${page}&limit=12&search=${encodeURIComponent(search)}`);

export const getMatches = (id: number, preferences: MatchPreferences) =>
  request<{ data: Customer[]; meta: { scoringSource: string; warning: string | null } }>(`/customers/${id}/matches`, {
    method: 'POST', body: JSON.stringify(preferences),
  });

export const generateIntro = (client: Customer, match: Customer) =>
  request<AiDraft>('/generate-intro', { method: 'POST', body: JSON.stringify({ client, match }) });
