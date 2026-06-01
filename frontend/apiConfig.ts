/// <reference types="vite/client" />

const viteEnv = import.meta.env as Record<string, string | undefined>;

function resolveDefaultApiBaseUrl(): string {
    // Return empty string for local dev so requests like /api/... use the Vite proxy
    return ''; 
}

let resolvedUrl = viteEnv.VITE_API_BASE_URL ??
    viteEnv.VITE_RENDER_EXTERNAL_URL ??
    viteEnv.RENDER_EXTERNAL_URL ??
    viteEnv.API_BASE_URL ??
    resolveDefaultApiBaseUrl();

if (import.meta.env.DEV || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))) {
    resolvedUrl = resolveDefaultApiBaseUrl();
}

export const API_BASE_URL = resolvedUrl;

export const FRONTEND_URL =
    viteEnv.VITE_FRONTEND_URL ??
    viteEnv.FRONTEND_URL ??
    window.location.origin;

/** Merge with fetch headers so institution / learner JWT routes work after server hardening. */
export function authHeaders(): Record<string, string> {
    const t = localStorage.getItem('auth_token');
    return t ? { Authorization: `Bearer ${t}` } : {};
}

if (!API_BASE_URL || !FRONTEND_URL) {
    console.warn('Missing env values. Set FRONTEND_URL and RENDER_EXTERNAL_URL in your env file.');
}

console.log('App is running in:', import.meta.env.MODE, 'Targeting API:', API_BASE_URL || '(missing env)');
