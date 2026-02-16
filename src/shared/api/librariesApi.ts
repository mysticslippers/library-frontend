import { getCurrentSession } from "./authApi";

const API_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8080";

type ApiResponse<T = any> = {
    status: "SUCCESS" | "ERROR";
    message?: string;
    data?: T | null;
    errors?: string[] | null;
};

export type LibraryStatus = "ACTIVE" | "CLOSED";

export type LibraryDTO = {
    id: number;
    address: Record<string, any>;
    staffNumber: number;
    status: LibraryStatus;
    bookIds?: number[];
};

function authHeader(): Record<string, string> {
    const s = getCurrentSession();
    return s?.token ? { Authorization: `Bearer ${s.token}` } : {};
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
            ...authHeader(),
        },
    });

    const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;

    if (!res.ok) {
        const msg =
            (body?.errors && body.errors.length ? body.errors[0] : null) ??
            body?.message ??
            `HTTP ${res.status}`;
        const err: any = new Error(msg);
        err.status = res.status;
        err.body = body;
        throw err;
    }

    return (body?.data as T) ?? (null as any);
}

export async function listLibraries(): Promise<LibraryDTO[]> {
    return await http<LibraryDTO[]>(
        `/libraries?page=1&size=1000&sortBy=id&sortDir=asc`
    );
}

let defaultLibraryIdCache: string | null = null;

export async function getDefaultLibraryId(): Promise<string> {
    if (defaultLibraryIdCache) return defaultLibraryIdCache;

    const libs = await listLibraries();
    if (!libs?.length) {
        defaultLibraryIdCache = "1";
        return defaultLibraryIdCache;
    }

    const active = libs.find((l) => l.status === "ACTIVE") ?? libs[0];
    defaultLibraryIdCache = String(active.id);
    return defaultLibraryIdCache;
}
