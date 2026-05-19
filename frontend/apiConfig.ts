/// <reference types="vite/client" />

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD
    ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')
    : 'http://localhost:8000');

export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

/** Merge with fetch headers so institution / learner JWT routes work after server hardening. */
export function authHeaders(): Record<string, string> {
    const t = localStorage.getItem('auth_token');
    return t ? { Authorization: `Bearer ${t}` } : {};
}

console.log('App is running in:', import.meta.env.MODE, 'Targeting API:', API_BASE_URL);
