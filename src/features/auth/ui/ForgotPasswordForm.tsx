import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import TextField from "../../../shared/ui/TextField";
import { forgotSchema, type ForgotValues } from "@/shared/lib/validators";
import { requestPasswordReset } from "@/shared/api/authApi";
import { useState } from "react";

export default function ForgotPasswordForm() {
    const [mockLink, setMockLink] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });

    const onSubmit = async (values: ForgotValues) => {
        const res = requestPasswordReset(values.email);
        setSubmitted(true);

        if (res.token) setMockLink(`/auth/reset-password?token=${encodeURIComponent(res.token)}`);
        else setMockLink(null);
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

            <button
                disabled={isSubmitting}
                className="w-full rounded-xl bg-brand-600 text-white py-2 font-semibold hover:bg-brand-700 disabled:opacity-60"
                type="submit"
            >
                Отправить ссылку
            </button>

            {submitted ? (
                <div className="rounded-xl border bg-brand-50 p-3 text-sm text-slate-700">
                    Если email существует — мы отправили ссылку для восстановления.
                    {mockLink ? (
                        <div className="mt-2">
                            (Учебный режим) Ссылка:
                            <div className="mt-1">
                                <Link className="text-brand-700 hover:underline" to={mockLink}>
                                    Перейти к сбросу пароля
                                </Link>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}

            <div className="text-sm text-right">
                <Link className="text-brand-700 hover:underline" to="/auth/login">
                    Назад к входу
                </Link>
            </div>
        </form>
    );
}
