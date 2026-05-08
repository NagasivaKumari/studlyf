/// <reference types="vite/client" />

// Detect environment using Vite's built-in variables
export const API_BASE_URL = import.meta.env.PROD
    ? 'https://studlyff.onrender.com'
    : 'http://localhost:8000';

export const FRONTEND_URL = 'https://studlyf-thub.vercel.app'; // Hardcoded as per user request for "Real" links

/** Merge with fetch headers so institution / learner JWT routes work after server hardening. */
export function authHeaders(): Record<string, string> {
    const t = localStorage.getItem('auth_token');
    return t ? { Authorization: `Bearer ${t}` } : {};
}

console.log('App is running in:', import.meta.env.MODE, 'Targeting API:', API_BASE_URL);
