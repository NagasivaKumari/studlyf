import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, ArrowRight, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';

export interface SpotlightItem {
    id: string;
    title: string;
    description: string;
    image: string;
    type: string;
    cta: string;
    date: string;
    community: string;
    color: string;
    glow: string;
}

const SPOTLIGHT_DATA: SpotlightItem[] = [
    {
        id: "event-1",
        title: "Global AI Hackathon 2026",
        description: "Join 2,000+ developers worldwide to build the next generation of AI agents. Compete for prizes and exclusive internships.",
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
        type: "Hackathon",
        cta: "Register Now",
        date: "Oct 15 - Oct 17, 2026",
        community: "STUDLYF × TechCorp",
        color: "from-purple-600 to-indigo-600",
        glow: "shadow-purple-500/30"
    },
    {
        id: "event-2",
        title: "Founder's Masterclass: Scaling SaaS",
        description: "Learn how to scale your startup from zero to one. An exclusive workshop by industry leaders focusing on growth loops.",
        image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80",
        type: "Workshop",
        cta: "Save Your Seat",
        date: "Nov 5, 2026 • Live Virtual",
        community: "Startup Hub",
        color: "from-pink-600 to-rose-600",
        glow: "shadow-pink-500/30"
    },
    {
        id: "event-3",
        title: "Web3 Builders Summit",
        description: "The ultimate gathering for blockchain developers and crypto enthusiasts. Keynotes, technical deep-dives, and networking.",
        image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80",
        type: "Community Event",
        cta: "Explore Event",
        date: "Dec 10, 2026 • Dubai",
        community: "Web3 Foundation",
        color: "from-blue-600 to-cyan-600",
        glow: "shadow-blue-500/30"
    },
    {
        id: "event-4",
        title: "Open Source Contribution Month",
        description: "Kickstart your open source journey. Find mentorship, contribute to massive projects, and build your developer portfolio.",
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
        type: "Collaboration",
        cta: "Join Initiative",
        date: "Entire Month of January",
        community: "STUDLYF Originals",
        color: "from-emerald-600 to-teal-600",
        glow: "shadow-emerald-500/30"
    }
];

export default function AdsCarousel() {
    // In the future, this can be hydrated by fetch(`${API_BASE_URL}/api/ads`) 
    // mapped into the SpotlightItem structure.
    const [items] = useState<SpotlightItem[]>(SPOTLIGHT_DATA);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    
    // Auto progress
    useEffect(() => {
        if (isHovered || items.length === 0) return;
        
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 5000);
        
        return () => clearInterval(timer);
    }, [isHovered, items.length]);

    if (items.length === 0) return null;

    const currentItem = items[currentIndex];

    return (
        <section className="relative w-full py-20 bg-white overflow-hidden font-['Poppins']">
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-purple-500/5 to-pink-500/5 rounded-full blur-[100px]" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-blue-500/5 to-transparent rounded-full blur-[80px]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-black text-black tracking-tight uppercase"
                        >
                            Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4DFF] via-[#EC4899] to-[#FF5B5B]">Spotlight</span>
                        </motion.h2>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-500 mt-2 font-medium text-lg"
                        >
                            Discover premium opportunities, hackathons, and exclusive events.
                        </motion.p>
                    </div>
                </div>

                <div 
                    className="flex flex-col lg:flex-row gap-6 lg:gap-8"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Main Featured Card */}
                    <div className="relative flex-grow lg:w-2/3 aspect-[4/5] sm:aspect-[4/3] lg:aspect-auto lg:h-[540px] rounded-[2rem] overflow-hidden group shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentItem.id}
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute inset-0"
                            >
                                {/* Background Image */}
                                <div className="absolute inset-0">
                                    <img 
                                        src={currentItem.image} 
                                        alt={currentItem.title}
                                        className="w-full h-full object-cover transition-transform duration-[10s] ease-out group-hover:scale-110"
                                    />
                                    {/* Cinematic Gradient Overlays */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/60 to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19]/90 via-[#0B0F19]/40 to-transparent" />
                                </div>

                                {/* Content Hierarchy */}
                                <div className="absolute inset-0 p-6 sm:p-10 md:p-12 flex flex-col justify-end">
                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-3 mb-6">
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r ${currentItem.color} shadow-lg backdrop-blur-md`}
                                        >
                                            {currentItem.type}
                                        </motion.div>
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-white/20 backdrop-blur-xl border border-white/30 flex items-center gap-1.5"
                                        >
                                            <Sparkles size={14} className="text-yellow-300" />
                                            {currentItem.community}
                                        </motion.div>
                                    </div>

                                    {/* Title */}
                                    <motion.h3 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4, duration: 0.5 }}
                                        className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-[1.1] tracking-tight drop-shadow-xl"
                                    >
                                        {currentItem.title}
                                    </motion.h3>

                                    {/* Description */}
                                    <motion.p 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5, duration: 0.5 }}
                                        className="text-gray-200 text-sm sm:text-base md:text-lg max-w-2xl mb-8 leading-relaxed font-medium drop-shadow-md line-clamp-3 sm:line-clamp-none"
                                    >
                                        {currentItem.description}
                                    </motion.p>

                                    {/* Footer Actions */}
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6, duration: 0.5 }}
                                        className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
                                    >
                                        <button className={`px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest text-white bg-gradient-to-r ${currentItem.color} hover:opacity-90 transition-all hover:-translate-y-1 hover:shadow-2xl flex items-center gap-2 shadow-lg ${currentItem.glow}`}>
                                            {currentItem.cta}
                                            <ArrowRight size={18} />
                                        </button>
                                        
                                        <div className="flex flex-col gap-1.5 border-l-2 border-white/20 pl-6 hidden sm:flex">
                                            <div className="flex items-center gap-2 text-sm text-gray-300 font-bold tracking-wide">
                                                <Calendar size={16} className="text-white" />
                                                <span>{currentItem.date}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-300 font-bold tracking-wide">
                                                <Users size={16} className="text-white" />
                                                <span>Premium Event</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Top Progress Bar */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-black/20 z-20 overflow-hidden">
                            <motion.div 
                                key={currentIndex + (isHovered ? "-hover" : "-play")}
                                initial={{ width: "0%" }}
                                animate={{ width: isHovered ? "0%" : "100%" }}
                                transition={{ duration: 5, ease: "linear" }}
                                className={`h-full bg-gradient-to-r ${currentItem.color}`}
                            />
                        </div>
                    </div>

                    {/* Right Side / Bottom: Preview Cards Navigation */}
                    <div className="lg:w-1/3 flex flex-col gap-3 h-[540px] overflow-y-auto pr-2 custom-scrollbar pb-4 lg:pb-0">
                        {items.map((item, idx) => {
                            const isActive = idx === currentIndex;
                            return (
                                <motion.div 
                                    key={item.id}
                                    onClick={() => setCurrentIndex(idx)}
                                    whileHover={{ scale: isActive ? 1 : 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`
                                        relative p-3 sm:p-4 rounded-[1.5rem] cursor-pointer transition-all duration-300 flex gap-4 items-center group
                                        ${isActive 
                                            ? 'bg-white shadow-[0_10px_40px_rgba(108,77,255,0.15)] border-2 border-purple-400' 
                                            : 'bg-gray-50 border-2 border-transparent hover:bg-white hover:shadow-lg hover:border-purple-200'}
                                    `}
                                >
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1rem] overflow-hidden shrink-0 relative shadow-inner">
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        <div className={`absolute inset-0 transition-colors duration-300 ${isActive ? 'bg-transparent' : 'bg-black/30 group-hover:bg-black/10'}`} />
                                    </div>
                                    
                                    <div className="flex flex-col justify-center flex-grow py-1">
                                        <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-purple-600 mb-1.5">
                                            {item.type}
                                        </div>
                                        <h4 className={`font-bold text-sm sm:text-base leading-tight mb-2 line-clamp-2 ${isActive ? 'text-black' : 'text-gray-600 group-hover:text-black'}`}>
                                            {item.title}
                                        </h4>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold mt-auto">
                                            <Calendar size={14} className={isActive ? 'text-purple-500' : 'text-gray-400'} />
                                            <span className="truncate">{item.date.split('•')[0].trim()}</span>
                                        </div>
                                    </div>

                                    {/* Active Indicator Line */}
                                    {isActive && (
                                        <motion.div 
                                            layoutId="activeIndicator"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full"
                                        />
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
