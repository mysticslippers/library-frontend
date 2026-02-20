import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { getCatalog, getCatalogFacets, listAllMaterials } from "@/shared/api/libraryMockApi";
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

    const [allMaterials, setAllMaterials] = useState<MaterialCardDto[] | null>(null);
    const [qDraft, setQDraft] = useState(q);
    const [authorDraft, setAuthorDraft] = useState(author);
    const [showQSuggestions, setShowQSuggestions] = useState(false);
    const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
    const hideTimers = useRef<{ q?: number; a?: number }>({});

    const from = `${location.pathname}${location.search}`;

    const setParam = (key: string, value?: string) => {
        const next = new URLSearchParams(sp);
        if (!value) next.delete(key);
        else next.set(key, value);
        setSp(next, { replace: true });
    };

    useEffect(() => {
        setQDraft(q);
    }, [q]);

    useEffect(() => {
        setAuthorDraft(author);
    }, [author]);

    useEffect(() => {
        getCatalogFacets().then((x) => {
            setGenres(["", ...x.genres]);
        });
    }, []);

    useEffect(() => {
        let alive = true;
        listAllMaterials()
            .then((x) => {
                if (!alive) return;
                setAllMaterials(x);
            })
            .catch(() => {
                if (!alive) return;
                setAllMaterials([]);
            });
        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        const t = window.setTimeout(() => {
            setParam("q", qDraft || undefined);
        }, 200);
        return () => window.clearTimeout(t);
    }, [qDraft]);

    useEffect(() => {
        const t = window.setTimeout(() => {
            setParam("author", authorDraft || undefined);
        }, 200);
        return () => window.clearTimeout(t);
    }, [authorDraft]);

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

    const normalizeYearInput = (v: string) => v.replace(/[^0-9]/g, "").slice(0, 4);

    const titleSuggestions = useMemo(() => {
        const src = allMaterials;
        const input = qDraft.trim().toLowerCase();
        if (!src || input.length < 2) return [] as string[];

        const uniq = new Set<string>();
        const starts: string[] = [];
        const contains: string[] = [];

        for (const m of src) {
            const t = (m.title ?? "").trim();
            if (!t) continue;
            if (uniq.has(t)) continue;

            const tl = t.toLowerCase();
            if (tl.startsWith(input)) {
                uniq.add(t);
                starts.push(t);
            } else if (tl.includes(input)) {
                uniq.add(t);
                contains.push(t);
            }

            if (starts.length >= 8 && contains.length >= 8) break;
        }

        return [...starts, ...contains].slice(0, 8);
    }, [allMaterials, qDraft]);

    const authorSuggestions = useMemo(() => {
        const src = allMaterials;
        const input = authorDraft.trim().toLowerCase();
        if (!src || input.length < 2) return [] as string[];

        const uniq = new Set<string>();
        const starts: string[] = [];
        const contains: string[] = [];

        for (const m of src) {
            const raw = (m.authors ?? "")
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean);

            for (const a of raw) {
                if (uniq.has(a)) continue;

                const al = a.toLowerCase();
                if (al.startsWith(input)) {
                    uniq.add(a);
                    starts.push(a);
                } else if (al.includes(input)) {
                    uniq.add(a);
                    contains.push(a);
                }

                if (starts.length >= 8 && contains.length >= 8) break;
            }

            if (starts.length >= 8 && contains.length >= 8) break;
        }

        return [...starts, ...contains].slice(0, 8);
    }, [allMaterials, authorDraft]);

    const cancelHideTimer = (which: "q" | "a") => {
        const id = hideTimers.current[which];
        if (id) window.clearTimeout(id);
        hideTimers.current[which] = undefined;
    };

    const scheduleHide = (which: "q" | "a") => {
        cancelHideTimer(which);
        hideTimers.current[which] = window.setTimeout(() => {
            if (which === "q") setShowQSuggestions(false);
            else setShowAuthorSuggestions(false);
        }, 120);
    };

    const highlightMatch = (text: string, query: string) => {
        const qn = query.trim();
        if (!qn) return text;

        const idx = text.toLowerCase().indexOf(qn.toLowerCase());
        if (idx < 0) return text;

        const before = text.slice(0, idx);
        const mid = text.slice(idx, idx + qn.length);
        const after = text.slice(idx + qn.length);

        return (
            <>
                {before}
                <mark className="rounded px-0.5 bg-slate-200/70">{mid}</mark>
                {after}
            </>
        );
    };

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
                        <div className="relative">
                            <input
                                value={qDraft}
                                onChange={(e) => {
                                    setQDraft(e.target.value);
                                    setShowQSuggestions(true);
                                }}
                                onFocus={() => {
                                    cancelHideTimer("q");
                                    setShowQSuggestions(true);
                                }}
                                onBlur={() => scheduleHide("q")}
                                placeholder="Начните вводить название или ключевое слово…"
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-200"
                                autoComplete="off"
                            />

                            <div className="mt-1 text-xs text-slate-500">
                                Подсказки появляются после 2 символов. Поиск работает по названию, авторам, жанру, году, ISBN и описанию.
                            </div>

                            {showQSuggestions && titleSuggestions.length > 0 ? (
                                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                                    <div className="px-3 py-2 text-xs font-medium text-slate-500 border-b bg-slate-50">
                                        Подсказки
                                    </div>
                                    {titleSuggestions.map((s) => (
                                        <button
                                            type="button"
                                            key={s}
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-brand-50"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                setQDraft(s);
                                                setShowQSuggestions(false);
                                            }}
                                        >
                                            {highlightMatch(s, qDraft)}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </label>

                    <label className="md:col-span-4 block">
                        <div className="text-sm font-medium text-slate-700">Автор</div>
                        <div className="relative">
                            <input
                                value={authorDraft}
                                onChange={(e) => {
                                    setAuthorDraft(e.target.value);
                                    setShowAuthorSuggestions(true);
                                }}
                                onFocus={() => {
                                    cancelHideTimer("a");
                                    setShowAuthorSuggestions(true);
                                }}
                                onBlur={() => scheduleHide("a")}
                                placeholder="Начните вводить фамилию или имя автора…"
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-200"
                                autoComplete="off"
                            />

                            <div className="mt-1 text-xs text-slate-500">Подсказки появляются после 2 символов.</div>

                            {showAuthorSuggestions && authorSuggestions.length > 0 ? (
                                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                                    <div className="px-3 py-2 text-xs font-medium text-slate-500 border-b bg-slate-50">
                                        Подсказки
                                    </div>
                                    {authorSuggestions.map((s) => (
                                        <button
                                            type="button"
                                            key={s}
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-brand-50"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                setAuthorDraft(s);
                                                setShowAuthorSuggestions(false);
                                            }}
                                        >
                                            {highlightMatch(s, authorDraft)}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
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
                                <option value="">Все</option>
                            )}
                        </select>
                    </label>

                    <label className="md:col-span-3 block">
                        <div className="text-sm font-medium text-slate-700">Год (от)</div>
                        <input
                            inputMode="numeric"
                            value={sp.get("yf") ?? ""}
                            onChange={(e) => {
                                const v = normalizeYearInput(e.target.value);
                                setParam("yf", v || undefined);
                            }}
                            placeholder="Например: 1990"
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-200 bg-white"
                        />
                    </label>

                    <label className="md:col-span-3 block">
                        <div className="text-sm font-medium text-slate-700">Год (до)</div>
                        <input
                            inputMode="numeric"
                            value={sp.get("yt") ?? ""}
                            onChange={(e) => {
                                const v = normalizeYearInput(e.target.value);
                                setParam("yt", v || undefined);
                            }}
                            placeholder="Например: 2024"
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-200 bg-white"
                        />
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