const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const brandId = import.meta.env.VITE_BRAND || 'clic';
const TOKEN_KEY = `${brandId}_token`;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | undefined>;
};

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export async function apiFetch<T = unknown>(
  path: string,
  { method = 'GET', body, auth = true, query }: Options = {}
): Promise<T> {
  const url = new URL(BASE_URL + path, window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Sin conexion a internet', 0);
  }

  if (res.status === 204) return undefined as T;

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (res.ok) return data as T;

  // Errores
  if (res.status === 401) {
    clearToken();
    if (onUnauthorized) onUnauthorized();
    throw new ApiError(
      'Tu sesion expiro. Inicia sesion de nuevo.',
      401
    );
  }
  if (res.status === 429) {
    throw new ApiError('Demasiados intentos. Espera unos minutos.', 429);
  }
  if (res.status >= 500) {
    throw new ApiError('Error del servidor. Intenta mas tarde.', res.status);
  }

  const msg =
    (data && (data.error || data.message)) ||
    `Error ${res.status}`;
  throw new ApiError(msg, res.status);
}
