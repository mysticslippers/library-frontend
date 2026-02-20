import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import StatusBadge from "../../../shared/ui/StatusBadge";
import {
    listIssuancesForStaff,
    returnIssuance,
    type StaffIssuanceRow,
} from "@/shared/api/issuancesMockApi";

import { getLibraryAddressMap } from "@/shared/api/librariesApi";
import { getMyLibrarian } from "@/shared/api/libraryMockApi";
import type { RootState } from "@/app/store";

function normalizeSearchQuery(q: string): string {
    const raw = (q ?? "").trim();
    if (!raw) return "";

    const lower = raw.toLowerCase();

    const map: Array<[RegExp, "OPEN" | "OVERDUE" | "RETURNED"]> = [
        [/^открыт(а|о|ые|ый)?$/i, "OPEN"],

        [/^просрочен(о|а|ые|ый)?$/i, "OVERDUE"],
        [/^просрочка$/i, "OVERDUE"],

        [/^возвращен(о|а|ые|ый)?$/i, "RETURNED"],
        [/^возврат$/i, "RETURNED"],
        [/^вернули$/i, "RETURNED"],
    ];

    for (const [re, code] of map) {
        if (re.test(lower)) return code;
    }

    const containsMap: Array<[RegExp, "OPEN" | "OVERDUE" | "RETURNED"]> = [
        [/\bоткрыт(а|о|ые|ый)?\b/iu, "OPEN"],
        [/\bпросрочен(о|а|ые|ый)?\b/iu, "OVERDUE"],
        [/\bпросрочка\b/iu, "OVERDUE"],
        [/\bвозвращен(о|а|ые|ый)?\b/iu, "RETURNED"],
        [/\bвозврат\b/iu, "RETURNED"],
        [/\bвернули\b/iu, "RETURNED"],
    ];

    let out = raw;
    for (const [re, code] of containsMap) {
        out = out.replace(re, code);
    }

    return out;
}

export default function IssuancesPage() {
    const user = useSelector((s: RootState) => s.auth.user);

    const [q, setQ] = useState("");
    const [status, setStatus] = useState<"" | "OPEN" | "OVERDUE" | "RETURNED">("");
    const [items, setItems] = useState<StaffIssuanceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const [libAddress, setLibAddress] = useState<Map<string, string>>(new Map());

    const [myLibraryId, setMyLibraryId] = useState<string | null>(user?.libraryId ?? null);

    const load = (
        nextQ: string = q,
        nextStatus: "" | "OPEN" | "OVERDUE" | "RETURNED" = status
    ) => {
        const qNormalized = normalizeSearchQuery(nextQ);
        setLoading(true);
        listIssuancesForStaff({ q: qNormalized, status: nextStatus })
            .then(setItems)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        let alive = true;
        getLibraryAddressMap()
            .then((m) => alive && setLibAddress(m))
            .catch(() => alive && setLibAddress(new Map()));
        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        if (user?.libraryId) {
            setMyLibraryId(user.libraryId);
            return;
        }

        let alive = true;
        getMyLibrarian()
            .then((me) => {
                if (!alive) return;
                setMyLibraryId(me?.libraryId != null ? String(me.libraryId) : null);
            })
            .catch(() => {
                if (!alive) return;
                setMyLibraryId(null);
            });

        return () => {
            alive = false;
        };
    }, [user?.libraryId]);

    const hasMyLibrary = useMemo(() => Boolean(myLibraryId), [myLibraryId]);

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
                            placeholder='loanId / userId / bookId / libraryId / status… (можно: "открыта", "просрочено", "возвращено")'
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none
                         focus:border-brand-300 focus:ring-4 focus:ring-brand-200/40"
                        />
                        <div className="mt-1 text-xs text-slate-500">
                            Поиск выполняется на сервере и учитывает только поля займа: id, userId, bookId, libraryId и status.
                            Статусы можно вводить по-русски (открыта/просрочено/возвращено) или по-английски (OPEN/OVERDUE/RETURNED).
                        </div>
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
                            <option value="OPEN">Открыта</option>
                            <option value="OVERDUE">Просрочено</option>
                            <option value="RETURNED">Возвращено</option>
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
                                <th className="py-3 pr-4">Библиотека</th>
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

                                const isMine = myLibraryId ? String(x.libraryId) === String(myLibraryId) : false;
                                const canActHere = !hasMyLibrary || isMine;

                                return (
                                    <tr key={x.id} className="border-b last:border-b-0">
                                        <td className="py-3 pr-4 font-mono text-xs text-slate-700">{x.id}</td>
                                        <td className="py-3 pr-4 font-semibold text-slate-900">{x.materialTitle}</td>
                                        <td className="py-3 pr-4 font-mono text-xs text-slate-700">{x.readerId}</td>

                                        <td className="py-3 pr-4 text-slate-700">
                                            <div className="min-w-[220px]">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-xs text-slate-500 font-mono">{x.libraryId}</div>

                                                    {hasMyLibrary ? (
                                                        isMine ? (
                                                            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                                                    моя
                                                                </span>
                                                        ) : (
                                                            <span className="rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                                                    чужая
                                                                </span>
                                                        )
                                                    ) : null}
                                                </div>

                                                <div
                                                    className="text-sm text-slate-700 truncate"
                                                    title={libAddress.get(x.libraryId) ?? x.libraryId}
                                                >
                                                    {libAddress.get(x.libraryId) ?? "—"}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-3 pr-4 text-slate-700">{x.issuanceDate}</td>

                                        <td
                                            className={`py-3 pr-4 ${
                                                x.status === "OVERDUE"
                                                    ? "text-red-600 font-semibold"
                                                    : "text-slate-700"
                                            }`}
                                        >
                                            {x.returnDeadline}
                                        </td>

                                        <td className="py-3 pr-4">
                                            <StatusBadge value={x.status} />
                                        </td>

                                        <td className="py-3 pr-2">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    disabled={disabled || !canReturn || !canActHere}
                                                    onClick={() => onReturn(x.id)}
                                                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 font-semibold
                                       hover:bg-brand-50 hover:border-brand-200 transition disabled:opacity-60"
                                                >
                                                    {busyId === x.id ? "…" : "Вернуть"}
                                                </button>
                                            </div>

                                            {hasMyLibrary && !isMine ? (
                                                <div className="mt-1 text-xs text-slate-500 text-right">
                                                    Действия доступны только для своей библиотеки.
                                                </div>
                                            ) : null}
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