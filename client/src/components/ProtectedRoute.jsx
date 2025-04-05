import { Navigate, Outlet } from "react-router";
import { useEffect, useState } from "react";

const ProtectedRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        // Check token on mount
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token);
    }, []);

    // Prevent infinite redirects while checking token
    if (isAuthenticated === null) {
        return null; // Show nothing while checking auth
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
