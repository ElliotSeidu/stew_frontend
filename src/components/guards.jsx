import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/Providers";

// Roles here are capabilities, not exclusive boxes:
//   customer  - order food
//   vendor    - order food AND sell (an approved kitchen)
//   admin     - STEW staff
// So a vendor also satisfies a customer-only route, which is what lets a chef order
// from another chef without a second account.
const satisfies = (user, role) => {
    const isAdmin = user.isAdmin === true || user.role === "admin";
    if (role === "customer") {
        // Admin cannot access customer pages or order food
        if (isAdmin) return false;
        // A vendor-only account cannot access customer pages.
        if (user.accountType === "vendor") return false;
        return true;
    }
    if (role === "vendor") {
        // Admin cannot access vendor pages
        if (isAdmin) return false;
        return user.isVendor === true || user.role === "vendor";
    }
    if (role === "admin") return isAdmin;
    return user.role === role;
};

export function Protected({ roles, children }) {
    const { user } = useAuth();
    const loc = useLocation();
    if (!user)
        return (
            <Navigate to="/app/login" state={{ from: loc.pathname }} replace />
        );
    if (roles && !roles.some((r) => satisfies(user, r))) {
        if (satisfies(user, "admin"))
            return <Navigate to="/app/admin" replace />;
        if (satisfies(user, "vendor"))
            return <Navigate to="/app/vendor" replace />;
        return <Navigate to="/app" replace />;
    }
    return children;
}
