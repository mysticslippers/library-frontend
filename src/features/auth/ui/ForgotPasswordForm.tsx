import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import TextField from "@/shared/ui/TextField";
import { forgotSchema, type ForgotValues } from "@/shared/lib/validators";
import { requestPasswordReset } from "@/shared/api/authApi";

export default function ForgotPasswordForm() {
    const [sentTo, setSentTo] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        watch,
    } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });

    const emailWatch = watch("email");

    const onSubmit = async (values: ForgotValues) => {
        try {
            await requestPasswordReset(values.email);
            setSentTo(values.email.trim());
        } catch (e: any) {
            setError("email", { message: e?.message || "Не удалось отправить письмо" });
        }
    };

    if (sentTo) {
        return (
            <div className="space-y-5">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    Если email <span className="font-semibold">{sentTo}</span> существует, мы отправили ссылку для сброса
                    пароля. Проверь «Входящие» и «Спам».
                </div>

                <button
                    type="button"
                    onClick={() => setSentTo(null)}
                    className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 font-semibold text-white
                       shadow-[0_12px_30px_-15px_rgba(124,58,237,0.65)]
                       hover:brightness-105 active:translate-y-[1px] transition"
                >
                    Отправить ещё раз
                </button>

                <div className="text-sm text-right">
                    <Link className="text-brand-700 hover:text-brand-800 hover:underline" to="/auth/login">
                        Назад к входу
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="text-sm text-slate-600">Укажи email — мы пришлём ссылку для сброса пароля.</div>

            <TextField
                label="Email"
                type="email"
                placeholder="you@mail.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register("email")}
            />

            <button
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 font-semibold text-white
                   shadow-[0_12px_30px_-15px_rgba(124,58,237,0.65)]
                   hover:brightness-105 active:translate-y-[1px] transition
                   disabled:opacity-60 disabled:cursor-not-allowed"
                type="submit"
            >
                {isSubmitting ? "Отправляем…" : emailWatch ? "Отправить ссылку" : "Продолжить"}
            </button>

            <div className="text-sm text-right">
                <Link className="text-brand-700 hover:text-brand-800 hover:underline" to="/auth/login">
                    Назад к входу
                </Link>
            </div>
        </form>
    );
}
