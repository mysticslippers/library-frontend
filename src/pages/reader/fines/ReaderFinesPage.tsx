import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { Link } from "react-router-dom";
import { listMyFines, payFine, type MyFineView } from "@/shared/api/finesMockApi";

export default function ReaderFinesPage() {
    const user = useSelector((s: RootState) => s.auth.user);
    const [items, setItems] = useState<MyFineView[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = () => {
        if (!user) return;
        setLoading(true);
        listMyFines(user.id)
            .then(setItems)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [user?.id]);

    const onPay = async (fineId: string) => {
        if (!user) return;
        try {
            setBusyId(fineId);
            await payFine({ readerId: user.id, fineId });
            load();
        } finally {
            setBusyId(null);
        }
    };

    const totalUnpaid = items.filter((x) => x.state === "UNPAID").reduce((sum, x) => sum + x.amount, 0);

    return (
        <div className="p-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-700">Штрафы</h1>
                    <p className="mt-1 text-slate-600">
                        Неоплачено: <b>{totalUnpaid.toFixed(2)} €</b>
                    </p>
                </div>
                <Link className="rounded-xl border px-3 py-1.5 hover:bg-brand-50 hover:border-brand-200" to="/reader/loans">
                    К выдачам
                </Link>
            </div>

            <div className="mt-6">
                {loading ? (
                    <div className="rounded-2xl border p-6 text-slate-600">Загрузка…</div>
                ) : items.length === 0 ? (
                    <div className="rounded-2xl border p-6 text-slate-600">Штрафов нет 🎉</div>
                ) : (
                    <div className="space-y-3">
                        {items.map((f) => (
                            <div key={f.id} className="rounded-2xl border bg-white p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="font-semibold">{f.description}</div>
                                        <div className="mt-1 text-sm text-slate-600">
                                            Сумма: <b>{f.amount.toFixed(2)} €</b> · Дата: {f.dueDate}
                                        </div>
                                        <div className="mt-1 text-sm">
                                            Статус:{" "}
                                            <span className={f.state === "UNPAID" ? "text-red-600 font-semibold" : "text-emerald-700 font-semibold"}>
                        {f.state}
                      </span>
                                            {f.paymentDate ? <span className="text-slate-500"> · Оплачено: {f.paymentDate}</span> : null}
                                        </div>
                                    </div>

                                    <button
                                        disabled={f.state !== "UNPAID" || busyId === f.id}
                                        onClick={() => onPay(f.id)}
                                        className="rounded-xl bg-brand-600 text-white px-3 py-1.5 hover:bg-brand-700 disabled:opacity-60"
                                    >
                                        {busyId === f.id ? "Оплата…" : "Оплатить"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
