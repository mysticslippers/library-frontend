import type { AuthUser, Role } from "../types/library";

const TOKEN_STORAGE_KEY = "lib.jwt";
const API_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8080";

type ApiResponse<T = any> = {
    status: "SUCCESS" | "ERROR";
    message?: string;
    data?: T | null;
    errors?: string[] | null;
};

function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const needle = `${encodeURIComponent(name)}=`;
    const parts = document.cookie.split(";");
    for (const raw of parts) {
        const s = raw.trim();
        if (s.startsWith(needle)) return decodeURIComponent(s.slice(needle.length));
    }
    return null;
}

function deleteCookie(name: string) {
    if (typeof document === "undefined") return;
    const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

function getTokenFromStorage(): string | null {
    try {
        if (typeof window === "undefined") return null;
        const t = window.localStorage.getItem(TOKEN_STORAGE_KEY);
        return t && t.trim() ? t : null;
    } catch {
        return null;
    }
}

function setTokenToStorage(token: string) {
    try {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
    }
}

function clearTokenStorage() {
    try {
        if (typeof window === "undefined") return;
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
    }
    deleteCookie(TOKEN_STORAGE_KEY);
}

function migrateTokenFromCookieIfNeeded() {
    try {
        if (typeof window === "undefined") return;
        const already = getTokenFromStorage();
        if (already) return;
        const legacy = getCookie(TOKEN_STORAGE_KEY);
        if (!legacy || !legacy.trim()) return;
        setTokenToStorage(legacy);
        deleteCookie(TOKEN_STORAGE_KEY);
    } catch {
    }
}

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

function extractToken(payload: any): string | null {
    const p = payload as ApiResponse<{ token?: string }> | any;
    return typeof p?.data?.token === "string" ? p.data.token : null;
}

function base64UrlDecode(input: string): string {
    const pad = "=".repeat((4 - (input.length % 4)) % 4);
    const base64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

type JwtPayload = {
    id?: string | number;
    email?: string;
    role?: string;
    sub?: string;
    exp?: number;
    iat?: number;
    [k: string]: unknown;
};

function decodeJwt(token: string): JwtPayload | null {
    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;
        const json = base64UrlDecode(parts[1]);
        return JSON.parse(json) as JwtPayload;
    } catch {
        return null;
    }
}

function mapBackendRoleToFrontend(role?: string): Role {
    if (!role) return "READER";
    if (role === "LIBRARIAN") return "LIBRARIAN";
    if (role === "USER") return "READER";
    return "READER";
}

function toAuthUserFromJwt(token: string): AuthUser | null {
    const payload = decodeJwt(token);
    if (!payload) return null;

    const backendRole = String(payload.role ?? "");
    const role = mapBackendRoleToFrontend(backendRole);

    const identifier = normalizeEmail(String(payload.email ?? payload.sub ?? ""));
    if (!identifier) return null;

    const idRaw = payload.id;
    const id =
        typeof idRaw === "string"
            ? idRaw
            : typeof idRaw === "number"
                ? String(idRaw)
                : "";

    const safeId = id || `email:${identifier}`;

    return {
        id: safeId,
        role,
        identifier,
    };
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_URL}${path}` as string, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

    if (!res.ok) {
        const api = body as ApiResponse | null;
        const msg =
            (api?.errors && api.errors.length ? api.errors[0] : null) ??
            api?.message ??
            `HTTP ${res.status}`;

        const err: any = new Error(msg);
        err.status = res.status;
        err.body = body;
        throw err;
    }

    return body as T;
}

export function getCurrentSession(): { token: string; user: AuthUser } | null {
    try {
        migrateTokenFromCookieIfNeeded();

        const token = getTokenFromStorage();
        if (!token || typeof token !== "string") return null;

        const payload = decodeJwt(token);
        if (!payload) return null;

        if (payload.exp && Date.now() / 1000 >= payload.exp) {
            clearTokenStorage();
            return null;
        }

        const user = toAuthUserFromJwt(token);
        if (!user) return null;

        return { token, user };
    } catch {
        return null;
    }
}

export function getAuthHeaders(): Record<string, string> {
    const s = getCurrentSession();
    return s?.token ? { Authorization: `Bearer ${s.token}` } : {};
}

export function logout() {
    clearTokenStorage();
}

export async function registerReader(email: string, password: string) {
    const payload = await http<ApiResponse<{ token: string }>>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
            email: normalizeEmail(email),
            password,
            role: "USER",
        }),
    });

    const token = extractToken(payload);
    if (!token) throw new Error("TOKEN_NOT_FOUND");

    setTokenToStorage(token);

    const user = toAuthUserFromJwt(token);
    if (!user) throw new Error("INVALID_TOKEN");

    return { token, user };
}

export async function login(email: string, password: string) {
    const payload = await http<ApiResponse<{ token: string }>>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email: normalizeEmail(email),
            password,
        }),
    });

    const token = extractToken(payload);
    if (!token) throw new Error("TOKEN_NOT_FOUND");

    setTokenToStorage(token);

    const user = toAuthUserFromJwt(token);
    if (!user) throw new Error("INVALID_TOKEN");

    return { token, user };
}

export async function requestPasswordReset(email: string) {
    await http<ApiResponse<null>>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: normalizeEmail(email) }),
    });

    return { ok: true };
}

export async function resetPassword(token: string, newPassword: string) {
    await http<ApiResponse<null>>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
    });

    return { ok: true };
}