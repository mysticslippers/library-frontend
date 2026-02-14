import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import TextField from "@/shared/ui/TextField";
import { loginSchema, type LoginValues } from "@/shared/lib/validators";
import { login } from "@/shared/api/authApi";
import { useDispatch } from "react-redux";
import { setSession } from "@/features/auth/model/authSlice";
import { useState } from "react";

export default function LoginForm() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [showPass, setShowPass] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

    const onSubmit = async (values: LoginValues) => {
        try {
            const res = await login(values.email, values.password);
            dispatch(setSession(res));
            navigate(res.user.role === "LIBRARIAN" ? "/librarian" : "/reader", { replace: true });
        } catch (e: any) {
            setError("password", { message: e?.message || "Ошибка входа" });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="text-sm text-slate-600">
                Войдите, чтобы продолжить работу с библиотекой.
            </div>

            <TextField
                label="Email"
                type="email"
                placeholder="you@mail.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register("email")}
            />

            <TextField
                label="Пароль"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                error={errors.password?.message}
                {...register("password")}
                rightSlot={
                    <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                    >
                        {showPass ? "Скрыть" : "Показать"}
                    </button>
                }
            />

            <button
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 font-semibold text-white
                   shadow-[0_12px_30px_-15px_rgba(124,58,237,0.65)]
                   hover:brightness-105 active:translate-y-[1px] transition
                   disabled:opacity-60 disabled:cursor-not-allowed"
                type="submit"
            >
                {isSubmitting ? "Входим…" : "Войти"}
            </button>

            <div className="flex items-center justify-between text-sm">
                <Link className="text-brand-700 hover:text-brand-800 hover:underline" to="/auth/forgot-password">
                    Забыли пароль?
                </Link>
                <Link className="text-brand-700 hover:text-brand-800 hover:underline" to="/auth/register">
                    Регистрация
                </Link>
            </div>
        </form>
    );
}
