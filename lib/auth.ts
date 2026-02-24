import { cookies } from "next/headers";
import { apiFetch } from "./api";
import { jwtVerify, type JWTPayload } from "jose";

export const TOKEN_COOKIE = "auth_token";
export const USER_COOKIE  = "auth_user";

export type PersonalUser = {
  tipo:        "personal";
  id_personal: number;
  id_rol:      number;
  nombre_rol:  string;
};

export type HuespedUser = {
  tipo:       "huesped";
  id_huesped: number;
};

export type AuthUser = PersonalUser | HuespedUser;

// ── Server-side helpers (App Router / Server Components) ──────────────────────

export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE)?.value ?? null;
}

export async function getServerUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(USER_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

// ── Login / Logout (llamados desde API routes) ────────────────────────────────

export async function loginPersonal(email: string, password: string) {
  return apiFetch<{ access_token: string; token_type: string; tipo: string }>(
    "/auth/login",
    { method: "POST", body: { email, password } }
  );
}

export async function loginHuesped(email_login: string, password: string) {
  return apiFetch<{ access_token: string; token_type: string; tipo: string }>(
    "/auth/login/huesped",
    { method: "POST", body: { email_login, password } }
  );
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);
  return payload;
}