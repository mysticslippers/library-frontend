import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import TextField from "../../../shared/ui/TextField";
import { resetSchema, type ResetValues } from "@/shared/lib/validators";
import { resetPassword } from "@/shared/api/authApi";

export default function ResetPasswordForm() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const tokenFromUrl = params.get("token") ?? "";

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<ResetValues>({
        resolver: zodResolver(resetSchema),
        defaultValues: { token: tokenFromUrl, password: "", confirmPassword: "" },
    });

    const onSubmit = async (values: ResetValues) => {
        try {
            resetPassword(values.token, values.password);
            navigate("/auth/login", { replace: true });
        } catch (e) {
            setError("token", { message: "Ссылка недействительна или истекла" });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register("token")} />
            {errors.token?.message ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {errors.token.message}
                </div>
            ) : null}

            <TextField
                label="Новый пароль"
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
                Сохранить пароль
            </button>

            <div className="text-sm text-right">
                <Link className="text-brand-700 hover:underline" to="/auth/login">
                    Назад к входу
                </Link>
            </div>
        </form>
    );
}
