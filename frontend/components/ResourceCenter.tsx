pull the code pimport React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, FileText, Video, Lightbulb, X } from 'lucide-react';

interface ResourceItem {
    type: string;
    title: string;
    desc: string;
    content: string;
    image: string;
    icon: JSX.Element;
    height: string;
    cardBg: string;
    glowColor: string;
    link: string;
}

const ResourceCenter: React.FC = () => {
    const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);

    const resources: ResourceItem[] = [
        {
            type: 'CASE STUDY',
            title: 'Elm Partners with Studlyf to Build a Graduate Development Program',
            desc: 'Elm is recognized for fostering a creative work environment that encourages...',
            image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
            icon: <BookOpen size={14} />,
            height: 'h-[360px]',
            cardBg: 'bg-gradient-to-br from-[#1E40AF] to-[#3B82F6]',
            glowColor: 'border-sky-400/50 hover:shadow-sky-400/20 text-sky-400 bg-sky-500/10',
            content: 'A quick peek into how creative teams use rapid prototyping and live feedback loops to build more engaging graduate programs.',
            link: 'https://example.com/case-study/elm-partners'
        },
        {
            type: 'REPORT',
            title: 'Generative AI Leadership Playbook',
            desc: 'Data-driven leaders are rethinking product strategy in every industry.',
            content: 'Takeaway notes, market signals, and tactical steps for product teams adopting AI-powered workflows.',
            image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800',
            icon: <FileText size={14} />,
            height: 'h-[360px]',
            cardBg: 'bg-[#1A0F0A]',
            glowColor: 'border-emerald-400/50 hover:shadow-emerald-400/20 text-emerald-400 bg-emerald-500/10',
            link: 'https://example.com/report/generative-ai'
        },
        {
            type: 'CASE STUDY',
            title: "Studlyf's Data Empowerment Initiative at Siemens",
            desc: 'Siemens SI has partnered with Studlyf to launch the Data Empowerment...',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
            icon: <BookOpen size={14} />,
            height: 'h-[360px]',
            cardBg: 'bg-[#4C1D95]',
            glowColor: 'border-amber-400/50 hover:shadow-amber-400/20 text-amber-400 bg-amber-500/10',
            content: 'A practical case example showing how analytics and collaboration can fuel better decision-making inside a large manufacturing business.',
            link: 'https://example.com/case-study/siemens-data'
        },
        {
            type: 'WEBINAR',
            title: 'What AI Agents can and can not do',
            desc: "Whether you're a developer, product manager, or just curious...",
            content: 'A quick summary of agent capabilities, limits, and the ideal situations for human + AI collaboration.',
            image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800',
            icon: <Video size={14} />,
            height: 'h-[360px]',
            cardBg: 'bg-[#051937]',
            glowColor: 'border-indigo-400/50 hover:shadow-indigo-400/20 text-indigo-400 bg-indigo-500/10',
            link: 'https://example.com/webinar/ai-agents'
        },
        {
            type: 'CASE STUDY',
            title: 'How Agentic AI works: MCP explained',
            desc: 'A deep dive into the underlying architecture of agentic workflows.',
            content: 'An example of how agent orchestration can simplify complex business processes while keeping humans in control.',
            image: 'https://images.unsplash.com/photo-1620712943543-bcc4628c9757?auto=format&fit=crop&q=80&w=1400',
            icon: <BookOpen size={14} />,
            height: 'h-[360px]',
            cardBg: 'bg-[#004DFF]',
            glowColor: 'border-rose-400/50 hover:shadow-rose-400/20 text-rose-400 bg-rose-500/10',
            link: 'https://example.com/case-study/agentic-ai'
        },
        {
            type: 'MEDIA',
            title: '2025 State of AI at work report',
            desc: 'The adoption of AI is accelerating...',
            content: 'A concise report snapshot covering AI adoption, skills demand, and workplace transformation in the next year.',
            image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800',
            icon: <FileText size={14} />,
            height: 'h-[360px]',
            cardBg: 'bg-[#C084FC]',
            glowColor: 'border-teal-400/50 hover:shadow-teal-400/20 text-teal-400 bg-teal-500/10',
            link: 'https://example.com/media/ai-work-report'
        }
    ];

    const containerVariants: any = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants: any = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    return (
        <section className="relative w-full bg-white overflow-hidden font-poppins text-[#111827]">
            {/* 🌑 Deep Purple/Navy Header Area */}
            <div className="max-w-[1600px] mx-auto sm:px-8 relative">
                <div className="bg-[#2D0B5A] pt-12 pb-32 px-6 sm:px-8 text-center relative overflow-hidden rounded-[2.5rem] sm:rounded-[5rem]">
                    {/* Subtle Brand Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#2563EB]/15 rounded-full blur-[120px] pointer-events-none" />

                    <div className="max-w-7xl mx-auto relative z-10 space-y-8">
                        {/* Center Label with Exact Blue Lines */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex items-center justify-center gap-4 sm:gap-6"
                        >
                            <div className="h-[1px] flex-grow max-w-[150px] bg-gradient-to-r from-transparent via-[#2563EB]/50 to-[#2563EB]" />
                            <div className="flex flex-col items-center gap-2 shrink-0">
                                <motion.div
                                    animate={{
                                        opacity: [0.7, 1, 0.7],
                                        scale: [1, 1.1, 1],
                                        filter: [
                                            "drop-shadow(0 0 0px rgba(56,189,248,0))",
                                            "drop-shadow(0 0 15px rgba(56,189,248,0.9))",
                                            "drop-shadow(0 0 0px rgba(56,189,248,0))"
                                        ]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    <Lightbulb size={28} className="text-[#38BDF8]" strokeWidth={1.2} />
                                </motion.div>
                                <span className="text-[#38BDF8] text-[12px] md:text-sm font-bold tracking-[0.4em] uppercase">Resource centre</span>
                            </div>
                            <div className="h-[1px] flex-grow max-w-[150px] bg-gradient-to-l from-transparent via-[#2563EB]/50 to-[#2563EB]" />
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, scale: 0.98 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-2xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1]"
                        >
                            Stay ahead of what's Next.
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-gray-400/80 text-xs md:text-base max-w-2xl mx-auto font-medium leading-relaxed italic"
                        >
                            Research and insights from tech experts and thought leaders so you're always on top of tech's latest trends
                        </motion.p>
                    </div>
                </div>
            </div>

            {/* ⚪ Premium Light Body Area */}
            <div className="pb-8 -mt-24 pt-0 px-4 md:px-12 relative z-20">
                <div className="max-w-[1300px] mx-auto">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {resources.map((res, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                whileHover={{ y: -12, transition: { duration: 0.4, ease: "easeOut" } }}
                                onClick={() => setSelectedResource(res)}
                                className={`group relative ${res.cardBg} rounded-[3rem] overflow-hidden transition-all duration-500 shadow-2xl flex flex-col border-x border-b cursor-pointer ${res.glowColor.split(' ')[0]} ${res.height}`}
                            >
                                {/* Permanent Background Glow Layer */}
                                <div className="absolute inset-0 z-0 opacity-40">
                                    <div className={`absolute inset-0 blur-[80px] -m-10 ${res.glowColor.split(' ').pop()}`} />
                                </div>

                                <div className="absolute inset-0 z-0">
                                    <img
                                        src={res.image}
                                        alt=""
                                        className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 opacity-20 grayscale"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/80 to-transparent" />
                                </div>

                                <div className="relative z-10 p-7 h-full flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl bg-white/5 border transition-all duration-500 ${res.glowColor.split(' ').slice(-2, -1)[0]} border-current`}>
                                                {res.icon}
                                            </div>
                                            <span className={`text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-white/5 border transition-all duration-500 ${res.glowColor.split(' ').slice(-2, -1)[0]} border-current`}>
                                                {res.type}
                                            </span>
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-bold text-white leading-tight transition-colors duration-500 group-hover:text-white">
                                            {res.title}
                                        </h3>
                                        <p className="text-white text-xs md:text-sm leading-relaxed opacity-90 transition-colors duration-500">
                                            {res.desc}
                                        </p>
                                    </div>

                                    <div className="mt-6">
                                        <button className="flex items-center gap-2 text-white/70 text-[10px] font-bold tracking-widest uppercase transition-all duration-500 border-b border-transparent pb-1 group-hover:text-white group-hover:border-current">
                                            READ MORE <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {selectedResource && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70" onClick={() => setSelectedResource(null)}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.25 }}
                                onClick={(event) => event.stopPropagation()}
                                className="w-full max-w-5xl h-[90vh] rounded-[2rem] overflow-hidden bg-white shadow-2xl border border-slate-200 flex flex-col"
                            >
                                {/* Header - Fixed */}
                                <div className="flex items-start justify-between gap-4 p-6 bg-slate-950 text-white flex-shrink-0">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Raw structure preview</p>
                                        <h3 className="mt-2 text-2xl font-bold">{selectedResource.title}</h3>
                                        <p className="mt-2 text-sm text-slate-300">{selectedResource.type}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedResource(null)}
                                        className="rounded-full border border-slate-700 bg-slate-900/80 p-2 text-slate-200 transition hover:bg-slate-900 flex-shrink-0"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Scrollable Content Area */}
                                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 scroll-smooth modal-scrollable">
                                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr] p-6">
                                        <div className="space-y-4">
                                            {/* Description Section */}
                                            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                                                <p className="text-sm text-slate-500 uppercase tracking-[0.35em]">Description</p>
                                                <p className="mt-3 text-slate-700 leading-relaxed">{selectedResource.desc}</p>
                                            </div>
                                            {/* Raw Content Section - Scrollable */}
                                            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-6 shadow-sm flex flex-col max-h-[500px]">
                                                <p className="text-sm text-slate-400 uppercase tracking-[0.35em] flex-shrink-0">Raw content</p>
                                                <div className="mt-3 overflow-y-auto overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-lime-100 flex-1 whitespace-pre-wrap break-words custom-scrollbar">
{`type: ${selectedResource.type}
title: ${selectedResource.title}
desc: ${selectedResource.desc}
content: ${selectedResource.content}
image: ${selectedResource.image}`}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            {/* Image Section */}
                                            <div className="rounded-[1.5rem] overflow-hidden border border-slate-200 shadow-sm">
                                                <img src={selectedResource.image} alt={selectedResource.title} className="w-full h-96 object-cover" />
                                            </div>
                                            {/* Details Section */}
                                            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm flex flex-col max-h-[300px]">
                                                <p className="text-sm text-slate-500 uppercase tracking-[0.35em] flex-shrink-0">Details</p>
                                                <div className="mt-3 overflow-y-auto flex-1 custom-scrollbar">
                                                    <p className="text-slate-700 leading-relaxed">{selectedResource.content}</p>
                                                    <p className="mt-4 text-xs uppercase tracking-[0.35em] text-slate-400">Source</p>
                                                    <a href={selectedResource.link} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-blue-600 hover:text-blue-500 break-all">{selectedResource.link}</a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Scroll Indicator */}
                                <div className="h-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent flex-shrink-0" />
                            </motion.div>
                        </div>
                    )}

                    {/* ✨ Premium Animated Footer Button */}
                    <div className="mt-10 flex justify-center">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.open('https://example.com/case-studies', '_blank')}
                            className="relative group p-[2px] rounded-full overflow-hidden bg-[#2563EB]/20 shadow-xl transition-all duration-500 border border-white/10"
                        >
                            {/* ✨ Rotating Border Shine */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent,transparent,#2563EB,transparent,transparent)] opacity-0 group-hover:opacity-100 transition-opacity"
                            />

                            {/* 🌬️ Pulsating Outer Glow */}
                            <motion.div
                                animate={{
                                    boxShadow: [
                                        "0 0 20px rgba(37,99,235,0.2)",
                                        "0 0 40px rgba(37,99,235,0.6)",
                                        "0 0 20px rgba(37,99,235,0.2)"
                                    ]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute inset-0 rounded-full"
                            />

                            <div className="relative px-16 py-5 rounded-full bg-[#2D0B5A] flex items-center gap-3 text-white font-bold tracking-[0.3em] transition-all z-10 uppercase text-sm border-2 border-[#2563EB]/50 group-hover:border-[#2563EB]">
                                {/* Internal Shimmer/Scan */}
                                <motion.div
                                    animate={{ x: ["-100%", "200%"] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-1/2 skew-x-[-20deg] pointer-events-none"
                                />
                                <span className="relative z-20">EXPLORE</span>
                            </div>
                        </motion.button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ResourceCenter;
