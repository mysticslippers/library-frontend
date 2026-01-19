import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/shared/ui/PageHeader";
import Surface from "@/shared/ui/Surface";
import TextField from "@/shared/ui/TextField";
import Button from "@/shared/ui/Button";
import {
    getCatalogFacets,
    listAllMaterials,
    upsertMaterial,
} from "@/shared/api/libraryMockApi";
import type { MaterialCardDto } from "@/shared/types/library";

type FormState = {
    id: string;
    title: string;
    authors: string;
    genre: string;
    year: string;
    totalCopies: string;
    description: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function genId() {
    return `m_${Math.random().toString(16).slice(2, 10)}`;
}

export default function LibrarianBooksPage() {
    const [items, setItems] = useState<MaterialCardDto[]>([]);
    const [genres, setGenres] = useState<string[]>([]);
    const [years, setYears] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    const [mode, setMode] = useState<"create" | "edit">("create");
    const [errors, setErrors] = useState<FormErrors>({});
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<FormState>({
        id: genId(),
        title: "",
        authors: "",
        genre: "",
        year: "",
        totalCopies: "1",
        description: "",
    });

    const yearOptions = useMemo(() => ["", ...years.map(String)], [years]);

    const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
        setForm((p) => ({ ...p, [k]: v }));

    const refresh = async () => {
        setLoading(true);
        try {
            const [list, facets] = await Promise.all([
                listAllMaterials(),
                getCatalogFacets(),
            ]);
            setItems(list);
            setGenres(["", ...facets.genres]);
            setYears(facets.years);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const validate = (x: FormState): FormErrors => {
        const e: FormErrors = {};

        if (!x.title.trim()) e.title = "Обязательное поле";
        if (!x.authors.trim()) e.authors = "Обязательное поле";
        if (!x.description.trim()) e.description = "Обязательное поле";

        const copies = Number(x.totalCopies);
        if (!Number.isFinite(copies) || copies < 1) e.totalCopies = "Введите число ≥ 1";

        if (x.year.trim()) {
            const y = Number(x.year);
            if (!Number.isFinite(y) || x.year.trim().length !== 4) {
                e.year = "Формат: YYYY (например, 2008)";
            }
        }

        return e;
    };

    const resetToCreate = () => {
        setMode("create");
        setErrors({});
        setForm({
            id: genId(),
            title: "",
            authors: "",
            genre: "",
            year: "",
            totalCopies: "1",
            description: "",
        });
    };

    const onSubmit = async () => {
        const e = validate(form);
        setErrors(e);
        if (Object.keys(e).length) return;

        setSaving(true);
        try {
            await upsertMaterial({
                id: form.id,
                title: form.title.trim(),
                authors: form.authors.trim(),
                genre: form.genre.trim() || null,
                year: form.year.trim() || null,
                description: form.description.trim(),
                coverUrl: null,
                totalCopies: Number(form.totalCopies),
            });

            await refresh();
            resetToCreate();
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (x: MaterialCardDto) => {
        setMode("edit");
        setErrors({});
        setForm({
            id: x.id,
            title: x.title ?? "",
            authors: x.authors ?? "",
            genre: (x.genre ?? "") as string,
            year: (x.year ?? "") as string,
            totalCopies: String(x.totalCopies ?? 1),
            description: x.description ?? "",
        });
    };

    const cancelEdit = () => resetToCreate();

    return (
        <div className="p-6">
            <PageHeader
                title="Каталог (админ)"
                subtitle="Добавление и редактирование книг. Обязательные поля отмечены *."
                right={<Button onClick={refresh}>Обновить</Button>}
            />

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <Surface>
                        <div className="text-sm font-medium text-slate-600">Список материалов</div>

                        {loading ? (
                            <div className="mt-3 rounded-2xl border p-4 text-slate-600">Загрузка…</div>
                        ) : items.length === 0 ? (
                            <div className="mt-3 rounded-2xl border p-4 text-slate-600">Пока нет материалов.</div>
                        ) : (
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {items.map((x) => (
                                    <button
                                        key={x.id}
                                        onClick={() => startEdit(x)}
                                        className="text-left rounded-2xl border border-slate-200 p-4 hover:bg-brand-50/40 hover:border-brand-200 transition"
                                    >
                                        <div className="font-semibold text-slate-900">{x.title}</div>
                                        <div className="mt-1 text-sm text-slate-600">{x.authors}</div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            {(x.genre ?? "—")}
                                            {x.year ? ` · ${x.year}` : ""} · Экз.: {x.totalCopies}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </Surface>
                </div>

                <div className="lg:col-span-1">
                    <Surface>
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-medium text-slate-600">
                                {mode === "edit" ? "Редактирование" : "Добавление"} книги
                            </div>
                            {mode === "edit" ? (
                                <Button variant="secondary" onClick={cancelEdit}>
                                    Отмена
                                </Button>
                            ) : null}
                        </div>

                        <div className="mt-4 space-y-4">
                            <TextField
                                label="Название *"
                                value={form.title}
                                onChange={(e) => set("title", e.target.value)}
                                placeholder="Например: Clean Code"
                                error={errors.title}
                            />

                            <TextField
                                label="Автор(ы) *"
                                value={form.authors}
                                onChange={(e) => set("authors", e.target.value)}
                                placeholder="Например: Robert C. Martin"
                                error={errors.authors}
                            />

                            <label className="block">
                                <div className="text-sm font-medium text-slate-800">Описание *</div>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => set("description", e.target.value)}
                                    rows={5}
                                    placeholder="Краткое описание книги…"
                                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none
                             focus:border-brand-300 focus:ring-4 focus:ring-brand-200/40"
                                />
                                {errors.description ? (
                                    <div className="mt-1.5 text-sm text-red-600">{errors.description}</div>
                                ) : null}
                                <div className="mt-1 text-xs text-slate-500">
                                    Показывается читателю на странице книги.
                                </div>
                            </label>

                            <label className="block">
                                <div className="text-sm font-medium text-slate-800">Жанр</div>
                                <select
                                    value={form.genre}
                                    onChange={(e) => set("genre", e.target.value)}
                                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none
                             focus:border-brand-300 focus:ring-4 focus:ring-brand-200/40"
                                >
                                    {genres.map((g) => (
                                        <option key={g || "_all"} value={g}>
                                            {g ? g : "—"}
                                        </option>
                                    ))}
                                </select>
                                <div className="mt-1 text-xs text-slate-500">Можно оставить пустым.</div>
                            </label>

                            <label className="block">
                                <div className="text-sm font-medium text-slate-800">Год издания</div>
                                <select
                                    value={form.year}
                                    onChange={(e) => set("year", e.target.value)}
                                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none
                             focus:border-brand-300 focus:ring-4 focus:ring-brand-200/40"
                                >
                                    {yearOptions.map((y) => (
                                        <option key={y || "_any"} value={y}>
                                            {y ? y : "—"}
                                        </option>
                                    ))}
                                </select>
                                {errors.year ? <div className="mt-1.5 text-sm text-red-600">{errors.year}</div> : null}
                                <div className="mt-1 text-xs text-slate-500">Формат: YYYY (например, 1999).</div>
                            </label>

                            <TextField
                                label="Количество экземпляров *"
                                value={form.totalCopies}
                                onChange={(e) => set("totalCopies", e.target.value)}
                                placeholder="Например: 5"
                                error={errors.totalCopies}
                            />

                            <Button variant="primary" onClick={onSubmit} disabled={saving}>
                                {saving ? "Сохраняем…" : mode === "edit" ? "Сохранить изменения" : "Добавить книгу"}
                            </Button>
                        </div>
                    </Surface>
                </div>
            </div>
        </div>
    );
}
