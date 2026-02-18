import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import type { BookingViewDto } from "@/shared/types/library";
import { cancelBooking, listMyBookings } from "@/shared/api/bookingsMockApi";
import { Link } from "react-router-dom";
import PageHeader from "@/shared/ui/PageHeader";
import Surface from "@/shared/ui/Surface";
import StatusBadge from "@/shared/ui/StatusBadge";

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
            <PageHeader
                title="Мои брони"
                subtitle="Активные и прошлые бронирования."
                actionLabel="В каталог"
                actionTo="/reader/catalog"
            />

            <div className="mt-6">
                <Surface>
                    {loading ? (
                        <div className="rounded-2xl border border-slate-200 p-6 text-slate-600">Загрузка…</div>
                    ) : items.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 p-6 text-slate-600">
                            Пока нет бронирований.{" "}
                            <Link className="text-brand-700 hover:underline" to="/reader/catalog">
                                Перейти в каталог
                            </Link>
                            .
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((b) => {
                                const isActive = b.status === "PENDING" || b.status === "RESERVED";
                                const disabled = busyId === b.id;

                                return (
                                    <div key={b.id} className="rounded-3xl border border-slate-200/70 bg-white p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-semibold text-slate-900">{b.material.title}</div>
                                                    <StatusBadge value={b.status} />
                                                </div>

                                                <div className="mt-1 text-sm text-slate-600">
                                                    Дата брони: {b.bookingDate} · Дедлайн:{" "}
                                                    <span className="font-semibold">{b.bookingDeadline}</span>
                                                </div>

                                                {isActive ? (
                                                    <div className="mt-1 text-sm text-slate-600">
                                                        Для получения книги обратитесь к библиотекарю (выдача оформляется сотрудником).
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="flex gap-2">
                                                <Link
                                                    to={`/reader/books/${b.material.id}`}
                                                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold
                                     hover:bg-brand-50 hover:border-brand-200 transition"
                                                >
                                                    Открыть
                                                </Link>

                                                <button
                                                    disabled={!isActive || disabled}
                                                    onClick={() => onCancel(b.id)}
                                                    className="rounded-2xl border border-red-200 bg-white px-3 py-2 font-semibold text-red-700
                                     hover:bg-red-50 transition disabled:opacity-60"
                                                >
                                                    {disabled ? "Отмена…" : "Отменить"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Surface>
            </div>
        </div>
    );
}
