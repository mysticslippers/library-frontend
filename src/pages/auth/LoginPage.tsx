import AuthCard from "../../shared/ui/AuthCard";
import LoginForm from "../../features/auth/ui/LoginForm";

export default function LoginPage() {
    return (
        <AuthCard title="Вход">
            <LoginForm />
        </AuthCard>
    );
}
