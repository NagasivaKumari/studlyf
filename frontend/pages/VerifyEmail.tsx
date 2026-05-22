import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail, RefreshCcw, ShieldCheck, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';
import AuthLayout from '../components/AuthLayout';
import AuthCard from '../components/AuthCard';

const VerifyEmailPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(Boolean(token));
    const [verifying, setVerifying] = useState(Boolean(token));
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    useEffect(() => {
        if (!token) {
            setLoading(false);
            setVerifying(false);
            setInfo('Enter your email to request a fresh verification link.');
            return;
        }

        const verify = async () => {
            setError('');
            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                if (res.ok) {
                    setSuccess(true);
                    setTimeout(() => navigate('/login'), 2500);
                    return;
                }

                const data = await res.json().catch(() => ({}));
                setError(data.detail || 'Verification link is invalid or expired.');
                setInfo('Request a new verification link below.');
            } catch (err) {
                setError('Connection failed while verifying your email.');
                setInfo('Request a new verification link below.');
            } finally {
                setLoading(false);
                setVerifying(false);
            }
        };

        verify();
    }, [navigate, token]);

    const handleResend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('Email is required.');
            return;
        }

        setLoading(true);
        setError('');
        setInfo('');

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setInfo(data.message || 'Verification link sent. Check your inbox.');
            } else {
                setError(data.detail || 'Unable to resend verification link.');
            }
        } catch (err) {
            setError('Connection failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <AuthCard title="Verify Email" maxWidth="max-w-[470px]">
                {success ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-6"
                    >
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Email Verified</h2>
                        <p className="text-sm text-gray-500 mb-8">
                            Your Studlyf account is now active. Redirecting you to login.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-purple-600 font-bold text-[10px] uppercase tracking-widest">
                            <Loader2 size={14} className="animate-spin" />
                            Opening Login...
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <p className="text-sm text-gray-500 text-center px-4">
                            {verifying
                                ? 'Verifying your account now. This only takes a moment.'
                                : 'If your verification link expired, enter your email to get a new one.'}
                        </p>

                        {info && (
                            <div className="p-3 bg-blue-50 text-blue-600 text-xs rounded-xl border border-blue-100">
                                {info}
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-50 text-red-500 text-xs rounded-xl border border-red-100">
                                {error}
                            </div>
                        )}

                        {!token && (
                            <form onSubmit={handleResend} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3.5 text-gray-300" size={18} />
                                        <input
                                            type="email"
                                            placeholder="your@email.com"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-purple-500 transition-all outline-none text-sm"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 mt-2 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Sending...' : 'Resend Verification Link'}
                                    <RefreshCcw size={16} />
                                </button>
                            </form>
                        )}

                        <div className="pt-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <ShieldCheck size={14} />
                            Secure account activation
                        </div>
                    </motion.div>
                )}
            </AuthCard>
        </AuthLayout>
    );
};

export default VerifyEmailPage;