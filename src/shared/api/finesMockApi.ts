import type { FineState } from "../types/library";
import type { MyIssuanceView } from "./issuancesMockApi";

type StoredFine = {
    id: string;
    readerId: string;
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

const LS_FINES = "lib.fines";

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

function getAllFines(): StoredFine[] {
    return readJson<StoredFine[]>(LS_FINES, []);
}

function setAllFines(x: StoredFine[]) {
    writeJson(LS_FINES, x);
}

export type MyFineView = {
    id: string;
    issuanceId: string;
    description: string;
    dueDate: string;
    paymentDate?: string | null;
    state: FineState;
    amount: number;
};

export async function listMyFines(readerId: string): Promise<MyFineView[]> {
    await new Promise((r) => setTimeout(r, 120));
    return getAllFines()
        .filter((f) => f.readerId === readerId)
        .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
}

export function ensureFinesFromIssuances(readerId: string, issuances: MyIssuanceView[]) {
    const all = getAllFines();
    const existsByIssuance = new Set(all.filter((f) => f.readerId === readerId).map((f) => f.issuanceId));

    const toAdd: StoredFine[] = [];

    for (const i of issuances) {
        if (i.status !== "OVERDUE") continue;
        if (existsByIssuance.has(i.id)) continue;

        toAdd.push({
            id: uuid(),
            readerId,
            issuanceId: i.id,
            description: "Просрочка возврата материала",
            dueDate: todayISO(),
            paymentDate: null,
            state: "UNPAID",
            amount: 100,
        });
    }

    if (toAdd.length) setAllFines([...toAdd, ...all]);
}

export async function payFine(params: { readerId: string; fineId: string }) {
    await new Promise((r) => setTimeout(r, 150));

    const all = getAllFines();
    const idx = all.findIndex((f) => f.id === params.fineId);
    if (idx === -1) throw new Error("FINE_NOT_FOUND");
    if (all[idx].readerId !== params.readerId) throw new Error("FORBIDDEN");
    if (all[idx].state !== "UNPAID") return { ok: true };

    all[idx] = { ...all[idx], state: "PAID", paymentDate: todayISO() };
    setAllFines(all);
    return { ok: true };
}

export async function listFinesForStaff(params?: {
    q?: string;
    state?: "" | "UNPAID" | "PAID";
}): Promise<StaffFineRow[]> {
    await new Promise((r) => setTimeout(r, 150));

    const q = (params?.q ?? "").trim().toLowerCase();
    const state = (params?.state ?? "").trim().toUpperCase() as any;

    let items = (readJson<any[]>(LS_FINES, []) as any[]).map((f) => ({
        id: f.id,
        readerId: f.readerId,
        issuanceId: f.issuanceId,
        description: f.description,
        dueDate: f.dueDate,
        state: f.state,
        amount: f.amount,
        paymentDate: f.paymentDate ?? null,
        writtenOff: Boolean(f.writtenOff),
    })) as StaffFineRow[];

    if (state) items = items.filter((x) => x.state === state);

    if (q) {
        items = items.filter((x) => {
            const hay = `${x.id} ${x.readerId} ${x.issuanceId} ${x.description}`.toLowerCase();
            return hay.includes(q);
        });
    }

    items.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
    return items;
}

export async function payFineByStaff(params: { fineId: string }) {
    await new Promise((r) => setTimeout(r, 150));

    const all = readJson<any[]>(LS_FINES, []);
    const idx = all.findIndex((f) => f.id === params.fineId);
    if (idx === -1) throw new Error("FINE_NOT_FOUND");

    if (all[idx].state === "PAID") return { ok: true };

    all[idx] = { ...all[idx], state: "PAID", paymentDate: todayISO(), writtenOff: false };
    writeJson(LS_FINES, all);
    return { ok: true };
}

export async function writeOffFineByStaff(params: { fineId: string }) {
    await new Promise((r) => setTimeout(r, 150));

    const all = readJson<any[]>(LS_FINES, []);
    const idx = all.findIndex((f) => f.id === params.fineId);
    if (idx === -1) throw new Error("FINE_NOT_FOUND");

    all[idx] = {
        ...all[idx],
        state: "PAID",
        paymentDate: todayISO(),
        writtenOff: true,
    };

    writeJson(LS_FINES, all);
    return { ok: true };
}
