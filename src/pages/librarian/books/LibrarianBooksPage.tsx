import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/shared/ui/PageHeader";
import Surface from "@/shared/ui/Surface";
import TextField from "@/shared/ui/TextField";
import Button from "@/shared/ui/Button";

import { getCatalogFacets, listAllMaterials } from "@/shared/api/libraryMockApi";
import type { MaterialCardDto } from "@/shared/types/library";
import { getAuthHeaders } from "@/shared/api/authApi";

const API_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8080";

type ApiResponse<T = any> = {
    status: "SUCCESS" | "ERROR";
    message?: string;
    data?: T | null;
    errors?: string[] | null;
};

type LibraryDTO = {
    id: number;
    address: Record<string, any>;
    staffNumber: number;
    status: "ACTIVE" | "CLOSED";
    bookIds?: number[];
};

type LibrarianDTO = {
    id: number;
    userId: number;
    libraryId: number | null;
};

type BookInventoryDTO = {
    id: number;
    bookId: number;
    libraryId: number;
    totalCopies: number;
    availableCopies: number;
};

type FormState = {
    search: string;
    selectedBookId: string;
    selectedBookQuery: string;
    copiesToAdd: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

async function http<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
            ...getAuthHeaders(), // Authorization: Bearer <JWT>
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

function normalize(s: string) {
    return (s ?? "").trim().toLowerCase();
}

function prettyAddress(addr?: Record<string, any> | null): string {
    if (!addr) return "—";

    const order = [
        "country",
        "region",
        "state",
        "province",
        "city",
        "settlement",
        "street",
        "house",
        "building",
        "block",
        "apartment",
        "zip",
        "postalCode",
    ];

    const parts: string[] = [];
    for (const k of order) {
        const v = (addr as any)[k];
        if (v === null || v === undefined) continue;
        const s = String(v).trim();
        if (!s) continue;
        parts.push(s);
    }

    if (!parts.length) {
        for (const [, v] of Object.entries(addr)) {
            if (v === null || v === undefined) continue;
            if (typeof v === "object") continue;
            const s = String(v).trim();
            if (!s) continue;
            parts.push(s);
        }
    }

    return parts.length ? parts.join(", ") : "—";
}

function makeOptionLabel(x: MaterialCardDto) {
    const title = x.title ?? "—";
    const authors = x.authors ? ` — ${x.authors}` : "";
    const year = x.year ? ` (${x.year})` : "";
    return `${title}${authors}${year} [id:${x.id}]`;
}

export default function LibrarianBooksPage() {
    const [items, setItems] = useState<MaterialCardDto[]>([]);
    const [genres, setGenres] = useState<string[]>([]);
    const [years, setYears] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    const [errors, setErrors] = useState<FormErrors>({});
    const [saving, setSaving] = useState(false);

    const [libraryId, setLibraryId] = useState<number | null>(null);
    const [libraryAddress, setLibraryAddress] = useState<string>("—");

    const [form, setForm] = useState<FormState>({
        search: "",
        selectedBookId: "",
        selectedBookQuery: "",
        copiesToAdd: "",
    });

    const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
        setForm((p) => ({ ...p, [k]: v }));

    const refresh = async () => {
        setLoading(true);
        try {
            const [list, facets, me, libs] = await Promise.all([
                listAllMaterials(),
                getCatalogFacets(),
                http<LibrarianDTO>(`/librarians/me`),
                http<LibraryDTO[]>(`/libraries?page=0&size=10000&sortBy=id&sortDir=asc`),
            ]);

            setItems(list);
            setGenres(["", ...facets.genres]);
            setYears(facets.years);

            const lid = me?.libraryId ?? null;
            setLibraryId(lid);

            const lib = lid ? libs.find((x) => x.id === lid) : null;
            setLibraryAddress(prettyAddress(lib?.address ?? null));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const filtered = useMemo(() => {
        const q = normalize(form.search);
        if (!q) return items;

        return items.filter((x) => {
            const hay = normalize(
                [
                    x.id,
                    x.title ?? "",
                    x.authors ?? "",
                    x.genre ?? "",
                    x.year ?? "",
                    x.description ?? "",
                ].join(" ")
            );
            return hay.includes(q);
        });
    }, [items, form.search]);

    const selectedBook = useMemo(() => {
        if (!form.selectedBookId) return null;
        return items.find((x) => String(x.id) === String(form.selectedBookId)) ?? null;
    }, [items, form.selectedBookId]);

    const bookSuggestions = useMemo(() => {
        const q = normalize(form.selectedBookQuery);
        const base = items;

        if (!q) return base.slice(0, 50);

        const scored = base
            .map((x) => {
                const label = normalize(makeOptionLabel(x));
                const score =
                    normalize(String(x.id)) === q
                        ? 4
                        : label.startsWith(q)
                            ? 3
                            : label.includes(q)
                                ? 2
                                : 0;
                return { x, score, label };
            })
            .filter((r) => r.score > 0)
            .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
            .slice(0, 50)
            .map((r) => r.x);

        return scored.length ? scored : base.slice(0, 50);
    }, [items, form.selectedBookQuery]);

    const validate = (x: FormState): FormErrors => {
        const e: FormErrors = {};

        if (!x.selectedBookId) e.selectedBookId = "Выберите книгу (можно начать вводить название/автора)";

        const n = Number(x.copiesToAdd);
        if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
            e.copiesToAdd = "Укажите целое число ≥ 1";
        }

        return e;
    };

    const resetForm = () => {
        setErrors({});
        setForm({ search: "", selectedBookId: "", selectedBookQuery: "", copiesToAdd: "" });
    };

    const onSubmit = async () => {
        const e = validate(form);
        setErrors(e);
        if (Object.keys(e).length) return;

        if (!libraryId) {
            setErrors((p) => ({
                ...p,
                selectedBookId: "У библиотекаря не назначена библиотека (libraryId отсутствует)",
            }));
            return;
        }

        const bookId = Number(form.selectedBookId);
        const delta = Number(form.copiesToAdd);

        setSaving(true);
        try {
            // ✅ page=0 (иначе можно не увидеть нужную запись)
            const invs = await http<BookInventoryDTO[]>(
                `/book-inventories?page=0&size=100000&sortBy=id&sortDir=asc`
            );

            const existing =
                invs.find((x) => x.bookId === bookId && x.libraryId === libraryId) ?? null;

            if (!existing) {
                await http<BookInventoryDTO>(`/book-inventories`, {
                    method: "POST",
                    body: JSON.stringify({
                        bookId,
                        libraryId,
                        totalCopies: delta,
                        availableCopies: delta,
                    }),
                });
            } else {
                await http<BookInventoryDTO>(`/book-inventories/${existing.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                        totalCopies: (existing.totalCopies ?? 0) + delta,
                        availableCopies: (existing.availableCopies ?? 0) + delta,
                    }),
                });
            }

            await refresh();
            resetForm();
        } catch (e: any) {
            alert(`Не удалось добавить копии: ${String(e?.message ?? "")}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6">
            <PageHeader
                title="Инвентарь книг (библиотекарь)"
                subtitle="Выберите книгу (можно вводить по буквам), библиотека определится автоматически, затем добавьте количество копий (1+)."
                right={<Button onClick={refresh}>Обновить</Button>}
            />

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <Surface>
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-medium text-slate-600">Каталог книг</div>
                            <div className="text-xs text-slate-500">
                                Жанров: {Math.max(0, genres.length - 1)} · лет: {years.length}
                            </div>
                        </div>

                        <div className="mt-3">
                            <TextField
                                label="Поиск по названию / автору / описанию"
                                value={form.search}
                                onChange={(e) => set("search", e.target.value)}
                                placeholder="Например: Martin, Clean Code, ISBN…"
                            />
                        </div>

                        {loading ? (
                            <div className="mt-3 rounded-2xl border p-4 text-slate-600">Загрузка…</div>
                        ) : items.length === 0 ? (
                            <div className="mt-3 rounded-2xl border p-4 text-slate-600">
                                Пока нет книг в каталоге.
                            </div>
                        ) : (
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filtered.map((x) => {
                                    const isActive = String(x.id) === String(form.selectedBookId);
                                    return (
                                        <button
                                            key={x.id}
                                            onClick={() => {
                                                setErrors((p) => ({ ...p, selectedBookId: undefined }));
                                                set("selectedBookId", String(x.id));
                                                set("selectedBookQuery", makeOptionLabel(x));
                                            }}
                                            className={[
                                                "text-left rounded-2xl border p-4 transition",
                                                isActive
                                                    ? "border-brand-300 bg-brand-50/60"
                                                    : "border-slate-200 hover:bg-brand-50/40 hover:border-brand-200",
                                            ].join(" ")}
                                        >
                                            <div className="font-semibold text-slate-900">{x.title}</div>
                                            <div className="mt-1 text-sm text-slate-600">{x.authors}</div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                {(x.genre ?? "—")}
                                                {x.year ? ` · ${x.year}` : ""} · Всего: {x.totalCopies ?? 0} ·
                                                Доступно: {x.availableCopies ?? 0}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </Surface>
                </div>

                <div className="lg:col-span-1">
                    <Surface>
                        <div className="text-sm font-medium text-slate-600">Добавить копии в библиотеку</div>

                        <div className="mt-4 space-y-4">
                            <label className="block">
                                <div className="text-sm font-medium text-slate-800">
                                    Выбранная книга *
                                </div>

                                <input
                                    list="books-suggest"
                                    value={form.selectedBookQuery}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        set("selectedBookQuery", v);
                                        setErrors((p) => ({ ...p, selectedBookId: undefined }));

                                        const m = v.match(/\[id:(.+?)\]\s*$/);
                                        if (m?.[1]) {
                                            set("selectedBookId", String(m[1]));
                                            return;
                                        }

                                        const exact = items.find((x) => makeOptionLabel(x) === v);
                                        set("selectedBookId", exact ? String(exact.id) : "");
                                    }}
                                    placeholder="Начните вводить название/автора…"
                                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none
                             focus:border-brand-300 focus:ring-4 focus:ring-brand-200/40"
                                />
                                <datalist id="books-suggest">
                                    {bookSuggestions.map((x) => (
                                        <option key={x.id} value={makeOptionLabel(x)} />
                                    ))}
                                </datalist>

                                {errors.selectedBookId ? (
                                    <div className="mt-1.5 text-sm text-red-600">
                                        {errors.selectedBookId}
                                    </div>
                                ) : null}

                                {selectedBook ? (
                                    <div className="mt-2 text-xs text-slate-500">
                                        Сейчас в каталоге: всего {selectedBook.totalCopies ?? 0}, доступно{" "}
                                        {selectedBook.availableCopies ?? 0}.
                                    </div>
                                ) : null}
                            </label>

                            <div className="rounded-2xl border border-slate-200 p-4">
                                <div className="text-sm font-medium text-slate-800">Библиотека</div>
                                <div className="mt-1 text-sm text-slate-700">
                                    ID: {libraryId ?? "—"}
                                </div>
                                <div className="mt-1 text-xs text-slate-500 break-words">
                                    Адрес: {libraryAddress}
                                </div>
                            </div>

                            <TextField
                                label="Укажите количество копий для добавления (1+) *"
                                value={form.copiesToAdd}
                                onChange={(e) => set("copiesToAdd", e.target.value)}
                                placeholder="Например: 3"
                                error={errors.copiesToAdd}
                            />

                            <Button variant="primary" onClick={onSubmit} disabled={saving || loading}>
                                {saving ? "Сохраняем…" : "Добавить копии"}
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={resetForm}
                                disabled={saving || loading}
                            >
                                Сбросить
                            </Button>
                        </div>
                    </Surface>
                </div>
            </div>
        </div>
    );
}