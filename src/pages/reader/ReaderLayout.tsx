import { Link, Navigate, Route, Routes } from "react-router-dom";
import ReaderCatalogPage from "./catalog/ReaderCatalogPage";
import ReaderLoansPage from "./loans/ReaderLoansPage";
import ReaderFinesPage from "./fines/ReaderFinesPage";
import ReaderBookDetailsPage from "./details/ReaderBookDetailsPage";
import ReaderReservationsPage from "./reservations/ReaderReservationsPage";


function ReaderNav() {
    return (
        <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r bg-white">
            <div className="p-4 font-semibold text-brand-700">Reader</div>
            <nav className="px-2 pb-4 flex md:block gap-2 overflow-x-auto">
                <Link className="px-3 py-2 rounded-xl hover:bg-brand-50" to="/reader/catalog">
                    Каталог
                </Link>
                <Link className="px-3 py-2 rounded-xl hover:bg-brand-50" to="/reader/reservations">
                    Мои брони
                </Link>
                <Link className="px-3 py-2 rounded-xl hover:bg-brand-50" to="/reader/loans">
                    Мои выдачи
                </Link>
                <Link className="px-3 py-2 rounded-xl hover:bg-brand-50" to="/reader/fines">
                    Штрафы
                </Link>
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
