import React from "react";
import { Link } from "react-router-dom";

export default function PageHeader({
                                       title,
                                       subtitle,
                                       actionLabel,
                                       actionTo,
                                       right,
                                   }: {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    actionTo?: string;
    right?: React.ReactNode;
}) {
    return (
        <div className="flex items-end justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold">
          <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
            {title}
          </span>
                </h1>
                {subtitle ? <p className="mt-1 text-slate-600">{subtitle}</p> : null}
            </div>

            <div className="flex items-center gap-2">
                {right}
                {actionLabel && actionTo ? (
                    <Link
                        to={actionTo}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 font-semibold
                       hover:bg-brand-50 hover:border-brand-200 transition"
                    >
                        {actionLabel}
                    </Link>
                ) : null}
            </div>
        </div>
    );
}
