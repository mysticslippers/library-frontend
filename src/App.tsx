import { BrowserRouter, Navigate, Route, Routes, Link } from "react-router-dom";
import ReaderCatalogPage from "./pages/reader/ReaderCatalogPage";
import LibrarianDashboardPage from "./pages/librarian/LibrarianDashboardPage";
import LoginPage from "./pages/auth/LoginPage";
import NotFoundPage from "./pages/notfound/NotFoundPage";

function TopBar() {
    return (
        <header className="border-b bg-white">
            <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
                <Link to="/reader" className="font-semibold text-brand-700">
                    Library
                </Link>

                <nav className="flex gap-3 text-sm">
                    <Link className="hover:text-brand-700" to="/reader">Reader</Link>
                    <Link className="hover:text-brand-700" to="/librarian">Librarian</Link>
                    <Link className="hover:text-brand-700" to="/auth/login">Login</Link>
                </nav>
            </div>
        </header>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-white text-slate-900">
                <TopBar />
                <main className="mx-auto max-w-6xl px-4 py-6">
                    <Routes>
                        <Route path="/" element={<Navigate to="/reader" replace />} />
                        <Route path="/reader" element={<ReaderCatalogPage />} />
                        <Route path="/librarian" element={<LibrarianDashboardPage />} />
                        <Route path="/auth/login" element={<LoginPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}
