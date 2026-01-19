import { useEffect, useState } from "react";
import StatusBadge from "../../../shared/ui/StatusBadge";
import { cancelBookingByStaff, listBookingsForStaff, type StaffBookingRow } from "@/shared/api/bookingsMockApi";
import { issueFromBooking } from "@/shared/api/issuancesMockApi";

export default function BookingsPage() {
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("");
    const [items, setItems] = useState<StaffBookingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        listBookingsForStaff({ q, status })
            .then(setItems)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const onIssue = async (row: StaffBookingRow) => {
        try {
            setBusyId(row.id);
            await issueFromBooking({ readerId: row.readerId, bookingId: row.id });
            load();
        } catch (e: any) {
            alert(`Не удалось оформить выдачу: ${String(e?.message ?? "")}`);
        } finally {
            setBusyId(null);
        }
    };

    const onCancel = async (row: StaffBookingRow) => {
        try {
            setBusyId(row.id);
            await cancelBookingByStaff({ bookingId: row.id });
            load();
        } catch (e: any) {
            alert(`Не удалось отменить бронь: ${String(e?.message ?? "")}`);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
              Брони
            </span>
                    </h1>
                    <p className="mt-1 text-slate-600">Поиск, фильтры и действия по бронированиям.</p>
                </div>

                <button
                    onClick={load}
                    className="rounded-2xl border border-slate-200 px-4 py-2 font-semibold hover:bg-brand-50 hover:border-brand-200 transition"
                >
                    Обновить
                </button>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_16px_50px_-30px_rgba(2,6,23,0.25)]">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <label className="md:col-span-8 block">
                        <div className="text-sm font-medium text-slate-800">Поиск</div>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="bookingId / readerId / materialId / title…"
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none
                         focus:border-brand-300 focus:ring-4 focus:ring-brand-200/40"
                        />
                    </label>

                    <label className="md:col-span-4 block">
                        <div className="text-sm font-medium text-slate-800">Статус</div>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none
                         focus:border-brand-300 focus:ring-4 focus:ring-brand-200/40"
                        >
                            <option value="">Все</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                            <option value="EXPIRED">EXPIRED</option>
                        </select>
                    </label>
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                        onClick={load}
                        className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 font-semibold text-white
                       shadow-[0_12px_30px_-15px_rgba(124,58,237,0.65)]
                       hover:brightness-105 active:translate-y-[1px] transition"
                    >
                        Применить
                    </button>

                    <button
                        onClick={() => {
                            setQ("");
                            setStatus("");
                            setTimeout(load, 0);
                        }}
                        className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold hover:bg-brand-50 hover:border-brand-200 transition"
                    >
                        Сбросить
                    </button>

                    <div className="ml-auto text-sm text-slate-600 self-center">
                        {loading ? "Загрузка…" : `Найдено: ${items.length}`}
                    </div>
                </div>

                <div className="mt-5 overflow-auto">
                    {loading ? (
                        <div className="rounded-2xl border border-slate-200 p-6 text-slate-600">Загрузка списка…</div>
                    ) : items.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 p-6 text-slate-600">
                            Брони не найдены. Создай бронь читателем, чтобы тут появились данные.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="text-left text-slate-600">
                            <tr className="border-b">
                                <th className="py-3 pr-4">ID</th>
                                <th className="py-3 pr-4">Книга</th>
                                <th className="py-3 pr-4">Reader</th>
                                <th className="py-3 pr-4">Дата</th>
                                <th className="py-3 pr-4">Дедлайн</th>
                                <th className="py-3 pr-4">Статус</th>
                                <th className="py-3 pr-2 text-right">Действия</th>
                            </tr>
                            </thead>

                            <tbody>
                            {items.map((x) => {
                                const disabled = busyId === x.id;
                                const canIssue = x.status === "ACTIVE";
                                const canCancel = x.status === "ACTIVE";

                                return (
                                    <tr key={x.id} className="border-b last:border-b-0">
                                        <td className="py-3 pr-4 font-mono text-xs text-slate-700">{x.id}</td>
                                        <td className="py-3 pr-4 font-semibold text-slate-900">{x.materialTitle}</td>
                                        <td className="py-3 pr-4 font-mono text-xs text-slate-700">{x.readerId}</td>
                                        <td className="py-3 pr-4 text-slate-700">{x.bookingDate}</td>
                                        <td className="py-3 pr-4 text-slate-700">{x.bookingDeadline}</td>
                                        <td className="py-3 pr-4">
                                            <StatusBadge value={String(x.status)} />
                                        </td>
                                        <td className="py-3 pr-2">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    disabled={disabled || !canIssue}
                                                    onClick={() => onIssue(x)}
                                                    className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-3 py-2 font-semibold text-white
                                       hover:brightness-105 transition disabled:opacity-60"
                                                >
                                                    {busyId === x.id ? "…" : "Выдать"}
                                                </button>

                                                <button
                                                    disabled={disabled || !canCancel}
                                                    onClick={() => onCancel(x)}
                                                    className="rounded-2xl border border-red-200 px-3 py-2 font-semibold text-red-700
                                       hover:bg-red-50 transition disabled:opacity-60"
                                                >
                                                    Отменить
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
