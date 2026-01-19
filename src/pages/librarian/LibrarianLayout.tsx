import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import CirculationPage from "./circulation/CirculationPage";
import BookingsPage from "./bookings/BookingsPage";
import IssuancesPage from "./issuances/IssuancesPage";
import FinesPage from "./fines/FinesPage";
import LibrarianBooksPage from "./books/LibrarianBooksPage";

function navCls({ isActive }: { isActive: boolean }) {
    return [
        "whitespace-nowrap px-3 py-2 rounded-2xl transition",
        isActive ? "bg-brand-50 text-brand-800 border border-brand-200" : "hover:bg-brand-50",
    ].join(" ");
}

function LibrarianTopNav() {
    return (
        <div className="border-b bg-white">
            <div className="px-6 py-4">
                <div className="font-bold">
          <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
            Librarian
          </span>
                </div>

                <nav className="mt-3 flex flex-wrap gap-2">
                    <NavLink className={navCls} to="/librarian/books">
                        Книги
                    </NavLink>
                    <NavLink className={navCls} to="/librarian/circulation">
                        Циркуляция
                    </NavLink>
                    <NavLink className={navCls} to="/librarian/bookings">
                        Брони
                    </NavLink>
                    <NavLink className={navCls} to="/librarian/issuances">
                        Выдачи
                    </NavLink>
                    <NavLink className={navCls} to="/librarian/fines">
                        Штрафы
                    </NavLink>
                </nav>
            </div>
        </div>
    );
}

export default function LibrarianLayout() {
    return (
        <div className="min-h-[calc(100vh-80px)] bg-white">
            <LibrarianTopNav />

            <section className="flex-1">
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
