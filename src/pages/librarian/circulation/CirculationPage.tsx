import React, { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { findBookingById } from "@/shared/api/bookingsMockApi";
import { issueFromBooking, findIssuanceById, returnIssuance } from "@/shared/api/issuancesMockApi";

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_16px_50px_-30px_rgba(2,6,23,0.25)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-brand-700">{title}</h2>
                    {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
                </div>
            </div>
            <div className="mt-5">{children}</div>
        </div>
    );
}

export default function CirculationPage() {
    const user = useSelector((s: RootState) => s.auth.user);

    const [bookingId, setBookingId] = useState("");
    const [bookingInfo, setBookingInfo] = useState<any>(null);
    const [issueBusy, setIssueBusy] = useState(false);

    const [issuanceId, setIssuanceId] = useState("");
    const [issuanceInfo, setIssuanceInfo] = useState<any>(null);
    const [returnBusy, setReturnBusy] = useState(false);

    const loadBooking = async () => {
        setBookingInfo(null);
        const id = bookingId.trim();
        if (!id) return;
        const b = await findBookingById(id);
        setBookingInfo(b);
    };

    const doIssue = async () => {
        if (!bookingInfo) return;
        try {
            setIssueBusy(true);
            await issueFromBooking({ readerId: bookingInfo.readerId, bookingId: bookingInfo.id });
            alert("Выдача оформлена");
            setBookingId("");
            setBookingInfo(null);
        } catch (e: any) {
            alert(`Не удалось оформить выдачу: ${String(e?.message ?? "")}`);
        } finally {
            setIssueBusy(false);
        }
    };

    const loadIssuance = async () => {
        setIssuanceInfo(null);
        const id = issuanceId.trim();
        if (!id) return;
        const i = await findIssuanceById(id);
        setIssuanceInfo(i);
    };

    const doReturn = async () => {
        if (!issuanceInfo) return;
        try {
            setReturnBusy(true);
            await returnIssuance({ issuanceId: issuanceInfo.id });
            alert("Возврат оформлен");
            setIssuanceId("");
            setIssuanceInfo(null);
        } catch (e: any) {
            alert(`Не удалось оформить возврат: ${String(e?.message ?? "")}`);
        } finally {
            setReturnBusy(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
              Циркуляция
            </span>
                    </h1>
                    <p className="mt-1 text-slate-600">
                        Выдача по брони и возврат по выдаче. (Локальные мок-данные)
                    </p>
                </div>

                <div className="text-sm text-slate-600">
                    {user ? (
                        <>
                            Вошли как <span className="font-semibold">{user.identifier}</span>
                        </>
                    ) : null}
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card title="Выдать по брони" subtitle="Введите ID брони (BOOKINGS.id), проверьте и оформите выдачу.">
                    <div className="flex gap-2">
                        <input
                            value={bookingId}
                            onChange={(e) => setBookingId(e.target.value)}
                            placeholder="bookingId…"
                            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none
                         focus:border-brand-300 focus:ring-4 focus:ring-brand-200/40"
                        />
                        <button
                            type="button"
                            onClick={loadBooking}
                            className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold hover:bg-brand-50 hover:border-brand-200 transition"
                        >
                            Найти
                        </button>
                    </div>

                    {bookingInfo ? (
                        <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm">
                            <div className="font-semibold text-slate-900">Бронь найдена</div>
                            <div className="mt-1 text-slate-700">
                                <div>ID: {bookingInfo.id}</div>
                                <div>Reader ID: {bookingInfo.readerId}</div>
                                <div>Material ID: {bookingInfo.materialId}</div>
                                <div>Status: <span className="font-semibold">{bookingInfo.status}</span></div>
                                <div>Deadline: {bookingInfo.bookingDeadline}</div>
                            </div>

                            <button
                                disabled={issueBusy || bookingInfo.status !== "ACTIVE"}
                                onClick={doIssue}
                                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 font-semibold text-white
                           shadow-[0_12px_30px_-15px_rgba(124,58,237,0.65)]
                           hover:brightness-105 active:translate-y-[1px] transition disabled:opacity-60"
                            >
                                {issueBusy ? "Оформляем…" : "Оформить выдачу"}
                            </button>

                            {bookingInfo.status !== "ACTIVE" ? (
                                <div className="mt-2 text-xs text-slate-600">
                                    Можно оформить выдачу только для брони со статусом <b>ACTIVE</b>.
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="mt-3 text-sm text-slate-500">
                            Подсказка: создайте бронь читателем, потом возьмите её ID в localStorage: <b>lib.bookings</b>.
                        </div>
                    )}
                </Card>

                <Card title="Вернуть по выдаче" subtitle="Введите ID выдачи (ISSUANCES.id), проверьте и оформите возврат.">
                    <div className="flex gap-2">
                        <input
                            value={issuanceId}
                            onChange={(e) => setIssuanceId(e.target.value)}
                            placeholder="issuanceId…"
                            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none
                         focus:border-brand-300 focus:ring-4 focus:ring-brand-200/40"
                        />
                        <button
                            type="button"
                            onClick={loadIssuance}
                            className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold hover:bg-brand-50 hover:border-brand-200 transition"
                        >
                            Найти
                        </button>
                    </div>

                    {issuanceInfo ? (
                        <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm">
                            <div className="font-semibold text-slate-900">Выдача найдена</div>
                            <div className="mt-1 text-slate-700">
                                <div>ID: {issuanceInfo.id}</div>
                                <div>Booking ID: {issuanceInfo.bookingId}</div>
                                <div>Status: <span className="font-semibold">{issuanceInfo.status}</span></div>
                                <div>Return deadline: {issuanceInfo.returnDeadline}</div>
                                <div>Renew count: {issuanceInfo.renewCount}</div>
                            </div>

                            <button
                                disabled={returnBusy || issuanceInfo.status === "RETURNED"}
                                onClick={doReturn}
                                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold
                           hover:bg-brand-50 hover:border-brand-200 transition disabled:opacity-60"
                            >
                                {returnBusy ? "Оформляем…" : "Оформить возврат"}
                            </button>

                            {issuanceInfo.status === "RETURNED" ? (
                                <div className="mt-2 text-xs text-slate-600">
                                    Эта выдача уже в статусе <b>RETURNED</b>.
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="mt-3 text-sm text-slate-500">
                            Подсказка: после оформления выдачи ID появится в localStorage: <b>lib.issuances</b>.
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
