import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../api/types";

const roleRoutes: Record<UserRole, string[]> = {
  [UserRole.RECIPIENT]: ["/wallet", "/profile", "/preferences"],
  [UserRole.VERIFIER]: ["/wallet", "/verify", "/profile", "/preferences"],
  [UserRole.ISSUER]: ["/issue", "/wallet", "/revoke", "/verify", "/certificates", "/profile", "/preferences"],
  [UserRole.ADMIN]: ["/issue", "/wallet", "/revoke", "/verify", "/certificates", "/profile", "/preferences"],
  [UserRole.AUDITOR]: ["/verify", "/certificates", "/profile", "/preferences"],
  [UserRole.USER]: ["/wallet", "/profile", "/preferences"],
};

/**
 * Paths that never require authentication.
 *
 * Membership is tested by **exact** string equality (Set lookup), never by
 * prefix. Listing `/verify` here therefore cannot make a future `/verify-*`
 * route (e.g. `/verify-email`, `/verify-payment`) public by accident — such a
 * route falls through to the normal auth/role checks unless it is added here
 * explicitly.
 */
const PUBLIC_PATHS: ReadonlySet<string> = new Set(["/verify"]);

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

/**
 * Returns true when `pathname` equals one of the allowed base paths or is a
 * sub-route of one. A path matches when it equals an allowed path exactly, or
 * begins with that path followed by a `/` segment boundary.
 *
 * The `/` boundary prevents false positives: `/certificates/abc-123` matches
 * `/certificates`, but `/certificatesfoo` does not.
 */
const isPathAllowed = (pathname: string, allowedPaths: string[]): boolean =>
  allowedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Public paths require no auth. Exact match only — see PUBLIC_PATHS.
  if (PUBLIC_PATHS.has(location.pathname)) return <Outlet />;

  // Not logged in — redirect to login and preserve destination
  if (!user) {
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const userRole = user.role as UserRole;

  if (allowedRoles) {
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  } else {
    const allowedPaths: string[] = roleRoutes[userRole] ?? [];
    if (!isPathAllowed(location.pathname, allowedPaths)) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
