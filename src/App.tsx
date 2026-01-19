import { BrowserRouter, Navigate, Route, Routes, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "./app/store";
import { clearSession } from "./features/auth/model/authSlice";
import { logout as logoutApi } from "./shared/api/authApi";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

import RequireAuth from "./shared/routing/RequireAuth";
import RequireRole from "./shared/routing/RequireRole";
import RedirectIfAuth from "./shared/routing/RedirectIfAuth";

import ReaderLayout from "./pages/reader/ReaderLayout";

import LibrarianLayout from "./pages/librarian/LibrarianLayout";

function NotFound() {
    return <div className="p-6 text-xl font-semibold">404</div>;
}

function RootRedirect() {
    const user = useSelector((s: RootState) => s.auth.user);
    if (!user) return <Navigate to="/auth/login" replace />;
    return <Navigate to={user.role === "LIBRARIAN" || user.role === "ADMIN" ? "/librarian" : "/reader"} replace />;
}

function TopBar() {
    const user = useSelector((s: RootState) => s.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const onLogout = () => {
        logoutApi();
        dispatch(clearSession());
        navigate("/auth/login", { replace: true });
    };

    return (
        <header className="border-b bg-white">
            <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
                <Link to="/" className="font-semibold text-brand-700">
                    Library
                </Link>

                <nav className="flex items-center gap-3 text-sm">
                    {user ? (
                        <>
                            <Link className="hover:text-brand-700" to="/reader">
                                Reader
                            </Link>
                            <Link className="hover:text-brand-700" to="/librarian">
                                Librarian
                            </Link>

                            <span className="hidden sm:inline text-slate-500">
                {user.identifier} · {user.role}
              </span>

                            <button
                                onClick={onLogout}
                                className="ml-2 rounded-xl border px-3 py-1.5 hover:bg-brand-50 hover:border-brand-200"
                            >
                                Выйти
                            </button>
                        </>
                    ) : (
                        <>
                            <Link className="hover:text-brand-700" to="/auth/login">
                                Вход
                            </Link>
                            <Link className="hover:text-brand-700" to="/auth/register">
                                Регистрация
                            </Link>
                        </>
                    )}
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

                <main className="mx-auto max-w-6xl px-4">
                    <Routes>
                        <Route path="/" element={<RootRedirect />} />

                        <Route
                            path="/auth/login"
                            element={
                                <RedirectIfAuth>
                                    <LoginPage />
                                </RedirectIfAuth>
                            }
                        />
                        <Route
                            path="/auth/register"
                            element={
                                <RedirectIfAuth>
                                    <RegisterPage />
                                </RedirectIfAuth>
                            }
                        />
                        <Route
                            path="/auth/forgot-password"
                            element={
                                <RedirectIfAuth>
                                    <ForgotPasswordPage />
                                </RedirectIfAuth>
                            }
                        />
                        <Route
                            path="/auth/reset-password"
                            element={
                                <RedirectIfAuth>
                                    <ResetPasswordPage />
                                </RedirectIfAuth>
                            }
                        />

                        <Route
                            path="/reader/*"
                            element={
                                <RequireAuth>
                                    <ReaderLayout />
                                </RequireAuth>
                            }
                        />

                        <Route
                            path="/librarian/*"
                            element={
                                <RequireAuth>
                                    <RequireRole roles={["LIBRARIAN", "ADMIN"]}>
                                        <LibrarianLayout />
                                    </RequireRole>
                                </RequireAuth>
                            }
                        />

                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}
