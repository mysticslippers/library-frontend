import { cn } from "@/shared/lib/cn";

const map: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    COMPLETED: "bg-brand-50 text-brand-700 border-brand-200",
    CANCELLED: "bg-slate-50 text-slate-600 border-slate-200",
    EXPIRED: "bg-amber-50 text-amber-700 border-amber-200",

    OPEN: "bg-brand-50 text-brand-700 border-brand-200",
    OVERDUE: "bg-red-50 text-red-700 border-red-200",
    RETURNED: "bg-slate-50 text-slate-600 border-slate-200",

    UNPAID: "bg-amber-50 text-amber-700 border-amber-200",
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function StatusBadge({ value }: { value: string }) {
    const v = String(value ?? "").toUpperCase();
    const cls = map[v] ?? "bg-slate-50 text-slate-600 border-slate-200";

    return (
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", cls)}>
      {v}
    </span>
    );
}
