import { PropsWithChildren } from "react";

export default function AuthCard({
                                     title,
                                     children,
                                 }: PropsWithChildren<{ title: string }>) {
    return (
        <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-28 -left-28 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
                <div className="absolute top-40 -right-28 h-[28rem] w-[28rem] rounded-full bg-brand-100/70 blur-3xl" />
            </div>

            <div className="relative flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md rounded-3xl border border-slate-200/60 bg-white/90 p-7 shadow-[0_20px_60px_-25px_rgba(2,6,23,0.25)] backdrop-blur">
                    <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
              {title}
            </span>
                    </h1>

                    <div className="mt-6">{children}</div>
                </div>
            </div>
        </div>
    );
}
