import React from "react";
import { cn } from "@/shared/lib/cn";

type Variant = "primary" | "secondary" | "danger";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
};

const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-3 font-semibold transition " +
    "disabled:opacity-60 disabled:cursor-not-allowed active:translate-y-[1px]";

const variants: Record<Variant, string> = {
    primary:
        "bg-gradient-to-r from-brand-600 to-brand-500 text-white " +
        "shadow-[0_12px_30px_-15px_rgba(124,58,237,0.65)] hover:brightness-105",
    secondary:
        "border border-slate-200 bg-white text-slate-900 hover:bg-brand-50 hover:border-brand-200",
    danger:
        "border border-red-200 bg-white text-red-700 hover:bg-red-50",
};

export default function Button({ variant = "secondary", className, ...props }: Props) {
    return <button {...props} className={cn(base, variants[variant], className)} />;
}
