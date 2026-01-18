import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { Link } from "react-router-dom";
import { listMyIssuances, renewIssuance, type MyIssuanceView } from "@/shared/api/issuancesMockApi";
import { ensureFinesFromIssuances } from "@/shared/api/finesMockApi";

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
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-700">Мои выдачи</h1>
                    <p className="mt-1 text-slate-600">Активные и завершённые выдачи.</p>
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
                        Пока нет выдач. Сначала оформите бронь, затем нажмите <b>Получить</b> в “Мои брони”.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((x) => {
                            const isOpen = x.status === "OPEN" || x.status === "OVERDUE";
                            return (
                                <div key={x.id} className="rounded-2xl border bg-white p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="font-semibold">{x.booking.material.title}</div>
                                            <div className="mt-1 text-sm text-slate-600">
                                                Выдано: {x.issuanceDate} · Вернуть до:{" "}
                                                <span className={x.status === "OVERDUE" ? "text-red-600 font-semibold" : ""}>
                          {x.returnDeadline}
                        </span>
                                            </div>
                                            <div className="mt-1 text-sm">
                                                Статус:{" "}
                                                <span className={x.status === "OVERDUE" ? "text-red-600 font-semibold" : "text-slate-600"}>
                          {x.status}
                        </span>
                                                <span className="text-slate-500"> · Продлений: {x.renewCount}/2</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link
                                                to={`/reader/books/${x.booking.material.id}`}
                                                className="rounded-xl border px-3 py-1.5 hover:bg-brand-50 hover:border-brand-200"
                                            >
                                                Открыть
                                            </Link>

                                            <button
                                                disabled={!isOpen || busyId === x.id}
                                                onClick={() => onRenew(x.id)}
                                                className="rounded-xl bg-brand-600 text-white px-3 py-1.5 hover:bg-brand-700 disabled:opacity-60"
                                            >
                                                {busyId === x.id ? "Продлеваем…" : "Продлить"}
                                            </button>

                                            <Link
                                                to="/reader/fines"
                                                className="rounded-xl border px-3 py-1.5 hover:bg-brand-50 hover:border-brand-200"
                                            >
                                                Штрафы
                                            </Link>
                                        </div>
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
