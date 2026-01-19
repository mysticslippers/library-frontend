import { Link } from "react-router-dom";
import type { MaterialCardDto } from "@/shared/types/library";

export default function MaterialCard({ item, from }: { item: MaterialCardDto; from: string }) {
    const available = item.availableCopies ?? 0;
    const isAvailable = available > 0;

    return (
        <div className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-start gap-3">
                <div className="h-16 w-12 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 text-xs font-semibold">
                    BOOK
                </div>

                <div className="min-w-0 flex-1">
                    <Link to={`/reader/books/${item.id}`} state={{ from }} className="font-semibold hover:text-brand-700">
                        {item.title}
                    </Link>
                    <div className="mt-1 text-sm text-slate-600 truncate">{item.authors}</div>
                    <div className="mt-1 text-xs text-slate-500">
                        {(item.genre ?? "—")}
                        {item.year ? ` · ${item.year}` : ""}
                    </div>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <div className="text-sm">
          <span className={`font-semibold ${isAvailable ? "text-emerald-700" : "text-red-600"}`}>
            {isAvailable ? `Доступно: ${available}` : "Нет в наличии"}
          </span>
                    <span className="text-slate-500"> / {item.totalCopies}</span>
                </div>

                <Link
                    to={`/reader/books/${item.id}`}
                    state={{ from }}
                    className="rounded-xl bg-brand-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-brand-700"
                >
                    Подробнее
                </Link>
            </div>
        </div>
    );
}
