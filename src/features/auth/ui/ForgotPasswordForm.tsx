import { Link } from "react-router-dom";

export default function ForgotPasswordForm() {
    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                В этом проекте восстановление пароля на беке не реализовано, поэтому эта форма — заглушка.
            </div>

            <div className="text-sm text-right">
                <Link className="text-brand-700 hover:underline" to="/auth/login">
                    Назад к входу
                </Link>
            </div>
        </div>
    );
}
