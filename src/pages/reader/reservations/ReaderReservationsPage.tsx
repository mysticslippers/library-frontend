import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import type { BookingViewDto } from "@/shared/types/library";
import { cancelBooking, listMyBookings } from "@/shared/api/bookingsMockApi";
import { issueFromBooking } from "../../../shared/api/issuancesMockApi";

import { Link } from "react-router-dom";

export default function ReaderReservationsPage() {
    const user = useSelector((s: RootState) => s.auth.user);
    const [items, setItems] = useState<BookingViewDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = () => {
        if (!user) return;
        setLoading(true);
        listMyBookings(user.id)
            .then(setItems)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [user?.id]);

    const onCancel = async (bookingId: string) => {
        if (!user) return;
        try {
            setBusyId(bookingId);
            await cancelBooking({ readerId: user.id, bookingId });
            load();
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-700">Мои брони</h1>
                    <p className="mt-1 text-slate-600">Активные и прошлые бронирования.</p>
                </div>
                <Link className="rounded-xl border px-3 py-1.5 hover:bg-brand-50 hover:border-brand-200" to="/reader/catalog">
                    В каталог
                </Link>
            </div>

            <div className="mt-6">
                {loading ? (
                    <div className="rounded-2xl border p-6 text-slate-600">Загрузка…</div>
                ) : items.length === 0 ? (
                    <div className="rounded-2xl border p-6 text-slate-600">
                        Пока нет бронирований.{" "}
                        <Link className="text-brand-700 hover:underline" to="/reader/catalog">
                            Перейти в каталог
                        </Link>
                        .
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((b) => {
                            const isActive = b.status === "ACTIVE";
                            return (
                                <div key={b.id} className="rounded-2xl border bg-white p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="font-semibold">{b.material.title}</div>
                                            <div className="mt-1 text-sm text-slate-600">
                                                Дата брони: {b.bookingDate} · Дедлайн: {b.bookingDeadline}
                                            </div>
                                            <div className="mt-1 text-sm">
                                                Статус:{" "}
                                                <span className={isActive ? "text-emerald-700 font-semibold" : "text-slate-600"}>
                          {b.status}
                        </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link
                                                to={`/reader/books/${b.material.id}`}
                                                className="rounded-xl border px-3 py-1.5 hover:bg-brand-50 hover:border-brand-200"
                                            >
                                                Открыть
                                            </Link>

                                            <button
                                                disabled={!isActive || busyId === b.id}
                                                onClick={() => onCancel(b.id)}
                                                className="rounded-xl bg-white border border-red-200 text-red-700 px-3 py-1.5 hover:bg-red-50 disabled:opacity-60"
                                            >
                                                {busyId === b.id ? "Отмена…" : "Отменить"}
                                            </button>
                                        </div>

                                        <button
                                            disabled={!isActive || busyId === b.id}
                                            onClick={async () => {
                                                if (!user) return;
                                                try {
                                                    setBusyId(b.id);
                                                    await issueFromBooking({ readerId: user.id, bookingId: b.id });
                                                    window.location.href = "/reader/loans";
                                                } catch {
                                                    alert("Не удалось оформить выдачу (эмуляция).");
                                                } finally {
                                                    setBusyId(null);
                                                }
                                            }}
                                            className="rounded-xl bg-brand-600 text-white px-3 py-1.5 hover:bg-brand-700 disabled:opacity-60"
                                        >
                                            Получить
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
