/// <reference types="vite/client" />

export const API_BASE_URL = import.meta.env.RENDER_EXTERNAL_URL ?? '';

export const FRONTEND_URL = import.meta.env.FRONTEND_URL ?? '';

/** Merge with fetch headers so institution / learner JWT routes work after server hardening. */
export function authHeaders(): Record<string, string> {
    const t = localStorage.getItem('auth_token');
    return t ? { Authorization: `Bearer ${t}` } : {};
}

if (!API_BASE_URL || !FRONTEND_URL) {
    console.warn('Missing env values. Set FRONTEND_URL and RENDER_EXTERNAL_URL in your env file.');
}

console.log('App is running in:', import.meta.env.MODE, 'Targeting API:', API_BASE_URL || '(missing env)');
