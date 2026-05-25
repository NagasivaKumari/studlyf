
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Building2, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';
import AuthCard from './AuthCard';

interface SignupFormProps {
    onSwitchToLogin: () => void;
    transparent?: boolean;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin, transparent = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Auth State
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [otp, setOtp] = useState('');
    const [institutionName, setInstitutionName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    
    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const getPasswordStrength = (pass: string) => {
        if (!pass) return 0;
        let score = 0;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        return score;
    };

    // Role detection from URL or email context
    const queryParams = new URLSearchParams(location.search);
    let selectedRole = queryParams.get('role') || 'student';
    
    // Auto-detect judge role if coming from judge invitation
    const nextPath = queryParams.get('next');
    if (nextPath && nextPath.includes('judge-portal') && !selectedRole) {
        selectedRole = 'judge';
        console.log('[SignupForm] Auto-detected judge role from nextPath:', nextPath);
    }
    
    // Also check if email looks like it's from judge invitation
    if (!selectedRole && email) {
        // Check if this email exists in judges collection (would need API call)
        // For now, assume judge if accessing from judge invitation flow
        const judgeIndicators = ['judge', 'evaluator', 'reviewer'];
        if (nextPath?.includes('judge-portal') || 
            document.referrer.includes('judge-invitation') ||
            localStorage.getItem('pendingJudgeRole') === 'true') {
            selectedRole = 'judge';
            console.log('[SignupForm] Auto-detected judge role from invitation flow:', selectedRole);
        }
    }
    
    console.log('[SignupForm] Final selected role:', selectedRole, 'email:', email);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Institution Email Check
        if (selectedRole === 'institution') {
            const personalDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "aol.com"];
            const domain = email.split("@").pop()?.toLowerCase();
            if (domain && personalDomains.includes(domain)) {
                setError("Please use your institution's official email (e.g., @university.edu). Personal Gmail/Yahoo accounts are not permitted for institutional registration.");
                return;
            }
        }

        setLoading(true);
        setError('');
        try {
            // 0. Client-side Strength Check
            const strength = getPasswordStrength(password);
            if (strength < 4) {
                setError("Password is not strong enough. Please include at least 8 characters, an uppercase letter, a number, and a special character.");
                setLoading(false);
                return;
            }

            // 1. Complete Signup in MongoDB directly
            const signupRes = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    full_name: fullName,
                    role: selectedRole,
                    institution_name: selectedRole === 'institution' ? institutionName : undefined
                })
            });

            if (signupRes.ok) {
                // Clear judge role flag if set
                if (selectedRole === 'judge') {
                    localStorage.removeItem('pendingJudgeRole');
                }
                setStep(3);
                setTimeout(() => onSwitchToLogin(), 3000);
            } else {
                const raw = await signupRes.text();
                let detail = 'Registration failed.';
                try {
                    const data = JSON.parse(raw);
                    detail = data.detail || data.message || detail;
                } catch {
                    if (raw.trim()) detail = raw;
                }
                setError(detail);
            }
        } catch (err) {
            setError(`System error during registration. ${err instanceof Error ? err.message : ''}`.trim());
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-200 outline-none text-gray-900 placeholder-gray-400 text-sm";
    const labelClasses = "block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 ml-1";

    return (
        <AuthCard 
            title={step === 3 ? "Welcome Aboard" : "Create Account"} 
            maxWidth="max-w-[450px]" 
            transparent={transparent}
        >
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.form
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onSubmit={handleSignup}
                        className="space-y-4"
                    >
                        {error && <div className="p-3 bg-red-50 text-red-500 text-xs rounded-lg border border-red-100">{error}</div>}
                        
                        {selectedRole === 'institution' && (
                            <div>
                                <label className={labelClasses}>Institution Name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3.5 text-gray-300" size={18} />
                                    <input
                                        type="text"
                                        placeholder="e.g. IIT Delhi"
                                        className={inputClasses + " pl-10"}
                                        value={institutionName}
                                        onChange={(e) => setInstitutionName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <label className={labelClasses}>Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-gray-300" size={18} />
                                <input
                                    type="text"
                                    placeholder={selectedRole === 'institution' ? "Administrator" : "Shiva"}
                                    className={inputClasses + " pl-10"}
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>{selectedRole === 'institution' ? "Work Email" : "Student Email"}</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 text-gray-300" size={18} />
                                <input
                                    type="email"
                                    placeholder={selectedRole === 'institution' ? "admin@institution.edu" : "shiva@gmail.com"}
                                    className={inputClasses + " pl-10"}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>Secure Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 text-gray-300" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={inputClasses + " pl-10"}
                                    value={password}
                                    onChange={(e) => {
                                        if (e.target.value.length <= 50) {
                                            setPassword(e.target.value);
                                        }
                                    }}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3.5 text-gray-400 hover:text-purple-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            
                            {/* Password Strength Indicator */}
                            {password.length > 0 && (
                                <div className="mt-2 flex gap-1 px-1">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div 
                                            key={level}
                                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                getPasswordStrength(password) >= level 
                                                    ? (getPasswordStrength(password) <= 2 ? 'bg-orange-400' : 'bg-green-500')
                                                    : 'bg-gray-100'
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}
                            <div className="mt-2 px-1 text-[9px] text-gray-400 font-medium leading-relaxed">
                                <span className={password.length >= 8 ? 'text-green-500' : ''}>• 8+ characters</span>{' '}
                                <span className={/[A-Z]/.test(password) ? 'text-green-500' : ''}>• Uppercase</span>{' '}
                                <span className={/[0-9]/.test(password) ? 'text-green-500' : ''}>• Number</span>{' '}
                                <span className={/[^A-Za-z0-9]/.test(password) ? 'text-green-500' : ''}>• Special char</span>
                            </div>
                        </div>



                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 mt-2 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Creating Account...' : 'Sign Up Now'}
                            <ArrowRight size={16} />
                        </button>
                    </motion.form>
                )}

                {/* Step 2 (OTP) is removed */}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                    >
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-2">Registration Complete</h2>
                        <p className="text-gray-500 text-sm mb-8">Welcome aboard! Your account is ready.</p>
                        <div className="flex items-center justify-center gap-2 text-purple-600 font-bold text-[10px] uppercase tracking-widest">
                            Please wait a moment...
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {step < 3 && (
                <div className="mt-8 text-center pt-6 border-t border-gray-50">
                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                        Already have an account?{' '}
                        <button
                            onClick={onSwitchToLogin}
                            className="text-purple-600 hover:text-purple-700 transition-colors ml-1"
                        >
                            Sign In
                        </button>
                    </p>
                </div>
            )}
        </AuthCard>
    );
};

export default SignupForm;
