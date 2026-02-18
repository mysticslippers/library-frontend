import { cn } from "@/shared/lib/cn";

const classMap: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    RESERVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ISSUED: "bg-brand-50 text-brand-700 border-brand-200",
    CANCELLED: "bg-slate-50 text-slate-600 border-slate-200",

    EXPIRED: "bg-slate-50 text-slate-600 border-slate-200",

    OPEN: "bg-brand-50 text-brand-700 border-brand-200",
    OVERDUE: "bg-red-50 text-red-700 border-red-200",
    RETURNED: "bg-slate-50 text-slate-600 border-slate-200",

    UNPAID: "bg-amber-50 text-amber-700 border-amber-200",
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const labelMap: Record<string, string> = {
    PENDING: "Ожидает",
    RESERVED: "Забронировано",
    ISSUED: "Выдано",
    CANCELLED: "Отменено",
    EXPIRED: "Отменено",

    OPEN: "Открыта",
    OVERDUE: "Просрочена",
    RETURNED: "Возвращена",

    UNPAID: "Не оплачено",
    PAID: "Оплачено",
};

export default function StatusBadge({
                                        value,
                                        showCode,
                                    }: {
    value: string;
    showCode?: boolean;
}) {
    const raw = String(value ?? "").toUpperCase();
    const code = raw === "EXPIRED" ? "CANCELLED" : raw;

    const cls = classMap[raw] ?? classMap[code] ?? "bg-slate-50 text-slate-600 border-slate-200";
    const label = labelMap[raw] ?? labelMap[code] ?? code;

    return (
        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", cls)}>
            <span>{label}</span>
            {showCode ? <span className="opacity-70">({code})</span> : null}
        </span>
    );
}
