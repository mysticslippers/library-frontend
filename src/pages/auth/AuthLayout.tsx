import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-brand-50 via-white to-white">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-brand-200/40 blur-3xl" />
                <div className="absolute top-40 -right-24 h-96 w-96 rounded-full bg-brand-100/60 blur-3xl" />
            </div>

            <div className="relative mx-auto flex max-w-6xl items-center justify-center px-4 py-12">
                {children}
            </div>
        </div>
    );
}
