import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
    open: boolean;
    onClose: () => void;
    onProblemStatements: () => void;
};

const HackathonWelcomePopup: React.FC<Props> = ({ open, onClose, onProblemStatements }) => {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] p-4 overflow-y-auto"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
                    <div className="relative min-h-full flex items-start sm:items-center justify-center">

                    <motion.div
                        initial={{ opacity: 0, y: 18, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 18, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                        className="relative w-full max-w-3xl my-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Glow frame */}
                        <div className="absolute -inset-2 rounded-[2.75rem] blur-2xl opacity-70 bg-gradient-to-r from-[#22c55e]/35 via-[#6C3BFF]/35 to-[#22c55e]/35" />
                        <div className="relative bg-white rounded-[2.75rem] overflow-hidden shadow-2xl border border-white/60 max-h-[calc(100vh-3rem)] flex flex-col">
                            {/* Close */}
                            <button
                                onClick={onClose}
                                className="absolute top-5 right-5 z-10 w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                aria-label="Close"
                                title="Close"
                            >
                                <X size={18} />
                            </button>

                            {/* Image */}
                            <div className="bg-slate-50 overflow-y-auto">
                                <img
                                    src="/popup.png"
                                    alt="AI Hackathon"
                                    className="w-full h-auto block select-none"
                                    draggable={false}
                                />
                            </div>

                            {/* Footer CTA */}
                            <div className="p-5 sm:p-7 bg-white border-t border-slate-100 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-center sm:text-left">
                                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                                        Hyderabad Biggest - AI Hackathon
                                    </div>
                                    <div className="text-sm font-black text-slate-900">
                                        Start with the problem statements, then submit your idea.
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        window.open(
                                            'https://ai-hackathon-2026.holistichealervedika.com/',
                                            '_blank',
                                            'noopener,noreferrer'
                                        );
                                    }}
                                    className="w-full sm:w-auto px-7 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] text-white bg-gradient-to-r from-[#22c55e] via-[#6C3BFF] to-[#22c55e] shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                                >
                                    Click here for Problem Statements
                                </button>
                            </div>
                        </div>
                    </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default HackathonWelcomePopup;

