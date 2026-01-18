import { ReactNode } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import type { RootState } from "@/app/store";

export default function RequireAuth({ children }: { children: ReactNode }) {
    const user = useSelector((s: RootState) => s.auth.user);
    const location = useLocation();

    if (!user) {
        return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
    }

    return <>{children}</>;
}
