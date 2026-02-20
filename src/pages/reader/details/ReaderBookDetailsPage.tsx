import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import PageHeader from "@/shared/ui/PageHeader";
import Surface from "@/shared/ui/Surface";
import { getMaterialCard } from "@/shared/api/libraryMockApi";
import { createBooking } from "@/shared/api/bookingsMockApi";
import { getDefaultLibraryId } from "@/shared/api/librariesApi";

export default function ReaderBookDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const user = useSelector((s: RootState) => s.auth.user);

    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState<Awaited<ReturnType<typeof getMaterialCard>>>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [libraryId, setLibraryId] = useState<string | null>(null);

    const materialId = useMemo(() => id ?? "", [id]);
    const backTo = (location.state as any)?.from ?? "/reader/catalog";

    useEffect(() => {
        let alive = true;

        setLoading(true);

        Promise.all([getMaterialCard(materialId), getDefaultLibraryId()])
            .then(([x, fallbackLibId]) => {
                if (!alive) return;
                setItem(x);

                const libs = x?.libraries ?? [];
                const best =
                    libs.find((l) => l.availableCopies > 0)?.libraryId ??
                    libs[0]?.libraryId ??
                    fallbackLibId;

                setLibraryId(best ?? null);
            })
            .finally(() => alive && setLoading(false));

        return () => {
            alive = false;
        };
    }, [materialId]);

    const libs = item?.libraries ?? [];

    const selectedLib = useMemo(() => {
        if (!libraryId) return null;
        return libs.find((l) => l.libraryId === libraryId) ?? null;
    }, [libs, libraryId]);

    const selectedAvailable = selectedLib?.availableCopies ?? 0;
    const selectedTotal = selectedLib?.totalCopies ?? 0;

    const overallAvailable = item?.availableCopies ?? 0;
    const overallTotal = item?.totalCopies ?? 0;

    const canBook = selectedLib ? selectedAvailable > 0 : overallAvailable > 0;

    const onBook = async () => {
        if (!user) return;
        try {
            setActionLoading(true);

            // если библиотека не выбрана (на всякий), фолбэчимся
            const libId = libraryId ?? (await getDefaultLibraryId());

            await createBooking({ readerId: user.id, materialId, libraryId: libId });
            navigate("/reader/reservations");
        } catch (e: any) {
            const code = String(e?.message ?? "");
            if (code === "ALREADY_BOOKED") alert("У вас уже есть активная бронь на этот материал.");
            else if (code === "NOT_AVAILABLE") alert("К сожалению, сейчас нет доступных копий в выбранной библиотеке.");
            else alert(e?.message ? String(e.message) : "Не удалось создать бронь.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-6 text-slate-600">Загрузка…</div>;

    if (!item) {
        return (
            <div className="p-6">
                <div className="text-slate-600">Материал не найден.</div>
                <Link className="text-brand-700 hover:underline" to={backTo}>
                    Назад к каталогу
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6">
            <PageHeader
                title={item.title}
                subtitle={`${item.authors}${item.year ? ` · ${item.year}` : ""}${item.genre ? ` · ${item.genre}` : ""}`}
                actionLabel="К каталогу"
                actionTo={backTo}
            />

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <Surface>
                        <div className="text-sm font-medium text-slate-600">Описание</div>
                        <div className="mt-2 text-slate-700">{item.description ?? "Описание не задано."}</div>

                        {libs.length ? (
                            <div className="mt-6">
                                <div className="text-sm font-medium text-slate-600">Где взять</div>

                                <div className="mt-2 space-y-2">
                                    {libs.map((l) => {
                                        const chosen = l.libraryId === libraryId;
                                        const disabled = l.availableCopies <= 0;

                                        return (
                                            <label
                                                key={l.libraryId}
                                                className={`flex items-start gap-3 rounded-2xl border p-3 cursor-pointer transition
                                                    ${chosen ? "border-brand-300 bg-brand-50/40" : "border-slate-200 bg-white"}
                                                    ${disabled ? "opacity-70" : "hover:border-brand-200 hover:bg-brand-50/30"}
                                                `}
                                            >
                                                <input
                                                    type="radio"
                                                    name="library"
                                                    checked={chosen}
                                                    onChange={() => setLibraryId(l.libraryId)}
                                                    className="mt-1"
                                                />

                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-semibold text-slate-900 truncate">
                                                        {l.address}
                                                    </div>
                                                    <div className="mt-0.5 text-sm text-slate-600">
                                                        Доступно:{" "}
                                                        <span className={l.availableCopies > 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-600"}>
                                                            {l.availableCopies}
                                                        </span>{" "}
                                                        <span className="text-slate-500">/ {l.totalCopies}</span>
                                                    </div>
                                                    <div className="mt-0.5 text-xs text-slate-500 font-mono">ID: {l.libraryId}</div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>

                                <div className="mt-2 text-xs text-slate-500">
                                    Выберите библиотеку — бронь будет создана именно для неё (и подтверждать её сможет админ/персонал этой библиотеки).
                                </div>
                            </div>
                        ) : null}
                    </Surface>
                </div>

                <div className="lg:col-span-1">
                    <Surface>
                        <div className="text-sm font-medium text-slate-600">Доступность</div>

                        <div className="mt-2 space-y-2">
                            <div>
                                <div className="text-xs text-slate-500">В выбранной библиотеке</div>
                                <div className="text-2xl font-bold text-slate-900">
                                    {selectedLib ? (
                                        selectedAvailable > 0 ? (
                                            <>
                                                <span className="text-emerald-700">{selectedAvailable}</span>
                                                <span className="text-slate-600 font-semibold"> / {selectedTotal}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-red-600">Нет</span>
                                                <span className="text-slate-600 font-semibold"> / {selectedTotal}</span>
                                            </>
                                        )
                                    ) : (
                                        <>
                                            <span className={overallAvailable > 0 ? "text-emerald-700" : "text-red-600"}>
                                                {overallAvailable > 0 ? overallAvailable : "Нет"}
                                            </span>
                                            <span className="text-slate-600 font-semibold"> / {overallTotal}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200">
                                <div className="text-xs text-slate-500">Всего по всем библиотекам</div>
                                <div className="text-lg font-semibold text-slate-900">
                                    <span className={overallAvailable > 0 ? "text-emerald-700" : "text-red-600"}>
                                        {overallAvailable > 0 ? overallAvailable : "Нет"}
                                    </span>
                                    <span className="text-slate-600 font-semibold"> / {overallTotal}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={!canBook || actionLoading}
                            onClick={onBook}
                            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 font-semibold text-white
                         shadow-[0_12px_30px_-15px_rgba(124,58,237,0.65)]
                         hover:brightness-105 active:translate-y-[1px] transition disabled:opacity-60"
                        >
                            {actionLoading ? "Бронируем…" : "Забронировать"}
                        </button>

                        {!canBook ? (
                            <div className="mt-2 text-sm text-slate-600">
                                В выбранной библиотеке сейчас нет доступных копий.
                            </div>
                        ) : null}

                        {libs.length === 0 ? (
                            <div className="mt-2 text-xs text-slate-500">
                                Подробной разбивки по библиотекам нет — будет использована библиотека по умолчанию.
                            </div>
                        ) : null}
                    </Surface>
                </div>
            </div>
        </div>
    );
}