import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";

import TextField from "@/shared/ui/TextField";
import { resetSchema, type ResetValues } from "@/shared/lib/validators";
import { resetPassword } from "@/shared/api/authApi";

function useTokenFromQuery(): string {
    const { search } = useLocation();
    return useMemo(() => {
        const qs = new URLSearchParams(search);
        return qs.get("token") ?? "";
    }, [search]);
}

export default function ResetPasswordForm() {
    const navigate = useNavigate();
    const token = useTokenFromQuery();
    const [done, setDone] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        watch,
    } = useForm<ResetValues>({
        resolver: zodResolver(resetSchema),
        defaultValues: {
            token,
            password: "",
            confirmPassword: "",
        },
    });

    const pass = watch("password");

    const onSubmit = async (values: ResetValues) => {
        if (!values.token) {
            setError("token", { message: "Ссылка некорректна: отсутствует token" });
            return;
        }

        try {
            await resetPassword(values.token, values.password);
            setDone(true);
        } catch (e: any) {
            const msg = e?.message || "Не удалось обновить пароль";
            if (String(msg).includes("TOKEN") || String(msg).includes("token")) {
                setError("token", { message: msg });
            } else {
                setError("password", { message: msg });
            }
        }
    };

    if (done) {
        return (
            <div className="space-y-5">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    Пароль успешно обновлён. Теперь можно войти с новым паролем.
                </div>

                <button
                    type="button"
                    onClick={() => navigate("/auth/login")}
                    className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 font-semibold text-white
                       shadow-[0_12px_30px_-15px_rgba(124,58,237,0.65)]
                       hover:brightness-105 active:translate-y-[1px] transition"
                >
                    Перейти ко входу
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
            {errors.token?.message ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    {errors.token.message}
                </div>
            ) : null}

            <TextField
                label="Новый пароль"
                type="password"
                autoComplete="new-password"
                placeholder="Минимум 6 символов"
                error={errors.password?.message}
                {...register("password")}
            />

            <TextField
                label="Повторите пароль"
                type="password"
                autoComplete="new-password"
                placeholder="Повторите новый пароль"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
            />

            <input type="hidden" {...register("token")} />

            <button
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 font-semibold text-white
                   shadow-[0_12px_30px_-15px_rgba(124,58,237,0.65)]
                   hover:brightness-105 active:translate-y-[1px] transition
                   disabled:opacity-60 disabled:cursor-not-allowed"
                type="submit"
            >
                {isSubmitting ? "Сохраняем…" : pass ? "Сохранить" : "Продолжить"}
            </button>

            <div className="text-sm text-right">
                <Link className="text-brand-700 hover:text-brand-800 hover:underline" to="/auth/login">
                    Назад к входу
                </Link>
            </div>
        </form>
    );
}