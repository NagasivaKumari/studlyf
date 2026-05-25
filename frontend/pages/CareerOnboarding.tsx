
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    ChevronLeft,
    ChevronDown,
    Sparkles,
    CheckCircle2,
    Brain,
    Target,
    Rocket,
    Search,
    RefreshCw,
    Plus,
    MessageSquare,
    FileText,
    Lightbulb,
    Briefcase,
    GraduationCap,
    Dumbbell,
    Heart,
    X,
    History,
    Copy,
    TrendingUp,
    Award,
    BookOpen,
    MapPin,
    Cpu,
    BarChart4,
    Zap,
    LayoutDashboard,
    Settings2,
    Share2,
    Edit3,
    Network,
    Flag,
    Loader2,
    Info,
    PlayCircle,
    Code,
    Terminal,
    ChevronRight
} from 'lucide-react';

import { API_BASE_URL as API_BASE } from '../apiConfig';

const DEFAULT_PATHS = [
    { name: "Cloud Solutions Architect", group: "Cloud", color: "#0EA5E9", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=300&fit=crop", desc: "Design secure, scalable cloud architectures." },
    { name: "Mobile App Developer", group: "App", color: "#3B82F6", image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&h=300&fit=crop", desc: "Build native and hybrid mobile experiences." },
    { name: "Cyber Security Lead", group: "Security", color: "#EF4444", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=300&h=300&fit=crop", desc: "Protect systems and data from digital threats." },
    { name: "AI Research Scientist", group: "AI", color: "#6366F1", image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&h=300&fit=crop", desc: "Advance the future with machine learning." },
    { name: "Data Science Manager", group: "Maths", color: "#10B981", image: "https://images.unsplash.com/photo-1551288049-bbda38a10ad1?w=300&h=300&fit=crop", desc: "Extract insights and drive data decisions." },
    { name: "Product Development", group: "Business", color: "#F59E0B", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=300&fit=crop", desc: "Turn ideas into scalable, impactful products." },
    { name: "UX Design Architect", group: "Design", color: "#EC4899", image: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=300&h=300&fit=crop", desc: "Design meaningful experiences users love." },
    { name: "Full Stack Engineer", group: "Dev", color: "#F97316", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&h=300&fit=crop", desc: "Build end-to-end web applications." },
    { name: "Robotics Lead Eng", group: "Robotics", color: "#06B6D4", image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&h=300&fit=crop", desc: "Build intelligent robots for the real world." },
    { name: "Blockchain Strategist", group: "Web3", color: "#F43F5E", image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=300&h=300&fit=crop", desc: "Design secure, transparent ledger solutions." },
    { name: "Quantum Computing Dev", group: "Future", color: "#14B8A6", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&h=300&fit=crop", desc: "Work on next-gen computing systems." },
    { name: "Big Data Engineer", group: "Data", color: "#F59E0B", image: "https://images.unsplash.com/photo-1558494949-ef01091244ea?w=300&h=300&fit=crop", desc: "Process and scale massive data streams." },
    { name: "Systems Integrator", group: "Ops", color: "#10B981", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=300&fit=crop", desc: "Unify complex technical subsystems." },
    { name: "IoT Platform Eng", group: "Tech", color: "#3B82F6", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=300&fit=crop", desc: "Connect devices for smarter ecosystems." },
];

const FALLBACK_ROADMAP = [
    { "month": 1, "title": "Starting Out", "tasks": ["Learn basic tools", "Set up your screen"], "project": "Initial Draft", "stack": ["VS Code", "Terminal"], "concepts": ["File Systems", "Basic Syntax"], "extras": "Watch YouTube Intros" },
    { "month": 2, "title": "Building Core Skills", "tasks": ["Try 5 small tasks", "Post your work"], "project": "Prototype One", "stack": ["Python", "Git"], "concepts": ["Loops", "Functions"], "extras": "Join Discord Labs" },
    { "month": 3, "title": "Designing Layouts", "tasks": ["Make it look good", "Fix obvious bugs"], "project": "Beta Version", "stack": ["HTML/CSS", "Figma"], "concepts": ["Typography", "Grid Systems"], "extras": "Read Design Blogs" },
    { "month": 4, "title": "Connecting Systems", "tasks": ["Save user data", "Add login screen"], "project": "Version 1.0", "stack": ["Node.js", "SQL"], "concepts": ["API Routing", "Databases"], "extras": "Try Cloud Hosting" },
    { "month": 5, "title": "Testing & Polish", "tasks": ["Check for errors", "Make video tour"], "project": "Final Polish", "stack": ["Jest", "Postman"], "concepts": ["Unit Testing", "Debugging"], "extras": "Optimize Performance" },
    { "month": 6, "title": "Job Search", "tasks": ["Send applications", "Practice talking"], "project": "Career Start", "stack": ["LinkedIn", "GitHub"], "concepts": ["Interview Prep", "Networking"], "extras": "Mock Interviews" }
];

// --- NETWORK VISUALIZATION COMPONENTS ---

interface Position {
  cx: number;
  cy: number;
}

interface Connection {
  from: number | 'center';
  to: number | 'center';
  color: string;
}

interface PathPositions {
  [key: string]: Position;
}

const CareerNetwork: React.FC<{ paths: any[]; onPathClick: (p: any) => void; isGenerating: boolean; formData: any }> = ({ paths, onPathClick, isGenerating, formData }) => {
    const [containerSize, setContainerSize] = useState({ width: 1000, height: 1000 });
    const [hoveredPathId, setHoveredPathId] = useState<number | string | null>(null);
    
    const dimensions = useMemo(() => {
        const width = window.innerWidth;
        const baseSize = Math.min(width - 32, 1200);
        const scale = baseSize / 1000;
        return {
            containerSize: baseSize,
            innerRadius: Math.floor(70 * scale),
            outerRadius: Math.floor(110 * scale),
            cardRadius: Math.floor(240 * scale), // Baseline radius for cards
            cardWidth: Math.floor(160 * scale),
            cardHeight: Math.floor(64 * scale),
            centerX: baseSize / 2,
            centerY: baseSize / 2,
        };
    }, [containerSize]);

    useEffect(() => {
        const updateSize = () => {
            setContainerSize({ width: window.innerWidth, height: window.innerHeight });
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const ringPaths = useMemo(() => {
        // Limit to 10 paths for an Enterprise-grade clean aesthetic
        return paths.slice(0, 10).map((p, i) => ({
            ...p,
            id: p.id || i,
        }));
    }, [paths]);

    const positions: any = useMemo(() => {
        const pos: any = {};
        const total = ringPaths.length;
        ringPaths.forEach((p, i) => {
            const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
            
            // Pronounced staggered radius to ensure zero horizontal overlap
            const currentCardRadius = i % 2 === 0 ? dimensions.cardRadius : dimensions.cardRadius + (90 * (dimensions.containerSize / 1000));
            
            // Anchor point on the outer dashed ring
            pos[`anchor_${p.id}`] = {
                cx: dimensions.centerX + dimensions.outerRadius * Math.cos(angle),
                cy: dimensions.centerY + dimensions.outerRadius * Math.sin(angle)
            };
            
            // Card center position on the staggered circle
            pos[`card_${p.id}`] = {
                cx: dimensions.centerX + currentCardRadius * Math.cos(angle),
                cy: dimensions.centerY + currentCardRadius * Math.sin(angle)
            };
        });
        return pos;
    }, [dimensions, ringPaths]);

    return (
        <div className="w-full relative flex items-center justify-center overflow-hidden bg-white" style={{ height: dimensions.containerSize }}>
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-[0.2]" style={{ backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            
            {isGenerating && (
                <div className="absolute top-10 z-[100] flex items-center gap-2 px-5 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-blue-100 text-blue-600 font-black text-[10px] uppercase tracking-widest">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synchronizing Network...</span>
                </div>
            )}

            <div style={{ width: dimensions.containerSize, height: dimensions.containerSize }} className="relative">
                {/* SVG Connections and Rings */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    {/* Inner Dashed Ring */}
                    <circle 
                        cx={dimensions.centerX} 
                        cy={dimensions.centerY} 
                        r={dimensions.innerRadius} 
                        fill="none" 
                        stroke="#D8B4FE" 
                        strokeWidth="1.5" 
                        strokeDasharray="4 4" 
                        className="opacity-40"
                    />
                    
                    {/* Outer Dashed Ring */}
                    <circle 
                        cx={dimensions.centerX} 
                        cy={dimensions.centerY} 
                        r={dimensions.outerRadius} 
                        fill="none" 
                        stroke="#D8B4FE" 
                        strokeWidth="1.5" 
                        strokeDasharray="4 4" 
                        className="opacity-40"
                    />

                    {/* Anchor Nodes and Connecting Lines */}
                    {ringPaths.map((p) => {
                        const anchor = positions[`anchor_${p.id}`];
                        const card = positions[`card_${p.id}`];
                        if (!anchor || !card) return null;
                        
                        return (
                            <g key={p.id}>
                                {/* Node on the ring */}
                                <circle 
                                    cx={anchor.cx} 
                                    cy={anchor.cy} 
                                    r="4" 
                                    fill="white" 
                                    stroke="#A855F7" 
                                    strokeWidth="2" 
                                />
                                {/* Connecting line to card */}
                                <motion.line 
                                    x1={anchor.cx} 
                                    y1={anchor.cy} 
                                    x2={card.cx} 
                                    y2={card.cy} 
                                    stroke={hoveredPathId === p.id ? "#8B5CF6" : "#C4B5FD"} 
                                    strokeWidth={hoveredPathId === p.id ? "2.5" : "1.5"}
                                    initial={false}
                                    animate={{ 
                                        stroke: hoveredPathId === p.id ? "#8B5CF6" : "#C4B5FD",
                                        strokeWidth: hoveredPathId === p.id ? 2.5 : 1.5,
                                        opacity: hoveredPathId === p.id ? 1 : 0.4
                                    }}
                                    className="transition-all duration-300"
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Path Cards */}
                {ringPaths.map((p) => {
                    const pos = positions[`card_${p.id}`];
                    if (!pos) return null;
                    
                    return (
                        <React.Fragment key={p.id}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onMouseEnter={() => setHoveredPathId(p.id)}
                                onMouseLeave={() => setHoveredPathId(null)}
                                className="absolute z-30 cursor-pointer group"
                                style={{ 
                                    left: pos.cx, 
                                    top: pos.cy, 
                                    width: dimensions.cardWidth,
                                    height: dimensions.cardHeight,
                                    transform: 'translate(-50%, -50%)' 
                                }}
                                onClick={() => onPathClick(p)}
                            >
                                <div className="w-full h-full bg-white/95 backdrop-blur-md rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-2.5 flex items-center gap-3 hover:shadow-[0_12px_30px_rgba(168,85,247,0.08)] hover:border-purple-200 transition-all duration-500 group-active:scale-95">
                                    <div 
                                        className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-gray-50 shadow-sm flex items-center justify-center bg-gray-50"
                                        style={{ backgroundColor: `${p.color}10` }}
                                    >
                                        <img src={p.image} alt="" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-tight truncate leading-none mb-1">
                                            {p.name}
                                        </h4>
                                        <p className="text-[8px] text-slate-400 font-medium leading-tight line-clamp-2">
                                            {p.desc || p.description || "Synthesizing career trajectory..."}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Hover Card Popover styled exactly like Image 2 */}
                            <AnimatePresence>
                                {hoveredPathId === p.id && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute z-[1000] w-[310px] bg-white rounded-[2rem] shadow-[0_24px_80px_rgba(0,0,0,0.12)] border border-slate-100 p-6 flex flex-col gap-4 text-left cursor-default pointer-events-auto"
                                        style={{
                                            left: pos.cx > dimensions.centerX ? pos.cx - 325 : pos.cx + 15,
                                            top: pos.cy > dimensions.centerY ? pos.cy - 120 : pos.cy - 120,
                                        }}
                                        onMouseEnter={() => setHoveredPathId(p.id)}
                                        onMouseLeave={() => setHoveredPathId(null)}
                                    >
                                        <div className="flex flex-col gap-2">
                                            <span className="self-start px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                                                {p.group || "Career"} result
                                            </span>
                                            <h3 className="text-xl font-bold text-slate-800 tracking-tight mt-1 leading-snug">
                                                {p.name}
                                            </h3>
                                            <div className="text-[11px] text-slate-500 font-medium space-y-0.5 mt-1">
                                                <p>Typical Degree: <span className="font-semibold text-slate-700">Bachelor's Degree</span></p>
                                                <p>Typical Experience: <span className="font-semibold text-slate-700">3-5 years</span></p>
                                            </div>
                                        </div>

                                        <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                                            As a {p.name}, you would be responsible for designing, developing, and executing high-impact solutions. Your background in {formData.subject || "academics"}, coupled with skills in {formData.skills.slice(0, 2).join(", ") || "domains"} will guide your success.
                                        </p>

                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPathClick(p);
                                            }} 
                                            className="w-full py-3 bg-[#1B66EC] hover:bg-blue-700 text-white font-bold rounded-2xl text-center text-xs tracking-wide shadow-md active:scale-95 transition-all select-none"
                                        >
                                            Learn more
                                        </button>

                                        <div className="w-full h-px bg-slate-100" />

                                        <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-2 border border-slate-100/50">
                                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                                Remember: These are just ideas for you to consider. Feel free to disregard anything that doesn't feel helpful.
                                            </p>
                                            <div className="flex items-center justify-between mt-1 select-none">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Helpful?</span>
                                                <div className="flex gap-2.5 text-sm">
                                                    <span className="cursor-pointer hover:scale-125 transition-transform" title="Not Helpful">👎</span>
                                                    <span className="cursor-pointer hover:scale-125 transition-transform" title="Helpful">👍</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </React.Fragment>
                    );
                })}

                {/* Central Hub Area */}
                <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center bg-white rounded-full border border-slate-100 shadow-[0_12px_32px_rgba(0,0,0,0.06)] z-20 pointer-events-none"
                    style={{ width: dimensions.innerRadius * 2, height: dimensions.innerRadius * 2 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 rounded-full blur-md opacity-40 -z-10" />
                    <div className="text-center space-y-1 p-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Explore paths</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">based on...</p>
                        <div className="text-lg py-1 select-none">🎓 💪</div>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 mx-auto animate-bounce" />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ROADMAP DETAIL MODAL ---
const RoadmapDetailModal: React.FC<{ month: any; onClose: () => void }> = ({ month, onClose }) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-10 bg-slate-900/40 backdrop-blur-md"
        >
            <motion.div 
                initial={{ scale: 0.95, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-[0_32px_120px_rgba(0,0,0,0.15)] relative"
            >
                {/* MODAL HEADER STRIP */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400" />
                
                <div className="p-8 sm:p-14">
                    <button onClick={onClose} className="absolute top-10 right-10 p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-slate-100 shadow-sm active:scale-95">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>

                    <div className="space-y-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-2xl text-white font-black text-xl shadow-lg ring-4 ring-blue-50">
                                    {month.month}
                                </span>
                                <div>
                                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">{month.title}</h2>
                                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.25em]">Phase {month.month} Briefing Protocol</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-[1fr_0.8fr] gap-16">
                            <div className="space-y-10">
                                <div className="space-y-6">
                                    <h3 className="text-[12px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-3"><Brain className="w-4 h-4" /> Strategic Core Focus</h3>
                                    <div className="grid gap-4">
                                        {(month.tasks || []).map((task: string, i: number) => (
                                            <div key={i} className="group p-5 bg-slate-50 rounded-2xl border border-slate-100/50 flex items-start gap-4 hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all">
                                                <div className="w-1.5 h-6 rounded-full bg-blue-500/20 group-hover:bg-blue-600 transition-colors" />
                                                <div>
                                                    <p className="font-bold text-[14px] text-slate-700 leading-tight mb-2 uppercase">{task}</p>
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Requirement {i + 1}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-900 rounded-3xl text-white space-y-6 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl" />
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2"><Target className="w-4 h-4" /> Technical Blueprint</h4>
                                        <div className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase">Standard {month.month}.0</div>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Primary Stack</div>
                                            <div className="flex flex-wrap gap-2">
                                                {(month.stack || []).map((s: string) => (
                                                    <span key={s} className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-tight shadow-sm border border-blue-500/50">#{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Core Mastery</div>
                                            <div className="flex flex-wrap gap-2">
                                                {(month.concepts || []).map((c: string) => (
                                                    <span key={c} className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-tight border border-emerald-500/20">{c}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div className="space-y-6">
                                    <h3 className="text-[12px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-3"><Flag className="w-4 h-4" /> Industrial Milestone</h3>
                                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6 relative group overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full blur-2xl group-hover:bg-blue-100transition-all" />
                                        <h4 className="text-2xl font-black text-slate-900 uppercase leading-tight relative z-10">{month.project}</h4>
                                        <p className="text-slate-500 text-sm leading-relaxed font-medium relative z-10">Deliver a production-ready implementation focused on architectural scalability and real-world performance for Phase {month.month}.</p>
                                        <div className="space-y-3 pt-2 relative z-10">
                                            <div className="flex items-center gap-3 text-[11px] font-black text-slate-900 border-b border-slate-50 pb-3">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> SCALABLE MODULES
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] font-black text-slate-900">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> QUALITY ASSURANCE
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100/50 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                            <PlayCircle className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-[12px] text-blue-900 uppercase tracking-tight">Curated Module</h4>
                                            <p className="text-blue-600/70 text-[10px] uppercase font-bold tracking-widest">Recommended Training</p>
                                        </div>
                                    </div>
                                    <p className="text-blue-900/60 text-[13px] font-medium leading-relaxed">Directly align your phase with the StudLyf Accelerator curriculum for this specialization.</p>
                                    <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-lg active:scale-95">Enroll in Protocol →</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- ROADMAP CARD COMPONENT ---
const RoadmapCard: React.FC<{ month: any; idx: number; isLast: boolean; onDetails: (m: any) => void }> = ({ month, idx, isLast, onDetails }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            className="relative pl-8 sm:pl-40 pb-16 group/card"
        >
            {/* Architectural Vertical Connector */}
            {!isLast && (
                <div className="absolute left-[15px] sm:left-[60px] top-12 bottom-0 w-[1px] bg-slate-200 transition-colors duration-500 group-hover/card:bg-blue-400" />
            )}
            
            {/* Engineering Node */}
            <div className="absolute left-[10px] sm:left-[55px] top-10 w-[12px] h-[12px] rounded-full bg-white border-2 border-slate-300 z-10 shadow-[0_0_0_4px_white] transition-all duration-500 group-hover/card:border-blue-600 group-hover/card:shadow-[0_0_0_4px_white,0_0_15px_rgba(37,99,235,0.4)]" />

            {/* Technical Month Indicator */}
            <div className="absolute left-0 sm:left-0 top-9 w-24 hidden sm:flex flex-col items-end pr-8 transition-all duration-500">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 transition-colors group-hover/card:text-amber-500">Phase</span>
                <span className="text-2xl font-bold text-slate-800 tabular-nums leading-none transition-colors group-hover/card:text-amber-600">{month.month.toString().padStart(2, '0')}</span>
            </div>

            {/* Professional Content Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:border-amber-200 transition-all duration-500 relative overflow-hidden group/card">
                {/* Dynamic Line Effect on Hover (Contrast Color) */}
                <div className="absolute left-0 top-0 bottom-0 w-0 bg-amber-500 transition-all duration-500 group-hover/card:w-1.5 shadow-[2px_0_15px_rgba(245,158,11,0.4)] z-20" />
                
                {/* Architectural Grid Background (Subtle) */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                
                <div className="flex flex-col xl:flex-row justify-between items-start gap-8 relative z-10">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-4">
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight group-hover/card:text-amber-600 transition-colors duration-300">{month.title}</h3>
                            <span className="shrink-0 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-black rounded-lg uppercase tracking-widest border border-amber-100">Validated</span>
                        </div>
                        <p className="text-slate-500 text-[13px] font-medium leading-relaxed max-w-2xl">{month.details || month.tasks?.[0] || "Synthesizing specialized technical curriculum and operational milestones."}</p>
                    </div>
                    
                    <button 
                        onClick={() => onDetails(month)}
                        className="shrink-0 group/btn px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all flex items-center gap-3 shadow-lg shadow-slate-200 active:scale-95"
                    >
                        <span className="text-[11px] font-black uppercase tracking-widest">Analysis Specs</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                </div>
                
                {/* Technical Specifications Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-10 relative z-10">
                    {/* Stack Specification */}
                    <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-100/50">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <Terminal className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Technical Stack</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(Array.isArray(month.stack) ? month.stack : (month.stack || '').split(',')).map((s: any, i: number) => (
                                <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg shadow-sm hover:border-blue-400 hover:text-blue-600 transition-all cursor-default">
                                    {s.toString().trim()}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Competency Specification */}
                    <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-100/50">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Core Competencies</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(Array.isArray(month.concepts) ? month.concepts : (month.concepts || '').split(',')).map((c: any, i: number) => (
                                <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg shadow-sm hover:border-green-400 hover:text-green-600 transition-all cursor-default">
                                    {c.toString().trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const RoadmapSection: React.FC<{ 
    roadmapData: any; 
    selectedPath: any; 
    isGeneratingRoadmap: boolean; 
    handlePathClick: (p: any) => void;
    onDetails: (m: any) => void;
    navigate: any;
}> = ({ roadmapData, selectedPath, isGeneratingRoadmap, handlePathClick, onDetails, navigate }) => {
    // Auto-trigger roadmap generation when a path is selected but data hasn't loaded yet.
    useEffect(() => {
        if (selectedPath && !roadmapData && !isGeneratingRoadmap) {
            handlePathClick(selectedPath);
        }
    }, [selectedPath, roadmapData, isGeneratingRoadmap, handlePathClick]);

    return (
        <section className="w-full max-w-6xl mx-auto py-24 px-6 relative bg-white">
            {/* Section Heading with Technical Specs */}
            <div className="mb-20">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-[1px] bg-blue-600" />
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Operational Protocol 741</span>
                </div>
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                    <div className="max-w-3xl">
                        <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">Career Architecture<br/><span className="text-slate-400">Blueprint</span></h2>
                        <p className="text-slate-500 text-base sm:text-lg font-medium leading-relaxed">
                            A validated 6-month technical progression strategy engineered for professional excellence and industry standard compliance.
                        </p>
                    </div>
                    {selectedPath && (
                        <div className="bg-slate-900 rounded-2xl p-6 lg:p-8 flex items-center gap-6 shadow-2xl shadow-slate-200 lg:min-w-[400px]">
                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-700/50 bg-slate-800 shrink-0">
                                <img src={selectedPath.image} alt="" className="w-full h-full object-cover grayscale opacity-80" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Selected Discipline</p>
                                <p className="text-xl font-bold text-white leading-tight">{selectedPath.name}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative">
                {isGeneratingRoadmap ? (
                    <div className="py-40 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-[2rem] border-dashed">
                        <div className="relative w-16 h-16 mb-8">
                            <div className="absolute inset-0 border-4 border-blue-50 rounded-full" />
                            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Compiling System Architecture</h3>
                        <p className="text-sm text-slate-500 mt-2 font-medium">Synchronizing with industry standard technical vectors...</p>
                    </div>
                ) : roadmapData && roadmapData.length > 0 ? (
                    <div className="space-y-0 relative">
                        {roadmapData.map((month: any, idx: number) => (
                            <RoadmapCard 
                                key={idx} 
                                month={month} 
                                idx={idx} 
                                isLast={idx === roadmapData.length - 1}
                                onDetails={onDetails} 
                            />
                        ))}
                    </div>
                ) : selectedPath ? (
                    <div className="py-40 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-[2rem] border-dashed">
                        <div className="relative w-16 h-16 mb-8">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                            <div className="absolute inset-0 border-4 border-[#1B66EC] border-t-transparent rounded-full animate-spin" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Compiling System Architecture</h3>
                        <p className="text-sm text-slate-500 mt-2 font-medium">Synchronizing with industry standard technical vectors...</p>
                    </div>
                ) : (
                    <div className="py-32 text-center bg-slate-50 border border-slate-200 rounded-[2.5rem] border-dashed">
                        <div className="p-6 bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8 shadow-sm">
                            <Network className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-400 tracking-tight uppercase px-6">Select a network vector above to review technical specifications.</h3>
                    </div>
                )}
            </div>


            {/* FINAL CTA */}
            {roadmapData && !isGeneratingRoadmap && (
                <div className="mt-20 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 p-6 md:p-8 rounded-2xl border mb-32">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Ready to initiate training?</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Access specialized modules aligned with your technical roadmap.</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm uppercase tracking-wider">
                            Export System PDF
                        </button>
                        <button onClick={() => navigate('/courses')} className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm uppercase tracking-wider flex items-center gap-2">
                            View Course Catalog <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 1.0
        }
    }
};

const wordVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } }
};

// --- SUBJECT AREAS catalog (shown as quick-pick chips on Step 2) ---
const SUBJECT_AREAS = [
    { label: 'Computer Science (CSE)', icon: '💻', keywords: ['cse', 'computer science'] },
    { label: 'Information Technology', icon: '🌐', keywords: ['it', 'information technology'] },
    { label: 'Software Engineering', icon: '🛠️', keywords: ['software'] },
    { label: 'Electronics & ECE', icon: '⚡', keywords: ['ece', 'electronics'] },
    { label: 'Mechanical Engineering', icon: '⚙️', keywords: ['mechanical', 'me'] },
    { label: 'Data Science & AI/ML', icon: '🤖', keywords: ['data', 'ai', 'ml'] },
    { label: 'Business & MBA', icon: '📊', keywords: ['mba', 'business'] },
    { label: 'Medical / Healthcare', icon: '🏥', keywords: ['medical', 'healthcare', 'mbbs'] },
    { label: 'Design (UX/UI)', icon: '🎨', keywords: ['design', 'ux', 'ui'] },
    { label: 'Cyber Security', icon: '🔐', keywords: ['cyber', 'security'] },
    { label: 'Civil Engineering', icon: '🏗️', keywords: ['civil'] },
    { label: 'Robotics & Automation', icon: '🦾', keywords: ['robotics', 'automation'] },
];

// --- SKILL CATALOG with descriptions (shown on Step 2.5) ---
const SKILL_CATALOG: Record<string, { name: string; desc: string }[]> = {
    cse: [
        { name: 'Programming Proficiency', desc: 'Core coding skills in languages like C++, Java, or Python for building software.' },
        { name: 'Data Structures', desc: 'Knowledge of arrays, trees, graphs, and hash maps for efficient problem-solving.' },
        { name: 'Algorithm Design', desc: 'Designing efficient algorithms including sorting, searching, and dynamic programming.' },
        { name: 'Software Development', desc: 'End-to-end ability to architect, build, test, and deploy software applications.' },
        { name: 'Database Management', desc: 'Design, query, and manage relational and NoSQL databases like MySQL, MongoDB.' },
        { name: 'Computer Architecture', desc: 'Understanding of CPU, memory hierarchy, and system-level design principles.' },
        { name: 'Operating Systems', desc: 'Concepts of process management, scheduling, memory management, and file systems.' },
        { name: 'Problem Solving', desc: 'Analytical thinking to break down complex problems into clear, solvable steps.' },
        { name: 'Cloud Computing', desc: 'Deploying and managing apps on platforms like AWS, Azure, or Google Cloud.' },
        { name: 'Version Control (Git)', desc: 'Managing code history, branches, and collaboration using Git and GitHub.' },
    ],
    it: [
        { name: 'Network Administration', desc: 'Setting up and managing local area networks, VPNs, and firewalls.' },
        { name: 'IT Support & Helpdesk', desc: 'Troubleshooting hardware, software, and connectivity issues for end users.' },
        { name: 'Cybersecurity Basics', desc: 'Foundational knowledge of security protocols, threats, and incident response.' },
        { name: 'Cloud Infrastructure', desc: 'Provisioning and managing cloud resources for scalable IT operations.' },
        { name: 'System Administration', desc: 'Installing, configuring, and maintaining servers and operating systems.' },
        { name: 'SQL & Databases', desc: 'Writing queries and managing structured data in relational databases.' },
        { name: 'Scripting (Python/Bash)', desc: 'Automating repetitive IT tasks using scripting languages.' },
        { name: 'ITIL Framework', desc: 'Best practices for IT service management aligned with business goals.' },
    ],
    software: [
        { name: 'Full Stack Development', desc: 'Building both front-end and back-end of web applications.' },
        { name: 'Agile & Scrum', desc: 'Working in sprints with iterative delivery and cross-functional teams.' },
        { name: 'API Design (REST/GraphQL)', desc: 'Designing and consuming APIs for service-to-service communication.' },
        { name: 'Testing & QA', desc: 'Writing unit, integration, and E2E tests to ensure software reliability.' },
        { name: 'DevOps & CI/CD', desc: 'Automating build, test, and deployment pipelines for faster delivery.' },
        { name: 'Software Architecture', desc: 'Designing scalable, maintainable system architectures and design patterns.' },
        { name: 'TypeScript / JavaScript', desc: 'Modern type-safe web development with JS ecosystem tools.' },
        { name: 'Docker & Kubernetes', desc: 'Containerising applications and orchestrating microservices at scale.' },
    ],
    ece: [
        { name: 'Circuit Design', desc: 'Designing analog and digital circuits using simulation tools like SPICE.' },
        { name: 'VLSI Design', desc: 'Very Large Scale Integration — designing chips and semiconductor circuits.' },
        { name: 'Signal Processing', desc: 'Analysing and manipulating signals in time and frequency domains.' },
        { name: 'Embedded Systems', desc: 'Programming microcontrollers (Arduino, STM32) for hardware-level control.' },
        { name: 'PCB Design', desc: 'Designing printed circuit boards using tools like Altium or KiCad.' },
        { name: 'IoT Development', desc: 'Connecting physical devices to the internet with sensors and protocols.' },
        { name: 'Communication Systems', desc: 'Understanding wireless, optical, and satellite communication protocols.' },
        { name: 'MATLAB / Simulink', desc: 'Simulation and modelling of engineering systems and control.' },
    ],
    mechanical: [
        { name: 'AutoCAD & SolidWorks', desc: 'Computer-aided design of mechanical parts and assemblies.' },
        { name: 'Thermodynamics', desc: 'Heat transfer, energy cycles, and efficiency of thermodynamic systems.' },
        { name: 'Manufacturing Processes', desc: 'CNC machining, casting, forming, and quality control methods.' },
        { name: 'FEA & Simulation', desc: 'Finite element analysis for stress, strain, and deformation studies.' },
        { name: 'Fluid Mechanics', desc: 'Study of fluid flow, pressure, and pipe system design.' },
        { name: 'Robotics & Automation', desc: 'Programming and designing robotic arms, actuators, and control systems.' },
        { name: 'Material Science', desc: 'Properties and selection of metals, polymers, and composites for design.' },
        { name: 'Project Management', desc: 'Planning, executing, and controlling engineering project timelines.' },
    ],
    data: [
        { name: 'Python', desc: 'The primary language for data science — pandas, numpy, scikit-learn.' },
        { name: 'Machine Learning', desc: 'Building predictive models using supervised and unsupervised algorithms.' },
        { name: 'Deep Learning', desc: 'Neural networks, CNNs, RNNs using TensorFlow or PyTorch.' },
        { name: 'Data Visualisation', desc: 'Creating insightful dashboards with Matplotlib, Seaborn, or Tableau.' },
        { name: 'SQL & NoSQL', desc: 'Querying structured databases and working with document stores like MongoDB.' },
        { name: 'Statistics & Probability', desc: 'Hypothesis testing, distributions, and statistical inference.' },
        { name: 'Natural Language Processing', desc: 'Processing text data for sentiment analysis, chatbots, and summarisation.' },
        { name: 'Big Data (Spark/Hadoop)', desc: 'Processing massive datasets across distributed computing clusters.' },
        { name: 'Feature Engineering', desc: 'Transforming raw data into meaningful inputs for ML models.' },
        { name: 'MLOps', desc: 'Deploying, monitoring, and maintaining machine learning models in production.' },
    ],
    business: [
        { name: 'Strategic Planning', desc: 'Setting long-term goals and allocating resources to achieve them.' },
        { name: 'Market Research', desc: 'Gathering and analysing market data to inform business decisions.' },
        { name: 'Financial Modelling', desc: 'Building Excel/Sheets models to forecast revenue, costs, and valuations.' },
        { name: 'Public Speaking', desc: 'Delivering presentations and pitching ideas to stakeholders confidently.' },
        { name: 'Project Management', desc: 'Coordinating tasks, timelines, and teams to deliver results on time.' },
        { name: 'Data Analysis', desc: 'Using Excel, SQL, or BI tools to extract business insights from data.' },
        { name: 'Leadership', desc: 'Motivating teams, resolving conflict, and driving outcomes.' },
        { name: 'Business Communication', desc: 'Writing professional reports, emails, and proposals clearly and persuasively.' },
    ],
    medical: [
        { name: 'Clinical Assessment', desc: 'Patient examination, history taking, and diagnosis techniques.' },
        { name: 'Pharmacology', desc: 'Drug mechanisms, dosing, and patient medication management.' },
        { name: 'Medical Research', desc: 'Reading and conducting evidence-based clinical studies.' },
        { name: 'Healthcare IT', desc: 'Electronic health records, PACS systems, and digital health tools.' },
        { name: 'Patient Communication', desc: 'Empathetic and clear communication with patients and families.' },
        { name: 'Medical Imaging', desc: 'Interpreting X-rays, CT scans, MRI, and ultrasound results.' },
        { name: 'Emergency Medicine', desc: 'Rapid assessment and treatment of acute and critical conditions.' },
        { name: 'Public Health', desc: 'Epidemiology, disease prevention, and health policy knowledge.' },
    ],
    design: [
        { name: 'UI Design (Figma)', desc: 'Designing pixel-perfect interfaces with components and design systems.' },
        { name: 'UX Research', desc: 'User interviews, usability testing, and journey mapping for insights.' },
        { name: 'Prototyping', desc: 'Creating interactive wireframes and clickable prototypes for validation.' },
        { name: 'Typography & Layout', desc: 'Applying visual hierarchy, grids, and typeface pairings effectively.' },
        { name: 'Motion Design', desc: 'Micro-animations and transitions that enhance user experience.' },
        { name: 'Design Systems', desc: 'Building scalable, reusable component libraries and style guides.' },
        { name: 'Accessibility (a11y)', desc: 'Designing inclusive interfaces usable by people with disabilities.' },
        { name: 'Brand Identity', desc: 'Creating logos, colour palettes, and visual language for brands.' },
    ],
    cyber: [
        { name: 'Network Security', desc: 'Firewalls, IDS/IPS, VPNs, and network traffic analysis.' },
        { name: 'Penetration Testing', desc: 'Ethical hacking to identify and report system vulnerabilities.' },
        { name: 'SIEM & Monitoring', desc: 'Security event logging, alerting, and incident response workflows.' },
        { name: 'Cryptography', desc: 'Encryption algorithms, PKI, and secure communication protocols.' },
        { name: 'Malware Analysis', desc: 'Reverse engineering and analysing malicious software behaviours.' },
        { name: 'Compliance & Governance', desc: 'ISO 27001, GDPR, SOC 2, and security policy frameworks.' },
        { name: 'Cloud Security', desc: 'Securing cloud workloads, IAM policies, and container security.' },
        { name: 'Threat Intelligence', desc: 'Collecting and analysing data on current and emerging cyber threats.' },
    ],
    civil: [
        { name: 'Structural Analysis', desc: 'Calculating loads, stresses, and deflections in structures.' },
        { name: 'AutoCAD & Revit', desc: 'Drafting and BIM modelling for construction projects.' },
        { name: 'Construction Management', desc: 'Planning, scheduling, and overseeing building projects on-site.' },
        { name: 'Geotechnical Engineering', desc: 'Soil mechanics and foundation design for stable structures.' },
        { name: 'Transportation Planning', desc: 'Designing roads, highways, and urban transport networks.' },
        { name: 'Environmental Engineering', desc: 'Water treatment, waste management, and sustainability in projects.' },
        { name: 'Surveying & GIS', desc: 'Land measurement and geospatial data analysis using GIS tools.' },
        { name: 'Quantity Estimation', desc: 'Calculating material quantities and project cost estimation.' },
    ],
    robotics: [
        { name: 'ROS (Robot OS)', desc: 'Programming robots using the Robot Operating System framework.' },
        { name: 'Embedded C / C++', desc: 'Low-level programming for microcontrollers and real-time systems.' },
        { name: 'Sensor Fusion', desc: 'Combining data from multiple sensors for accurate state estimation.' },
        { name: 'Computer Vision', desc: 'Object detection, tracking, and image processing for robotic perception.' },
        { name: 'Kinematics & Dynamics', desc: 'Mathematical modelling of robot motion and force.' },
        { name: 'Control Systems', desc: 'PID controllers and feedback loops for precise actuation.' },
        { name: 'SLAM', desc: 'Simultaneous Localisation and Mapping for autonomous navigation.' },
        { name: 'CAD for Robots', desc: 'Mechanical design of robotic structures using SolidWorks or CATIA.' },
    ],
    default: [
        { name: 'Communication', desc: 'Expressing ideas clearly in writing, presentations, and conversation.' },
        { name: 'Problem Solving', desc: 'Structured thinking to analyse challenges and identify solutions.' },
        { name: 'Adaptability', desc: 'Quickly learning new tools, processes, and environments.' },
        { name: 'Critical Thinking', desc: 'Evaluating evidence and arguments to make sound decisions.' },
        { name: 'Time Management', desc: 'Prioritising and scheduling tasks to meet deadlines effectively.' },
        { name: 'Teamwork', desc: 'Collaborating with diverse people to achieve shared goals.' },
        { name: 'Leadership', desc: 'Inspiring and guiding others toward a common vision.' },
        { name: 'Research Skills', desc: 'Finding, evaluating, and synthesising information from multiple sources.' },
    ],
};

// Helper: derive skill catalog key from subject string
const getSkillCatalogKey = (subject: string): string => {
    const s = (subject || '').toLowerCase();
    if (s.includes('cse') || s.includes('computer science')) return 'cse';
    if (s.includes(' it') || s.includes('information tech')) return 'it';
    if (s.includes('software')) return 'software';
    if (s.includes('ece') || s.includes('electronics')) return 'ece';
    if (s.includes('mechanical') || s.includes(' me ') || s.includes('mech')) return 'mechanical';
    if (s.includes('data') || s.includes('ai') || s.includes('ml') || s.includes('machine')) return 'data';
    if (s.includes('mba') || s.includes('business') || s.includes('management')) return 'business';
    if (s.includes('medical') || s.includes('health') || s.includes('mbbs') || s.includes('nursing')) return 'medical';
    if (s.includes('design') || s.includes('ux') || s.includes('ui')) return 'design';
    if (s.includes('cyber') || s.includes('security')) return 'cyber';
    if (s.includes('civil')) return 'civil';
    if (s.includes('robot') || s.includes('automat')) return 'robotics';
    return 'default';
};

// Helper: derive tasks and skills matching a non-student professional role
const getRoleTasksAndSkills = (role: string) => {
    const r = (role || "").toLowerCase();
    if (r.includes("teacher") || r.includes("educat") || r.includes("professor") || r.includes("instruct") || r.includes("lectur") || r.includes("school") || r.includes("teach")) {
        return {
            tasks: [
                "Develop engaging lesson plans that cater to diverse learning styles and needs.",
                "Create a positive and inclusive classroom environment that fosters student growth.",
                "Assess student progress through a variety of methods and provide constructive feedback.",
                "Collaborate with colleagues, parents, and administrators to support student success.",
                "Integrate technology effectively to enhance learning experiences and outcomes.",
                "Adapt instructional strategies to meet the evolving needs of students and curriculum.",
                "Facilitate critical thinking and problem-solving skills through interactive activities."
            ],
            skills: [
                { name: "Instructional Design", desc: "Designing structured curricula and learning experiences." },
                { name: "Classroom Management", desc: "Maintaining a productive, engaging, and orderly learning environment." },
                { name: "Curriculum Development", desc: "Planning and structuring academic courses and materials." },
                { name: "Student Assessment", desc: "Evaluating student understanding through tests, projects, and observation." },
                { name: "Communication", desc: "Conveying information clearly and empathetically to students and parents." },
                { name: "Problem Solving", desc: "Addressing classroom challenges and student learning difficulties creatively." },
                { name: "Adaptability", desc: "Adjusting teaching styles to accommodate different student needs." },
                { name: "Patience", desc: "Remaining calm and supportive under stressful or challenging conditions." }
            ]
        };
    }
    if (r.includes("developer") || r.includes("engineer") || r.includes("program") || r.includes("coder") || r.includes("tech") || r.includes("it ") || r.includes("software")) {
        return {
            tasks: [
                "Write clean, scalable, and well-tested code for front-end or back-end applications.",
                "Collaborate with product designers and engineers to build modern web interfaces.",
                "Debug and optimize application performance for maximum speed and scalability.",
                "Design and manage robust database schemas and APIs.",
                "Set up CI/CD pipelines and automate software deployment.",
                "Participate in code reviews and technical architecture design discussions."
            ],
            skills: [
                { name: "Full Stack Development", desc: "Building end-to-end web applications." },
                { name: "Problem Solving", desc: "Solving complex algorithmic and systems design challenges." },
                { name: "System Architecture", desc: "Designing scalable, modular, and maintainable software systems." },
                { name: "API Design", desc: "Creating clear, secure, and performant REST or GraphQL endpoints." },
                { name: "Database Management", desc: "Designing and querying relational and non-relational databases." },
                { name: "Git / Version Control", desc: "Collaborating on code repositories and managing release branches." },
                { name: "Testing / QA", desc: "Writing unit, integration, and end-to-end tests." },
                { name: "Cloud Services", desc: "Deploying and managing microservices in AWS, GCP, or Azure." }
            ]
        };
    }
    if (r.includes("doctor") || r.includes("physician") || r.includes("medical") || r.includes("nurse") || r.includes("health")) {
        return {
            tasks: [
                "Examine patients, review medical histories, and diagnose health conditions.",
                "Prescribe appropriate medications, treatments, or therapeutic plans.",
                "Collaborate with multidisciplinary healthcare teams to coordinate patient care.",
                "Monitor patient recovery and adjust treatment protocols accordingly.",
                "Document clinical visits, procedures, and patient charts accurately.",
                "Educate patients and families on disease prevention and wellness strategies."
            ],
            skills: [
                { name: "Clinical Assessment", desc: "Conducting thorough physical examinations and diagnosing conditions." },
                { name: "Pharmacology", desc: "Understanding drug actions, interactions, and safe dosage protocols." },
                { name: "Patient Empathy", desc: "Providing compassionate care and listening actively to patient concerns." },
                { name: "Emergency Response", desc: "Handling acute medical emergencies and critical care situations." },
                { name: "Diagnostics", desc: "Interpreting lab tests, X-rays, ECGs, and MRI scans." },
                { name: "Medical Communication", desc: "Explaining complex medical details in clear, understandable terms." },
                { name: "Ethics & Compliance", desc: "Adhering to strict medical confidentiality and ethical standards." },
                { name: "Team Collaboration", desc: "Working cohesively with nurses, specialists, and support staff." }
            ]
        };
    }
    if (r.includes("manager") || r.includes("lead") || r.includes("consultant") || r.includes("exec") || r.includes("business")) {
        return {
            tasks: [
                "Define strategic goals, align team resources, and execute operational initiatives.",
                "Manage project timelines, budgets, and deliverable quality metrics.",
                "Analyze market trends and customer feedback to optimize product strategies.",
                "Deliver high-impact presentations and pitches to executive stakeholders.",
                "Mentor and lead team members to achieve their full professional potential.",
                "Negotiate contracts and manage client/partner relationships."
            ],
            skills: [
                { name: "Strategic Planning", desc: "Setting long-term business objectives and action plans." },
                { name: "Project Management", desc: "Coordinating schedules, budgets, and resources effectively." },
                { name: "Leadership", desc: "Motivating and guiding teams toward operational success." },
                { name: "Financial Modeling", desc: "Analyzing revenues, costs, and key performance indicators." },
                { name: "Public Speaking", desc: "Presenting ideas with clarity, confidence, and persuasion." },
                { name: "Market Analysis", desc: "Evaluating industry trends, competition, and user demand." },
                { name: "Problem Solving", desc: "Resolving conflicts and operational bottlenecks efficiently." },
                { name: "Negotiation", desc: "Brokering mutually beneficial agreements with clients and vendors." }
            ]
        };
    }
    // Fallback/Default
    return {
        tasks: [
            "Analyze complex requirements and devise effective, scalable solutions.",
            "Collaborate with cross-functional teams to deliver key projects on time.",
            "Communicate progress and results clearly to stakeholders and managers.",
            "Identify process improvements and optimize day-to-day workflow efficiency.",
            "Manage project timelines, resources, and deliverable quality.",
            "Continuous learning to stay updated with industry best practices and tools."
        ],
        skills: [
            { name: "Communication", desc: "Expressing ideas clearly in writing and verbal discussions." },
            { name: "Problem Solving", desc: "Analyzing challenges and formulating structured solutions." },
            { name: "Project Management", desc: "Planning, organizing, and completing projects successfully." },
            { name: "Analytical Thinking", desc: "Analyzing data and situations logically to make sound decisions." },
            { name: "Team Collaboration", desc: "Working productively with diverse team members." },
            { name: "Adaptability", desc: "Learning new processes, tools, and adjusting to changing environments." },
            { name: "Critical Thinking", desc: "Evaluating information critically to reach objective conclusions." },
            { name: "Time Management", desc: "Prioritizing tasks efficiently to meet goals on time." }
        ]
    };
};

// --- MAIN COMPONENT ---
const CareerOnboarding: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [activeTab, setActiveTab] = useState<'Identity' | 'Paths'>('Identity');
    const [selectedDetailMonth, setSelectedDetailMonth] = useState<any>(null);
    const [carouselIndex, setCarouselIndex] = useState(0);
    
    const [formData, setFormData] = useState({
        role: '',
        level: 'Bachelor\'s degree',
        subject: '',
        skills: [] as string[],
        interests: [] as string[],
        experience: ["Summer Engineering Internship"],
        traits: ["Analytical", "Collaborative"]
    });

    const [organization, setOrganization] = useState('');
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [showTasksPopover, setShowTasksPopover] = useState(false);

    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const placeholderWords = useMemo(() => ["student", "parent", "job", "doctor", "developer", "engineering", "teacher"], []);

    useEffect(() => {
        if (formData.role || step !== 1) return;
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholderWords.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [formData.role, step, placeholderWords]);

    const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGeneratingPaths, setIsGeneratingPaths] = useState(false);
    const [isGeneratingIdentity, setIsGeneratingIdentity] = useState(false);
    const [identityStatement, setIdentityStatement] = useState('');
    const [generatedPaths, setGeneratedPaths] = useState<any[]>([]);
    const [hoveredPath, setHoveredPath] = useState<any>(null);
    const [roadmapData, setRoadmapData] = useState<any>(null);
    const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

    // Dynamic Google Career Dreamer styled Path Details
    const [selectedPath, setSelectedPath] = useState<any>(null);
    const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
    const [pathDetails, setPathDetails] = useState<any>(null);
    const [showDetailedPage, setShowDetailedPage] = useState(false);

    // Dynamic upgrades states
    const [isRegeneratingDay, setIsRegeneratingDay] = useState(false);
    const [selectedInsightItem, setSelectedInsightItem] = useState<{ type: 'skill' | 'task'; name: string } | null>(null);
    const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
    const [insightData, setInsightData] = useState<{ importance: string; mastery_steps: string[]; pro_tip: string } | null>(null);
    const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);
    const [isGeneratingCourses, setIsGeneratingCourses] = useState(false);

    const renderBrandLogo = (brandName: string) => {
        const bn = (brandName || "").toLowerCase();
        if (bn.includes("google")) {
            return (
                <div className="flex items-center justify-center gap-1 text-[11px] font-extrabold tracking-tight select-none">
                    <span className="text-slate-400">Grow with</span>
                    <span className="flex font-black tracking-tighter">
                        <span className="text-[#4285F4]">G</span>
                        <span className="text-[#EA4335]">o</span>
                        <span className="text-[#FBBC05]">o</span>
                        <span className="text-[#4285F4]">g</span>
                        <span className="text-[#34A853]">l</span>
                        <span className="text-[#EA4335]">e</span>
                    </span>
                </div>
            );
        } else if (bn.includes("aws") || bn.includes("amazon")) {
            return (
                <div className="flex items-center justify-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-400 select-none">
                    <span className="text-[#FF9900] font-black">AWS</span> <span>Training</span>
                </div>
            );
        } else if (bn.includes("meta")) {
            return (
                <div className="flex items-center justify-center gap-1 text-[11px] font-black text-slate-400 select-none">
                    <span className="text-[#0668E1] font-black">Meta</span> <span>Careers</span>
                </div>
            );
        } else if (bn.includes("ibm")) {
            return (
                <div className="flex items-center justify-center gap-1 text-[11px] font-black text-slate-400 select-none">
                    <span className="text-[#006699] font-black">IBM</span> <span>Training</span>
                </div>
            );
        } else {
            return (
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 select-none">
                    {brandName}
                </div>
            );
        }
    };

    const renderIllustration = (type: string) => {
        const baseClass = "w-full h-full flex items-center justify-center p-6 relative";
        const iconType = (type || "").toLowerCase();
        if (iconType === 'analytics') {
            return (
                <div className={baseClass}>
                    <svg className="w-28 h-28 text-[#4285F4]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="22" y="60" width="10" height="20" rx="3" fill="#4285F4" />
                        <rect x="42" y="45" width="10" height="35" rx="3" fill="#4285F4" />
                        <rect x="62" y="30" width="10" height="50" rx="3" fill="#3B82F6" opacity="0.8" />
                        <path d="M15 80 H85" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="47" cy="48" r="15" stroke="#4285F4" strokeWidth="3.5" fill="white" />
                        <path d="M57 58 L72 72" stroke="#4285F4" strokeWidth="4.5" strokeLinecap="round" />
                        <path d="M43 48 H51 M47 44 V52" stroke="#EA4335" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                </div>
            );
        } else if (iconType === 'cloud') {
            return (
                <div className={baseClass}>
                    <svg className="w-28 h-28 text-[#4285F4]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M30 65 C30 55 38 47 48 47 C51 38 59 34 68 36 C76 38 82 46 82 55 C88 55 92 60 92 66 C92 72 87 77 81 77 H31 C25 77 20 72 20 66 C20 60 25 55 30 65 Z" fill="#E8F0FE" stroke="#4285F4" strokeWidth="3.5" />
                        <circle cx="50" cy="62" r="6" fill="#34A853" />
                        <path d="M35 62 H65" stroke="#4285F4" strokeWidth="2" strokeDasharray="4 4" />
                    </svg>
                </div>
            );
        } else if (iconType === 'security') {
            return (
                <div className={baseClass}>
                    <svg className="w-28 h-28 text-[#34A853]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M50 18 C67 18 82 23 82 23 V50 C82 69 68 80 50 84 C32 80 18 69 18 50 V23 C18 23 33 18 50 18 Z" fill="#E6F4EA" stroke="#34A853" strokeWidth="3.5" />
                        <path d="M40 50 L47 57 L60 44" stroke="#34A853" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            );
        } else if (iconType === 'pm') {
            return (
                <div className={baseClass}>
                    <svg className="w-28 h-28 text-[#FBBC05]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="18" y="22" width="64" height="56" rx="10" fill="#FEF7E0" stroke="#FBBC05" strokeWidth="3.5" />
                        <line x1="28" y1="38" x2="72" y2="38" stroke="#FBBC05" strokeWidth="3" strokeLinecap="round" />
                        <line x1="28" y1="50" x2="55" y2="50" stroke="#FBBC05" strokeWidth="3" strokeLinecap="round" />
                        <line x1="28" y1="62" x2="62" y2="62" stroke="#FBBC05" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="70" cy="56" r="6" fill="#EA4335" />
                    </svg>
                </div>
            );
        } else if (iconType === 'design') {
            return (
                <div className={baseClass}>
                    <svg className="w-28 h-28 text-[#A855F7]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="38" cy="50" r="24" fill="#F3E8FF" stroke="#A855F7" strokeWidth="3.5" />
                        <circle cx="62" cy="50" r="24" fill="#F3E8FF" stroke="#A855F7" strokeWidth="3.5" strokeDasharray="5 5" />
                        <path d="M43 32 L57 68" stroke="#A855F7" strokeWidth="3.5" strokeLinecap="round" />
                    </svg>
                </div>
            );
        } else {
            return (
                <div className={baseClass}>
                    <svg className="w-28 h-28 text-[#4285F4]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="20" y="20" width="60" height="60" rx="12" fill="#E8F0FE" stroke="#4285F4" strokeWidth="3.5" />
                        <path d="M32 38 H68 M32 50 H68 M32 62 H52" stroke="#4285F4" strokeWidth="3.5" strokeLinecap="round" />
                    </svg>
                </div>
            );
        }
    };

    const fetchCourses = async (pathName: string) => {
        setIsGeneratingCourses(true);
        setCarouselIndex(0); // reset carousel to first slide for new path
        try {
            const res = await fetch(`${API_BASE}/api/career/certifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    career_path: pathName,
                    subject: formData.subject,
                    skills: formData.skills
                })
            });
            const data = await res.json();
            if (data && data.courses) {
                setRecommendedCourses(data.courses);
                setCarouselIndex(0);
            }
        } catch (err) {
            console.error("Failed to fetch certifications:", err);
        } finally {
            setIsGeneratingCourses(false);
        }
    };

    const handleRegenerateDayInLife = async () => {
        if (!selectedPath) return;
        setIsRegeneratingDay(true);
        try {
            const res = await fetch(`${API_BASE}/api/career/path-details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    career_path: selectedPath.name,
                    subject: formData.subject,
                    skills: formData.skills,
                    role: formData.role,
                    interests: formData.interests,
                    regenerate_day_only: true
                })
            });
            const data = await res.json();
            if (data && data.day_in_the_life) {
                setPathDetails((prev: any) => prev ? { ...prev, day_in_the_life: data.day_in_the_life } : null);
            }
        } catch (err) {
            console.error("Day in the life regeneration failed:", err);
        } finally {
            setIsRegeneratingDay(false);
        }
    };

    const handleInsightClick = async (type: 'skill' | 'task', name: string) => {
        setSelectedInsightItem({ type, name });
        setIsGeneratingInsight(true);
        setInsightData(null);
        try {
            const res = await fetch(`${API_BASE}/api/career/insight-details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item_type: type,
                    item_name: name,
                    career_path: selectedPath?.name || "Target Career Path",
                    subject: formData.subject || "general background"
                })
            });
            const data = await res.json();
            if (data) {
                setInsightData(data);
            }
        } catch (err) {
            console.error("Failed to fetch insights:", err);
            setInsightData({
                importance: `Mastering this is vital to execute operational and high-fidelity frameworks for becoming a successful ${selectedPath?.name || "Professional"}.`,
                mastery_steps: [
                    "Engage in deep, hands-on practice simulating production scenarios.",
                    "Review official documentation and key case studies.",
                    "Build small, interactive prototypes to validate your competence."
                ],
                pro_tip: "Focus on automated testing and integration patterns to stand out."
            });
        } finally {
            setIsGeneratingInsight(false);
        }
    };

    const getDefaultSkillsForSubject = (subj: string) => {
        const s = (subj || "").toLowerCase();
        if (s.includes("testing") || s.includes("qa")) return ["SDLC", "Manual Testing", "Automation Testing", "Bug Tracking"];
        if (s.includes("software") || s.includes("cs") || s.includes("it")) return ["C++", "Java", "DSA", "SQL"];
        if (s.includes("ece") || s.includes("electronics")) return ["Circuit Design", "VLSI", "Signal Processing", "Arduino"];
        if (s.includes("mechanical") || s.includes("me")) return ["AutoCAD", "SolidWorks", "Thermodynamics", "Kinematics"];
        if (s.includes("mba") || s.includes("business") || s.includes("management")) return ["Strategic Planning", "Market Research", "Excel Modeling", "Public Speaking"];
        if (s.includes("robotics")) return ["ROS", "Embedded Systems", "Sensor Fusion", "CAD"];
        if (s.includes("data") || s.includes("aiml") || s.includes("ai")) return ["Python", "Machine Learning", "Data Visualization", "SQL"];
        return ["Communication", "Problem Solving", "Adaptability"];
    };

    const fetchIdentity = useCallback(async () => {
        setIsGeneratingIdentity(true);
        try {
            const res = await fetch(`${API_BASE}/api/career/identity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    subject: formData.subject, 
                    skills: formData.skills, 
                    interests: formData.interests,
                    role: formData.role
                })
            });
            const data = await res.json();
            if (data.identity_statement) setIdentityStatement(data.identity_statement);
        } catch (err) {
            console.error("Identity fetch failed:", err);
        } finally {
            setIsGeneratingIdentity(false);
        }
    }, [formData.subject, formData.skills, formData.interests, formData.role, API_BASE]);

    const fetchPaths = useCallback(async () => {
        if (isGeneratingPaths) return;
        setIsGeneratingPaths(true);
        try {
            const res = await fetch(`${API_BASE}/api/career/explore-paths`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    subject: formData.subject, 
                    skills: formData.skills, 
                    interests: formData.interests,
                    role: formData.role
                })
            });
            const data = await res.json();
            if (data && data.paths && data.paths.length > 0) {
                setGeneratedPaths(data.paths);
            } else {
                setGeneratedPaths(DEFAULT_PATHS);
            }
        } catch (err) {
            console.error("Paths fetch failed:", err);
            setGeneratedPaths(DEFAULT_PATHS);
        } finally {
            setIsGeneratingPaths(false);
        }
    }, [formData.subject, formData.skills, formData.interests, formData.role, isGeneratingPaths, API_BASE]);

    const fetchIdentityDirect = async (dataToUse: typeof formData) => {
        setIsGeneratingIdentity(true);
        try {
            const res = await fetch(`${API_BASE}/api/career/identity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    subject: dataToUse.subject, 
                    skills: dataToUse.skills, 
                    interests: dataToUse.interests,
                    role: dataToUse.role
                })
            });
            const data = await res.json();
            if (data.identity_statement) setIdentityStatement(data.identity_statement);
        } catch (err) {
            console.error("Identity fetch failed:", err);
        } finally {
            setIsGeneratingIdentity(false);
        }
    };

    const fetchPathsDirect = async (dataToUse: typeof formData) => {
        if (isGeneratingPaths) return;
        setIsGeneratingPaths(true);
        try {
            const res = await fetch(`${API_BASE}/api/career/explore-paths`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    subject: dataToUse.subject, 
                    skills: dataToUse.skills, 
                    interests: dataToUse.interests,
                    role: dataToUse.role
                })
            });
            const data = await res.json();
            if (data && data.paths && data.paths.length > 0) {
                setGeneratedPaths(data.paths);
            } else {
                setGeneratedPaths(DEFAULT_PATHS);
            }
        } catch (err) {
            console.error("Paths fetch failed:", err);
            setGeneratedPaths(DEFAULT_PATHS);
        } finally {
            setIsGeneratingPaths(false);
        }
    };

    const handleAnalyze = async () => {
        const isStudent = formData.role.toLowerCase().includes('student');
        if (isStudent && !formData.subject) {
            alert("Please enter your academic trajectory.");
            return;
        }
        setIsAnalyzing(true);
        setGeneratedPaths([]);
        setRoadmapData(null);
        setSelectedPath(null);
        
        let updatedExp = [...formData.experience];
        let updatedSubject = formData.subject;
        let updatedSkills = [...formData.skills];

        if (!isStudent) {
            const expString = organization ? `${formData.role} at ${organization}` : formData.role;
            updatedExp = [expString];
            updatedSubject = ''; // No field of study for non-students
        } else {
            // Keep user-selected skills from step 2.5; only derive defaults if none were picked
            if (updatedSkills.length === 0) {
                updatedSkills = getDefaultSkillsForSubject(formData.subject);
            }
        }

        const nextFormData = {
            ...formData,
            experience: updatedExp,
            subject: updatedSubject,
            skills: updatedSkills
        };

        setFormData(nextFormData);

        // Pre-compute a premium static fallback identity statement so the card is never empty.
        const skillsPreview = updatedSkills.slice(0, 3).join(', ') || 'core domain skills';
        const staticFallback = nextFormData.subject
            ? `As a driven and intellectually curious ${nextFormData.role}, I have cultivated deep expertise in ${nextFormData.subject}, developing a strong command of ${skillsPreview}. My academic journey has been defined by a rigorous commitment to solving real-world challenges through innovation and structured analytical thinking. I am now channelling this expertise to design scalable, high-impact solutions that bridge academic theory with industry-grade practice, positioning myself to lead transformative initiatives in my chosen domain.`
            : `Leveraging a proven professional track record as a ${nextFormData.role}${organization ? ` at ${organization}` : ''}, I have built deep operational expertise across ${skillsPreview}. My career trajectory is driven by a relentless focus on delivering measurable impact — from designing optimized frameworks to spearheading cross-functional initiatives. I combine strategic thinking with hands-on execution, consistently translating complex challenges into scalable, high-value outcomes that accelerate organisational growth.`;
        setIdentityStatement(staticFallback);

        try {
            await Promise.all([
                fetchIdentityDirect(nextFormData),
                fetchPathsDirect(nextFormData)
            ]);
        } catch (err) {
            console.error("Analysis failed:", err);
        } finally {
            setIsAnalyzing(false);
            setStep(3);
        }
    };



    useEffect(() => {
        if (activeTab === 'Paths' && generatedPaths.length === 0 && !isGeneratingPaths && step >= 3) {
            fetchPaths();
        }
    }, [activeTab, generatedPaths.length, isGeneratingPaths, fetchPaths, step]);

    const handlePathClick = useCallback(async (path: any) => {
        if (isGeneratingRoadmap) return;
        setSelectedPath(path);
        setIsGeneratingRoadmap(true);
        setRoadmapData(null);
        
        try {
            const res = await fetch(`${API_BASE}/api/career/roadmap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    career_path: path.name,
                    subject: formData.subject,
                    skills: formData.skills
                })
            });
            const data = await res.json();
            if (data && data.roadmap && data.roadmap.length > 0) {
                setRoadmapData(data.roadmap);
            } else {
                setRoadmapData(FALLBACK_ROADMAP);
            }
        } catch (err) {
            console.error("Roadmap generation failed:", err);
            setRoadmapData(FALLBACK_ROADMAP);
        } finally {
            setIsGeneratingRoadmap(false);
        }
    }, [isGeneratingRoadmap, formData.subject, formData.skills, API_BASE]);

    const handleLearnMore = async (path: any) => {
        setSelectedPath(path);
        setIsGeneratingDetails(true);
        setPathDetails(null);
        setShowDetailedPage(true);
        setRecommendedCourses([]);
        setCarouselIndex(0); // reset carousel for new path
        
        // Pre-fetch roadmap timeline and course list in the background
        handlePathClick(path);
        fetchCourses(path.name);
        
        try {
            const res = await fetch(`${API_BASE}/api/career/path-details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    career_path: path.name,
                    subject: formData.subject,
                    skills: formData.skills,
                    role: formData.role,
                    interests: formData.interests
                })
            });
            const data = await res.json();
            setPathDetails(data);
        } catch (err) {
            console.error("Details fetch failed:", err);
            setPathDetails({
                description: `A ${path.name} is a highly specialized expert responsible for designing, deploying, and optimizing critical industrial and technical solutions.`,
                avg_salary: "$118,000",
                typical_degree: "Bachelor's degree",
                sweet_spot_explanation: `Your academic field in ${formData.subject || "CSE"} and your skills in ${formData.skills.slice(0, 3).join(', ') || 'core domains'} overlap perfectly with the demands of a ${path.name}. This unique synergy provides you with a strong competitive advantage.`,
                day_in_the_life: [
                    "Design and develop robust systems and functional components tailored to engineering requirements.",
                    "Program, debug, and test specialized software scripts and automated control algorithms.",
                    "Integrate physical sensors, cloud platforms, and NoSQL databases into local subsystems.",
                    "Perform routine quality assurance checks, diagnostics, and high-fidelity code reviews.",
                    "Collaborate with multi-disciplinary stakeholders to align technical blueprints with market value."
                ]
            });
        } finally {
            setIsGeneratingDetails(false);
        }
    };

    const addExperience = () => {
        const exp = prompt("Enter your experience:");
        if (exp) setFormData({ ...formData, experience: [...formData.experience, exp] });
    };

    const removeExperience = (idx: number) => {
        setFormData({ ...formData, experience: formData.experience.filter((_, i) => i !== idx) });
    };

    const addSkill = () => {
        const skill = prompt("Enter a skill:");
        if (skill) setFormData({ ...formData, skills: [...formData.skills, skill] });
    };

    const removeSkill = (skill: string) => {
        setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
    };

    const renderHeaderTabs = () => (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-6">
            <div className="relative p-1 bg-white/60 backdrop-blur-xl rounded-full border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex items-center">
                <button
                    onClick={() => { setActiveTab('Identity'); setStep(3); }}
                    className={`relative z-10 flex-1 h-10 rounded-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${activeTab === 'Identity' ? 'text-[#111]' : 'text-gray-400'}`}
                >
                    {activeTab === 'Identity' && (
                        <motion.div 
                            layoutId="activeTab" 
                            className="absolute inset-0 bg-white shadow-sm rounded-full border border-gray-100/50" 
                            transition={{ type: 'spring', duration: 0.6 }}
                        />
                    )}
                    <span className="relative z-20 flex items-center gap-2">
                        <Edit3 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Identity</span>
                    </span>
                </button>
                <button
                    onClick={() => { setActiveTab('Paths'); setStep(4); }}
                    className={`relative z-10 flex-1 h-10 rounded-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${activeTab === 'Paths' ? 'text-[#111]' : 'text-gray-400'}`}
                >
                    {activeTab === 'Paths' && (
                        <motion.div 
                            layoutId="activeTab" 
                            className="absolute inset-0 bg-white shadow-sm rounded-full border border-gray-100/50" 
                            transition={{ type: 'spring', duration: 0.6 }}
                        />
                    )}
                    <span className="relative z-20 flex items-center gap-2">
                        <Network className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Explore</span>
                    </span>
                </button>
            </div>
        </div>
    );

    const renderContent = () => {
        if (step === 1) {
            const titleText = "To start, share a current or previous role:";
            const titleWords = titleText.split(" ");
            const wordsArr = formData.role.trim().split(/\s+/).filter(Boolean);
            const wordCount = wordsArr.length;
            const charCount = formData.role.length;
            const isValid = wordCount > 0 && wordCount <= 5 && charCount <= 50;

            return (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-12 border border-slate-100/80 shadow-[0_24px_80px_rgba(0,0,0,0.04)] relative overflow-hidden flex flex-col gap-8"
                >
                    {/* Subtle gradient background glow */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#7C3AED]/5 rounded-full blur-3xl pointer-events-none" />

                    {/* --- Logo Header --- */}
                    <div className="flex justify-center select-none mb-2">
                        <div className="flex items-center gap-1">
                            <span className="text-4xl sm:text-5xl font-black text-slate-800 tracking-wider uppercase">CAREER</span>
                            <span className="text-4xl sm:text-5xl font-black text-[#7C3AED] tracking-wider uppercase">DREAMER</span>
                        </div>
                    </div>

                    {/* ── Title: styled in an attractive prompt card ── */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex items-center gap-2 py-2"
                    >
                        <motion.span
                            className="text-2xl sm:text-3xl inline-block origin-[70%_70%] select-none"
                            animate={{ rotate: [0, 18, -10, 18, -10, 12, 0] }}
                            transition={{ duration: 1.2, ease: "easeInOut" }}
                        >
                            👋
                        </motion.span>
                        <h1 className="text-lg sm:text-xl font-semibold text-slate-700 flex flex-wrap gap-x-[6px] leading-snug">
                            {titleWords.map((word, idx) => (
                                <motion.span key={idx} variants={wordVariants} className="inline-block">
                                    {word === 'role:' ? (
                                        <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent font-bold">{word}</span>
                                    ) : word === 'current' || word === 'previous' ? (
                                        <span className="text-slate-900 font-semibold">{word}</span>
                                    ) : word}
                                </motion.span>
                            ))}
                        </h1>
                    </motion.div>

                    {/* ── Placeholder hint above input ── */}
                    <div className="flex flex-col gap-1">
                        <div className="h-8 overflow-hidden">
                            {!formData.role && (
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={placeholderIndex}
                                        initial={{ y: 14, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -14, opacity: 0 }}
                                        transition={{ duration: 0.35, ease: "easeInOut" }}
                                        className="text-sm font-medium text-slate-400 capitalize select-none"
                                    >
                                        e.g. {placeholderWords[placeholderIndex]}
                                    </motion.p>
                                </AnimatePresence>
                            )}
                        </div>

                        {/* ── Input field ── */}
                        <div className="relative">
                            <input
                                autoFocus
                                type="text"
                                value={formData.role}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const words = val.trim().split(/\s+/).filter(Boolean);
                                    if (words.length <= 5 && val.length <= 50) {
                                        setFormData({ ...formData, role: val });
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && isValid) {
                                        const isStudent = formData.role.toLowerCase().includes('student');
                                        setStep(isStudent ? 2 : 21);
                                    }
                                }}
                                placeholder="Type your role here…"
                                className="w-full text-3xl sm:text-4xl font-light text-slate-900 border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-3 pt-1 bg-transparent transition-all placeholder:text-slate-200"
                                style={{ caretColor: '#1A73E8' }}
                            />
                        </div>

                        <div className="flex justify-between items-center mt-2">
                            <span className="text-xs font-medium text-slate-400 select-none">
                                {wordCount}/5 words &nbsp;·&nbsp; {charCount}/50 chars
                            </span>
                            {isValid && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-xs font-semibold text-green-500"
                                >
                                    ✓ Ready
                                </motion.span>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            const isStudent = formData.role.toLowerCase().includes('student');
                            setStep(isStudent ? 2 : 21);
                        }} 
                        disabled={!isValid}
                        className={`w-full sm:w-fit px-12 py-4 rounded-2xl font-semibold text-base transition-all select-none ${
                            isValid 
                            ? "bg-[#1B66EC] text-white hover:bg-blue-700 shadow-lg shadow-blue-200/50 active:scale-95 cursor-pointer" 
                            : "bg-[#D2E3FC] text-white cursor-not-allowed"
                        }`}
                    >
                        Next →
                    </button>
                </motion.div>
            );
        }

        if (step === 21) {
            return (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col gap-10 w-full max-w-2xl px-6"
                >
                    {/* Role Title */}
                    <div className="space-y-2">
                        <h1 className="text-4xl sm:text-5xl font-semibold text-slate-800 tracking-tight lowercase">
                            {formData.role}
                        </h1>
                    </div>

                    {/* Organization Input */}
                    <div className="relative">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Organization or industry (optional)"
                            value={organization}
                            onChange={(e) => setOrganization(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && setStep(22)}
                            className="w-full text-3xl sm:text-4xl font-light text-slate-900 border-b-2 border-gray-200 focus:border-blue-500 outline-none pb-3 pt-1 bg-transparent transition-all placeholder:text-slate-300"
                            style={{ caretColor: '#1A73E8' }}
                        />
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setStep(1)}
                            className="px-8 py-3 rounded-2xl font-semibold text-base transition-all select-none border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-blue-600 active:scale-95 cursor-pointer bg-white"
                        >
                            Back
                        </button>
                        <button 
                            onClick={() => setStep(22)}
                            className="px-8 py-3 rounded-2xl font-semibold text-base transition-all select-none bg-[#1B66EC] text-white hover:bg-blue-700 shadow-lg shadow-blue-200/50 active:scale-95 cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                </motion.div>
            );
        }

        if (step === 22) {
            const roleData = getRoleTasksAndSkills(formData.role);
            const allTasks = roleData.tasks;
            const isAllSelected = allTasks.every(t => selectedTasks.includes(t));

            const toggleSelectAllTasks = () => {
                if (isAllSelected) {
                    setSelectedTasks([]);
                } else {
                    setSelectedTasks([...allTasks]);
                }
            };

            const toggleTask = (task: string) => {
                setSelectedTasks(prev => 
                    prev.includes(task) 
                        ? prev.filter(t => t !== task) 
                        : [...prev, task]
                );
            };

            return (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col gap-6 w-full max-w-3xl px-6"
                >
                    {/* Header */}
                    <div className="space-y-2">
                        <h1 className="text-4xl sm:text-5xl font-semibold text-slate-800 tracking-tight lowercase">
                            {formData.role}
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Select all the tasks you performed as a(n) <span className="font-semibold text-slate-700">{formData.role}</span> (optional).
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-4 items-center">
                        <button 
                            onClick={() => {
                                alert("Re-shuffled roles and responsibilities!");
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Re-generate
                        </button>
                        <button 
                            onClick={toggleSelectAllTasks}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <input 
                                type="checkbox" 
                                checked={isAllSelected} 
                                onChange={toggleSelectAllTasks}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Select all</span>
                        </button>
                    </div>

                    {/* Task List */}
                    <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                        {allTasks.map((task, idx) => {
                            const isSelected = selectedTasks.includes(task);
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => toggleTask(task)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer select-none text-left flex items-start gap-3 hover:shadow-md ${
                                        isSelected
                                            ? 'bg-blue-50/80 border-blue-500 text-slate-800 font-medium'
                                            : 'bg-[#F1F3F4]/60 border-slate-100 hover:bg-white text-slate-600'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border mt-0.5 ${
                                        isSelected 
                                            ? 'bg-blue-500 border-blue-500 text-white' 
                                            : 'bg-white border-slate-300'
                                    }`}>
                                        {isSelected && <span className="text-[10px]">✓</span>}
                                    </div>
                                    <span className="text-sm sm:text-base leading-relaxed">{task}</span>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-xs text-slate-400 font-medium select-none">
                            {selectedTasks.length} task{selectedTasks.length !== 1 && 's'} selected
                        </span>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setStep(21)}
                                className="px-8 py-3 rounded-2xl font-semibold text-base transition-all select-none border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-blue-600 active:scale-95 cursor-pointer bg-white"
                            >
                                Back
                            </button>
                            <button 
                                onClick={() => setStep(23)}
                                className="px-8 py-3 rounded-2xl font-semibold text-base transition-all select-none bg-[#1B66EC] text-white hover:bg-blue-700 shadow-lg shadow-blue-200/50 active:scale-95 cursor-pointer"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </motion.div>
            );
        }

        if (step === 23) {
            const roleData = getRoleTasksAndSkills(formData.role);
            const skillList = roleData.skills;
            const selectedSkills = formData.skills;
            const isSkillValid = selectedSkills.length >= 3;
            const isAllSelected = skillList.every(s => selectedSkills.includes(s.name));

            const toggleSelectAllSkills = () => {
                if (isAllSelected) {
                    setFormData(prev => ({
                        ...prev,
                        skills: prev.skills.filter(s => !skillList.some(k => k.name === s))
                    }));
                } else {
                    const uniqueSkills = Array.from(new Set([...selectedSkills, ...skillList.map(s => s.name)]));
                    setFormData(prev => ({ ...prev, skills: uniqueSkills }));
                }
            };

            const addCustomSkill = () => {
                const s = prompt("Enter a custom skill:");
                if (s && s.trim()) {
                    setFormData(prev => ({
                        ...prev,
                        skills: [...prev.skills, s.trim()]
                    }));
                }
            };

            return (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col gap-6 w-full max-w-2xl px-6"
                >
                    {/* Header */}
                    <div className="space-y-3 relative">
                        <h1 className="text-4xl sm:text-5xl font-semibold text-slate-800 tracking-tight lowercase">
                            {formData.role}
                        </h1>

                        {/* Selected Tasks Popover Trigger */}
                        <div className="relative inline-block">
                            <button 
                                onClick={() => setShowTasksPopover(!showTasksPopover)}
                                className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-95"
                            >
                                💼 {selectedTasks.length} task{selectedTasks.length !== 1 && 's'} <ChevronDown className={`w-3 h-3 transition-transform ${showTasksPopover ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Selected Tasks Popover */}
                            <AnimatePresence>
                                {showTasksPopover && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                                        className="absolute left-0 mt-2 z-[100] w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 max-h-56 overflow-y-auto text-left space-y-2"
                                    >
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1 mb-2">Performed Tasks</p>
                                        {selectedTasks.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">No tasks selected.</p>
                                        ) : (
                                            selectedTasks.map((t, idx) => (
                                                <div key={idx} className="flex gap-2 items-start text-xs text-slate-600 font-medium">
                                                    <span className="text-blue-500">•</span>
                                                    <span>{t}</span>
                                                </div>
                                            ))
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <p className="text-slate-500 text-sm">
                            Select at least 3 skills that apply to you.
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-4 items-center">
                        <button 
                            onClick={() => {
                                alert("Re-shuffled roles and responsibilities!");
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" /> Re-generate
                        </button>
                        <button 
                            onClick={toggleSelectAllSkills}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <input 
                                type="checkbox" 
                                checked={isAllSelected} 
                                onChange={toggleSelectAllSkills}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-[#7C3AED] focus:ring-[#7C3AED] cursor-pointer"
                            />
                            <span>Select all</span>
                        </button>
                    </div>

                    {/* Skill chips grid */}
                    <div className="flex flex-wrap gap-2.5">
                        {skillList.map((skill, idx) => {
                            const isSelected = selectedSkills.includes(skill.name);
                            return (
                                <div key={idx} className="relative">
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.88 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.04 }}
                                        onMouseEnter={() => setHoveredSkill(skill.name)}
                                        onMouseLeave={() => setHoveredSkill(null)}
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                skills: isSelected
                                                    ? prev.skills.filter(s => s !== skill.name)
                                                    : [...prev.skills, skill.name]
                                            }));
                                        }}
                                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all select-none ${
                                            isSelected
                                                ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-md shadow-purple-200'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-[#7C3AED]/50 hover:text-[#7C3AED]'
                                        }`}
                                    >
                                        {isSelected && <span className="mr-1">✓</span>}
                                        {skill.name}
                                    </motion.button>

                                    {/* Tooltip */}
                                    <AnimatePresence>
                                        {hoveredSkill === skill.name && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.94 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 6, scale: 0.94 }}
                                                transition={{ duration: 0.18 }}
                                                className="absolute bottom-full left-0 mb-2 z-[200] w-56 rounded-2xl p-4 shadow-2xl pointer-events-none text-left"
                                                style={{ background: '#7C3AED' }}
                                            >
                                                <p className="text-white font-bold text-sm mb-1.5">{skill.name}</p>
                                                <p className="text-white/80 text-xs leading-relaxed">{skill.desc}</p>
                                                <p className="text-white/50 text-[10px] mt-2 font-medium">
                                                    Based on: {formData.role}
                                                </p>
                                                <div
                                                    className="absolute top-full left-5 w-0 h-0"
                                                    style={{
                                                        borderLeft: '6px solid transparent',
                                                        borderRight: '6px solid transparent',
                                                        borderTop: '6px solid #7C3AED',
                                                    }}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}

                        {/* More skills button */}
                        <button
                            onClick={addCustomSkill}
                            className="px-4 py-2 rounded-full text-sm font-semibold border border-dashed border-[#7C3AED]/40 text-[#7C3AED] bg-[#7C3AED]/5 hover:bg-[#7C3AED]/10 hover:border-[#7C3AED]/80 transition-all select-none flex items-center gap-1"
                        >
                            More skills... <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Navigation and validation */}
                    <div className="flex justify-between items-center mt-6">
                        <span className="text-xs font-medium text-slate-400">
                            {selectedSkills.length} selected{selectedSkills.length < 3 && ` — pick ${3 - selectedSkills.length} more`}
                            {selectedSkills.length >= 3 && <span className="text-green-500 font-semibold ml-1">✓ Good to go!</span>}
                        </span>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setStep(22)}
                                className="px-8 py-3 rounded-2xl font-semibold text-base transition-all select-none border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-blue-600 active:scale-95 cursor-pointer bg-white"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handleAnalyze} 
                                disabled={!isSkillValid}
                                className={`px-8 py-3 rounded-2xl font-semibold text-base transition-all flex items-center gap-2 ${
                                    isSkillValid 
                                    ? 'bg-[#1B66EC] text-white hover:bg-blue-700 shadow-lg shadow-blue-200/50 active:scale-95 cursor-pointer' 
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </motion.div>
            );
        }

        if (step === 2) {
            const step2SubjectWords = formData.subject.trim().split(/\s+/).filter(Boolean);
            const isStep2Valid = step2SubjectWords.length > 0;

            return (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col gap-8 w-full max-w-2xl px-6"
                >
                    {/* ── Step 1 answer (conversation bubble) ── */}
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-3"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-lg select-none">👋</span>
                            <span className="text-sm text-slate-400 font-medium">To start, share a current or previous role:</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">U</div>
                            <div className="inline-flex items-center px-5 py-2.5 bg-blue-50 border border-blue-100 rounded-2xl rounded-tl-sm shadow-sm">
                                <span className="text-slate-800 font-semibold text-base">{formData.role}</span>
                            </div>
                        </div>
                        <div className="w-full h-px bg-gray-100 mt-2" />
                    </motion.div>

                    {/* ── Step 2 title ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-2"
                    >
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setStep(1)} 
                                className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors text-xs font-semibold uppercase tracking-widest"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" /> Back
                            </button>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-snug">
                            What's your field of study
                            <span className="text-[#7C3AED]"> or background?</span>
                        </h1>
                        <p className="text-slate-400 text-sm">Type below or pick a subject area to get started.</p>
                    </motion.div>

                    {/* ── Input ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative"
                    >
                        <input
                            autoFocus
                            type="text"
                            placeholder="e.g. B.Tech Computer Science"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && isStep2Valid && setStep(25)}
                            className="w-full text-3xl sm:text-4xl font-light text-slate-900 border-b-2 border-gray-200 focus:border-[#7C3AED] outline-none pb-3 pt-1 bg-transparent placeholder:text-slate-200 transition-all"
                            style={{ caretColor: '#7C3AED' }}
                        />
                    </motion.div>

                    {/* ── Subject Area Quick-Pick chips ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-3"
                    >
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Or choose a subject area</p>
                        <div className="flex flex-wrap gap-2">
                            {SUBJECT_AREAS.map((area, idx) => {
                                const isActive = area.keywords.some(k => formData.subject.toLowerCase().includes(k));
                                return (
                                    <motion.button
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.92 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.45 + idx * 0.04 }}
                                        onClick={() => setFormData({ ...formData, subject: area.label })}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                                            isActive
                                                ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-lg shadow-purple-200'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-[#7C3AED] hover:text-[#7C3AED] hover:shadow-sm'
                                        }`}
                                    >
                                        <span>{area.icon}</span>
                                        <span>{area.label}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>

                    <motion.button 
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        onClick={() => setStep(25)}
                        disabled={!isStep2Valid}
                        className={`w-full sm:w-fit px-12 py-4 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-3 ${
                            isStep2Valid 
                            ? 'bg-[#7C3AED] text-white hover:bg-purple-700 active:scale-95 cursor-pointer shadow-lg shadow-purple-200/50' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        }`}
                    >
                        Next — Pick Your Skills →
                    </motion.button>
                </motion.div>
            );
        }

        // ── STEP 2.5: Skill Selection ──
        if (step === 25) {
            const catalogKey = getSkillCatalogKey(formData.subject);
            const skillList = SKILL_CATALOG[catalogKey] || SKILL_CATALOG.default;
            const selectedSkills = formData.skills;
            const isSkillValid = selectedSkills.length >= 3;

            return (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col gap-8 w-full max-w-2xl px-6"
                >
                    {/* ── Conversation echo: Role + Subject ── */}
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="space-y-2"
                    >
                        {/* Role echo */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm select-none">👋</span>
                            <span className="text-xs text-slate-400 font-medium">Role:</span>
                            <span className="text-xs font-semibold text-slate-600 bg-blue-50 border border-blue-100 px-3 py-0.5 rounded-full">{formData.role}</span>
                        </div>
                        {/* Subject echo */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm select-none">📚</span>
                            <span className="text-xs text-slate-400 font-medium">Field:</span>
                            <span className="text-xs font-semibold text-slate-600 bg-purple-50 border border-purple-100 px-3 py-0.5 rounded-full">{formData.subject}</span>
                        </div>
                        <div className="w-full h-px bg-gray-100 mt-1" />
                    </motion.div>

                    {/* ── Title ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="space-y-2"
                    >
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setStep(2)} 
                                className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors text-xs font-semibold uppercase tracking-widest"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" /> Back
                            </button>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                            Select your <span className="text-[#7C3AED]">skills</span>
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Pick at least <span className="font-semibold text-slate-600">3 skills</span> that apply to you. 
                            Hover any skill to learn more.
                        </p>
                    </motion.div>

                    {/* ── Skill chips grid ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="flex flex-wrap gap-2.5"
                    >
                        {skillList.map((skill, idx) => {
                            const isSelected = selectedSkills.includes(skill.name);
                            return (
                                <div key={idx} className="relative">
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.88 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 + idx * 0.05 }}
                                        onMouseEnter={() => setHoveredSkill(skill.name)}
                                        onMouseLeave={() => setHoveredSkill(null)}
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                skills: isSelected
                                                    ? prev.skills.filter(s => s !== skill.name)
                                                    : [...prev.skills, skill.name]
                                            }));
                                        }}
                                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all select-none ${
                                            isSelected
                                                ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-md shadow-purple-200'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-[#7C3AED]/50 hover:text-[#7C3AED]'
                                        }`}
                                    >
                                        {isSelected && <span className="mr-1">✓</span>}
                                        {skill.name}
                                    </motion.button>

                                    {/* ── Hover tooltip (app purple bg) ── */}
                                    <AnimatePresence>
                                        {hoveredSkill === skill.name && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.94 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 6, scale: 0.94 }}
                                                transition={{ duration: 0.18 }}
                                                className="absolute bottom-full left-0 mb-2 z-50 w-56 rounded-2xl p-4 shadow-2xl pointer-events-none"
                                                style={{ background: '#7C3AED' }}
                                            >
                                                <p className="text-white font-bold text-sm mb-1.5">{skill.name}</p>
                                                <p className="text-white/80 text-xs leading-relaxed">{skill.desc}</p>
                                                {formData.subject && (
                                                    <p className="text-white/50 text-[10px] mt-2 font-medium">
                                                        Based on: {formData.subject}
                                                    </p>
                                                )}
                                                {/* Arrow */}
                                                <div
                                                    className="absolute top-full left-5 w-0 h-0"
                                                    style={{
                                                        borderLeft: '6px solid transparent',
                                                        borderRight: '6px solid transparent',
                                                        borderTop: '6px solid #7C3AED',
                                                    }}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </motion.div>

                    {/* ── Counter + Next ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center justify-between gap-4"
                    >
                        <span className="text-xs font-medium text-slate-400">
                            {selectedSkills.length} selected{selectedSkills.length < 3 && ` — pick ${3 - selectedSkills.length} more`}
                            {selectedSkills.length >= 3 && <span className="text-green-500 font-semibold ml-1">✓ Good to go!</span>}
                        </span>
                        <button 
                            onClick={handleAnalyze} 
                            disabled={!isSkillValid}
                            className={`px-10 py-4 rounded-2xl font-semibold text-base transition-all flex items-center gap-3 ${
                                isSkillValid 
                                ? 'bg-[#7C3AED] text-white hover:bg-purple-700 active:scale-95 cursor-pointer shadow-lg shadow-purple-200/50' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            Analyze Career <Rocket className="w-4 h-4" />
                        </button>
                    </motion.div>
                </motion.div>
            );
        }

        if (activeTab === 'Identity') {
            return (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-6xl mx-auto pt-28 pb-12 grid lg:grid-cols-[0.9fr_1.1fr] gap-12 px-6">
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-800 font-bold uppercase text-[11px] tracking-widest"><Briefcase className="w-4 h-4 text-blue-500" /> Experiences</div>
                            <div className="flex flex-wrap gap-2">
                                {formData.experience.map((exp, i) => (
                                    <div key={i} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-[#111] rounded-lg text-[11px] font-bold uppercase tracking-tight">{exp} <X className="w-3 h-3 cursor-pointer opacity-40 hover:opacity-100" onClick={() => removeExperience(i)} /></div>
                                ))}
                                <button onClick={addExperience} className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-400 rounded-lg text-[11px] font-bold border border-dashed border-gray-200 hover:border-gray-400 transition-all uppercase tracking-tight"><Plus className="w-3 h-3" /> Add experience</button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-800 font-bold uppercase text-[11px] tracking-widest"><GraduationCap className="w-4 h-4 text-purple-500" /> Education</div>
                            <div className="flex gap-2 flex-wrap">
                                {formData.subject ? (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-bold border border-blue-100 uppercase tracking-tight">
                                        {formData.subject}
                                        <X className="w-3 h-3 cursor-pointer opacity-40 hover:opacity-100" onClick={() => setFormData({...formData, subject: ''})} />
                                    </div>
                                ) : null}
                                <button onClick={() => { const s = prompt("Update background:"); if(s) setFormData({...formData, subject: s}) }} className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-400 rounded-lg text-[11px] font-bold border border-dashed border-gray-200 hover:border-gray-400 transition-all uppercase tracking-tight"><Plus className="w-3 h-3" /> Add education</button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-800 font-bold uppercase text-[11px] tracking-widest"><Target className="w-4 h-4 text-green-500" /> Skills</div>
                            <div className="flex flex-wrap gap-2">
                                {formData.skills.map(s => (
                                    <div key={s} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-[11px] font-bold border border-green-100 uppercase tracking-tight">{s} <X className="w-3 h-3 cursor-pointer opacity-40" onClick={() => removeSkill(s)} /></div>
                                ))}
                                <button onClick={addSkill} className="px-4 py-2 bg-gray-50 text-gray-400 rounded-lg text-[11px] font-bold border border-dashed border-gray-200 hover:border-gray-400 transition-all uppercase tracking-tight"><Plus className="w-3 h-3" /> Add skills</button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-800 font-bold uppercase text-[11px] tracking-widest"><Heart className="w-4 h-4 text-rose-500" /> Interests</div>
                            <div className="flex flex-wrap gap-2">
                                {formData.interests.map(interest => (
                                    <div key={interest} className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-700 rounded-lg text-[11px] font-bold border border-pink-100 uppercase tracking-tight">
                                        {interest}
                                        <X className="w-3 h-3 cursor-pointer opacity-40 hover:opacity-100" onClick={() => setFormData({...formData, interests: formData.interests.filter(item => item !== interest)})} />
                                    </div>
                                ))}
                                <button onClick={() => { const interest = prompt("Enter an interest:"); if (interest) setFormData({...formData, interests: [...formData.interests, interest]}) }} className="px-4 py-2 bg-gray-50 text-gray-400 rounded-lg text-[11px] font-bold border border-dashed border-gray-200 hover:border-gray-400 transition-all uppercase tracking-tight"><Plus className="w-3 h-3" /> Add interests</button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-[0_15px_60px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between h-auto min-h-[450px] relative overflow-hidden group">
                        <AnimatePresence>
                            {isGeneratingIdentity && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/80 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-4">
                                    <div className="w-8 h-8 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                                    <span className="text-blue-600 font-black uppercase text-[9px] tracking-widest italic">Syncing Profile...</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div>
                            <div className="flex justify-between items-start mb-10">
                                <div className="flex items-center gap-2 text-[#34A853]">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="font-black text-[10px] uppercase tracking-widest">Identity Synthesis</span>
                                </div>
                                <span className="px-3 py-1 bg-gray-50 rounded-lg text-[9px] font-black text-gray-300 uppercase tracking-widest italic border border-gray-100">GROQ 2.0</span>
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.p 
                                    key={identityStatement.substring(0, 30) || 'empty'}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-2xl sm:text-3xl text-[#3C4043] leading-tight font-light italic pr-4"
                                >
                                    "{identityStatement}"
                                </motion.p>
                            </AnimatePresence>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-12 pb-2">
                            <div className="flex gap-3">
                                <button onClick={async () => {
                                    await Promise.all([
                                        fetchIdentityDirect(formData),
                                        fetchPathsDirect(formData)
                                    ]);
                                }} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all border border-gray-100 shadow-sm active:scale-95 hover:text-purple-600" title="Re-generate Identity and Paths"><RefreshCw className="w-4 h-4" /></button>
                                <button onClick={() => { navigator.clipboard.writeText(identityStatement); alert('Copied!'); }} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all border border-gray-100"><Copy className="w-4 h-4" /></button>
                            </div>
                            <button
                                onClick={() => { setActiveTab('Paths'); setStep(4); }}
                                className="w-full sm:w-auto px-10 py-4 bg-[#111] text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95 flex items-center gap-3"
                            >
                                Explore Paths <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            );
        }

        if (activeTab === 'Paths') {
            return (
                <div className="w-full min-h-screen bg-white pt-24 sm:pt-28">
                    <CareerNetwork 
                        paths={generatedPaths.length > 0 ? generatedPaths : DEFAULT_PATHS} 
                        onPathClick={handleLearnMore}
                        isGenerating={isGeneratingPaths}
                        formData={formData}
                    />

                    <RoadmapSection 
                        roadmapData={roadmapData} 
                        selectedPath={selectedPath} 
                        isGeneratingRoadmap={isGeneratingRoadmap} 
                        handlePathClick={handlePathClick} 
                        onDetails={setSelectedDetailMonth} 
                        navigate={navigate} 
                    />
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center font-sans antialiased text-[#111] overflow-x-hidden">
            {step >= 3 && renderHeaderTabs()}
            <main className={`w-full ${activeTab === 'Paths' ? 'block' : 'min-h-screen flex items-center justify-center p-4'}`}>
                {isAnalyzing ? (
                    <div className="fixed inset-0 bg-[#F8F9FA] flex flex-col items-center justify-center z-[200]">
                        <div className="w-16 h-16 mb-8 relative">
                            <div className="absolute inset-0 border-[6px] border-blue-50 rounded-full" />
                            <div className="absolute inset-0 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <h2 className="text-3xl font-black text-[#111] uppercase tracking-tighter text-center px-6 leading-none">Synthesizing Profile</h2>
                        <div className="flex gap-4 mt-6 flex-wrap justify-center">
                            {["Core Vectors", "Path Synapses"].map((t, idx) => (
                                <motion.span key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.4 }} className="text-[9px] font-black text-gray-400 tracking-widest uppercase">{t}</motion.span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {renderContent()}
                    </AnimatePresence>
                )}
            </main>
            
            <AnimatePresence>
                {selectedDetailMonth && (
                    <RoadmapDetailModal 
                        month={selectedDetailMonth} 
                        onClose={() => setSelectedDetailMonth(null)} 
                    />
                )}
            </AnimatePresence>

            {/* Dynamic Full-Page Slide-Up Career Blueprint Panel styled exactly like Google Career Dreamer */}
            <AnimatePresence>
                {showDetailedPage && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 200 }}
                        className="fixed inset-0 z-[1500] bg-[#F8F9FA] overflow-y-auto flex flex-col items-center"
                    >
                        {/* Loading State Overlay */}
                        <AnimatePresence>
                            {isGeneratingDetails && (
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    exit={{ opacity: 0 }} 
                                    className="absolute inset-0 bg-[#F8F9FA]/90 backdrop-blur-md z-[1600] flex flex-col items-center justify-center gap-4"
                                >
                                    <div className="relative w-16 h-16">
                                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-[#1B66EC] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                    <span className="text-[#1B66EC] font-black uppercase text-[10px] tracking-widest italic animate-pulse">Syncing Pathway Blueprints...</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Top Header Bar */}
                        <div className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-100 bg-white/40 backdrop-blur-md sticky top-0 z-[1400]">
                            <button 
                                onClick={() => setShowDetailedPage(false)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs shadow-sm active:scale-95 cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4 text-slate-400" /> Back to Network
                            </button>
                            <button 
                                onClick={() => window.open("https://www.google.com/search?q=" + encodeURIComponent(`jobs near me ${selectedPath?.name}`), "_blank")}
                                className="px-5 py-2.5 bg-[#1B66EC] text-white font-bold rounded-xl text-xs shadow-md hover:bg-blue-700 transition-all active:scale-95 cursor-pointer"
                            >
                                Find jobs near you ↗
                            </button>
                        </div>

                        {/* Section 1: Imagine yourself as (Landing screen with arrow) */}
                        <div className="w-full max-w-4xl mx-auto text-center py-20 px-6 flex flex-col items-center min-h-[85vh] justify-center relative">
                            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.25em] mb-4">Imagine yourself as:</p>
                            
                            {/* Title styled with gorgeous blue/green gradient */}
                            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-8">
                                <span className="bg-gradient-to-r from-[#1B66EC] to-[#4AD66D] bg-clip-text text-transparent capitalize">
                                    {selectedPath?.name}
                                </span>
                            </h1>
                            
                            <p className="text-slate-600 text-base sm:text-lg max-w-3xl leading-relaxed font-semibold mb-5">
                                "{pathDetails?.description || "Synthesizing professional trajectory..."}"
                            </p>
                            
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider">Source: GROQ 2.0 AI Synthesis</span>
                            
                            {/* Badges */}
                            <div className="flex gap-4 justify-center mt-12 flex-wrap">
                                <div className="flex items-center gap-2 px-5 py-3 bg-white rounded-full border border-slate-100 shadow-sm text-xs font-bold text-slate-700">
                                    <span className="text-green-500">💰</span> Avg. Salary: {pathDetails?.avg_salary || "$118,000"}
                                </div>
                                <div className="flex items-center gap-2 px-5 py-3 bg-white rounded-full border border-slate-100 shadow-sm text-xs font-bold text-slate-700">
                                    <span className="text-blue-500">🎓</span> Typical Degree: {pathDetails?.typical_degree || "Bachelor's degree"}
                                </div>
                            </div>
                            
                            <p className="text-[9px] text-slate-400 max-w-md mx-auto mt-8 font-medium">
                                Salary information synthesized dynamically from live GROQ 2.0 data. This roadmap represents localized attributes and active competencies.
                            </p>
                            
                            {/* Scroll down button */}
                            <motion.button 
                                onClick={() => {
                                    document.getElementById("sweet-spots-section")?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className="mt-16 w-12 h-12 rounded-full bg-[#1B66EC] hover:bg-blue-700 flex items-center justify-center text-white shadow-lg active:scale-90 transition-all pointer-events-auto cursor-pointer"
                                animate={{ y: [0, 8, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <ChevronDown className="w-5 h-5" />
                            </motion.button>
                        </div>

                        {/* Section 2: Sweet spots */}
                        <div id="sweet-spots-section" className="w-full bg-white border-t border-slate-100 py-28 px-6 text-left">
                            <div className="w-full max-w-5xl mx-auto">
                                <div className="flex items-center justify-between mb-16 flex-wrap gap-4">
                                    <div>
                                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                                            💪 Sweet spots
                                        </h2>
                                        <p className="text-slate-500 text-sm font-medium mt-2">
                                            Consider how the role of a(n) <span className="text-slate-800 font-bold">{selectedPath?.name}</span> may overlap with where you are now.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            setIsGeneratingDetails(true);
                                            await handleLearnMore(selectedPath);
                                        }}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm cursor-pointer"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Re-generate
                                    </button>
                                </div>
                                
                                <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-12 items-start mt-8">
                                    {/* Left column: User selected skills */}
                                    <div className="flex flex-col gap-3">
                                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b pb-2 mb-2">Your Active Competencies (Click for insights)</span>
                                        {formData.skills.map((skill: string) => (
                                            <button 
                                                key={skill} 
                                                onClick={() => handleInsightClick('skill', skill)}
                                                className="px-5 py-3.5 bg-slate-50 hover:bg-white border border-slate-100 hover:border-[#7C3AED]/30 rounded-2xl text-left text-sm font-bold text-slate-700 tracking-tight shadow-sm hover:shadow-md active:scale-98 transition-all duration-300 cursor-pointer flex justify-between items-center group w-full"
                                            >
                                                <span>{skill}</span>
                                                <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            </button>
                                        ))}
                                    </div>
                                    
                                    {/* Right column: Customized green bordered card */}
                                    <div className="bg-emerald-50/20 border-2 border-emerald-500/30 rounded-[2.5rem] p-8 sm:p-10 shadow-[0_15px_40px_rgba(16,185,129,0.04)] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                                            <Sparkles className="w-32 h-32 text-emerald-500" />
                                        </div>
                                        <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-4">Strategic Competency Match</h3>
                                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-semibold">
                                            {pathDetails?.sweet_spot_explanation || "Analyzing profile alignment matrices..."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: A day in the life */}
                        <div className="w-full bg-slate-50/50 border-t border-slate-100 py-28 px-6 pb-20 text-left">
                            <div className="w-full max-w-4xl mx-auto">
                                <div className="flex items-center justify-between mb-16 flex-wrap gap-4">
                                    <div>
                                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                                            📋 A day in the life
                                        </h2>
                                        <p className="text-slate-500 text-sm font-medium mt-2">
                                            Here's what a day in the life of a(n) <span className="text-slate-800 font-bold">{selectedPath?.name}</span> might look like. (Click cards for info)
                                        </p>
                                    </div>
                                    <button 
                                        onClick={handleRegenerateDayInLife}
                                        disabled={isRegeneratingDay}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${isRegeneratingDay ? 'animate-spin' : ''}`} /> Re-generate
                                    </button>
                                </div>
                                
                                <div className="relative space-y-4 max-w-3xl mx-auto min-h-[120px]">
                                    {isRegeneratingDay && (
                                        <div className="absolute inset-0 bg-[#F8F9FA]/70 backdrop-blur-[1px] rounded-2xl z-20 flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                                            <span className="text-[10px] font-black text-emerald-700 tracking-widest uppercase italic animate-pulse">Varying Daily Routine...</span>
                                        </div>
                                    )}
                                    {(pathDetails?.day_in_the_life || []).map((task: string, idx: number) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                                            onClick={() => handleInsightClick('task', task)}
                                            className="p-6 bg-white border-2 border-emerald-500/20 rounded-2xl text-left flex items-start gap-4 hover:border-emerald-500/40 hover:shadow-lg active:scale-[0.99] transition-all duration-300 cursor-pointer group"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm shrink-0 border border-emerald-100 group-hover:bg-[#7C3AED] group-hover:text-white group-hover:border-transparent transition-all">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 flex justify-between items-start gap-4">
                                                <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-semibold mt-0.5 group-hover:text-slate-900 transition-colors">{task}</p>
                                                <Sparkles className="w-4 h-4 text-[#7C3AED] opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1 shrink-0" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Requirements for the Role */}
                        <div className="w-full bg-white border-t border-slate-100 py-20 px-6 text-left">
                            <div className="w-full max-w-5xl mx-auto">
                                <div className="mb-10">
                                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                                        ✅ What you'd need
                                    </h2>
                                    <p className="text-slate-500 text-sm font-medium mt-2">
                                        Core requirements to transition into or excel as a <span className="text-slate-800 font-bold">{selectedPath?.name}</span>.
                                    </p>
                                </div>
                                <div className="grid md:grid-cols-3 gap-6">
                                    {(pathDetails?.requirements || []).map((req: string, rIdx: number) => (
                                        <motion.div
                                            key={rIdx}
                                            initial={{ opacity: 0, y: 15 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: rIdx * 0.12 }}
                                            className="p-6 bg-slate-50 border border-slate-200/60 rounded-[1.75rem] flex flex-col gap-3 hover:shadow-md hover:border-blue-200/80 transition-all"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-[#1B66EC]/10 flex items-center justify-center shrink-0">
                                                <span className="text-[#1B66EC] font-black text-base">{rIdx + 1}</span>
                                            </div>
                                            <p className="text-slate-700 text-sm font-semibold leading-relaxed">{req}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section 5: Upskilling Resources Carousel */}
                        <div className="w-full bg-[#F8F9FA] border-t border-slate-100 py-20 px-6 pb-48 text-center">
                            <div className="w-full max-w-3xl mx-auto">
                                <div className="mb-10">
                                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center justify-center gap-2">
                                        🚀 Upskilling Resources
                                    </h2>
                                    <p className="text-slate-500 text-sm font-medium mt-3 max-w-xl mx-auto leading-relaxed">
                                        The below resources might help you develop some of the knowledge and skills you'd need as a(n){" "}
                                        <span className="font-bold" style={{ color: selectedPath?.color || "#1B66EC" }}>{selectedPath?.name}</span>.
                                    </p>
                                </div>

                                {isGeneratingCourses ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                                        <Loader2 className="w-8 h-8 text-[#1B66EC] animate-spin" />
                                        <p className="text-xs text-slate-400 font-bold tracking-wider uppercase animate-pulse">Retrieving elite learning pathways...</p>
                                    </div>
                                ) : recommendedCourses.length > 0 ? (
                                    <div className="relative">
                                        {/* Carousel Card */}
                                        <AnimatePresence mode="wait">
                                            {recommendedCourses[carouselIndex] && (
                                                <motion.div
                                                    key={carouselIndex}
                                                    initial={{ opacity: 0, x: 40 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -40 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className="bg-white rounded-[2.5rem] shadow-[0_12px_50px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden mx-auto max-w-lg"
                                                >
                                                    {/* Brand line */}
                                                    <div className="pt-7 pb-1 text-center">
                                                        {renderBrandLogo(recommendedCourses[carouselIndex].brand || recommendedCourses[carouselIndex].platform)}
                                                    </div>
                                                    {/* Title */}
                                                    <div className="px-8 pt-3 pb-1 text-center">
                                                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                                                            {recommendedCourses[carouselIndex].title}
                                                        </h3>
                                                    </div>
                                                    {/* Illustration Box */}
                                                    <div className="mx-6 mt-4 mb-2 rounded-2xl bg-slate-50/80 border border-slate-100 overflow-hidden" style={{ height: "180px" }}>
                                                        {renderIllustration(recommendedCourses[carouselIndex].icon_type || 'development')}
                                                    </div>
                                                    {/* Description */}
                                                    <div className="px-8 py-5 text-left space-y-3">
                                                        <p className="text-slate-600 text-sm leading-relaxed font-medium">
                                                            {recommendedCourses[carouselIndex].description}
                                                        </p>
                                                        {recommendedCourses[carouselIndex].requirements && (
                                                            <p className="text-slate-400 text-xs font-semibold">
                                                                {recommendedCourses[carouselIndex].requirements}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {/* Learn More Button */}
                                                    <div className="px-8 pb-8">
                                                        <button
                                                            onClick={() => {
                                                                const course = recommendedCourses[carouselIndex];
                                                                const url = course.url || `https://www.coursera.org/search?query=${encodeURIComponent(course.title)}`;
                                                                window.open(url, "_blank");
                                                            }}
                                                            className="w-full py-4 bg-[#1B66EC] hover:bg-blue-700 text-white rounded-full font-bold text-sm transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                                                        >
                                                            Learn more
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Previous / Next arrows */}
                                        {carouselIndex > 0 && (
                                            <button
                                                onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center hover:bg-slate-50 active:scale-90 transition-all cursor-pointer z-10"
                                            >
                                                <ChevronLeft className="w-5 h-5 text-slate-500" />
                                            </button>
                                        )}
                                        {carouselIndex < recommendedCourses.length - 1 && (
                                            <button
                                                onClick={() => setCarouselIndex(prev => Math.min(recommendedCourses.length - 1, prev + 1))}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center hover:bg-slate-50 active:scale-90 transition-all cursor-pointer z-10"
                                            >
                                                <ChevronRight className="w-5 h-5 text-slate-500" />
                                            </button>
                                        )}

                                        {/* Dot indicators */}
                                        <div className="flex items-center justify-center gap-2 mt-8">
                                            {recommendedCourses.map((_: any, dotIdx: number) => (
                                                <button
                                                    key={dotIdx}
                                                    onClick={() => setCarouselIndex(dotIdx)}
                                                    className={`rounded-full transition-all cursor-pointer ${
                                                        dotIdx === carouselIndex
                                                            ? "w-5 h-2.5 bg-[#1B66EC]"
                                                            : "w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Right-Side Detailed Insights Slide-Over Panel */}
                        <AnimatePresence>
                            {selectedInsightItem && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setSelectedInsightItem(null)}
                                    className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[1800] flex justify-end"
                                >
                                    <motion.div
                                        initial={{ x: "100%" }}
                                        animate={{ x: 0 }}
                                        exit={{ x: "100%" }}
                                        transition={{ type: "spring", damping: 35, stiffness: 300 }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full max-w-md h-full bg-[#7C3AED] text-white shadow-2xl p-8 flex flex-col justify-between overflow-y-auto relative z-[1900]"
                                        style={{ background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)" }}
                                    >
                                        <div>
                                            {/* Close Button */}
                                            <button 
                                                onClick={() => setSelectedInsightItem(null)}
                                                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer border border-white/5 active:scale-90"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>

                                            <div className="mt-12">
                                                <span className="px-3.5 py-1.5 bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 select-none">
                                                    {selectedInsightItem.type === 'skill' ? 'Skill Insight' : 'Daily Task Insight'}
                                                </span>
                                                <h2 className="text-2xl font-black tracking-tight mt-6 mb-4 capitalize leading-tight">
                                                    {selectedInsightItem.name}
                                                </h2>
                                                
                                                <div className="h-[2px] w-12 bg-white/40 my-6" />
                                            </div>

                                            {isGeneratingInsight ? (
                                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                                    <p className="text-[10px] text-white/70 font-black uppercase tracking-widest animate-pulse">Consulting Pathways Oracle...</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-8 mt-8">
                                                    <div>
                                                        <h4 className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Why it matters:</h4>
                                                        <p className="text-white text-sm sm:text-base leading-relaxed font-semibold">
                                                            {insightData?.importance}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-3">Tactical Mastery Roadmap:</h4>
                                                        <ul className="space-y-3">
                                                            {(insightData?.mastery_steps || []).map((step: string, sIdx: number) => (
                                                                <li key={sIdx} className="flex gap-3 text-sm font-semibold text-white/90">
                                                                    <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-[10px] font-black border border-white/10 shrink-0">{sIdx + 1}</span>
                                                                    <span className="leading-snug mt-0.5">{step}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="bg-white/10 border border-white/15 rounded-[1.5rem] p-5 shadow-inner mt-4">
                                                        <h4 className="text-[10px] font-black text-amber-300 uppercase tracking-widest mb-1">💡 Insider Pro Tip:</h4>
                                                        <p className="text-white/90 text-xs sm:text-sm font-semibold leading-relaxed">
                                                            {insightData?.pro_tip}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setSelectedInsightItem(null)}
                                            className="w-full mt-10 py-4 bg-white text-[#7C3AED] hover:bg-slate-50 active:scale-[0.98] transition-all font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl cursor-pointer"
                                        >
                                            Got it
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CareerOnboarding;
