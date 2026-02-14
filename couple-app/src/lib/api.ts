// API base URL - Capacitor 빌드 시 실제 서버 URL로 변경
// 개발 중에는 로컬 서버 사용
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

export async function apiGet(path: string) {
  return apiFetch(path);
}

export async function apiPost(path: string, body: any) {
  return apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiPut(path: string, body: any) {
  return apiFetch(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function apiDelete(path: string) {
  return apiFetch(path, { method: 'DELETE' });
}
