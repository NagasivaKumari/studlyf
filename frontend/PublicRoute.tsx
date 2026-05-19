import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, role, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="h-screen flex items-center justify-center font-mono text-xs tracking-widest uppercase text-[#7C3AED]">Synchronizing Protocol...</div>;
    }

    if (user) {
        console.log("[PublicRoute] User already logged in. Role:", role);
        
        // Allow reset-password page even for authenticated users
        if (location.pathname === '/reset-password') {
            return <>{children}</>;
        }
        
        // Wait for role to be fetched before redirecting
        if (role === null && loading === false) {
            return <div className="h-screen flex items-center justify-center font-mono text-xs tracking-widest uppercase text-[#7C3AED]">Identifying Authority...</div>;
        }

        if (role === 'super_admin' || role === 'admin') {
            return <Navigate to="/admin" replace />;
        }
        if (role === 'hiring_partner') {
            return <Navigate to="/dashboard/partner" replace />;
        }
        if (role === 'institution') {
            console.log("[PublicRoute] Redirecting Institution to dashboard");
            return <Navigate to="/institution-dashboard" replace />;
        }
        console.log("[PublicRoute] Redirecting Student/Default to opportunities");
        return <Navigate to="/opportunities" replace />;
    }

    return <>{children}</>;
};

export default PublicRoute;
