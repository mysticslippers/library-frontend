import type { MaterialCardDto } from "../types/library";
import { materialCards } from "../fixtures/materials";
import { getActiveBookingsCountByMaterial } from "./bookingsMockApi";
import { getActiveIssuancesCountByMaterial } from "./issuancesMockApi";

export type CatalogQuery = {
    q?: string;
    genre?: string;
    sort?: "relevance" | "title_asc" | "title_desc" | "available_desc";
};

function normalize(s: string) {
    return s.trim().toLowerCase();
}

function withAvailability(x: MaterialCardDto): MaterialCardDto {
    const activeBookings = getActiveBookingsCountByMaterial(x.id);
    const activeIssuances = getActiveIssuancesCountByMaterial(x.id);
    const available = Math.max(0, x.totalCopies - activeBookings - activeIssuances);
    return { ...x, availableCopies: available };
}

export async function getCatalog(query: CatalogQuery): Promise<MaterialCardDto[]> {
    await new Promise((r) => setTimeout(r, 200));

    const q = query.q ? normalize(query.q) : "";
    const genre = query.genre ? normalize(query.genre) : "";
    const sort = query.sort ?? "relevance";

    let items = materialCards.map(withAvailability);

    if (q) {
        items = items.filter((x) => {
            const hay = normalize(`${x.title} ${x.authors} ${x.genre ?? ""} ${x.year ?? ""}`);
            return hay.includes(q);
        });
    }

    if (genre) {
        items = items.filter((x) => normalize(x.genre ?? "") === genre);
    }

    if (sort === "title_asc") items.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "title_desc") items.sort((a, b) => b.title.localeCompare(a.title));
    if (sort === "available_desc") items.sort((a, b) => (b.availableCopies ?? 0) - (a.availableCopies ?? 0));

    return items;
}

export async function getMaterialCard(id: string): Promise<MaterialCardDto | null> {
    await new Promise((r) => setTimeout(r, 120));
    const item = materialCards.find((x) => x.id === id);
    return item ? withAvailability(item) : null;
}
