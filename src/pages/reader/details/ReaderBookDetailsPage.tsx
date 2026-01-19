import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import PageHeader from "@/shared/ui/PageHeader";
import Surface from "@/shared/ui/Surface";
import { getMaterialCard } from "@/shared/api/libraryMockApi";
import { createBooking } from "@/shared/api/bookingsMockApi";

export default function ReaderBookDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const user = useSelector((s: RootState) => s.auth.user);

    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState<Awaited<ReturnType<typeof getMaterialCard>>>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const materialId = useMemo(() => id ?? "", [id]);
    const backTo = (location.state as any)?.from ?? "/reader/catalog";

    useEffect(() => {
        let alive = true;
        setLoading(true);
        getMaterialCard(materialId)
            .then((x) => alive && setItem(x))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [materialId]);

    const canBook = (item?.availableCopies ?? 0) > 0;

    const onBook = async () => {
        if (!user) return;
        try {
            setActionLoading(true);
            await createBooking({ readerId: user.id, materialId, libraryId: "1" });
            navigate("/reader/reservations");
        } catch (e: any) {
            const code = String(e?.message ?? "");
            if (code === "ALREADY_BOOKED") alert("У вас уже есть активная бронь на этот материал.");
            else if (code === "NOT_AVAILABLE") alert("К сожалению, сейчас нет доступных копий.");
            else alert("Не удалось создать бронь.");
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
                    </Surface>
                </div>

                <div className="lg:col-span-1">
                    <Surface>
                        <div className="text-sm font-medium text-slate-600">Доступность</div>
                        <div className="mt-2 text-2xl font-bold text-slate-900">
                            {canBook ? (
                                <>
                                    <span className="text-emerald-700">{item.availableCopies}</span>
                                    <span className="text-slate-600 font-semibold"> / {item.totalCopies}</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-red-600">Нет</span>
                                    <span className="text-slate-600 font-semibold"> / {item.totalCopies}</span>
                                </>
                            )}
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

                        {!canBook ? <div className="mt-2 text-sm text-slate-600">Сейчас нет доступных копий.</div> : null}
                    </Surface>
                </div>
            </div>
        </div>
    );
}
