import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth";
import type { Role } from "../types";

export function ProtectedRoute({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
