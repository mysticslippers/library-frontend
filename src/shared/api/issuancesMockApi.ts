import type { Booking, BookingViewDto, IssuanceStatus } from "../types/library";
import { materialCards } from "../fixtures/materials";

type StoredIssuance = {
    id: string;
    bookingId: string;
    issuanceDate: string;
    status: IssuanceStatus;
    returnDeadline: string;
    renewCount: number;
};

const LS_ISSUANCES = "lib.issuances";
const LS_BOOKINGS = "lib.bookings";

function uuid() {
    return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
}

function readJson<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function writeJson<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
}

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function addDaysISO(fromISO: string, days: number) {
    const d = new Date(fromISO + "T00:00:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

function getAllBookings(): Booking[] {
    return readJson<Booking[]>(LS_BOOKINGS, []);
}

function setAllBookings(b: Booking[]) {
    writeJson(LS_BOOKINGS, b);
}

function getAllIssuances(): StoredIssuance[] {
    return readJson<StoredIssuance[]>(LS_ISSUANCES, []);
}

function setAllIssuances(x: StoredIssuance[]) {
    writeJson(LS_ISSUANCES, x);
}

function isOpen(status: IssuanceStatus) {
    return status === "OPEN" || status === "OVERDUE";
}

export function getActiveIssuancesCountByMaterial(materialId: string): number {
    const bookings = getAllBookings();
    const openIssuances = getAllIssuances().filter((i) => isOpen(i.status));

    const bookingIds = new Set(
        bookings.filter((b) => b.materialId === materialId).map((b) => b.id)
    );

    return openIssuances.filter((i) => bookingIds.has(i.bookingId)).length;
}

export type MyIssuanceView = {
    id: string;
    status: IssuanceStatus;
    issuanceDate: string;
    returnDeadline: string;
    renewCount: number;
    booking: BookingViewDto;
};

export async function listMyIssuances(readerId: string): Promise<MyIssuanceView[]> {
    await new Promise((r) => setTimeout(r, 150));

    const bookings = getAllBookings().filter((b) => b.readerId === readerId);
    const bookingsById = new Map(bookings.map((b) => [b.id, b]));

    const issuances = getAllIssuances()
        .filter((i) => bookingsById.has(i.bookingId))
        .map((i) => {
            const b = bookingsById.get(i.bookingId)!;
            const m = materialCards.find((x) => x.id === b.materialId);

            const overdueNow = i.status === "OPEN" && i.returnDeadline < todayISO();
            const status: IssuanceStatus = overdueNow ? "OVERDUE" : i.status;

            return {
                id: i.id,
                status,
                issuanceDate: i.issuanceDate,
                returnDeadline: i.returnDeadline,
                renewCount: i.renewCount,
                booking: {
                    id: b.id,
                    status: b.status,
                    bookingDate: b.bookingDate,
                    bookingDeadline: b.bookingDeadline,
                    libraryId: b.libraryId,
                    material: { id: b.materialId, title: m?.title ?? "Unknown", isbn: null },
                },
            } satisfies MyIssuanceView;
        })
        .sort((a, b) => b.issuanceDate.localeCompare(a.issuanceDate));

    const needUpdate = issuances.some((x) => x.status === "OVERDUE");
    if (needUpdate) {
        const all = getAllIssuances();
        const updated = all.map((i) => {
            if (i.status === "OPEN" && i.returnDeadline < todayISO()) return { ...i, status: "OVERDUE" as const };
            return i;
        });
        setAllIssuances(updated);
    }

    return issuances;
}

export async function issueFromBooking(params: { readerId: string; bookingId: string }) {
    await new Promise((r) => setTimeout(r, 200));

    const bookings = getAllBookings();
    const bIdx = bookings.findIndex((b) => b.id === params.bookingId);
    if (bIdx === -1) throw new Error("BOOKING_NOT_FOUND");
    if (bookings[bIdx].readerId !== params.readerId) throw new Error("FORBIDDEN");
    if (bookings[bIdx].status !== "ACTIVE") throw new Error("BOOKING_NOT_ACTIVE");

    const issuances = getAllIssuances();
    const already = issuances.some((i) => i.bookingId === params.bookingId && isOpen(i.status));
    if (already) throw new Error("ALREADY_ISSUED");

    const issuanceDate = todayISO();
    const issuance: StoredIssuance = {
        id: uuid(),
        bookingId: params.bookingId,
        issuanceDate,
        status: "OPEN",
        returnDeadline: addDaysISO(issuanceDate, 14),
        renewCount: 0,
    };

    bookings[bIdx] = { ...bookings[bIdx], status: "COMPLETED" };
    setAllBookings(bookings);
    setAllIssuances([issuance, ...issuances]);

    return { ok: true, issuanceId: issuance.id };
}

export async function renewIssuance(params: { readerId: string; issuanceId: string }) {
    await new Promise((r) => setTimeout(r, 150));

    const bookings = getAllBookings().filter((b) => b.readerId === params.readerId);
    const bookingIds = new Set(bookings.map((b) => b.id));

    const all = getAllIssuances();
    const idx = all.findIndex((i) => i.id === params.issuanceId);
    if (idx === -1) throw new Error("ISSUANCE_NOT_FOUND");
    if (!bookingIds.has(all[idx].bookingId)) throw new Error("FORBIDDEN");

    const current = all[idx];
    if (!isOpen(current.status)) throw new Error("ISSUANCE_NOT_OPEN");
    if (current.renewCount >= 2) throw new Error("RENEW_LIMIT");

    all[idx] = {
        ...current,
        returnDeadline: addDaysISO(current.returnDeadline, 7),
        renewCount: current.renewCount + 1,
    };

    setAllIssuances(all);
    return { ok: true };
}
