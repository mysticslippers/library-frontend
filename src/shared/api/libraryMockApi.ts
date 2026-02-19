import type { MaterialCardDto } from "../types/library";
import { getCurrentSession } from "./authApi";

const API_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8080";

type ApiResponse<T = any> = {
    status: "SUCCESS" | "ERROR";
    message?: string;
    data?: T | null;
    errors?: string[] | null;
};

type BookDTO = {
    id: number;
    title: string;
    authorIds: number[];
    libraryIds: number[];
    publishingHouse: string;
    publicationYear: string;
    genre: string;
    language: string;
    isbn: string;
};

type AuthorDTO = {
    id: number;
    surname: string;
    name: string;
    middleName?: string | null;
    bookIds?: number[];
};

type BookInventoryDTO = {
    id: number;
    bookId: number;
    libraryId: number;
    totalCopies: number;
    availableCopies: number;
};

export type CatalogSort =
    | "relevance"
    | "title_asc"
    | "title_desc"
    | "available_desc"
    | "year_desc"
    | "year_asc";

export type CatalogQuery = {
    q?: string;
    author?: string;
    genre?: string;
    yearFrom?: number;
    yearTo?: number;
    availableOnly?: boolean;
    sort?: CatalogSort;
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

function yearFromDateString(d?: string | null): string | null {
    if (!d) return null;
    const y = String(d).slice(0, 4);
    return /^\d{4}$/.test(y) ? y : null;
}

function normalize(s: string) {
    return s.trim().toLowerCase();
}

function matchesFreeText(card: MaterialCardDto, q: string): boolean {
    const qq = normalize(q);
    if (!qq) return true;

    const parts: string[] = [];
    if (card.id) parts.push(String(card.id));
    if (card.title) parts.push(card.title);
    if (card.authors) parts.push(card.authors);
    if (card.genre) parts.push(String(card.genre));
    if (card.year) parts.push(String(card.year));
    if (card.description) parts.push(card.description);

    const hay = normalize(parts.join(" "));
    return hay.includes(qq);
}

let authorsCache: Map<number, string> | null = null;
let inventoriesCache: Map<number, { total: number; available: number }> | null = null;

async function loadAllAuthors(): Promise<Map<number, string>> {
    if (authorsCache) return authorsCache;

    const list = await http<AuthorDTO[]>(
        `/authors?page=1&size=10000&sortBy=surname&sortDir=asc`
    );

    const map = new Map<number, string>();
    for (const a of list) {
        const full = [a.surname, a.name, a.middleName].filter(Boolean).join(" ");
        map.set(a.id, full);
    }
    authorsCache = map;
    return map;
}

async function loadAllInventories(): Promise<Map<number, { total: number; available: number }>> {
    if (inventoriesCache) return inventoriesCache;

    const list = await http<BookInventoryDTO[]>(
        `/book-inventories?page=1&size=10000&sortBy=id&sortDir=asc`
    );

    const map = new Map<number, { total: number; available: number }>();
    for (const inv of list) {
        const cur = map.get(inv.bookId) ?? { total: 0, available: 0 };
        cur.total += inv.totalCopies ?? 0;
        cur.available += inv.availableCopies ?? 0;
        map.set(inv.bookId, cur);
    }

    inventoriesCache = map;
    return map;
}

function mapBookToCard(
    b: BookDTO,
    authorsById: Map<number, string>,
    invByBookId: Map<number, { total: number; available: number }>
): MaterialCardDto {
    const authors = (b.authorIds ?? [])
        .map((id) => authorsById.get(id))
        .filter(Boolean)
        .join(", ");

    const inv = invByBookId.get(b.id);
    const totalCopies = inv?.total ?? 0;
    const availableCopies = inv?.available ?? 0;

    return {
        id: String(b.id),
        title: b.title,
        authors: authors || "—",
        genre: b.genre ?? null,
        year: yearFromDateString(b.publicationYear),
        description: `${b.publishingHouse ?? ""}${b.isbn ? ` · ISBN ${b.isbn}` : ""}`.trim() || "—",
        coverUrl: null,
        totalCopies,
        availableCopies,
    };
}

export async function getCatalogFacets(): Promise<{ genres: string[]; years: number[] }> {
    const [books, _a, _i] = await Promise.all([
        http<BookDTO[]>(`/books?page=1&size=10000&sortBy=title&sortDir=asc`),
        loadAllAuthors(),
        loadAllInventories(),
    ]);

    const genres = Array.from(new Set(books.map((b) => b.genre).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
    );

    const years = Array.from(
        new Set(
            books
                .map((b) => Number(String(b.publicationYear ?? "").slice(0, 4)))
                .filter((x) => Number.isFinite(x))
        )
    ).sort((a, b) => b - a);

    return { genres, years };
}

export async function getCatalog(query: CatalogQuery): Promise<MaterialCardDto[]> {
    const sort = query.sort ?? "relevance";

    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("size", "10000");

    params.set("sortBy", "title");
    params.set("sortDir", sort === "title_desc" ? "desc" : "asc");

    if (query.genre) params.set("filter.genre", query.genre.trim());

    const [books, authorsById, invByBookId] = await Promise.all([
        http<BookDTO[]>(`/books?${params.toString()}`),
        loadAllAuthors(),
        loadAllInventories(),
    ]);

    let cards = books.map((b) => mapBookToCard(b, authorsById, invByBookId));

    if (query.q) {
        cards = cards.filter((x) => matchesFreeText(x, query.q!));
    }

    if (query.author) {
        const a = normalize(query.author);
        cards = cards.filter((x) => normalize(x.authors).includes(a));
    }

    const yf = typeof query.yearFrom === "number" ? query.yearFrom : null;
    const yt = typeof query.yearTo === "number" ? query.yearTo : null;
    const yearMin = yf !== null && yt !== null ? Math.min(yf, yt) : yf ?? yt;
    const yearMax = yf !== null && yt !== null ? Math.max(yf, yt) : yf ?? yt;

    if (yearMin !== null || yearMax !== null) {
        cards = cards.filter((x) => {
            const y = Number(String(x.year ?? ""));
            if (!Number.isFinite(y)) return false;
            if (yearMin !== null && y < yearMin) return false;
            return !(yearMax !== null && y > yearMax);
        });
    }

    if (query.availableOnly) {
        cards = cards.filter((x) => (x.availableCopies ?? 0) > 0);
    }

    if (sort === "available_desc")
        cards.sort((a, b) => (b.availableCopies ?? 0) - (a.availableCopies ?? 0));
    if (sort === "year_desc")
        cards.sort((a, b) => Number(b.year ?? -999999) - Number(a.year ?? -999999));
    if (sort === "year_asc")
        cards.sort((a, b) => Number(a.year ?? 999999) - Number(b.year ?? 999999));

    return cards;
}

export async function getMaterialCard(id: string): Promise<MaterialCardDto | null> {
    const [books, authorsById, invByBookId] = await Promise.all([
        http<BookDTO[]>(`/books?page=1&size=10000&sortBy=title&sortDir=asc`),
        loadAllAuthors(),
        loadAllInventories(),
    ]);

    const bookId = Number(id);
    const b = books.find((x) => x.id === bookId);
    return b ? mapBookToCard(b, authorsById, invByBookId) : null;
}

export async function listAllMaterials(): Promise<MaterialCardDto[]> {
    const [books, authorsById, invByBookId] = await Promise.all([
        http<BookDTO[]>(`/books?page=1&size=10000&sortBy=title&sortDir=asc`),
        loadAllAuthors(),
        loadAllInventories(),
    ]);

    return books.map((b) => mapBookToCard(b, authorsById, invByBookId));
}

export async function upsertMaterial(_input: MaterialCardDto): Promise<MaterialCardDto> {
    throw new Error("NOT_IMPLEMENTED");
}

export async function getMyLibrarian(): Promise<{ id: number; libraryId: number | null }> {
    return await http<{ id: number; userId?: number; libraryId: number | null }>(`/librarians/me`);
}

export async function listBookInventoriesRaw(): Promise<BookInventoryDTO[]> {
    return await http<BookInventoryDTO[]>(
        `/book-inventories?page=1&size=10000&sortBy=id&sortDir=asc`
    );
}

export async function createBookInventory(req: {
    bookId: number;
    libraryId: number;
    totalCopies: number;
    availableCopies: number;
}): Promise<BookInventoryDTO> {
    return await http<BookInventoryDTO>(`/book-inventories`, {
        method: "POST",
        body: JSON.stringify(req),
    });
}

export async function patchBookInventory(
    id: number,
    req: { totalCopies: number; availableCopies: number }
): Promise<BookInventoryDTO> {
    return await http<BookInventoryDTO>(`/book-inventories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(req),
    });
}
