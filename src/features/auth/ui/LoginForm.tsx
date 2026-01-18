import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import TextField from "../../../shared/ui/TextField";
import { loginSchema, type LoginValues } from "@/shared/lib/validators";
import { login } from "@/shared/api/authApi";
import { useDispatch } from "react-redux";
import { setSession } from "../model/authSlice";

export default function LoginForm() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

    const onSubmit = async (values: LoginValues) => {
        try {
            const res = login(values.email, values.password);
            dispatch(setSession(res));
            navigate(res.user.role === "LIBRARIAN" ? "/librarian" : "/reader", { replace: true });
        } catch (e) {
            setError("password", { message: "Неверный email или пароль" });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                type="password"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register("password")}
            />

            <button
                disabled={isSubmitting}
                className="w-full rounded-xl bg-brand-600 text-white py-2 font-semibold hover:bg-brand-700 disabled:opacity-60"
                type="submit"
            >
                Войти
            </button>

            <div className="flex justify-between text-sm">
                <Link className="text-brand-700 hover:underline" to="/auth/forgot-password">
                    Забыли пароль?
                </Link>
                <Link className="text-brand-700 hover:underline" to="/auth/register">
                    Нет аккаунта? Регистрация
                </Link>
            </div>

            <div className="mt-2 text-xs text-slate-500">
                Тестовый библиотекарь: <b>admin@lib.com</b> / <b>Admin1234</b>
            </div>
        </form>
    );
}
