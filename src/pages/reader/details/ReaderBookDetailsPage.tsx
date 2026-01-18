import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { getMaterialCard } from "@/shared/api/libraryMockApi";
import { createBooking } from "@/shared/api/bookingsMockApi";

export default function ReaderBookDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useSelector((s: RootState) => s.auth.user);

    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState<Awaited<ReturnType<typeof getMaterialCard>>>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const materialId = useMemo(() => id ?? "", [id]);

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
                <Link className="text-brand-700 hover:underline" to="/reader/catalog">
                    Назад к каталогу
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-700">{item.title}</h1>
                    <div className="mt-1 text-slate-600">{item.authors}</div>
                    <div className="mt-1 text-sm text-slate-500">
                        {(item.genre ?? "—")}{item.year ? ` · ${item.year}` : ""}
                    </div>
                </div>

                <Link className="rounded-xl border px-3 py-1.5 hover:bg-brand-50 hover:border-brand-200" to="/reader/catalog">
                    К каталогу
                </Link>
            </div>

            <div className="mt-6 rounded-2xl border p-4">
                <div className="text-sm text-slate-600">Доступность</div>
                <div className="mt-1 text-lg font-semibold">
                    {canBook ? `Доступно: ${item.availableCopies}` : "Нет в наличии"}
                    <span className="text-slate-500"> / {item.totalCopies}</span>
                </div>

                <button
                    disabled={!canBook || actionLoading}
                    className="mt-4 rounded-xl bg-brand-600 text-white px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60"
                    onClick={onBook}
                >
                    {actionLoading ? "Бронируем…" : "Забронировать"}
                </button>

                <div className="mt-3 text-sm text-slate-500">
                    Бронь действует до <b>3 дней</b> (для MVP).
                </div>
            </div>
        </div>
    );
}
