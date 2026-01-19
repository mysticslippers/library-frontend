import { useEffect, useState } from "react";
import StatusBadge from "../../../shared/ui/StatusBadge";
import {
    listFinesForStaff,
    payFineByStaff,
    writeOffFineByStaff,
    type StaffFineRow,
} from "@/shared/api/finesMockApi";

export default function FinesPage() {
    const [q, setQ] = useState("");
    const [state, setState] = useState<"" | "UNPAID" | "PAID">("");
    const [items, setItems] = useState<StaffFineRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        listFinesForStaff({ q, state })
            .then(setItems)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const totalUnpaid = items
        .filter((x) => x.state === "UNPAID")
        .reduce((sum, x) => sum + (x.amount ?? 0), 0);

    const onPay = async (fineId: string) => {
        try {
            setBusyId(fineId);
            await payFineByStaff({ fineId });
            load();
        } catch (e: any) {
            alert(`Не удалось отметить оплату: ${String(e?.message ?? "")}`);
        } finally {
            setBusyId(null);
        }
    };

    const onWriteOff = async (fineId: string) => {
        try {
            setBusyId(fineId);
            await writeOffFineByStaff({ fineId });
            load();
        } catch (e: any) {
            alert(`Не удалось списать штраф: ${String(e?.message ?? "")}`);
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
              Штрафы
            </span>
                    </h1>
                    <p className="mt-1 text-slate-600">
                        Неоплачено: <b>{totalUnpaid.toFixed(2)} €</b>
                    </p>
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
                            placeholder="fineId / readerId / issuanceId / описание…"
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none
                         focus:border-brand-300 focus:ring-4 focus:ring-brand-200/40"
                        />
                    </label>

                    <label className="md:col-span-4 block">
                        <div className="text-sm font-medium text-slate-800">Статус</div>
                        <select
                            value={state}
                            onChange={(e) => setState(e.target.value as any)}
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none
                         focus:border-brand-300 focus:ring-4 focus:ring-brand-200/40"
                        >
                            <option value="">Все</option>
                            <option value="UNPAID">UNPAID</option>
                            <option value="PAID">PAID</option>
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
                            setState("");
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
                        <div className="rounded-2xl border border-slate-200 p-6 text-slate-600">Загрузка…</div>
                    ) : items.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 p-6 text-slate-600">
                            Штрафов нет. Просрочь выдачу (или поставь returnDeadline в прошлое) — и штраф появится.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="text-left text-slate-600">
                            <tr className="border-b">
                                <th className="py-3 pr-4">ID</th>
                                <th className="py-3 pr-4">Reader</th>
                                <th className="py-3 pr-4">Issuance</th>
                                <th className="py-3 pr-4">Описание</th>
                                <th className="py-3 pr-4">Сумма</th>
                                <th className="py-3 pr-4">Статус</th>
                                <th className="py-3 pr-2 text-right">Действия</th>
                            </tr>
                            </thead>

                            <tbody>
                            {items.map((x) => {
                                const disabled = busyId === x.id;
                                const isUnpaid = x.state === "UNPAID";

                                return (
                                    <tr key={x.id} className="border-b last:border-b-0">
                                        <td className="py-3 pr-4 font-mono text-xs text-slate-700">{x.id}</td>
                                        <td className="py-3 pr-4 font-mono text-xs text-slate-700">{x.readerId}</td>
                                        <td className="py-3 pr-4 font-mono text-xs text-slate-700">{x.issuanceId}</td>
                                        <td className="py-3 pr-4 text-slate-700">
                                            {x.description}
                                            {x.writtenOff ? <span className="ml-2 text-xs text-slate-500">(списано)</span> : null}
                                        </td>
                                        <td className="py-3 pr-4 text-slate-700">{(x.amount ?? 0).toFixed(2)} €</td>
                                        <td className="py-3 pr-4">
                                            <StatusBadge value={x.state} />
                                        </td>
                                        <td className="py-3 pr-2">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    disabled={disabled || !isUnpaid}
                                                    onClick={() => onPay(x.id)}
                                                    className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-3 py-2 font-semibold text-white
                                       hover:brightness-105 transition disabled:opacity-60"
                                                >
                                                    {busyId === x.id ? "…" : "Оплачено"}
                                                </button>

                                                <button
                                                    disabled={disabled || !isUnpaid}
                                                    onClick={() => onWriteOff(x.id)}
                                                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold
                                       hover:bg-brand-50 hover:border-brand-200 transition disabled:opacity-60"
                                                >
                                                    Списать
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
