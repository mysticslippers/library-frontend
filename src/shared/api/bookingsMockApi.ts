import type { Booking, BookingStatus, BookingViewDto } from "../types/library";
import { materialCards } from "../fixtures/materials";

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

function todayDateISO() {
    return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

function getAllBookings(): Booking[] {
    return readJson<Booking[]>(LS_BOOKINGS, []);
}

function setAllBookings(b: Booking[]) {
    writeJson(LS_BOOKINGS, b);
}

function isActive(status: BookingStatus) {
    return status === "ACTIVE";
}

export function getActiveBookingsCountByMaterial(materialId: string): number {
    const all = getAllBookings();
    return all.filter((b) => b.materialId === materialId && isActive(b.status)).length;
}

export async function listMyBookings(readerId: string): Promise<BookingViewDto[]> {
    await new Promise((r) => setTimeout(r, 150));

    const all = getAllBookings()
        .filter((b) => b.readerId === readerId)
        .sort((a, b) => b.bookingDate.localeCompare(a.bookingDate));

    return all.map((b) => {
        const m = materialCards.find((x) => x.id === b.materialId);
        return {
            id: b.id,
            status: b.status,
            bookingDate: b.bookingDate,
            bookingDeadline: b.bookingDeadline,
            libraryId: b.libraryId,
            material: {
                id: b.materialId,
                title: m?.title ?? "Unknown",
                isbn: null,
            },
        };
    });
}

export async function createBooking(params: {
    readerId: string;
    materialId: string;
    libraryId?: string;
}): Promise<Booking> {
    await new Promise((r) => setTimeout(r, 200));

    const { readerId, materialId } = params;
    const libraryId = params.libraryId ?? "1";

    const m = materialCards.find((x) => x.id === materialId);
    if (!m) throw new Error("MATERIAL_NOT_FOUND");

    const all = getAllBookings();

    const already = all.some(
        (b) => b.readerId === readerId && b.materialId === materialId && isActive(b.status)
    );
    if (already) throw new Error("ALREADY_BOOKED");

    const activeCount = getActiveBookingsCountByMaterial(materialId);
    const available = (m.totalCopies ?? 0) - activeCount;

    if (available <= 0) throw new Error("NOT_AVAILABLE");

    const booking: Booking = {
        id: uuid(),
        readerId,
        librarianId: null,
        libraryId,
        materialId,
        bookingDate: todayDateISO(),
        bookingDeadline: addDaysISO(3),
        status: "ACTIVE",
    };

    setAllBookings([booking, ...all]);
    return booking;
}

export async function cancelBooking(params: { readerId: string; bookingId: string }) {
    await new Promise((r) => setTimeout(r, 150));

    const all = getAllBookings();
    const idx = all.findIndex((b) => b.id === params.bookingId);

    if (idx === -1) throw new Error("BOOKING_NOT_FOUND");
    if (all[idx].readerId !== params.readerId) throw new Error("FORBIDDEN");

    if (all[idx].status !== "ACTIVE") return { ok: true };

    all[idx] = { ...all[idx], status: "CANCELLED" };
    setAllBookings(all);
    return { ok: true };
}
