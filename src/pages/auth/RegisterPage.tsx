import AuthCard from "../../shared/ui/AuthCard";
import RegisterForm from "../../features/auth/ui/RegisterForm";

export default function RegisterPage() {
    return (
        <AuthCard title="Регистрация читателя">
            <RegisterForm />
        </AuthCard>
    );
}
