import React, { useState, useEffect, useMemo } from 'react';
import { 
    Gavel, 
    Star, 
    MessageSquare, 
    Save, 
    Users, 
    ChevronRight,
    Clock,
    CheckCircle,
    AlertCircle,
    FileText,
    ExternalLink,
    Calendar,
    Award,
    Trophy,
    Zap,
    Target,
    ShieldCheck,
    LayoutDashboard,
    ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, authHeaders } from '../../../apiConfig';

interface TeamSubmission {
    id: string;
    teamId: string;
    teamName: string;
    projectTitle: string;
    description: string;
    submittedAt: string;
    status: 'pending' | 'in_review' | 'completed';
    submissionUrl?: string;
    demoUrl?: string;
    githubUrl?: string;
    members: Array<{
        name: string;
        email: string;
        role: string;
    }>;
}

interface EvaluationCriteria {
    id: string;
    name: string;
    description: string;
    maxScore: number;
    weight: number;
    icon?: React.ReactNode;
}

interface JudgeEvaluation {
    submissionId: string;
    scores: Record<string, number>;
    feedback: string;
    overallComments: string;
    submittedAt?: string;
}

interface JudgeEvaluationInterfaceProps {
    judgeId: string;
    eventId: string;
    criteria?: EvaluationCriteria[];
    onSave?: (evaluation: JudgeEvaluation) => Promise<void>;
    onBack?: () => void;
}

const JudgeEvaluationInterface: React.FC<JudgeEvaluationInterfaceProps> = ({
    judgeId,
    eventId,
    criteria: providedCriteria,
    onSave,
    onBack
}) => {
    const [eventCriteria, setEventCriteria] = useState<EvaluationCriteria[]>([]);
    
    // Fetch evaluation criteria from event
    useEffect(() => {
        const fetchCriteria = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/events/${eventId}/criteria`, {
                    headers: { ...authHeaders() }
                });
                if (res.ok) {
                    const data = await res.json();
                    const criteria: EvaluationCriteria[] = data.map((item: any) => ({
                        id: item._id,
                        name: item.name,
                        description: item.description || '',
                        maxScore: item.max_points || 10,
                        weight: item.weight || 1,
                        icon: <Award size={18} />
                    }));
                    setEventCriteria(criteria);
                }
            } catch (error) {
                console.error('Failed to fetch criteria:', error);
            }
        };
        
        if (eventId && !providedCriteria) {
            fetchCriteria();
        }
    }, [eventId, providedCriteria]);

    // Default criteria if none provided
    const criteria = useMemo(() => providedCriteria || eventCriteria.length > 0 ? eventCriteria : [
        { id: 'innovation', name: 'Innovation', description: 'Originality and uniqueness of the solution', maxScore: 10, weight: 1, icon: <Zap size={18} /> },
        { id: 'technical', name: 'Technicality', description: 'Code quality and technical complexity', maxScore: 10, weight: 1, icon: <ShieldCheck size={18} /> },
        { id: 'impact', name: 'Impact', description: 'Potential real-world impact and viability', maxScore: 10, weight: 1, icon: <Target size={18} /> },
        { id: 'presentation', name: 'Presentation', description: 'Clarity of the pitch and UI/UX quality', maxScore: 10, weight: 1, icon: <Award size={18} /> },
    ], [providedCriteria, eventCriteria]);

    const [assignedSubmissions, setAssignedSubmissions] = useState<TeamSubmission[]>([]);
    const [activeSubmission, setActiveSubmission] = useState<TeamSubmission | null>(null);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedSubmissions, setSavedSubmissions] = useState<Set<string>>(new Set());

    useEffect(() => {
        // Fetch judge's assigned submissions from API
        const fetchAssignments = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE_URL}/api/v1/institution/judge/my-assignments`, {
                    headers: { ...authHeaders() }
                });
                if (res.ok) {
                    const data = await res.json();
                    // Transform API data to match TeamSubmission interface
                    const submissions: TeamSubmission[] = data.map((item: any) => ({
                        id: item._id,
                        teamId: item.team_id || item.id,
                        teamName: item.team_name || item.project_title,
                        projectTitle: item.project_title,
                        description: item.description || '',
                        submittedAt: item.submitted_at,
                        status: item.status === 'Under Review' ? 'in_review' : 
                                item.status === 'Evaluation Complete' ? 'completed' : 'pending',
                        submissionUrl: item.data?.file_url,
                        demoUrl: item.data?.url,
                        githubUrl: item.data?.github_url,
                        members: item.team_members || []
                    }));
                    setAssignedSubmissions(submissions);
                } else {
                    console.error('Failed to fetch assignments');
                }
            } catch (error) {
                console.error('Error fetching assignments:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAssignments();
    }, [judgeId, eventId]);

    const handleScoreChange = (id: string, val: number) => {
        setScores(prev => ({ ...prev, [id]: val }));
    };

    const totalScore = useMemo(() => {
        return Object.values(scores).reduce((a, b) => a + b, 0);
    }, [scores]);

    const maxPossible = useMemo(() => {
        return criteria.reduce((sum, c) => sum + c.maxScore, 0);
    }, [criteria]);

    const percentage = Math.round((totalScore / maxPossible) * 100) || 0;

    const handleSave = async () => {
        if (!activeSubmission) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/judges/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    submission_id: activeSubmission.id,
                    scores: scores,
                    feedback: feedback
                })
            });
            
            if (res.ok) {
                setSavedSubmissions(prev => new Set([...prev, activeSubmission.id]));
                setSaving(false);
                setActiveSubmission(null);
                setFeedback('');
                alert("Evaluation submitted successfully!");
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(errData.detail || 'Failed to submit evaluation');
                setSaving(false);
            }
        } catch (error) {
            console.error('Submit evaluation error:', error);
            alert('Network error. Please try again.');
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-950">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 flex overflow-hidden font-sans selection:bg-purple-500/30">
            {/* 1. Left Navigation Bar (Glassmorphism) */}
            <aside className="w-80 bg-white/5 border-r border-white/10 backdrop-blur-xl flex flex-col h-screen shrink-0 relative z-20">
                <div className="p-8 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
                            <Gavel size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-tighter text-white">Judge Console</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protocol Active</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Pending Assignments</p>
                    {assignedSubmissions.map((sub) => {
                        const isActive = activeSubmission?.id === sub.id;
                        const isEvaluated = savedSubmissions.has(sub.id);
                        return (
                            <motion.button
                                key={sub.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setActiveSubmission(sub);
                                    setScores({});
                                    setFeedback('');
                                }}
                                className={`w-full text-left p-5 rounded-3xl border transition-all relative overflow-hidden group ${
                                    isActive 
                                        ? 'bg-gradient-to-br from-purple-600/20 to-blue-500/10 border-purple-500/50 shadow-2xl shadow-purple-500/10' 
                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                }`}
                            >
                                {isActive && <motion.div layoutId="active-pill" className="absolute left-0 top-0 w-1 h-full bg-purple-500" />}
                                
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-sm text-white line-clamp-1">{sub.teamName}</h3>
                                    {isEvaluated && <CheckCircle size={14} className="text-emerald-400 shrink-0" />}
                                </div>
                                <p className="text-[11px] text-slate-400 line-clamp-1 mb-3">{sub.projectTitle}</p>
                                
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        {sub.members.map((_, i) => (
                                            <div key={i} className="w-5 h-5 rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-bold">
                                                {sub.members[i].name.charAt(0)}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                        {sub.members.length} Members
                                    </span>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                <div className="p-6 border-t border-white/5 bg-black/20">
                    <button onClick={onBack} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all border border-white/5">
                        <ArrowLeft size={14} /> Exit Portal
                    </button>
                </div>
            </aside>

            {/* 2. Main Evaluation Canvas */}
            <main className="flex-1 overflow-y-auto custom-scrollbar relative">
                <AnimatePresence mode="wait">
                    {activeSubmission ? (
                        <motion.div 
                            key={activeSubmission.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="p-12 space-y-10"
                        >
                            {/* Header Section */}
                            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-purple-400 text-xs font-black uppercase tracking-widest">
                                        <Trophy size={14} /> Global Hackathon 2024
                                    </div>
                                    <h1 className="text-4xl font-black text-white tracking-tight">{activeSubmission.projectTitle}</h1>
                                    <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">{activeSubmission.description}</p>
                                </div>

                                <div className="flex items-center gap-6 bg-white/5 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
                                    <div className="relative w-24 h-24 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                            <motion.circle 
                                                cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                                                strokeDasharray={251.2}
                                                strokeDashoffset={251.2 - (251.2 * percentage) / 100}
                                                className="text-purple-500"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-black text-white">{totalScore}</span>
                                            <span className="text-[10px] font-black text-slate-500">/{maxPossible}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Current Stance</p>
                                        <p className="text-sm font-bold text-white uppercase tracking-tighter">
                                            {percentage > 80 ? 'Exceptional' : percentage > 50 ? 'Strong Contender' : 'Average'}
                                        </p>
                                    </div>
                                </div>
                            </header>

                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                                {/* Left Column: Scoring */}
                                <div className="xl:col-span-7 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {criteria.map((c) => (
                                            <div key={c.id} className="p-6 bg-white/5 border border-white/5 rounded-3xl hover:border-purple-500/30 transition-all group">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                                            {c.icon || <Star size={16} />}
                                                        </div>
                                                        <span className="font-bold text-white">{c.name}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-500">{scores[c.id] || 0} / {c.maxScore}</span>
                                                </div>
                                                <input 
                                                    type="range" min="0" max={c.maxScore} step="1"
                                                    value={scores[c.id] || 0}
                                                    onChange={(e) => handleScoreChange(c.id, parseInt(e.target.value))}
                                                    className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-purple-500"
                                                />
                                                <div className="flex justify-between mt-3 px-1">
                                                    {[0, 2, 4, 6, 8, 10].map(v => (
                                                        <span key={v} className="text-[8px] font-bold text-slate-600">{v}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] space-y-4">
                                        <div className="flex items-center gap-3 text-slate-300 font-bold text-sm">
                                            <MessageSquare size={18} className="text-purple-400" />
                                            Professional Evaluation Feedback
                                        </div>
                                        <textarea 
                                            rows={6}
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Write detailed critique for the team..."
                                            className="w-full bg-white/5 border border-white/5 rounded-2xl p-6 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                                        />
                                        <p className="text-[10px] text-slate-500 italic">This feedback will be visible to the team after the results are declared.</p>
                                    </div>
                                </div>

                                {/* Right Column: Assets & Team */}
                                <div className="xl:col-span-5 space-y-8">
                                    <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
                                        <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-purple-500/10 blur-[80px]" />
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <Zap size={16} className="text-yellow-400" /> Project Assets
                                        </h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {[
                                                { icon: <FileText />, label: 'Project Deck (PDF)', url: activeSubmission.submissionUrl },
                                                { icon: <ExternalLink />, label: 'Live Demonstration', url: activeSubmission.demoUrl },
                                                { icon: <LayoutDashboard />, label: 'Source Code (Github)', url: activeSubmission.githubUrl },
                                            ].map((asset, i) => (
                                                <a key={i} href={asset.url} target="_blank" className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-purple-400 group-hover:scale-110 transition-transform">{asset.icon}</div>
                                                        <span className="text-xs font-bold text-slate-200">{asset.label}</span>
                                                    </div>
                                                    <ChevronRight size={14} className="text-slate-600" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem]">
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Founding Team</h3>
                                        <div className="space-y-4">
                                            {activeSubmission.members.map((m, i) => (
                                                <div key={i} className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-tr from-slate-800 to-slate-700 rounded-2xl flex items-center justify-center font-black text-slate-300 border border-white/5 shadow-inner">
                                                        {m.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{m.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.role}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full py-6 bg-white text-slate-950 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-white/10 disabled:opacity-50"
                                    >
                                        {saving ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity }}><Clock size={20} /></motion.div> : <Save size={20} />}
                                        Finalize Evaluation
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center space-y-6">
                                <motion.div 
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                    className="w-32 h-32 bg-white/5 border border-white/10 rounded-[3rem] flex items-center justify-center mx-auto text-slate-700 shadow-inner"
                                >
                                    <Gavel size={48} />
                                </motion.div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">Protocol Standby</h2>
                                    <p className="text-slate-500 text-sm font-medium mt-2">Select a submission from the terminal to begin assessment.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default JudgeEvaluationInterface;
