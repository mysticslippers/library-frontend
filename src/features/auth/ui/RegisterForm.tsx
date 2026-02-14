import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import TextField from "../../../shared/ui/TextField";
import { registerSchema, type RegisterValues } from "@/shared/lib/validators";
import { registerReader } from "@/shared/api/authApi";
import { useDispatch } from "react-redux";
import { setSession } from "@/features/auth/model/authSlice";

export default function RegisterForm() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

    const onSubmit = async (values: RegisterValues) => {
        try {
            const res = await registerReader(values.email, values.password);
            dispatch(setSession(res));
            navigate("/reader", { replace: true });
        } catch (e: any) {
            setError("email", { message: e?.message || "Не удалось зарегистрироваться" });
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
                autoComplete="new-password"
                error={errors.password?.message}
                {...register("password")}
            />
            <TextField
                label="Повторите пароль"
                type="password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
            />

            <button
                disabled={isSubmitting}
                className="w-full rounded-xl bg-brand-600 text-white py-2 font-semibold hover:bg-brand-700 disabled:opacity-60"
                type="submit"
            >
                Зарегистрироваться
            </button>

            <div className="text-sm text-right">
                <Link className="text-brand-700 hover:underline" to="/auth/login">
                    Уже есть аккаунт? Войти
                </Link>
            </div>
        </form>
    );
}
