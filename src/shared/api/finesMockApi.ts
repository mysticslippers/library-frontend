import type { FineState } from "../types/library";
import { getCurrentSession } from "./authApi";
import type { MyIssuanceView } from "./issuancesMockApi";

const API_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8080";

type ApiResponse<T = any> = {
    status: "SUCCESS" | "ERROR";
    message?: string;
    data?: T | null;
    errors?: string[] | null;
};

export type MyFineView = {
    id: string;
    issuanceId: string;
    description: string;
    dueDate: string;
    paymentDate?: string | null;
    state: FineState;
    amount: number;
};

export type StaffFineRow = {
    id: string;
    readerId: string;
    issuanceId: string;
    description: string;
    dueDate: string;
    state: FineState;
    amount: number;
    paymentDate?: string | null;
    writtenOff?: boolean;
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

export function ensureFinesFromIssuances(_readerId: string, _issuances: MyIssuanceView[]) {
}

export async function listMyFines(_readerId: string): Promise<MyFineView[]> {
    const list = await http<any[]>(`/fines/my`);
    return (list ?? []).map((x) => ({
        id: String(x.id),
        issuanceId: String(x.issuanceId ?? ""),
        description: x.description ?? "",
        dueDate: x.dueDate ?? "",
        paymentDate: x.paymentDate ?? null,
        state: (String(x.state).toUpperCase() === "UNPAID" ? "UNPAID" : "PAID") as FineState,
        amount: Number(x.amount ?? 0),
    }));
}

export async function payFine(params: { readerId: string; fineId: string }) {
    void params.readerId;
    await http(`/fines/${params.fineId}/pay`, { method: "POST" });
    return { ok: true };
}

export async function listFinesForStaff(params?: {
    q?: string;
    state?: "" | "UNPAID" | "PAID";
}): Promise<StaffFineRow[]> {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.state) qs.set("state", params.state);

    const list = await http<any[]>(`/fines?${qs.toString()}`);

    return (list ?? []).map((x) => ({
        id: String(x.id),
        readerId: String(x.readerId ?? ""),
        issuanceId: String(x.issuanceId ?? ""),
        description: x.description ?? "",
        dueDate: x.dueDate ?? "",
        state: (String(x.state).toUpperCase() === "UNPAID" ? "UNPAID" : "PAID") as FineState,
        amount: Number(x.amount ?? 0),
        paymentDate: x.paymentDate ?? null,
        writtenOff: Boolean(x.writtenOff),
    }));
}

export async function payFineByStaff(params: { fineId: string }) {
    await http(`/fines/${params.fineId}/pay`, { method: "POST" });
    return { ok: true };
}

export async function writeOffFineByStaff(params: { fineId: string }) {
    await http(`/fines/${params.fineId}/write-off`, { method: "POST" });
    return { ok: true };
}
