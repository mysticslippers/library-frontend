import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { Link } from "react-router-dom";
import { listMyFines, payFine, type MyFineView } from "@/shared/api/finesMockApi";
import PageHeader from "@/shared/ui/PageHeader";
import Surface from "@/shared/ui/Surface";
import StatusBadge from "@/shared/ui/StatusBadge";

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
            <PageHeader
                title="Штрафы"
                subtitle={`Неоплачено: ${totalUnpaid.toFixed(2)} €`}
                actionLabel="К выдачам"
                actionTo="/reader/loans"
            />

            <div className="mt-6">
                <Surface>
                    {loading ? (
                        <div className="rounded-2xl border border-slate-200 p-6 text-slate-600">Загрузка…</div>
                    ) : items.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 p-6 text-slate-600">
                            Штрафов нет 🎉{" "}
                            <Link className="text-brand-700 hover:underline" to="/reader/loans">
                                Перейти к выдачам
                            </Link>
                            .
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((f) => {
                                const disabled = busyId === f.id;

                                return (
                                    <div key={f.id} className="rounded-3xl border border-slate-200/70 bg-white p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-semibold text-slate-900">{f.description}</div>
                                                    <StatusBadge value={f.state} />
                                                </div>

                                                <div className="mt-1 text-sm text-slate-600">
                                                    Сумма: <b>{f.amount.toFixed(2)} €</b> · Дата: {f.dueDate}
                                                    {f.paymentDate ? <span className="text-slate-500"> · Оплачено: {f.paymentDate}</span> : null}
                                                </div>

                                                <div className="mt-1 text-xs text-slate-500">
                                                    Fine ID: <span className="font-mono">{f.id}</span>
                                                </div>
                                            </div>

                                            <button
                                                disabled={f.state !== "UNPAID" || disabled}
                                                onClick={() => onPay(f.id)}
                                                className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-3 py-2 font-semibold text-white
                                   shadow-[0_12px_30px_-18px_rgba(124,58,237,0.60)]
                                   hover:brightness-105 transition disabled:opacity-60"
                                            >
                                                {disabled ? "Оплата…" : "Оплатить"}
                                            </button>
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
