import { useState } from "react";
import { useSelector } from "react-redux";
import StatusBadge from "@/shared/ui/StatusBadge";
import { type RootState } from "@/app/store";
import { approveBookingByStaff, findBookingById } from "@/shared/api/bookingsMockApi";
import { findIssuanceById, issueFromBooking, returnIssuance } from "@/shared/api/issuancesMockApi";

type BookingInfo = {
    id: string;
    readerId: string;
    libraryId: string;
    materialId: string;
    bookingDate: string;
    bookingDeadline: string;
    status: string;
};

type IssuanceInfo = {
    id: string;
    bookingId: string;
    issuanceDate: string;
    returnDeadline: string;
    renewCount: number;
    status: string;
};

export default function CirculationPage() {
    const user = useSelector((s: RootState) => s.auth.user);

    const [bookingId, setBookingId] = useState("");
    const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null);
    const [bookingBusy, setBookingBusy] = useState(false);

    const [issuanceId, setIssuanceId] = useState("");
    const [issuanceInfo, setIssuanceInfo] = useState<IssuanceInfo | null>(null);
    const [issuanceBusy, setIssuanceBusy] = useState(false);

    const findBooking = async () => {
        const id = bookingId.trim();
        if (!id) return;

        try {
            setBookingBusy(true);
            const b = await findBookingById(id);
            setBookingInfo({
                id: b.id,
                readerId: b.readerId,
                libraryId: b.libraryId,
                materialId: b.materialId,
                bookingDate: b.bookingDate,
                bookingDeadline: b.bookingDeadline,
                status: String(b.status),
            });
        } catch (e: any) {
            alert(`Бронь не найдена: ${String(e?.message ?? "")}`);
            setBookingInfo(null);
        } finally {
            setBookingBusy(false);
        }
    };

    const approveBooking = async () => {
        if (!bookingInfo) return;

        try {
            setBookingBusy(true);
            await approveBookingByStaff({ bookingId: bookingInfo.id });

            const b = await findBookingById(bookingInfo.id);
            setBookingInfo({
                id: b.id,
                readerId: b.readerId,
                libraryId: b.libraryId,
                materialId: b.materialId,
                bookingDate: b.bookingDate,
                bookingDeadline: b.bookingDeadline,
                status: String(b.status),
            });

            alert("Бронь подтверждена.");
        } catch (e: any) {
            alert(`Не удалось подтвердить бронь: ${String(e?.message ?? "")}`);
        } finally {
            setBookingBusy(false);
        }
    };

    const issueByBooking = async () => {
        if (!bookingInfo) return;

        try {
            setBookingBusy(true);
            await issueFromBooking({ readerId: bookingInfo.readerId, bookingId: bookingInfo.id });
            alert("Выдача оформлена.");

            setBookingId("");
            setBookingInfo(null);
        } catch (e: any) {
            alert(`Не удалось оформить выдачу: ${String(e?.message ?? "")}`);
        } finally {
            setBookingBusy(false);
        }
    };

    const findIssuance = async () => {
        const id = issuanceId.trim();
        if (!id) return;

        try {
            setIssuanceBusy(true);
            const x = await findIssuanceById(id);

            setIssuanceInfo({
                id: x.id,
                bookingId: x.bookingId,
                issuanceDate: x.issuanceDate,
                returnDeadline: x.returnDeadline,
                renewCount: x.renewCount,
                status: String(x.status),
            });
        } catch (e: any) {
            alert(`Выдача не найдена: ${String(e?.message ?? "")}`);
            setIssuanceInfo(null);
        } finally {
            setIssuanceBusy(false);
        }
    };

    const doReturn = async () => {
        if (!issuanceInfo) return;

        try {
            setIssuanceBusy(true);
            await returnIssuance({ issuanceId: issuanceInfo.id });
            alert("Возврат оформлен.");

            setIssuanceId("");
            setIssuanceInfo(null);
        } catch (e: any) {
            alert(`Не удалось оформить возврат: ${String(e?.message ?? "")}`);
        } finally {
            setIssuanceBusy(false);
        }
    };

    const canApprove = bookingInfo?.status === "PENDING";
    const canIssue = bookingInfo?.status === "RESERVED"; // как на бэке
    const canReturn = issuanceInfo && issuanceInfo.status !== "RETURNED";

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
                        Быстрые операции: подтвердить бронь, выдать книгу и оформить возврат.
                    </p>
                    {user ? (
                        <div className="mt-2 text-xs text-slate-500">
                            Вошли как: <span className="font-mono">{user.identifier}</span>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_16px_50px_-30px_rgba(2,6,23,0.25)]">
                    <h2 className="text-lg font-bold text-slate-900">Выдача по брони</h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Найдите бронь по ID. Затем подтвердите (PENDING → RESERVED), после чего можно выдать.
                    </p>

                    <div className="mt-4 flex gap-2">
                        <input
                            value={bookingId}
                            onChange={(e) => setBookingId(e.target.value)}
                            placeholder="ID брони"
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none
                         focus:border-brand-300 focus:ring-4 focus:ring-brand-200/40"
                        />
                        <button
                            disabled={bookingBusy || !bookingId.trim()}
                            onClick={findBooking}
                            className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold hover:bg-brand-50 hover:border-brand-200 transition disabled:opacity-60"
                        >
                            {bookingBusy ? "…" : "Найти"}
                        </button>
                    </div>

                    {bookingInfo ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold text-slate-900">
                                    Бронь <span className="font-mono text-xs text-slate-700">{bookingInfo.id}</span>
                                </div>
                                <StatusBadge value={bookingInfo.status} />
                            </div>

                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
                                <div>
                                    Reader: <span className="font-mono text-xs">{bookingInfo.readerId}</span>
                                </div>
                                <div>
                                    Book: <span className="font-mono text-xs">{bookingInfo.materialId}</span>
                                </div>
                                <div>
                                    Дата: <span className="font-mono text-xs">{bookingInfo.bookingDate}</span>
                                </div>
                                <div>
                                    Дедлайн: <span className="font-mono text-xs">{bookingInfo.bookingDeadline}</span>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    disabled={bookingBusy || !canApprove}
                                    onClick={approveBooking}
                                    className="rounded-2xl border border-emerald-200 px-4 py-3 font-semibold text-emerald-700
                             hover:bg-emerald-50 transition disabled:opacity-60"
                                >
                                    {bookingBusy ? "…" : "Подтвердить бронь"}
                                </button>

                                <button
                                    disabled={bookingBusy || !canIssue}
                                    onClick={issueByBooking}
                                    className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 font-semibold text-white
                             shadow-[0_12px_30px_-15px_rgba(124,58,237,0.65)]
                             hover:brightness-105 active:translate-y-[1px] transition disabled:opacity-60"
                                >
                                    {bookingBusy ? "…" : "Оформить выдачу"}
                                </button>
                            </div>

                            <div className="mt-2 text-xs text-slate-500">
                                Выдача доступна только после подтверждения (статус <span className="font-mono">RESERVED</span>).
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_16px_50px_-30px_rgba(2,6,23,0.25)]">
                    <h2 className="text-lg font-bold text-slate-900">Возврат по выдаче</h2>
                    <p className="mt-1 text-sm text-slate-600">Найдите выдачу по ID и оформите возврат.</p>

                    <div className="mt-4 flex gap-2">
                        <input
                            value={issuanceId}
                            onChange={(e) => setIssuanceId(e.target.value)}
                            placeholder="ID выдачи"
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none
                         focus:border-brand-300 focus:ring-4 focus:ring-brand-200/40"
                        />
                        <button
                            disabled={issuanceBusy || !issuanceId.trim()}
                            onClick={findIssuance}
                            className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold hover:bg-brand-50 hover:border-brand-200 transition disabled:opacity-60"
                        >
                            {issuanceBusy ? "…" : "Найти"}
                        </button>
                    </div>

                    {issuanceInfo ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold text-slate-900">
                                    Выдача <span className="font-mono text-xs text-slate-700">{issuanceInfo.id}</span>
                                </div>
                                <StatusBadge value={issuanceInfo.status} />
                            </div>

                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
                                <div>
                                    Booking: <span className="font-mono text-xs">{issuanceInfo.bookingId}</span>
                                </div>
                                <div>
                                    Renew: <span className="font-mono text-xs">{issuanceInfo.renewCount}</span>
                                </div>
                                <div>
                                    Issued: <span className="font-mono text-xs">{issuanceInfo.issuanceDate}</span>
                                </div>
                                <div>
                                    Due: <span className="font-mono text-xs">{issuanceInfo.returnDeadline}</span>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button
                                    disabled={issuanceBusy || !canReturn}
                                    onClick={doReturn}
                                    className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 font-semibold text-white
                             shadow-[0_12px_30px_-15px_rgba(124,58,237,0.65)]
                             hover:brightness-105 active:translate-y-[1px] transition disabled:opacity-60"
                                >
                                    {issuanceBusy ? "…" : "Оформить возврат"}
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
