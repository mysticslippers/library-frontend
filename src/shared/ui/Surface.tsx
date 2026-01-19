import React from "react";

export default function Surface({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_16px_50px_-30px_rgba(2,6,23,0.25)]">
            {children}
        </div>
    );
}
