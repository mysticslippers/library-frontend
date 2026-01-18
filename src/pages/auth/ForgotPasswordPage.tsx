import AuthCard from "../../shared/ui/AuthCard";
import ForgotPasswordForm from "../../features/auth/ui/ForgotPasswordForm";

export default function ForgotPasswordPage() {
    return (
        <AuthCard title="Восстановление пароля">
            <ForgotPasswordForm />
        </AuthCard>
    );
}
