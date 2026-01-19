import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { Link } from "react-router-dom";
import { listMyIssuances, renewIssuance, type MyIssuanceView } from "@/shared/api/issuancesMockApi";
import { ensureFinesFromIssuances } from "@/shared/api/finesMockApi";
import PageHeader from "@/shared/ui/PageHeader";
import Surface from "@/shared/ui/Surface";
import StatusBadge from "@/shared/ui/StatusBadge";

export default function ReaderLoansPage() {
    const user = useSelector((s: RootState) => s.auth.user);
    const [items, setItems] = useState<MyIssuanceView[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = () => {
        if (!user) return;
        setLoading(true);
        listMyIssuances(user.id)
            .then((data) => {
                setItems(data);
                ensureFinesFromIssuances(user.id, data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const onRenew = async (issuanceId: string) => {
        if (!user) return;
        try {
            setBusyId(issuanceId);
            await renewIssuance({ readerId: user.id, issuanceId });
            load();
        } catch (e: any) {
            const code = String(e?.message ?? "");
            if (code === "RENEW_LIMIT") alert("Лимит продлений: 2.");
            else alert("Не удалось продлить выдачу.");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="p-6">
            <PageHeader
                title="Мои выдачи"
                subtitle="Активные и завершённые выдачи."
                right={
                    <Link
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 font-semibold
                       hover:bg-brand-50 hover:border-brand-200 transition"
                        to="/reader/fines"
                    >
                        Штрафы
                    </Link>
                }
                actionLabel="В каталог"
                actionTo="/reader/catalog"
            />

            <div className="mt-6">
                <Surface>
                    {loading ? (
                        <div className="rounded-2xl border border-slate-200 p-6 text-slate-600">Загрузка…</div>
                    ) : items.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 p-6 text-slate-600">
                            Пока нет выдач. Сначала оформите бронь, затем попросите библиотекаря оформить выдачу.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((x) => {
                                const isOpen = x.status === "OPEN" || x.status === "OVERDUE";
                                const disabled = busyId === x.id;

                                return (
                                    <div key={x.id} className="rounded-3xl border border-slate-200/70 bg-white p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-semibold text-slate-900">{x.booking.material.title}</div>
                                                    <StatusBadge value={x.status} />
                                                </div>

                                                <div className="mt-1 text-sm text-slate-600">
                                                    Выдано: {x.issuanceDate} · Вернуть до:{" "}
                                                    <span className={x.status === "OVERDUE" ? "text-red-600 font-semibold" : "font-semibold"}>
                            {x.returnDeadline}
                          </span>
                                                    <span className="text-slate-500"> · Продлений: {x.renewCount}/2</span>
                                                </div>

                                                <div className="mt-1 text-xs text-slate-500">
                                                    Issuance ID: <span className="font-mono">{x.id}</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Link
                                                    to={`/reader/books/${x.booking.material.id}`}
                                                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold
                                     hover:bg-brand-50 hover:border-brand-200 transition"
                                                >
                                                    Открыть
                                                </Link>

                                                <button
                                                    disabled={!isOpen || disabled}
                                                    onClick={() => onRenew(x.id)}
                                                    className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-3 py-2 font-semibold text-white
                                     shadow-[0_12px_30px_-18px_rgba(124,58,237,0.60)]
                                     hover:brightness-105 transition disabled:opacity-60"
                                                >
                                                    {disabled ? "Продлеваем…" : "Продлить"}
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
