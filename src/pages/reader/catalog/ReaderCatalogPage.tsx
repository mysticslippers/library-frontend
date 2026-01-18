import { useEffect, useMemo, useState } from "react";
import { getCatalog } from "@/shared/api/libraryMockApi";
import type { MaterialCardDto } from "@/shared/types/library";
import MaterialCard from "./components/MaterialCard";

export default function ReaderCatalogPage() {
    const [q, setQ] = useState("");
    const [genre, setGenre] = useState("");
    const [sort, setSort] = useState<"relevance" | "title_asc" | "title_desc" | "available_desc">("relevance");
    const [items, setItems] = useState<MaterialCardDto[]>([]);
    const [loading, setLoading] = useState(true);

    const genres = useMemo(() => ["", "Software", "Fiction"], []);

    useEffect(() => {
        let alive = true;
        setLoading(true);

        getCatalog({ q, genre: genre || undefined, sort })
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
    }, [q, genre, sort]);

    return (
        <div className="p-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-700">Каталог</h1>
                    <p className="mt-1 text-slate-600">Ищите книги и бронируйте доступные экземпляры.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <label className="md:col-span-6 block">
                        <div className="text-sm font-medium text-slate-700">Поиск</div>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Название, автор, жанр..."
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-200"
                        />
                    </label>

                    <label className="md:col-span-3 block">
                        <div className="text-sm font-medium text-slate-700">Жанр</div>
                        <select
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-200 bg-white"
                        >
                            {genres.map((g) => (
                                <option key={g} value={g}>
                                    {g ? g : "Все"}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="md:col-span-3 block">
                        <div className="text-sm font-medium text-slate-700">Сортировка</div>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as any)}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-200 bg-white"
                        >
                            <option value="relevance">По релевантности</option>
                            <option value="title_asc">Название (А → Я)</option>
                            <option value="title_desc">Название (Я → А)</option>
                            <option value="available_desc">Сначала доступные</option>
                        </select>
                    </label>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600">
                    <div>Найдено: {loading ? "..." : items.length}</div>
                    <button
                        className="rounded-xl border px-3 py-1.5 hover:bg-brand-50 hover:border-brand-200"
                        onClick={() => {
                            setQ("");
                            setGenre("");
                            setSort("relevance");
                        }}
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
                            <MaterialCard key={m.id} item={m} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
