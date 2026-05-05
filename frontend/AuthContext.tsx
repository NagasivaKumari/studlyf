import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from './apiConfig';

export type UserRole = 'super_admin' | 'admin' | 'mentor' | 'hiring_partner' | 'student' | 'institution' | 'judge';

interface User {
    email: string;
    full_name: string;
    role: UserRole;
    user_id: string;
    institution_id?: string;
    institution_name?: string;
}

interface AuthContextType {
    user: User | null;
    role: UserRole | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    role: null, 
    loading: true,
    login: () => {},
    logout: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                setRole(userData.role);
            } else {
                // Token invalid or expired
                localStorage.removeItem('auth_token');
                setUser(null);
                setRole(null);
            }
        } catch (error) {
            console.error("[AuthContext] Auth check failed:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem('auth_token', token);
        setUser(userData);
        setRole(userData.role);
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setUser(null);
        setRole(null);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
