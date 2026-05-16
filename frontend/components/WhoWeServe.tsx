import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, GraduationCap, Building2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const cardData = [
    {
        title: "Startups",
        icon: Rocket,
        bullets: [
            "Build job-ready engineering talent",
            "Upskill teams with hands-on tech training",
            "AI-powered assessment & hiring support"
        ],
        highlight: false,
        theme: {
            primary: "red",
            bg: "from-red-50 to-white",
            header: "bg-gradient-to-r from-red-400 to-rose-300",
            border: "border-red-200",
            icon: "bg-red-50 text-red-500",
            blob: "red-300"
        }
    },
    {
        title: "Students",
        icon: GraduationCap,
        bullets: [
            "Learn by building real-world projects",
            "Career-focused roadmaps & mentorship",
            "Mock interviews & AI feedback system"
        ],
        highlight: true,
        theme: {
            primary: "violet",
            bg: "from-violet-50 to-white",
            header: "bg-gradient-to-r from-violet-500 to-purple-400",
            border: "border-violet-300",
            icon: "bg-violet-50 text-violet-600",
            blob: "violet-400"
        }
    },
    {
        title: "Institutions",
        icon: Building2,
        bullets: [
            "Industry-aligned curriculum integration",
            "Live practice & project-based modules",
            "Placement-driven learning ecosystem"
        ],
        highlight: false,
        theme: {
            primary: "blue",
            bg: "from-blue-50 to-white",
            header: "bg-gradient-to-r from-blue-400 to-sky-300",
            border: "border-blue-200",
            icon: "bg-blue-50 text-blue-500",
            blob: "blue-300"
        }
    }
];

const WhoWeServe: React.FC = () => {
    const { user, role } = useAuth();
    const navigate = useNavigate();
    return (
        <section className="relative w-full py-10 md:py-12 overflow-hidden bg-white font-['Poppins']">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    animate={{
                        x: [0, 30, -30, 0],
                        y: [0, -50, 50, 0],
                        scale: [1, 1.2, 0.9, 1],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-200/20 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        x: [0, -40, 40, 0],
                        y: [0, 60, -60, 0],
                        scale: [1, 0.8, 1.1, 1],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-100/20 rounded-full blur-[120px]"
                />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Top Centered Title */}
                <div className="text-center mb-10 md:mb-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-5xl md:text-7xl font-['Poppins'] font-extrabold text-black tracking-tight uppercase leading-[1.1]"
                    >
                        WHO WE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4DFF] via-[#EC4899] to-[#FF5B5B]">SERVE</span>
                    </motion.h2>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-12 lg:gap-16 items-center">
                    {/* Left Sidebar Heading */}
                    <div className="text-center lg:text-left relative py-8 px-4">
                        {/* Decorative background accent */}
                        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1.5 h-16 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full hidden lg:block" />

                        <motion.h3
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-3xl md:text-5xl font-['Poppins'] font-black uppercase leading-tight whitespace-nowrap lg:pl-6"
                        >
                            <span className="block mb-4">
                                <div className="bg-white p-3 rounded-2xl inline-block shadow-sm">
                                    <img src="/images/studlyf.png" alt="Studlyf" className="h-12 md:h-20 w-auto inline-block" />
                                </div>
                            </span>
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#6C4DFF] via-[#EC4899] to-[#FF5B5B]">For</span>
                        </motion.h3>

                        {/* Mobile decorative line */}
                        <div className="w-16 h-1 bg-gradient-to-r from-purple-600 to-blue-600 mx-auto mt-4 lg:hidden rounded-full" />
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                        {cardData.map((card, index) => (
                            <motion.div
                                key={card.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                whileHover={{
                                    y: -8,
                                    transition: { duration: 0.3 }
                                }}
                                className={`group relative rounded-[24px] overflow-hidden transition-all duration-500 flex flex-col border-2
                                    ${card.theme.border}
                                    bg-white/30 backdrop-blur-xl
                                    ${card.highlight
                                        ? `shadow-[0_40px_80px_rgba(108,59,255,0.1)] border-opacity-60`
                                        : `shadow-[0_15px_40px_rgba(0,0,0,0.02)] border-opacity-30`
                                    }
                                    hover:shadow-3xl hover:bg-white/50
                                `}
                            >
                                {/* Header Strip (Transparent Gradient) */}
                                <div className={`py-3 px-4 text-center ${card.theme.header} bg-opacity-70 backdrop-blur-md transition-all duration-300`}>
                                    <span className="text-white font-bold text-lg tracking-wide uppercase">
                                        {card.title}
                                    </span>
                                </div>

                                {/* Hero / Icon Section (Fluid Transparent) */}
                                <div className={`relative pt-10 pb-6 text-center bg-gradient-to-br ${card.theme.bg} bg-opacity-10 transition-colors duration-500 flex flex-col items-center`}>
                                    {/* Liquid Blobs */}
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            rotate: [0, 90, 0],
                                            borderRadius: ["40% 60% 70% 30% / 40% 50% 60% 50%", "60% 40% 30% 70% / 50% 60% 40% 60%", "40% 60% 70% 30% / 40% 50% 60% 50%"]
                                        }}
                                        transition={{ duration: 8, repeat: Infinity }}
                                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-${card.theme.blob} opacity-10 blur-xl px-4 pointer-events-none group-hover:scale-150 transition-transform duration-700`}
                                    />

                                    <div className={`relative mb-4 inline-flex items-center justify-center w-20 h-20 rounded-[30%_70%_70%_30%_/_30%_30%_70%_70%] ${card.theme.icon} bg-opacity-20 backdrop-blur-sm group-hover:rounded-full group-hover:scale-110 transition-all duration-700 shadow-lg`}>
                                        <card.icon size={32} strokeWidth={1.5} />
                                    </div>
                                </div>

                                {/* Body Section (Transparent) */}
                                <div className="p-6 bg-white/10 flex-grow flex flex-col backdrop-blur-sm">
                                    <ul className="space-y-4 flex-grow">
                                        {card.bullets.map((bullet, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <div className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${card.highlight ? 'bg-purple-600/80 text-white' : `bg-${card.theme.primary}-100/40 text-${card.theme.primary}-600`}`}>
                                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <span className="text-gray-700 text-[13px] leading-snug font-bold group-hover:text-black transition-colors uppercase tracking-tight">{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            console.log("[WhoWeServe] Card clicked:", card.title, "Current User:", user?.email, "Current Role:", role);
                                            if (user) {
                                                if (role === 'institution') {
                                                    console.log("[WhoWeServe] Routing to Institution Dashboard");
                                                    navigate('/institution-dashboard');
                                                } else if (role === 'super_admin' || role === 'admin') {
                                                    navigate('/admin');
                                                } else if (role === 'student') {
                                                    console.log("[WhoWeServe] Routing to Learner Dashboard");
                                                    navigate('/dashboard/learner');
                                                } else {
                                                    console.log("[WhoWeServe] Role not yet loaded or unknown, waiting for global redirect...");
                                                }
                                                return;
                                            }

                                            if (card.title === 'Students') {
                                                console.log("[WhoWeServe] No user. Routing to Student Signup");
                                                navigate('/signup?role=student');
                                            } else if (card.title === 'Institutions') {
                                                console.log("[WhoWeServe] No user. Routing to Institution Signup");
                                                navigate('/signup?role=institution');
                                            } else {
                                                navigate('/login');
                                            }
                                        }}
                                        className={`mt-8 w-full py-3 px-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border-2 text-white shadow-lg glow-btn
                                            ${card.highlight
                                                ? 'bg-purple-600 border-purple-600 shadow-purple-600/20 hover:bg-purple-700'
                                                : `${card.theme.header} border-transparent hover:opacity-90`}
                                        `}
                                    >
                                        <span className="glow-orb glow-orb-1" />
                                        <span className="glow-orb glow-orb-2" />
                                        <span className="glow-orb glow-orb-3" />
                                        <span className="glow-label flex items-center justify-center gap-2 w-full">
                                            Contact
                                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </motion.button>
                                </div>

                                {/* Bottom Accent Line */}
                                <div className={`h-2 w-full bg-gradient-to-r transition-all duration-500 opacity-0 group-hover:opacity-100
                                    ${card.highlight 
                                        ? 'from-purple-600 to-indigo-600' 
                                        : card.theme.primary === 'red'
                                            ? 'from-red-500 to-rose-400'
                                            : 'from-blue-500 to-sky-400'
                                    }`} 
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WhoWeServe;
