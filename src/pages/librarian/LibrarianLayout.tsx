import { Link, Navigate, Route, Routes } from "react-router-dom";
import CirculationPage from "./circulation/CirculationPage";
import BookingsPage from "./bookings/BookingsPage";
import IssuancesPage from "./issuances/IssuancesPage";
import FinesPage from "./fines/FinesPage";
import LibrarianBooksPage from "./books/LibrarianBooksPage";

function LibrarianNav() {
    return (
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r bg-white">
            <div className="p-4 font-bold">
                <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">Librarian</span>
            </div>

            <nav className="px-2 pb-4 flex md:block gap-2 overflow-x-auto">
                <Link className="px-3 py-2 rounded-2xl hover:bg-brand-50" to="/librarian/books">
                    Книги
                </Link>
                <Link className="px-3 py-2 rounded-2xl hover:bg-brand-50" to="/librarian/circulation">
                    Циркуляция
                </Link>
                <Link className="px-3 py-2 rounded-2xl hover:bg-brand-50" to="/librarian/bookings">
                    Брони
                </Link>
                <Link className="px-3 py-2 rounded-2xl hover:bg-brand-50" to="/librarian/issuances">
                    Выдачи
                </Link>
                <Link className="px-3 py-2 rounded-2xl hover:bg-brand-50" to="/librarian/fines">
                    Штрафы
                </Link>
            </nav>
        </aside>
    );
}

export default function LibrarianLayout() {
    return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col md:flex-row">
            <LibrarianNav />

            <section className="flex-1 bg-white">
                <Routes>
                    <Route path="/" element={<Navigate to="books" replace />} />
                    <Route path="books" element={<LibrarianBooksPage />} />
                    <Route path="circulation" element={<CirculationPage />} />
                    <Route path="bookings" element={<BookingsPage />} />
                    <Route path="issuances" element={<IssuancesPage />} />
                    <Route path="fines" element={<FinesPage />} />
                </Routes>
            </section>
        </div>
    );
}
