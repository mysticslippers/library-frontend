import React from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/shared/ui/PageHeader";
import Surface from "@/shared/ui/Surface";

type Booking = {
    id: string;
    status: string;
    bookingDate: string;
    bookingDeadline: string;
    readerId: string;
    materialId: string;
};

type Issuance = {
    id: string;
    bookingId: string;
    status: string;
    issuanceDate: string;
    returnDeadline: string;
    renewCount: number;
};

type Fine = {
    id: string;
    readerId: string;
    issuanceId: string;
    description: string;
    dueDate: string;
    state: string;
    amount: number;
    paymentDate?: string | null;
    writtenOff?: boolean;
};

function readLS<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function MetricCard({
                        title,
                        value,
                        hint,
                        to,
                    }: {
    title: string;
    value: string;
    hint?: string;
    to: string;
}) {
    return (
        <Link
            to={to}
            className="group block rounded-3xl border border-slate-200/70 bg-white p-5
                 shadow-[0_16px_50px_-30px_rgba(2,6,23,0.25)]
                 hover:border-brand-200 hover:bg-brand-50/30 transition"
        >
            <div className="text-sm font-medium text-slate-600">{title}</div>
            <div className="mt-2 text-3xl font-bold text-slate-900 group-hover:text-brand-700 transition">
                {value}
            </div>
            {hint ? <div className="mt-2 text-sm text-slate-600">{hint}</div> : null}
        </Link>
    );
}

function ListBlock({
                       title,
                       to,
                       children,
                   }: {
    title: string;
    to: string;
    children: React.ReactNode;
}) {
    return (
        <Surface>
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                <Link
                    to={to}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold
                     hover:bg-brand-50 hover:border-brand-200 transition"
                >
                    Открыть
                </Link>
            </div>
            <div className="mt-4">{children}</div>
        </Surface>
    );
}

export default function LibrarianDashboardPage() {
    const bookings = readLS<Booking[]>("lib.bookings", []);
    const issuances = readLS<Issuance[]>("lib.issuances", []);
    const fines = readLS<Fine[]>("lib.fines", []);

    const today = todayISO();

    const activeBookings = bookings.filter((b) => {
        const s = String(b.status).toUpperCase();
        return s === "PENDING" || s === "RESERVED";
    });

    const openIssuances = issuances.filter((i) => String(i.status).toUpperCase() !== "RETURNED");
    const overdueIssuances = openIssuances.filter((i) => i.returnDeadline < today);

    const unpaidFines = fines.filter((f) => String(f.state).toUpperCase() === "UNPAID");
    const unpaidTotal = unpaidFines.reduce((s, f) => s + (Number(f.amount) || 0), 0);

    const lastActiveBookings = [...activeBookings]
        .sort((a, b) => b.bookingDate.localeCompare(a.bookingDate))
        .slice(0, 5);

    const lastOverdues = [...overdueIssuances]
        .sort((a, b) => a.returnDeadline.localeCompare(b.returnDeadline))
        .slice(0, 5);

    const lastUnpaidFines = [...unpaidFines]
        .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
        .slice(0, 5);

    return (
        <div className="p-6">
            <PageHeader title="Дашборд библиотекаря" subtitle="Ключевые показатели и быстрые действия." />

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard title="Активные брони" value={`${activeBookings.length}`} hint="Готовы к выдаче" to="/librarian/bookings" />
                <MetricCard title="Просроченные выдачи" value={`${overdueIssuances.length}`} hint="Нужно обработать возврат/штраф" to="/librarian/issuances" />
                <MetricCard title="Неоплаченные штрафы" value={`${unpaidFines.length} · ${unpaidTotal.toFixed(2)} €`} hint="Контроль задолженностей" to="/librarian/fines" />
            </div>

            <div className="mt-6">
                <Surface>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            to="/librarian/circulation"
                            className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 font-semibold text-white
                         shadow-[0_12px_30px_-15px_rgba(124,58,237,0.65)]
                         hover:brightness-105 active:translate-y-[1px] transition"
                        >
                            Циркуляция: выдача/возврат
                        </Link>

                        <Link
                            to="/librarian/bookings"
                            className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold
                         hover:bg-brand-50 hover:border-brand-200 transition"
                        >
                            Управление бронями
                        </Link>

                        <Link
                            to="/librarian/issuances"
                            className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold
                         hover:bg-brand-50 hover:border-brand-200 transition"
                        >
                            Выдачи
                        </Link>

                        <Link
                            to="/librarian/fines"
                            className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold
                         hover:bg-brand-50 hover:border-brand-200 transition"
                        >
                            Штрафы
                        </Link>
                    </div>
                </Surface>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ListBlock title="Последние активные брони" to="/librarian/bookings">
                    {lastActiveBookings.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 p-4 text-slate-600">Пока нет активных броней.</div>
                    ) : (
                        <ul className="space-y-2">
                            {lastActiveBookings.map((b) => (
                                <li key={b.id} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="text-sm text-slate-600">Booking</div>
                                    <div className="mt-1 font-mono text-xs text-slate-700">{b.id}</div>
                                    <div className="mt-2 text-sm text-slate-700">
                                        Reader: <span className="font-mono text-xs">{b.readerId}</span>
                                    </div>
                                    <div className="text-sm text-slate-700">
                                        Deadline: <span className="font-semibold">{b.bookingDeadline}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </ListBlock>

                <ListBlock title="Ближайшие просрочки" to="/librarian/issuances">
                    {lastOverdues.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 p-4 text-slate-600">Пока нет просроченных выдач.</div>
                    ) : (
                        <ul className="space-y-2">
                            {lastOverdues.map((i) => (
                                <li key={i.id} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="text-sm text-slate-600">Issuance</div>
                                    <div className="mt-1 font-mono text-xs text-slate-700">{i.id}</div>
                                    <div className="mt-2 text-sm text-slate-700">
                                        Deadline: <span className="font-semibold">{i.returnDeadline}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </ListBlock>

                <ListBlock title="Последние неоплаченные штрафы" to="/librarian/fines">
                    {lastUnpaidFines.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 p-4 text-slate-600">Пока нет неоплаченных штрафов.</div>
                    ) : (
                        <ul className="space-y-2">
                            {lastUnpaidFines.map((f) => (
                                <li key={f.id} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="text-sm text-slate-600">Fine</div>
                                    <div className="mt-1 font-mono text-xs text-slate-700">{f.id}</div>
                                    <div className="mt-2 text-sm text-slate-700">
                                        Amount: <span className="font-semibold">{Number(f.amount).toFixed(2)} €</span>
                                    </div>
                                    <div className="text-sm text-slate-700">Due: {f.dueDate}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </ListBlock>
            </div>
        </div>
    );
}
