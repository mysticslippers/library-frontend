import type { MaterialCardDto } from "../types/library";
import { materialCards as seedCards } from "../fixtures/materials";
import { getActiveBookingsCountByMaterial } from "./bookingsMockApi";
import { getActiveIssuancesCountByMaterial } from "./issuancesMockApi";

const LS_KEY = "lib.materialCards";

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

function normalize(s: string) {
    return s.trim().toLowerCase();
}

function readCards(): MaterialCardDto[] {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) {
            localStorage.setItem(LS_KEY, JSON.stringify(seedCards));
            return [...seedCards];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [...seedCards];
        return parsed as MaterialCardDto[];
    } catch {
        return [...seedCards];
    }
}

function writeCards(items: MaterialCardDto[]) {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
}

function withAvailability(x: MaterialCardDto): MaterialCardDto {
    const activeBookings = getActiveBookingsCountByMaterial(x.id);
    const activeIssuances = getActiveIssuancesCountByMaterial(x.id);
    const available = Math.max(0, x.totalCopies - activeBookings - activeIssuances);
    return { ...x, availableCopies: available };
}

function toYearNum(x?: string | null) {
    const n = Number(String(x ?? "").slice(0, 4));
    return Number.isFinite(n) ? n : null;
}

export async function getCatalogFacets(): Promise<{ genres: string[]; years: number[] }> {
    await new Promise((r) => setTimeout(r, 50));
    const items = readCards();

    const genres = Array.from(new Set(items.map((x) => x.genre).filter(Boolean) as string[]))
        .sort((a, b) => a.localeCompare(b));

    const years = Array.from(
        new Set(items.map((x) => toYearNum(x.year)).filter((x): x is number => x !== null))
    ).sort((a, b) => b - a);

    return { genres, years };
}

export async function getCatalog(query: CatalogQuery): Promise<MaterialCardDto[]> {
    await new Promise((r) => setTimeout(r, 150));

    const q = query.q ? normalize(query.q) : "";
    const author = query.author ? normalize(query.author) : "";
    const genre = query.genre ? normalize(query.genre) : "";
    const sort = query.sort ?? "relevance";
    const availableOnly = Boolean(query.availableOnly);

    const yf = typeof query.yearFrom === "number" ? query.yearFrom : null;
    const yt = typeof query.yearTo === "number" ? query.yearTo : null;
    const yearMin = yf !== null && yt !== null ? Math.min(yf, yt) : yf ?? yt;
    const yearMax = yf !== null && yt !== null ? Math.max(yf, yt) : yf ?? yt;

    let items = readCards().map(withAvailability);

    if (q) {
        items = items.filter((x) => {
            const hay = normalize(`${x.title} ${x.authors} ${x.genre ?? ""} ${x.year ?? ""}`);
            return hay.includes(q);
        });
    }

    if (author) {
        items = items.filter((x) => normalize(x.authors).includes(author));
    }

    if (genre) {
        items = items.filter((x) => normalize(x.genre ?? "") === genre);
    }

    if (yearMin !== null || yearMax !== null) {
        items = items.filter((x) => {
            const y = toYearNum(x.year);
            if (y === null) return false;
            if (yearMin !== null && y < yearMin) return false;
            return !(yearMax !== null && y > yearMax);

        });
    }

    if (availableOnly) {
        items = items.filter((x) => (x.availableCopies ?? 0) > 0);
    }

    if (sort === "title_asc") items.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "title_desc") items.sort((a, b) => b.title.localeCompare(a.title));
    if (sort === "available_desc") items.sort((a, b) => (b.availableCopies ?? 0) - (a.availableCopies ?? 0));
    if (sort === "year_desc")
        items.sort((a, b) => (toYearNum(b.year) ?? -999999) - (toYearNum(a.year) ?? -999999));
    if (sort === "year_asc")
        items.sort((a, b) => (toYearNum(a.year) ?? 999999) - (toYearNum(b.year) ?? 999999));

    return items;
}

export async function getMaterialCard(id: string): Promise<MaterialCardDto | null> {
    await new Promise((r) => setTimeout(r, 80));
    const item = readCards().find((x) => x.id === id);
    return item ? withAvailability(item) : null;
}

export async function listAllMaterials(): Promise<MaterialCardDto[]> {
    await new Promise((r) => setTimeout(r, 80));
    return readCards().map(withAvailability);
}

export async function upsertMaterial(input: MaterialCardDto): Promise<MaterialCardDto> {
    await new Promise((r) => setTimeout(r, 120));

    const items = readCards();
    const idx = items.findIndex((x) => x.id === input.id);

    if (idx >= 0) items[idx] = { ...items[idx], ...input };
    else items.push(input);

    writeCards(items);
    return withAvailability(input);
}
