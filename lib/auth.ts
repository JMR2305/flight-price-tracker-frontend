import type { TokenResponse, User } from "./types";

const TOKEN_KEY = "fpt_token";
const USER_KEY = "fpt_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function storeAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

async function authRequest<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      detail = json?.detail ?? detail;
    } catch {
      // ignore
    }
    const err = new Error(detail) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const data = await authRequest<TokenResponse>("/api/auth/login", { email, password });
  storeAuth(data.access_token, data.user);
  return data;
}

export async function register(
  email: string,
  full_name: string,
  password: string,
): Promise<TokenResponse> {
  const data = await authRequest<TokenResponse>("/api/auth/register", {
    email,
    full_name,
    password,
  });
  storeAuth(data.access_token, data.user);
  return data;
}

export function logout(): void {
  clearAuth();
}
