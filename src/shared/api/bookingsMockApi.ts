import type { Booking, BookingStatus, BookingViewDto } from "../types/library";
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

export type StaffBookingRow = {
    id: string;
    status: Booking["status"];
    bookingDate: string;
    bookingDeadline: string;

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

function mapLoanToBookingStatus(s: BookLoanDTO["status"]): BookingStatus {
    if (s === "CANCELLED") return "CANCELLED";
    if (s === "PENDING" || s === "RESERVED" || s === "ISSUED") return s;

    return "ISSUED";
}

export function getActiveBookingsCountByMaterial(_materialId: string): number {
    return 0;
}

export async function listMyBookings(_readerId: string): Promise<BookingViewDto[]> {
    const loans = await http<BookLoanDTO[]>(`/loans/my`);

    const bookings = loans
        .filter(
            (l) =>
                l.status === "PENDING" ||
                l.status === "RESERVED" ||
                l.status === "CANCELLED" ||
                l.status === "ISSUED"
        )
        .sort((a, b) => (b.reservedAt ?? "").localeCompare(a.reservedAt ?? ""));

    const result: BookingViewDto[] = [];
    for (const l of bookings) {
        const m = await getMaterialCard(String(l.bookId));
        result.push({
            id: String(l.id),
            status: mapLoanToBookingStatus(l.status),
            bookingDate: toISODate(l.reservedAt),
            bookingDeadline: toISODate(l.reservedUntil),
            libraryId: String(l.libraryId),
            material: {
                id: String(l.bookId),
                title: m?.title ?? "Unknown",
                isbn: null,
            },
        });
    }
    return result;
}

export async function createBooking(params: {
    readerId: string;
    materialId: string;
    libraryId?: string;
}): Promise<Booking> {
    void params.readerId;

    const payload = await http<BookLoanDTO>(`/loans/reserve`, {
        method: "POST",
        body: JSON.stringify({
            bookId: Number(params.materialId),
            libraryId: Number(params.libraryId ?? "1"),
        }),
    });

    return {
        id: String(payload.id),
        readerId: String(payload.userId),
        librarianId: null,
        libraryId: String(payload.libraryId),
        materialId: String(payload.bookId),
        bookingDate: toISODate(payload.reservedAt),
        bookingDeadline: toISODate(payload.reservedUntil),
        status: mapLoanToBookingStatus(payload.status),
    };
}

export async function cancelBooking(params: { readerId: string; bookingId: string }) {
    void params.readerId;
    await http(`/loans/${params.bookingId}/cancel`, { method: "POST" });
    return { ok: true };
}

export async function findBookingById(bookingId: string) {
    const loan = await http<BookLoanDTO>(`/loans/${bookingId}`);
    return {
        id: String(loan.id),
        readerId: String(loan.userId),
        librarianId: null,
        libraryId: String(loan.libraryId),
        materialId: String(loan.bookId),
        bookingDate: toISODate(loan.reservedAt),
        bookingDeadline: toISODate(loan.reservedUntil),
        status: mapLoanToBookingStatus(loan.status),
    } as Booking;
}

export async function listBookingsForStaff(params?: { q?: string; status?: string }): Promise<StaffBookingRow[]> {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.status) {
        const s = params.status.toUpperCase();
        qs.set("status", s === "EXPIRED" ? "CANCELLED" : s);
    }

    const loans = await http<BookLoanDTO[]>(`/loans?${qs.toString()}`);

    const bookings = loans.filter(
        (l) =>
            l.status === "PENDING" ||
            l.status === "RESERVED" ||
            l.status === "CANCELLED" ||
            l.status === "ISSUED"
    );

    const rows: StaffBookingRow[] = [];
    for (const l of bookings) {
        const m = await getMaterialCard(String(l.bookId));
        rows.push({
            id: String(l.id),
            status: mapLoanToBookingStatus(l.status),
            bookingDate: toISODate(l.reservedAt),
            bookingDeadline: toISODate(l.reservedUntil),
            readerId: String(l.userId),
            materialId: String(l.bookId),
            materialTitle: m?.title ?? "Unknown",
            libraryId: String(l.libraryId),
        });
    }
    rows.sort((a, b) => b.bookingDate.localeCompare(a.bookingDate));
    return rows;
}