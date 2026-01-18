import AuthCard from "../../shared/ui/AuthCard";
import ResetPasswordForm from "../../features/auth/ui/ResetPasswordForm";

export default function ResetPasswordPage() {
    return (
        <AuthCard title="Сброс пароля">
            <ResetPasswordForm />
        </AuthCard>
    );
}
