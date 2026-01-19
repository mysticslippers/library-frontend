import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import ReaderCatalogPage from "./catalog/ReaderCatalogPage";
import ReaderLoansPage from "./loans/ReaderLoansPage";
import ReaderFinesPage from "./fines/ReaderFinesPage";
import ReaderBookDetailsPage from "./details/ReaderBookDetailsPage";
import ReaderReservationsPage from "./reservations/ReaderReservationsPage";

function navCls({ isActive }: { isActive: boolean }) {
    return [
        "px-3 py-2 rounded-2xl transition",
        isActive ? "bg-brand-50 text-brand-800 border border-brand-200" : "hover:bg-brand-50",
    ].join(" ");
}

function ReaderNav() {
    return (
        <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r bg-white">
            <div className="p-4 font-bold">
        <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
          Reader
        </span>
            </div>

            <nav className="px-2 pb-4 flex md:block gap-2 overflow-x-auto">
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
        </aside>
    );
}

export default function ReaderLayout() {
    return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col md:flex-row">
            <ReaderNav />

            <section className="flex-1 bg-white">
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
