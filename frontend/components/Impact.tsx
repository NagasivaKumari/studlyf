import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useAnimation, useSpring, useTransform } from 'framer-motion';

const StatCard = ({ number, suffix, label, delay, floatDirection = 1, floatDuration = 4.8 }: { number: number, suffix: string, label: string, delay: number, floatDirection?: 1 | -1, floatDuration?: number }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    // Animation for counting up
    const springValue = useSpring(0, {
        stiffness: 40,
        damping: 20,
        restDelta: 0.001
    });

    const displayValue = useTransform(springValue, (latest) => Math.floor(latest).toLocaleString());

    useEffect(() => {
        if (isInView) {
            springValue.set(number);
        }
    }, [isInView, number, springValue]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            animate={{ y: [0, floatDirection * -7, 0] }}
            transition={{
                opacity: { duration: 0.5, delay },
                y: { duration: floatDuration, repeat: Infinity, ease: "easeInOut", delay }
            }}
            whileHover={{ y: floatDirection * -10, scale: 1.02 }}
            className="relative group p-4 md:p-5 rounded-[1.5rem] bg-[#0F172A] border border-white/5 overflow-hidden shadow-xl transition-all duration-300"
        >
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#6C3BFF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Background Grain */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC42NSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNuKSIvPjwvc3ZnPg==')]" />

            <div className="relative z-10">
                <div className="flex items-baseline space-x-1 mb-2">
                    <motion.h3 className="text-3xl md:text-4xl font-bold text-white tracking-tighter leading-none">
                        {displayValue}
                    </motion.h3>
                    <span className="text-2xl md:text-3xl font-bold text-[#6C3BFF]">{suffix}</span>
                </div>

                <p className="text-white/60 text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] mb-3">
                    {label}
                </p>

                {/* Animated Gradient Underline */}
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: delay + 0.3 }}
                    className="h-[3px] bg-gradient-to-r from-[#6C3BFF] to-transparent rounded-full"
                />
            </div>

            {/* Subtle Inner Border Shine */}
            <div className="absolute inset-0 border border-white/10 rounded-[2rem] pointer-events-none group-hover:border-[#6C3BFF]/40 transition-colors duration-300" />
        </motion.div>
    );
};

const Impact = () => {
    const images = [
        { src: '/images/impact/hackathon.png', alt: 'Hackathon', size: 'h-48 md:h-60', delay: 0.1 },
        { src: '/images/impact/certificates.png', alt: 'Certificates', size: 'h-56 md:h-72', delay: 0.2 },
        { src: '/images/impact/mentorship.png', alt: 'Mentorship', size: 'h-64 md:h-80', delay: 0.3 },
        { src: '/images/impact/online_sessions.png', alt: 'Online Sessions', size: 'h-48 md:h-60', delay: 0.4 },
    ];

    const stats = [
        { number: 5000, suffix: '+', label: 'Strong Community', delay: 0.3 },
        { number: 15000, suffix: '+', label: 'Students Reached', delay: 0.3 },
        { number: 25, suffix: '+', label: 'Colleges Partnered', delay: 0.3 },
        { number: 1, suffix: ' Lakh +', label: 'Media Reach', delay: 0.4 },
        { number: 15, suffix: '+', label: 'Startup Hiring Partners', delay: 0.5 },
    ];

    return (
        <section className="w-full bg-white py-16 sm:py-24 px-4 sm:px-12 lg:px-24 overflow-hidden relative" id="impact">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#6C3BFF]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">

                {/* LEFT SIDE: Media Grid */}
                <div className="order-1 lg:order-1 relative group-grid w-full">
                    <div className="grid grid-cols-2 gap-3 sm:gap-6">
                        {/* Column 1 */}
                        <div className="space-y-4 md:space-y-6 flex flex-col justify-center">
                            {images.filter((_, i) => i % 2 === 0).map((img, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        duration: 0.8,
                                        delay: img.delay,
                                        y: {
                                            duration: 6,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }
                                    }}
                                    animate={{
                                        y: i % 2 === 0 ? [0, -10, 0] : [0, 10, 0]
                                    }}
                                    className={`relative rounded-3xl overflow-hidden group shadow-xl ${img.size}`}
                                >
                                    <motion.img
                                        src={img.src}
                                        alt={img.alt}
                                        loading="lazy"
                                        whileHover={{ scale: 1.03 }}
                                        className="w-full h-full object-cover transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </motion.div>
                            ))}
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-4 md:space-y-6 pt-12">
                            {images.filter((_, i) => i % 2 !== 0).map((img, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        duration: 0.8,
                                        delay: img.delay,
                                        y: {
                                            duration: 5,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }
                                    }}
                                    animate={{
                                        y: i % 2 === 0 ? [0, 10, 0] : [0, -10, 0]
                                    }}
                                    className={`relative rounded-3xl overflow-hidden group shadow-xl ${img.size}`}
                                >
                                    <motion.img
                                        src={img.src}
                                        alt={img.alt}
                                        loading="lazy"
                                        whileHover={{ scale: 1.03 }}
                                        className="w-full h-full object-cover transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    {/* Soft Blur Gradient Overlay for Depth */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/50 to-transparent pointer-events-none z-10" />
                </div>

                {/* RIGHT SIDE: Impact Content */}
                <div className="order-2 lg:order-2 space-y-12">
                    <div className="space-y-6">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl lg:text-7xl font-black text-[#0F172A] leading-[1.1] tracking-tight"
                        >
                            OUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4DFF] via-[#EC4899] to-[#FF5B5B]">IMPACT</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-slate-500 max-w-lg"
                        >
                            Creating a global ecosystem where engineering skills meet real-world opportunities.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-2xl">
                        {stats.map((stat, i) => (
                            <StatCard
                                key={i}
                                {...stat}
                                floatDirection={i % 2 === 0 ? 1 : -1}
                                floatDuration={4.4 + i * 0.35}
                            />
                        ))}
                    </div>


                </div>

            </div>
        </section>
    );
};

export default Impact;