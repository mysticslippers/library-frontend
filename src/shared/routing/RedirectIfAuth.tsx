import { ReactNode } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "@/app/store";

export default function RedirectIfAuth({ children }: { children: ReactNode }) {
    const user = useSelector((s: RootState) => s.auth.user);
    const initialized = useSelector((s: RootState) => s.auth.initialized);

    if (!initialized) return null;

    if (user) {
        return <Navigate to={user.role === "LIBRARIAN" || user.role === "ADMIN" ? "/librarian" : "/reader"} replace />;
    }

    return <>{children}</>;
}
