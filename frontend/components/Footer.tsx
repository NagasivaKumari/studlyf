import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Linkedin, Twitter, Github, Send, Mail } from 'lucide-react';
import TermsOverlay from './TermsOverlay';

// Custom WhatsApp icon (not available in lucide-react)
const WhatsAppIcon = ({ size = 22 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
);

const Footer: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setIsSubscribed(true);
            setTimeout(() => setIsSubscribed(false), 3000);
            setEmail('');
        }
    };

    const socialLinks = [
        { icon: <Instagram size={22} />, href: "https://www.instagram.com/stuudent.lyf?igsh=bDIwYzIxaDFyeWd3", label: "Instagram" },
        { icon: <Linkedin size={22} />, href: "https://www.linkedin.com/company/studlyf/", label: "LinkedIn" },
        { icon: <Twitter size={22} />, href: "https://twitter.com", label: "Twitter" },
        { icon: <WhatsAppIcon size={22} />, href: "https://whatsapp.com/channel/0029VbCHsjAHVvTRqLfOau24/113 ", label: "WhatsApp" },
        { icon: <Github size={22} />, href: "https://github.com", label: "GitHub" },
    ];

    return (
        <footer className="relative w-full bg-[#0B0B0F] py-8 px-4 md:px-10 font-poppins font-medium">
            <AnimatePresence>
                {showTerms && (
                    <TermsOverlay onClose={() => setShowTerms(false)} />
                )}
            </AnimatePresence>
            {/* Animated Purple Gradient Overlay */}
            <motion.div
                className="absolute inset-0 pointer-events-none opacity-40"
                animate={{
                    background: [
                        "radial-gradient(circle at 20% 20%, #6C3BFF 0%, transparent 60%)",
                        "radial-gradient(circle at 80% 80%, #6C3BFF 0%, transparent 60%)",
                        "radial-gradient(circle at 20% 20%, #6C3BFF 0%, transparent 60%)"
                    ]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />

            {/* Subtle Floating Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-[#9D7CFF] rounded-full opacity-30"
                        initial={{
                            x: Math.random() * 100 + "%",
                            y: Math.random() * 100 + "%",
                            scale: Math.random() * 0.5 + 0.5
                        }}
                        animate={{
                            y: [null, "-25vh"],
                            opacity: [0, 0.6, 0],
                        }}
                        transition={{
                            duration: Math.random() * 6 + 6,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 5
                        }}
                    />
                ))}
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Floating Curved Container */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative backdrop-blur-3xl bg-white/[0.04] border border-white/10 rounded-[2rem] sm:rounded-[3.5rem] p-8 sm:p-12 md:p-16 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5),0_0_50px_rgba(108,59,255,0.1)]"
                >
                    {/* Glowing Top Border Line */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#9D7CFF]/50 to-transparent" />

                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* 1️⃣ Left Side – Email Subscription */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-[#FFFFFF] text-2xl md:text-4xl font-bold tracking-tight uppercase leading-tight">
                                    Join Our Community
                                </h3>
                                <p className="text-[#CFCFEA] text-sm md:text-lg opacity-90 max-w-lg leading-relaxed">
                                    Get the latest updates on AI innovations and tech trends straight to your inbox.
                                </p>
                            </div>

                            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-grow group">
                                    <motion.div
                                        whileFocus={{ scale: 1.02 }}
                                        className="relative"
                                    >
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CFCFEA]/50 group-focus-within:text-[#9D7CFF] transition-colors" size={20} />
                                        <input
                                            type="email"
                                            placeholder="Enter your email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full bg-[#15151A]/80 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-white text-base placeholder:text-[#CFCFEA]/30 focus:outline-none focus:border-[#9D7CFF]/50 transition-all duration-300"
                                        />
                                    </motion.div>
                                </div>

                                <button
                                    type="submit"
                                    className="glow-btn glow-btn-purple px-10 py-4 text-base rounded-2xl"
                                >
                                    <span className="glow-orb glow-orb-1" />
                                    <span className="glow-orb glow-orb-2" />
                                    <span className="glow-orb glow-orb-3" />
                                    <span className="glow-label flex items-center gap-2">
                                        {isSubscribed ? "Thank You!" : "Subscribe"}
                                        {!isSubscribed && <Send size={20} />}
                                    </span>
                                </button>
                            </form>
                        </div>

                        {/* 2️⃣ Right Side – Social Icons */}
                        <div className="flex flex-col items-center lg:items-end gap-8">
                            <h4 className="text-[#CFCFEA] text-xs font-bold uppercase tracking-[0.3em] opacity-50">Connect with us</h4>
                            <div className="flex gap-5">
                                {socialLinks.map((social, index) => (
                                    <motion.a
                                        key={social.label}
                                        href={social.href}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{
                                            scale: 1.2,
                                            y: -5,
                                            backgroundColor: "rgba(255, 255, 255, 0.08)",
                                            borderColor: "rgba(157, 124, 255, 0.5)",
                                            color: "#9D7CFF"
                                        }}
                                        className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/[0.04] border border-white/10 text-white transition-all shadow-lg"
                                    >
                                        {social.icon}
                                    </motion.a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section – Copyright + Legal Links */}
                    <div className="mt-20 pt-10 border-t border-white/[0.08] flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-[#CFCFEA] text-sm opacity-40">
                            &copy; {new Date().getFullYear()} Studlyf. All rights reserved.
                        </p>
                        <div className="flex gap-6">
                            <button
                                onClick={() => setShowTerms(true)}
                                className="text-[#CFCFEA] text-xs font-bold uppercase tracking-widest hover:text-purple-400 transition-colors"
                            >
                                Terms & Conditions
                            </button>
                            <a
                                href="/privacy-policy"
                                className="text-[#CFCFEA] text-xs font-bold uppercase tracking-widest hover:text-purple-400 transition-colors"
                            >
                                Privacy Policy
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
};

export default Footer;