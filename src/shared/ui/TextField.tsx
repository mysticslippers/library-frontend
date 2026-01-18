import React from "react";

type Props = {
    label: string;
    type?: string;
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    name?: string;
    placeholder?: string;
    error?: string;
    autoComplete?: string;
};

export default function TextField(props: Props) {
    const { label, error, ...inputProps } = props;

    return (
        <label className="block">
            <div className="text-sm font-medium text-slate-700">{label}</div>
            <input
                {...inputProps}
                className={`mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-200 ${
                    error ? "border-red-400" : "border-slate-200"
                }`}
            />
            {error ? <div className="mt-1 text-sm text-red-600">{error}</div> : null}
        </label>
    );
}
