import { ReactNode } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "@/app/store";
import type { Role } from "../types/library";

export default function RequireRole({
                                        roles,
                                        children,
                                    }: {
    roles: Role[];
    children: ReactNode;
}) {
    const user = useSelector((s: RootState) => s.auth.user);

    if (!user) return <Navigate to="/auth/login" replace />;

    if (!roles.includes(user.role)) {
        return <Navigate to="/reader" replace />;
    }

    return <>{children}</>;
}
