import type { BookingViewDto, IssuanceStatus } from "../types/library";
import { getAuthHeaders } from "./authApi";
import { getMaterialCard } from "./libraryMockApi";

const API_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8080";

type ApiResponse<T = any> = {
    status: "SUCCESS" | "ERROR";
    message?: string;
    data?: T | null;
    errors?: string[] | null;
};

type BookLoanDTO = {
    id: number;
    userId: number;
    bookId: number;
    libraryId: number;
    status: "PENDING" | "RESERVED" | "ISSUED" | "OVERDUE" | "RETURNED" | "CANCELLED";
    reservedAt?: string | null;
    reservedUntil?: string | null;
    issuedAt?: string | null;
    dueAt?: string | null;
    returnedAt?: string | null;
};

export type StaffIssuanceRow = {
    id: string;
    bookingId: string;
    status: "OPEN" | "OVERDUE" | "RETURNED";
    issuanceDate: string;
    returnDeadline: string;
    renewCount: number;

    readerId: string;
    materialId: string;
    materialTitle: string;

    libraryId: string;
};

async function http<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
            ...getAuthHeaders(),
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

function toISODate(x?: string | null): string {
    if (!x) return new Date().toISOString().slice(0, 10);
    return String(x).slice(0, 10);
}

function mapLoanToIssuanceStatus(s: BookLoanDTO["status"]): IssuanceStatus {
    if (s === "RETURNED") return "RETURNED";
    if (s === "OVERDUE") return "OVERDUE";
    return "OPEN";
}

export type MyIssuanceView = {
    id: string;
    status: IssuanceStatus;
    issuanceDate: string;
    returnDeadline: string;
    renewCount: number;
    booking: BookingViewDto;
};

export async function listMyIssuances(_readerId: string): Promise<MyIssuanceView[]> {
    const loans = await http<BookLoanDTO[]>(`/loans/my`);

    const issuances = loans
        .filter((l) => l.status === "ISSUED" || l.status === "OVERDUE" || l.status === "RETURNED")
        .sort((a, b) => (b.issuedAt ?? "").localeCompare(a.issuedAt ?? ""));

    const result: MyIssuanceView[] = [];
    for (const l of issuances) {
        const m = await getMaterialCard(String(l.bookId));
        result.push({
            id: String(l.id),
            status: mapLoanToIssuanceStatus(l.status),
            issuanceDate: toISODate(l.issuedAt),
            returnDeadline: toISODate(l.dueAt),
            renewCount: 0,
            booking: {
                id: String(l.id),
                status: "ISSUED",
                bookingDate: toISODate(l.reservedAt),
                bookingDeadline: toISODate(l.reservedUntil),
                libraryId: String(l.libraryId),
                material: { id: String(l.bookId), title: m?.title ?? "Unknown", isbn: null },
            },
        });
    }
    return result;
}

export async function issueFromBooking(params: { readerId: string; bookingId: string }) {
    void params.readerId;
    await http(`/loans/${params.bookingId}/issue`, { method: "POST" });
    return { ok: true, issuanceId: params.bookingId };
}

export async function renewIssuance(_params: { readerId: string; issuanceId: string }) {
    throw new Error("NOT_IMPLEMENTED");
}

export async function findIssuanceById(issuanceId: string) {
    const loan = await http<BookLoanDTO>(`/loans/${issuanceId}`);
    return {
        id: String(loan.id),
        bookingId: String(loan.id),
        issuanceDate: toISODate(loan.issuedAt),
        status: mapLoanToIssuanceStatus(loan.status),
        returnDeadline: toISODate(loan.dueAt),
        renewCount: 0,
    };
}

export async function returnIssuance(params: { issuanceId: string }) {
    await http(`/loans/${params.issuanceId}/return`, { method: "POST" });
    return { ok: true };
}

export async function listIssuancesForStaff(params?: { q?: string; status?: "" | "OPEN" | "OVERDUE" | "RETURNED" }): Promise<StaffIssuanceRow[]> {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.status) {
        if (params.status === "OPEN") qs.set("status", "ISSUED");
        else qs.set("status", params.status);
    }

    const loans = await http<BookLoanDTO[]>(`/loans?${qs.toString()}`);

    const issuances = loans.filter((l) => l.status === "ISSUED" || l.status === "OVERDUE" || l.status === "RETURNED");

    const rows: StaffIssuanceRow[] = [];
    for (const l of issuances) {
        const m = await getMaterialCard(String(l.bookId));
        rows.push({
            id: String(l.id),
            bookingId: String(l.id),
            status: l.status === "RETURNED" ? "RETURNED" : l.status === "OVERDUE" ? "OVERDUE" : "OPEN",
            issuanceDate: toISODate(l.issuedAt),
            returnDeadline: toISODate(l.dueAt),
            renewCount: 0,
            readerId: String(l.userId),
            materialId: String(l.bookId),
            materialTitle: m?.title ?? "Unknown",

            libraryId: String(l.libraryId),
        });
    }

    rows.sort((a, b) => b.issuanceDate.localeCompare(a.issuanceDate));
    return rows;
}