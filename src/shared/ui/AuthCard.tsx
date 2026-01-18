import { PropsWithChildren } from "react";

export default function AuthCard({
                                     title,
                                     children,
                                 }: PropsWithChildren<{ title: string }>) {
    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border bg-white shadow-sm p-6">
                <h1 className="text-2xl font-bold text-brand-700">{title}</h1>
                <div className="mt-4">{children}</div>
            </div>
        </div>
    );
}
