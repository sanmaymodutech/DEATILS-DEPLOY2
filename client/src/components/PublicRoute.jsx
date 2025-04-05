import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

const PublicRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token);
    }, []);

    if (isAuthenticated === null) {
        return null; // Prevent flashing while checking auth status
    }

    return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};

export default PublicRoute;
