import { useEffect, useState } from "react";
import StatusBadge from "../../../shared/ui/StatusBadge";
import {
    listIssuancesForStaff,
    returnIssuance,
    type StaffIssuanceRow,
} from "@/shared/api/issuancesMockApi";

export default function IssuancesPage() {
    const [q, setQ] = useState("");
    const [status, setStatus] = useState<"" | "OPEN" | "OVERDUE" | "RETURNED">("");
    const [items, setItems] = useState<StaffIssuanceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = (
        nextQ: string = q,
        nextStatus: "" | "OPEN" | "OVERDUE" | "RETURNED" = status
    ) => {
        setLoading(true);
        listIssuancesForStaff({ q: nextQ, status: nextStatus })
            .then(setItems)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const onReturn = async (issuanceId: string) => {
        try {
            setBusyId(issuanceId);
            await returnIssuance({ issuanceId });
            load();
        } catch (e: any) {
            alert(`Не удалось оформить возврат: ${String(e?.message ?? "")}`);
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
              Выдачи
            </span>
                    </h1>
                    <p className="mt-1 text-slate-600">Список выдач и быстрый возврат.</p>
                </div>

                <button
                    onClick={() => load()}
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
                            placeholder="issuanceId / bookingId / readerId / title…"
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none
                         focus:border-brand-300 focus:ring-4 focus:ring-brand-200/40"
                        />
                    </label>

                    <label className="md:col-span-4 block">
                        <div className="text-sm font-medium text-slate-800">Статус</div>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none
                         focus:border-brand-300 focus:ring-4 focus:ring-brand-200/40"
                        >
                            <option value="">Все</option>
                            <option value="OPEN">OPEN</option>
                            <option value="OVERDUE">OVERDUE</option>
                            <option value="RETURNED">RETURNED</option>
                        </select>
                    </label>
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => load()}
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
                            load("", "");
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
                        <div className="rounded-2xl border border-slate-200 p-6 text-slate-600">Загрузка…</div>
                    ) : items.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 p-6 text-slate-600">
                            Выдачи не найдены. Сначала оформите выдачу по брони.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="text-left text-slate-600">
                            <tr className="border-b">
                                <th className="py-3 pr-4">ID</th>
                                <th className="py-3 pr-4">Книга</th>
                                <th className="py-3 pr-4">Reader</th>
                                <th className="py-3 pr-4">Выдано</th>
                                <th className="py-3 pr-4">Вернуть до</th>
                                <th className="py-3 pr-4">Статус</th>
                                <th className="py-3 pr-2 text-right">Действия</th>
                            </tr>
                            </thead>

                            <tbody>
                            {items.map((x) => {
                                const disabled = busyId === x.id;
                                const canReturn = x.status !== "RETURNED";

                                return (
                                    <tr key={x.id} className="border-b last:border-b-0">
                                        <td className="py-3 pr-4 font-mono text-xs text-slate-700">{x.id}</td>
                                        <td className="py-3 pr-4 font-semibold text-slate-900">{x.materialTitle}</td>
                                        <td className="py-3 pr-4 font-mono text-xs text-slate-700">{x.readerId}</td>
                                        <td className="py-3 pr-4 text-slate-700">{x.issuanceDate}</td>
                                        <td className={`py-3 pr-4 ${x.status === "OVERDUE" ? "text-red-600 font-semibold" : "text-slate-700"}`}>
                                            {x.returnDeadline}
                                        </td>
                                        <td className="py-3 pr-4">
                                            <StatusBadge value={x.status} />
                                        </td>
                                        <td className="py-3 pr-2">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    disabled={disabled || !canReturn}
                                                    onClick={() => onReturn(x.id)}
                                                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold
                                       hover:bg-brand-50 hover:border-brand-200 transition disabled:opacity-60"
                                                >
                                                    {busyId === x.id ? "…" : "Вернуть"}
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
