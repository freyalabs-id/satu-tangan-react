export const BASE = import.meta.env.VITE_API_BASE || '';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('st_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('st_auth_token');
    localStorage.removeItem('st_username');
    window.dispatchEvent(new CustomEvent('st-auth-cleared'));
    throw new Error('Sesi berakhir');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Gagal' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  },
  get<T>(path: string): Promise<T> {
    return request<T>(path);
  },
  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
  },
  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' });
  },
};
