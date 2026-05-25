
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const LandingNavbar: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="absolute top-0 left-0 right-0 z-[100] px-4 py-4 sm:px-8 sm:py-5 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-4 rounded-full border border-amber-200/80 bg-white/75 backdrop-blur-xl px-4 py-2.5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                <button
                    className="flex items-center gap-3 tracking-tight transition-transform hover:scale-[1.02]"
                    onClick={() => navigate('/')}
                >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFB84D] via-[#F97316] to-[#7C3AED] flex items-center justify-center shadow-lg shadow-orange-200">
                        <img src="/images/studlyf.png" alt="STUDLYF" className="h-5 w-auto object-contain" />
                    </div>
                    <div className="hidden sm:block text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#F97316]">Studlyf</p>
                        <p className="text-sm font-semibold text-slate-900">Learn. Practice. Launch.</p>
                    </div>
                </button>

                <div className="hidden md:flex items-center gap-1 rounded-full bg-slate-50/90 px-2 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-slate-600">
                    <span className="px-3 py-2 rounded-full bg-white text-slate-900 shadow-sm">Learn</span>
                    <span className="px-3 py-2 rounded-full hover:bg-white transition-colors cursor-pointer" onClick={() => navigate('/job-prep/portfolio')}>Job Prep</span>
                    <span className="px-3 py-2 rounded-full hover:bg-white transition-colors cursor-pointer" onClick={() => navigate('/opportunities')}>Opportunities</span>
                </div>
            </div>

            <div className="pointer-events-auto flex items-center gap-3">
                <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/login')}
                    className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/75 backdrop-blur-xl px-5 py-3 text-sm font-bold text-slate-800 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-colors hover:bg-white"
                >
                    Sign in
                </motion.button>

                <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/signup')}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_34px_rgba(15,23,42,0.22)] transition-colors hover:bg-black"
                >
                    Get started
                    <ChevronRight className="w-4 h-4" />
                </motion.button>
            </div>
        </div>
    );
};

export default LandingNavbar;
