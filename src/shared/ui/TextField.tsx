import React from "react";
import { cn } from "@/shared/lib/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
    rightSlot?: React.ReactNode;
};

const TextField = React.forwardRef<HTMLInputElement, Props>(
    ({ label, error, rightSlot, className, ...props }, ref) => {
        return (
            <label className="block">
                <div className="text-sm font-medium text-slate-800">{label}</div>

                <div className="relative mt-1">
                    <input
                        ref={ref}
                        {...props}
                        className={cn(
                            "w-full rounded-2xl border bg-white px-4 py-3 text-slate-900 shadow-sm outline-none",
                            "placeholder:text-slate-400 transition",
                            error
                                ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-200/40"
                                : "border-slate-200 focus:border-brand-300 focus:ring-4 focus:ring-brand-200/40",
                            rightSlot ? "pr-12" : "",
                            className
                        )}
                    />

                    {rightSlot ? (
                        <div className="absolute inset-y-0 right-3 flex items-center">{rightSlot}</div>
                    ) : null}
                </div>

                {error ? <div className="mt-1.5 text-sm text-red-600">{error}</div> : null}
            </label>
        );
    }
);

TextField.displayName = "TextField";
export default TextField;
