import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import ReaderCatalogPage from "./catalog/ReaderCatalogPage";
import ReaderLoansPage from "./loans/ReaderLoansPage";
import ReaderFinesPage from "./fines/ReaderFinesPage";
import ReaderBookDetailsPage from "./details/ReaderBookDetailsPage";
import ReaderReservationsPage from "./reservations/ReaderReservationsPage";

function navCls({ isActive }: { isActive: boolean }) {
    return [
        "whitespace-nowrap px-3 py-2 rounded-2xl transition",
        isActive ? "bg-brand-50 text-brand-800 border border-brand-200" : "hover:bg-brand-50",
    ].join(" ");
}

function ReaderTopNav() {
    return (
        <div className="border-b bg-white">
            <div className="px-6 py-4">
                <div className="font-bold">
          <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
            Reader
          </span>
                </div>

                <nav className="mt-3 flex flex-wrap gap-2">
                    <NavLink className={navCls} to="/reader/catalog">
                        Каталог
                    </NavLink>
                    <NavLink className={navCls} to="/reader/reservations">
                        Мои брони
                    </NavLink>
                    <NavLink className={navCls} to="/reader/loans">
                        Мои выдачи
                    </NavLink>
                    <NavLink className={navCls} to="/reader/fines">
                        Штрафы
                    </NavLink>
                </nav>
            </div>
        </div>
    );
}

export default function ReaderLayout() {
    return (
        <div className="min-h-[calc(100vh-80px)] bg-white">
            <ReaderTopNav />

            <section className="flex-1">
                <Routes>
                    <Route path="/" element={<Navigate to="catalog" replace />} />
                    <Route path="catalog" element={<ReaderCatalogPage />} />
                    <Route path="books/:id" element={<ReaderBookDetailsPage />} />
                    <Route path="reservations" element={<ReaderReservationsPage />} />
                    <Route path="loans" element={<ReaderLoansPage />} />
                    <Route path="fines" element={<ReaderFinesPage />} />
                </Routes>
            </section>
        </div>
    );
}
