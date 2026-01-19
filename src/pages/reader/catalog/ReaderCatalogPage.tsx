import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { getCatalog, getCatalogFacets } from "@/shared/api/libraryMockApi";
import type { MaterialCardDto } from "@/shared/types/library";
import MaterialCard from "./components/MaterialCard";

type Sort =
    | "relevance"
    | "title_asc"
    | "title_desc"
    | "available_desc"
    | "year_desc"
    | "year_asc";

function getNum(v: string | null): number | undefined {
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

export default function ReaderCatalogPage() {
    const location = useLocation();
    const [sp, setSp] = useSearchParams();

    const q = sp.get("q") ?? "";
    const author = sp.get("author") ?? "";
    const genre = sp.get("genre") ?? "";
    const yearFrom = getNum(sp.get("yf"));
    const yearTo = getNum(sp.get("yt"));
    const availableOnly = sp.get("avail") === "1";
    const sort = (sp.get("sort") as Sort) ?? "relevance";

    const [items, setItems] = useState<MaterialCardDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [genres, setGenres] = useState<string[]>([]);
    const [years, setYears] = useState<number[]>([]);

    const from = `${location.pathname}${location.search}`;

    const setParam = (key: string, value?: string) => {
        const next = new URLSearchParams(sp);
        if (!value) next.delete(key);
        else next.set(key, value);
        setSp(next, { replace: true });
    };

    useEffect(() => {
        getCatalogFacets().then((x) => {
            setGenres(["", ...x.genres]);
            setYears(x.years);
        });
    }, []);

    useEffect(() => {
        let alive = true;
        setLoading(true);

        getCatalog({
            q: q || undefined,
            author: author || undefined,
            genre: genre || undefined,
            yearFrom,
            yearTo,
            availableOnly,
            sort,
        })
            .then((data) => {
                if (!alive) return;
                setItems(data);
            })
            .finally(() => {
                if (!alive) return;
                setLoading(false);
            });

        return () => {
            alive = false;
        };
    }, [q, author, genre, yearFrom, yearTo, availableOnly, sort]);

    const found = loading ? "..." : String(items.length);

    const yearOptions = useMemo(() => ["", ...years.map(String)], [years]);

    return (
        <div className="p-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-700">Каталог</h1>
                    <p className="mt-1 text-slate-600">Ищите книги по параметрам и бронируйте доступные экземпляры.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <label className="md:col-span-5 block">
                        <div className="text-sm font-medium text-slate-700">Поиск</div>
                        <input
                            value={q}
                            onChange={(e) => setParam("q", e.target.value || undefined)}
                            placeholder="Название, жанр, год…"
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-200"
                        />
                    </label>

                    <label className="md:col-span-4 block">
                        <div className="text-sm font-medium text-slate-700">Автор</div>
                        <input
                            value={author}
                            onChange={(e) => setParam("author", e.target.value || undefined)}
                            placeholder="Например: Булгаков"
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-200"
                        />
                    </label>

                    <label className="md:col-span-3 block">
                        <div className="text-sm font-medium text-slate-700">Жанр</div>
                        <select
                            value={genre}
                            onChange={(e) => setParam("genre", e.target.value || undefined)}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-200 bg-white"
                        >
                            {genres.length ? (
                                genres.map((g) => (
                                    <option key={g || "_all"} value={g}>
                                        {g ? g : "Все"}
                                    </option>
                                ))
                            ) : (
                                <>
                                    <option value="">Все</option>
                                </>
                            )}
                        </select>
                    </label>

                    <label className="md:col-span-3 block">
                        <div className="text-sm font-medium text-slate-700">Год (от)</div>
                        <select
                            value={yearFrom ? String(yearFrom) : ""}
                            onChange={(e) => setParam("yf", e.target.value || undefined)}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-200 bg-white"
                        >
                            {yearOptions.map((y) => (
                                <option key={y || "_any"} value={y}>
                                    {y ? y : "Любой"}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="md:col-span-3 block">
                        <div className="text-sm font-medium text-slate-700">Год (до)</div>
                        <select
                            value={yearTo ? String(yearTo) : ""}
                            onChange={(e) => setParam("yt", e.target.value || undefined)}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-200 bg-white"
                        >
                            {yearOptions.map((y) => (
                                <option key={y || "_any2"} value={y}>
                                    {y ? y : "Любой"}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="md:col-span-3 block">
                        <div className="text-sm font-medium text-slate-700">Сортировка</div>
                        <select
                            value={sort}
                            onChange={(e) => setParam("sort", e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-200 bg-white"
                        >
                            <option value="relevance">По релевантности</option>
                            <option value="available_desc">Сначала доступные</option>
                            <option value="year_desc">Год: новые → старые</option>
                            <option value="year_asc">Год: старые → новые</option>
                            <option value="title_asc">Название (А → Я)</option>
                            <option value="title_desc">Название (Я → А)</option>
                        </select>
                    </label>

                    <label className="md:col-span-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <input
                            type="checkbox"
                            checked={availableOnly}
                            onChange={(e) => setParam("avail", e.target.checked ? "1" : undefined)}
                        />
                        <span className="text-sm text-slate-700">Только доступные</span>
                    </label>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600">
                    <div>Найдено: {found}</div>

                    <button
                        className="rounded-xl border px-3 py-1.5 hover:bg-brand-50 hover:border-brand-200"
                        onClick={() => setSp(new URLSearchParams(), { replace: true })}
                    >
                        Сбросить
                    </button>
                </div>

                {loading ? (
                    <div className="rounded-2xl border p-6 text-slate-600">Загрузка каталога…</div>
                ) : items.length === 0 ? (
                    <div className="rounded-2xl border p-6 text-slate-600">Ничего не найдено.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((m) => (
                            <MaterialCard key={m.id} item={m} from={from} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
