import { Link } from "react-router-dom";

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="p-8 rounded-2xl border shadow-sm max-w-md w-full">
                <h1 className="text-2xl font-bold">404</h1>
                <p className="mt-2 text-slate-600">Страница не найдена.</p>
                <Link
                    to="/reader"
                    className="inline-block mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700"
                >
                    На каталог
                </Link>
            </div>
        </div>
    );
}
