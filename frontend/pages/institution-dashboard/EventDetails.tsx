import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../apiConfig';
import { 
    ArrowLeft, 
    Save, 
    X, 
    Info, 
    Users, 
    Layers, 
    FileText, 
    Gavel, 
    BarChart3,
    Clock,
    MapPin,
    Trophy,
    Calendar,
    ChevronRight,
    Award,
    HelpCircle,
    Plus,
    ShieldCheck,
    Trash2,
    Settings2,
    Filter,
    Send,
    CheckCircle2,
    AlertCircle,
    Timer,
    ExternalLink,
    Search,
    Download,
    Mail,
    LayoutDashboard,
    Share2,
    FileCheck,
    PieChart,
    Settings,
    Edit3,
    Eye,
    Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LeaderboardPage from './LeaderboardPage';
import { useNavigate } from 'react-router-dom';
import StageBuilder from './components/StageBuilder';
import JudgeInviteModal from './components/JudgeInviteModal';
import QuizDesignerModal from './components/QuizDesignerModal';

interface EventDetailsProps {
    eventId: string | null;
    onBack: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ eventId, onBack }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [event, setEvent] = useState<any>(null);
    const [institution, setInstitution] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [stages, setStages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [criteria, setCriteria] = useState<any[]>([]);
    const [bundleData, setBundleData] = useState<any>(null);
    const [threshold, setThreshold] = useState(90);
    const [debouncedThreshold, setDebouncedThreshold] = useState(90);
    const [bundleTab, setBundleTab] = useState('approved');
    const [isJudgeModalOpen, setIsJudgeModalOpen] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [teams, setTeams] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
    const [editDescription, setEditDescription] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!eventId) return;
            try {
                const eventRes = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/details`);
                const eventData = await eventRes.json();
                setEvent(eventData);
                setStages(eventData.stages || []);

                if (eventData.institution_id) {
                    const instRes = await fetch(`${API_BASE_URL}/api/v1/institution/profile/${eventData.institution_id}`);
                    const instData = await instRes.json();
                    setInstitution(instData);

                    const partData = await partRes.json();
                    setParticipants(partData);
                }

                const quizRes = await fetch(`${API_BASE_URL}/api/institution/events/${eventId}/quizzes`);
                const quizData = await quizRes.json();
                setQuizzes(quizData || []);
                
                setCriteria(eventData.judging_criteria || [
                    { id: '1', name: 'Innovation', max_points: 25 },
                    { id: '2', name: 'UI/UX Design', max_points: 25 },
                    { id: '3', name: 'Technical Depth', max_points: 25 },
                    { id: '4', name: 'Completeness', max_points: 25 },
                ]);
            } catch (err) {
                console.error("Failed to load event data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [eventId]);

    const fetchBundle = async (val: number) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/qualified-bundle?threshold=${val}`);
            const data = await res.json();
            setBundleData(data);
        } catch (err) {
            console.error("Failed to fetch bundle");
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedThreshold(threshold);
        }, 500);
        return () => clearTimeout(timer);
    }, [threshold]);

    useEffect(() => {
        if(activeTab === 'participants' || activeTab === 'submissions') {
            fetchBundle(debouncedThreshold);
        }
        if(activeTab === 'teams') {
            fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/teams`)
                .then(res => res.json())
                .then(data => setTeams(Array.isArray(data) ? data : []))
                .catch(() => setTeams([]));
        }
        if(activeTab === 'submissions') {
            fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/submissions`)
                .then(res => res.json())
                .then(data => setSubmissions(Array.isArray(data) ? data : []))
                .catch(() => setSubmissions([]));
        }
    }, [eventId, activeTab, debouncedThreshold]);

    const handleSaveEvent = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/update`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...event, stages, judging_criteria: criteria })
            });
            if(res.ok) {
                setShowSaveSuccess(true);
                setTimeout(() => setShowSaveSuccess(false), 3000);
            }
        } catch (err) {
            console.error("Save failed");
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveJudge = async (judgeEmail: string) => {
        if (!window.confirm("Are you sure you want to revoke this judge's assignment? They will be notified immediately.")) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/judges/${judgeEmail}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                // Refresh local event state
                const eventRes = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/details`);
                const eventData = await eventRes.json();
                setEvent(eventData);
            }
        } catch (err) {
            console.error("Failed to remove judge");
        }
    };

    const handleInviteJudge = async (judgeData: any) => {
        setIsInviting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/judges`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(judgeData)
            });
            if(res.ok) {
                setIsJudgeModalOpen(false);
                const eventRes = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/details`);
                const eventData = await eventRes.json();
                setEvent(eventData);
            }
        } catch (err) {
            console.error("Failed to invite judge");
        } finally {
            setIsInviting(false);
        }
    };

    if (loading) return <div className="h-96 flex items-center justify-center"><div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div></div>;
    if (!event) return <div>Event not found</div>;

    const handleUpdateStatus = async (teamId: string, newStatus: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/submissions/${teamId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                const eventRes = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/details`);
                const eventData = await eventRes.json();
                setEvent(eventData);
            }
        } catch (err) {
            console.error("Status update failed");
        }
    };

    const handleCreateQuiz = async (quizData: any) => {
        try {
            setIsCreatingQuiz(true);
            const res = await fetch(`${API_BASE_URL}/api/institution/events/${eventId}/quizzes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quizData)
            });
            if (res.ok) {
                const updatedQuizRes = await fetch(`${API_BASE_URL}/api/institution/events/${eventId}/quizzes`);
                const updatedQuizzes = await updatedQuizRes.json();
                setQuizzes(updatedQuizzes);
                setIsQuizModalOpen(false);
            }
        } catch (err) {
            console.error("Failed to create quiz");
        } finally {
            setIsCreatingQuiz(false);
        }
    };

    const tabs = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'basic', label: 'Basic Info', icon: Info },
        { id: 'stages', label: 'Stages & Timeline', icon: Clock },
        { id: 'participants', label: 'Participants', icon: Users },
        { id: 'teams', label: 'Teams', icon: Layers },
        { id: 'submissions', label: 'Submissions', icon: FileText },
        { id: 'judges', label: 'Judges', icon: Gavel },
        { id: 'criteria', label: 'Scoring Rubrics', icon: ShieldCheck },
        { id: 'leaderboard', label: 'Leaderboard', icon: BarChart3 },
        { id: 'assessments', label: 'Assessments', icon: HelpCircle },
        { id: 'certificates', label: 'Certificates', icon: FileCheck },
        { id: 'prizes', label: 'Prizes & Rewards', icon: Trophy },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Registered Teams', val: teams?.length || 0, icon: Layers, color: 'text-[#6C3BFF]', bg: 'bg-purple-50', tab: 'teams' },
                                { label: 'Total Participants', val: participants?.length || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', tab: 'participants' },
                                { label: 'Submissions', val: submissions?.length || 0, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50', tab: 'submissions' },
                                { label: 'Judges Active', val: event.judges?.length || 0, icon: Gavel, color: 'text-amber-600', bg: 'bg-amber-50', tab: 'judges' }
                            ].map((m, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setActiveTab(m.tab)}
                                    className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
                                >
                                    <div className={`w-12 h-12 ${m.bg} ${m.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all shadow-inner`}>
                                        <m.icon size={24} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-3xl font-black text-slate-900">{m.val}</p>
                                        <ChevronRight size={18} className="text-slate-200 group-hover:text-[#6C3BFF] group-hover:translate-x-1 transition-all" />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Recent Activity Mock */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="p-10 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black mb-6">Recent Stage Progress</h3>
                                    <div className="space-y-8">
                                        {stages.map((s, i) => (
                                            <div key={i} className="flex items-center gap-6 group">
                                                <div className="relative">
                                                    <div className="w-2 h-14 bg-white/10 rounded-full relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 right-0 bg-[#6C3BFF] transition-all duration-1000" style={{ height: i === 0 ? '100%' : i === 1 ? '45%' : '0%' }}></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm tracking-tight">{s.name}</p>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{s.type}</p>
                                                </div>
                                                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all">
                                                    <ChevronRight size={16} className="text-slate-500" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#6C3BFF]/10 rounded-full blur-3xl"></div>
                            </div>
                            <div className="p-10 bg-white border border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center shadow-sm">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
                                    <PieChart size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Analytics Engine</h3>
                                <p className="text-slate-500 text-sm mt-3 max-w-xs leading-relaxed font-medium">Real-time demographic and performance reports are now available for download.</p>
                                <button className="mt-10 px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-[#6C3BFF] transition-all shadow-xl shadow-black/10">Generate Full Report</button>
                            </div>
                        </div>
                    </div>
                );
            case 'basic':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-12 bg-slate-50 border border-slate-100 rounded-[3.5rem] relative overflow-hidden shadow-inner">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight relative z-10">Event Identity</h3>
                            <Building2 size={160} className="absolute -right-8 -bottom-8 text-[#6C3BFF]/5 -rotate-12" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Event Title</label>
                                <input 
                                    value={event.title} 
                                    onChange={(e) => setEvent({...event, title: e.target.value})} 
                                    className="w-full px-8 py-5 bg-white border border-slate-100 rounded-[2rem] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-[#6C3BFF]/5 focus:border-[#6C3BFF] transition-all shadow-sm" 
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Organisation</label>
                                <input 
                                    value={event.organisation} 
                                    onChange={(e) => setEvent({...event, organisation: e.target.value})} 
                                    className="w-full px-8 py-5 bg-white border border-slate-100 rounded-[2rem] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-[#6C3BFF]/5 focus:border-[#6C3BFF] transition-all shadow-sm" 
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                                <button 
                                    onClick={() => setEditDescription(!editDescription)}
                                    className="text-[10px] font-black text-[#6C3BFF] uppercase tracking-widest hover:underline"
                                >
                                    {editDescription ? 'View Visual' : 'Edit HTML'}
                                </button>
                            </div>
                            
                            {editDescription ? (
                                <textarea 
                                    value={event.description} 
                                    onChange={(e) => setEvent({...event, description: e.target.value})} 
                                    rows={10}
                                    className="w-full px-8 py-6 bg-white border border-[#6C3BFF]/20 rounded-[2.5rem] font-medium text-slate-900 outline-none focus:ring-4 focus:ring-[#6C3BFF]/5 focus:border-[#6C3BFF] transition-all shadow-sm resize-none font-mono text-sm" 
                                    placeholder="Enter HTML description..."
                                />
                            ) : (
                                <div 
                                    onClick={() => setEditDescription(true)}
                                    className="w-full px-10 py-10 bg-white border border-slate-100 rounded-[3rem] text-slate-700 prose prose-slate max-w-none shadow-sm cursor-text hover:border-[#6C3BFF]/20 transition-all min-h-[200px]"
                                    dangerouslySetInnerHTML={{ __html: event.description || '<p class="text-slate-400 italic">No description provided. Click to add one.</p>' }}
                                />
                            )}
                        </div>
                    </div>
                );
            case 'assessments':
                return (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 p-12 rounded-[3.5rem] text-white relative overflow-hidden gap-10 shadow-2xl">
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black tracking-tight">Qualification Rounds</h3>
                                <p className="text-slate-400 max-w-md mt-3 text-lg opacity-80 font-medium">Orchestrate mandatory assessments to filter top-tier talent automatically.</p>
                            </div>
                            <HelpCircle size={180} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
                            <button 
                                onClick={() => setIsQuizModalOpen(true)}
                                className="relative z-10 px-10 py-5 bg-[#6C3BFF] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:scale-[1.05] transition-all shadow-2xl shadow-purple-900/40 flex items-center justify-center gap-3"
                            >
                                <Plus size={22} /> Design Assessment Round
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Dynamic Assessment Cards */}
                            {quizzes.map((quiz, i) => (
                                <div key={quiz._id || i} className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden border-b-4 border-b-[#6C3BFF]">
                                    <div className="w-16 h-16 bg-purple-50 text-[#6C3BFF] rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all shadow-inner">
                                        <FileText size={32} />
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-900 mb-2">{quiz.title}</h4>
                                    <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">Qualification phase with {quiz.questions?.length || 0} technical questions.</p>
                                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                        <span className="px-4 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">{quiz.duration || 0} Minutes</span>
                                        <span className="text-[10px] font-black text-[#6C3BFF] uppercase tracking-widest flex items-center gap-2">EDIT FLOW <ChevronRight size={14} /></span>
                                    </div>
                                </div>
                            ))}

                            <div 
                                onClick={() => setIsQuizModalOpen(true)}
                                className="p-10 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center group hover:border-slate-200 transition-all cursor-pointer"
                            >
                                <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center mb-6 group-hover:rotate-90 transition-all duration-500">
                                    <Plus size={40} />
                                </div>
                                <p className="font-black text-xs uppercase tracking-widest text-slate-300">Initialize New Round</p>
                            </div>
                        </div>

                        <div className="p-10 bg-blue-50/40 rounded-[3rem] border border-blue-100 flex items-center gap-10">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-blue-100 flex items-center justify-center text-blue-500">
                                <Timer size={28} />
                            </div>
                            <div className="flex-1">
                                <h5 className="font-black text-slate-900 text-lg">Automated Proctoring</h5>
                                <p className="text-sm text-slate-500 font-medium mt-1">Enable AI-based monitoring and tab-switch detection for all assessments.</p>
                            </div>
                            <div className="w-14 h-8 bg-blue-500 rounded-full relative shadow-inner cursor-pointer">
                                <div className="absolute right-1 top-1 w-6 h-6 bg-white rounded-full shadow-md"></div>
                            </div>
                        </div>
                    </div>
                );
            case 'certificates':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-12 bg-gradient-to-br from-[#6C3BFF] to-[#8B5CF6] rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                <div className="max-w-xl">
                                    <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-6 w-fit border border-white/10">Credentialing Protocol</div>
                                    <h3 className="text-5xl font-black tracking-tighter leading-tight">Digital Verification<br />& Rewards</h3>
                                    <p className="text-purple-100 mt-6 text-lg opacity-90 leading-relaxed">
                                        Issue blockchain-verifiable certificates to winners and participants automatically 
                                        upon event finalization. Total security, zero fraud.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <button className="px-10 py-5 bg-white text-[#6C3BFF] rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-black/20 hover:scale-[1.05] transition-all flex items-center justify-center gap-3">
                                        <Award size={20} /> Configure Templates
                                    </button>
                                    <button className="px-10 py-5 bg-white/10 border border-white/20 backdrop-blur-md text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-3">
                                        <Share2 size={20} /> Bulk Release Protocol
                                    </button>
                                </div>
                            </div>
                            <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                            <div className="absolute left-1/4 bottom-0 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {[
                                { rank: 'Excellence Distinction', category: 'Winners (Top 3)', color: 'text-amber-500', bg: 'bg-amber-50', icon: Trophy, count: 3 },
                                { rank: 'Merit Achievement', category: 'Qualified Finalists', color: 'text-[#6C3BFF]', bg: 'bg-purple-50', icon: Award, count: 12 },
                                { rank: 'Participation Proof', category: 'All Authenticated Users', color: 'text-blue-500', bg: 'bg-blue-50', icon: Users, count: participants.length }
                            ].map((c, i) => (
                                <div key={i} className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                                    <div className={`w-16 h-16 ${c.bg} ${c.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all shadow-inner`}>
                                        <c.icon size={32} />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 mb-1">{c.rank}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{c.category}</p>
                                    
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="flex -space-x-3">
                                            {[1,2,3].map(j => <div key={j} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white"></div>)}
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">+{c.count} Recipients</span>
                                    </div>

                                    <button className="w-full py-4 bg-slate-50 text-slate-400 group-hover:text-white group-hover:bg-[#6C3BFF] rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Setup Issuance Rules</button>
                                </div>
                            ))}
                        </div>

                        <div className="p-12 bg-slate-50 border border-slate-100 rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-10 shadow-inner">
                            <div className="flex items-center gap-8">
                                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center text-emerald-500">
                                    <FileCheck size={40} />
                                </div>
                                <div>
                                    <h5 className="text-2xl font-black text-slate-900 tracking-tight">One-Click Finalization</h5>
                                    <p className="text-slate-500 text-sm font-medium mt-1">Locks all scores, generates the final leaderboard, and triggers certificate emails.</p>
                                </div>
                            </div>
                            <button className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-black/10 flex items-center gap-3">
                                <Zap size={18} /> Finalize & Dispatch
                            </button>
                        </div>
                    </div>
                );
            case 'stages':
                return <StageBuilder stages={stages} onUpdate={setStages} />;
            case 'teams':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Team Management</h3>
                                <p className="text-slate-500 text-sm font-medium mt-1">Direct control over participant grouping and identities.</p>
                            </div>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#6C3BFF] transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search team or lead..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#6C3BFF]/5 focus:border-[#6C3BFF] transition-all w-80 font-medium"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(Array.isArray(teams) ? teams : []).filter(t => t.team_name?.toLowerCase().includes(searchQuery.toLowerCase())).map((team, i) => (
                                <div key={i} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 bg-purple-50 text-[#6C3BFF] rounded-2xl flex items-center justify-center font-black text-lg group-hover:bg-[#6C3BFF] group-hover:text-white transition-all shadow-inner">
                                            {team.team_name?.charAt(0)}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                {team.members?.length || 0} Members
                                            </span>
                                            <span className="text-[9px] font-black text-[#6C3BFF] uppercase tracking-widest">Verified</span>
                                        </div>
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 mb-6 tracking-tight">{team.team_name}</h4>
                                    <div className="space-y-4 mb-8">
                                        {(team.members || []).map((m: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between group/mem">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#6C3BFF]"></div>
                                                    <span className="text-sm text-slate-600 font-bold">{m.name}</span>
                                                </div>
                                                {m.is_leader && <span className="text-[8px] font-black text-[#6C3BFF] bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Leader</span>}
                                            </div>
                                        ))}
                                    </div>
                                    <button className="w-full py-4 bg-slate-50 text-slate-500 hover:text-white hover:bg-[#6C3BFF] rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm">Inspect Full Dossier</button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'submissions':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-12 bg-slate-900 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="px-4 py-1 bg-[#6C3BFF] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-purple-900/20">Review Interface</div>
                                        <h3 className="text-4xl font-black tracking-tight">Portfolio Analysis</h3>
                                    </div>
                                    <p className="text-slate-400 max-w-md text-lg opacity-80 leading-relaxed">Centralized repository for all artifacts and evaluation metrics.</p>
                                </div>
                                <div className="flex gap-6">
                                    <div className="text-center px-8 py-5 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
                                        <div className="text-3xl font-black text-[#6C3BFF]">{submissions?.length || 0}</div>
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Artifacts</div>
                                    </div>
                                    <div className="text-center px-8 py-5 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
                                        <div className="text-3xl font-black text-emerald-500">{(Array.isArray(submissions) ? submissions : []).filter(s => s.status === 'Scored').length || 0}</div>
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Validated</div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -left-20 -top-20 w-96 h-96 bg-[#6C3BFF]/5 rounded-full blur-3xl"></div>
                        </div>

                        <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/40">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Team Identity</th>
                                        <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Score Aggregate</th>
                                        <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol State</th>
                                        <th className="px-12 py-8 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(Array.isArray(submissions) ? submissions : []).map((sub, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-all duration-300">
                                            <td className="px-12 py-10">
                                                <div className="font-black text-slate-900 text-lg tracking-tight">{sub.team_name}</div>
                                                <div className="text-xs text-slate-400 font-bold mt-1.5 flex items-center gap-2"><Layers size={12} /> {sub.project_title || 'N/A Portfolio'}</div>
                                            </td>
                                            <td className="px-12 py-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${sub.total_score || 0}%` }} className="h-full bg-[#6C3BFF] shadow-lg shadow-purple-200" />
                                                    </div>
                                                    <span className="font-black text-slate-900 text-sm">{sub.total_score || 0}%</span>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 text-center">
                                                <span className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-sm ${sub.status === 'Scored' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                    {sub.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-12 py-10 text-right">
                                                <button className="p-4 bg-slate-50 text-slate-400 hover:text-[#6C3BFF] hover:bg-purple-50 rounded-2xl transition-all shadow-sm">
                                                    <Eye size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'prizes':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {[
                            { rank: '1st Division', val: event.prize_pool ? `₹${event.prize_pool * 0.6}` : 'Excellence Trophy', icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                            { rank: '2nd Division', val: event.prize_pool ? `₹${event.prize_pool * 0.3}` : 'Distinction Award', icon: Award, color: 'text-slate-500', bg: 'bg-slate-50' },
                            { rank: 'Merit List', val: 'Digital Verifications', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' }
                        ].map((p, i) => (
                            <div key={i} className="p-10 bg-white border border-slate-100 rounded-[3rem] text-center shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all">
                                <div className={`w-20 h-20 ${p.bg} ${p.color} rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner`}>
                                    <p.icon size={40} />
                                </div>
                                <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-2">{p.rank}</h4>
                                <p className="text-3xl font-black text-[#6C3BFF] tracking-tight">{p.val}</p>
                            </div>
                        ))}
                    </div>
                );
            case 'participants':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-12 bg-slate-900 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="px-4 py-1 bg-[#6C3BFF] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-purple-900/30">Selection Intelligence</div>
                                    <h1 className="text-4xl font-black tracking-tight">Selection Command Center</h1>
                                </div>
                                <p className="text-slate-400 max-w-xl text-lg leading-relaxed opacity-80 font-medium">
                                    Dynamically aggregate and approve candidate bundles using algorithmic scoring thresholds. 
                                    Authorized for high-stakes talent filtering.
                                </p>
                            </div>

                            <div className="mt-12 p-10 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-12">
                                <div className="flex-1 w-full space-y-6">
                                    <div className="flex justify-between items-center px-2">
                                        <div className="flex items-center gap-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Score Threshold</label>
                                            {threshold !== debouncedThreshold && (
                                                <span className="text-[10px] font-black text-[#6C3BFF] animate-pulse">RECALCULATING BUNDLES...</span>
                                            )}
                                        </div>
                                        <span className="text-3xl font-black text-[#6C3BFF] bg-white px-5 py-2 rounded-2xl shadow-xl">{threshold}%</span>
                                    </div>
                                    <div className="relative pt-2">
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="100" 
                                            value={threshold} 
                                            onChange={(e) => setThreshold(parseInt(e.target.value))}
                                            className="w-full h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#6C3BFF] hover:accent-[#8B5CF6] transition-all" 
                                        />
                                        <div className="flex justify-between mt-4 px-1">
                                            <span className="text-[10px] font-black text-slate-500">BASELINE</span>
                                            <span className="text-[10px] font-black text-slate-500">EXCELLENCE</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => {/* Bulk Action Logic */}}
                                    className="px-12 py-6 bg-[#6C3BFF] text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest hover:scale-[1.05] hover:shadow-[0_20px_40px_rgba(108,59,255,0.4)] active:scale-95 transition-all flex items-center gap-4 shadow-2xl shadow-purple-900/40"
                                >
                                    <Send size={20} className="group-hover:translate-x-1 transition-transform" /> 
                                    Dispatch Approval Protocol
                                </button>
                            </div>
                            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
                        </div>

                        <div className="flex gap-6 p-2 bg-slate-100 rounded-[2.5rem] w-fit shadow-inner">
                            {['approved', 'pending', 'rejected'].map((tab) => (
                                <button 
                                    key={tab} 
                                    onClick={() => setBundleTab(tab)} 
                                    className={`px-12 py-4 rounded-[1.8rem] font-black text-xs uppercase tracking-widest transition-all ${bundleTab === tab ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {tab} ({bundleData?.[tab]?.length || 0})
                                </button>
                            ))}
                        </div>

                        <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Candidate Identity</th>
                                        <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Score Aggregate</th>
                                        <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Judges Verified</th>
                                        <th className="px-12 py-8 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Authorization</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(bundleData?.[bundleTab] || []).length > 0 ? (
                                        bundleData[bundleTab].map((item: any) => (
                                            <tr key={item.team_id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-12 py-10">
                                                    <div className="font-black text-slate-900 text-lg tracking-tight">{item.team_name}</div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {item.team_id.slice(-8)}</div>
                                                </td>
                                                <td className="px-12 py-10 text-center">
                                                    <div className="inline-flex items-center gap-3">
                                                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-[#6C3BFF]" style={{ width: `${item.score}%` }}></div>
                                                        </div>
                                                        <span className="font-black text-slate-900 text-sm">{item.score}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-12 py-10 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <CheckCircle2 size={14} className={item.is_fully_evaluated ? "text-emerald-500" : "text-slate-300"} />
                                                        <span className="font-bold text-slate-600 text-sm">{item.judges_completed} / {event.judges?.length || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-12 py-10 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button 
                                                            onClick={() => handleUpdateStatus(item.team_id, 'Shortlisted')}
                                                            className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${item.status === 'Shortlisted' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-500 hover:text-white'}`}
                                                        >
                                                            {item.status === 'Shortlisted' ? 'Shortlisted' : 'Shortlist'}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(item.team_id, 'Rejected')}
                                                            className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${item.status === 'Rejected' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white'}`}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-12 py-32 text-center">
                                                <div className="flex flex-col items-center opacity-30">
                                                    <Filter size={48} className="mb-4" />
                                                    <p className="font-black text-xs uppercase tracking-widest">No candidates in this bundle protocol</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'judges':
                return (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-slate-900 p-12 rounded-[3.5rem] text-white relative overflow-hidden gap-10 shadow-2xl">
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black tracking-tight">Evaluator Panel</h3>
                                <p className="text-slate-400 max-w-md mt-3 text-lg opacity-80">Orchestrate expert reviews via professional invitations.</p>
                            </div>
                            <Gavel size={180} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
                            <button onClick={() => setIsJudgeModalOpen(true)} className="relative z-10 px-10 py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-[#6C3BFF] hover:text-white transition-all shadow-2xl shadow-black/40 flex items-center justify-center gap-3">
                                <Plus size={22} /> External Appointment
                            </button>
                        </div>

                        {institution?.team && (
                            <div className="p-10 bg-purple-50/40 rounded-[3rem] border border-purple-100 shadow-inner">
                                <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-8 flex items-center gap-3"><Users size={16} /> Rapid Faculty Assignment</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {institution.team.map((member: any, i: number) => {
                                        const isAlreadyJudge = event.judges?.some((j: any) => j.email === member.email);
                                        return (
                                            <button 
                                                key={i} 
                                                disabled={isAlreadyJudge}
                                                onClick={() => handleInviteJudge({ name: member.name, email: member.email, expertise: member.role })}
                                                className={`p-6 bg-white border-2 rounded-[2rem] text-center transition-all ${isAlreadyJudge ? 'opacity-40 grayscale' : 'hover:border-[#6C3BFF] hover:shadow-xl hover:-translate-y-1 border-slate-50 shadow-sm'}`}
                                            >
                                                <div className="font-black text-sm text-slate-900 truncate">{member.name}</div>
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{member.role}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {event.judges?.map((judge: any, idx: number) => (
                                <div key={idx} className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm group hover:shadow-2xl transition-all relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="w-20 h-20 bg-slate-50 text-[#6C3BFF] rounded-[1.5rem] flex items-center justify-center font-black text-2xl group-hover:bg-[#6C3BFF] group-hover:text-white transition-all shadow-inner">{judge.name.charAt(0)}</div>
                                        <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${judge.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>{judge.status || 'PENDING'}</span>
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{judge.name}</h4>
                                    <p className="text-sm text-slate-500 font-bold mb-8">{judge.email}</p>
                                    <div className="flex flex-wrap gap-3 pt-8 border-t border-slate-50">
                                        <button 
                                            onClick={() => handleRemoveJudge(judge.email)}
                                            className="flex-1 py-4 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all"
                                        >
                                            Revoke Assignment
                                        </button>
                                        <button className="p-4 bg-slate-50 text-slate-400 hover:text-[#6C3BFF] hover:bg-purple-50 rounded-xl transition-all"><Mail size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'criteria':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-12 bg-slate-50 border border-slate-100 rounded-[3.5rem] relative overflow-hidden shadow-inner">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight relative z-10">Evaluation Matrix</h3>
                            <ShieldCheck size={160} className="absolute -right-8 -bottom-8 text-[#6C3BFF]/5 -rotate-12" />
                        </div>
                        <div className="space-y-6">
                            {(event.judging_criteria || []).map((criterion: any, idx: number) => (
                                <div key={idx} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex items-center gap-10 group hover:border-[#6C3BFF] transition-all">
                                    <div className="w-16 h-16 bg-purple-50 text-[#6C3BFF] rounded-[1.2rem] flex items-center justify-center font-black text-xl shadow-inner group-hover:bg-[#6C3BFF] group-hover:text-white transition-all">{idx + 1}</div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dimension</label>
                                            <input value={criterion.name} onChange={(e) => {
                                                const newCriteria = [...criteria];
                                                newCriteria[idx].name = e.target.value;
                                                setCriteria(newCriteria);
                                            }} className="w-full px-6 py-4 bg-slate-50 border border-slate-50 rounded-2xl font-black text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#6C3BFF]/5 transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Max Load (%)</label>
                                            <input type="number" value={criterion.max_points} onChange={(e) => {
                                                const newCriteria = [...criteria];
                                                newCriteria[idx].max_points = parseInt(e.target.value);
                                                setCriteria(newCriteria);
                                            }} className="w-full px-6 py-4 bg-slate-50 border border-slate-50 rounded-2xl font-black text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-[#6C3BFF]/5 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'leaderboard':
                return <LeaderboardPage />;
            default:
                return <div className="py-32 text-center text-slate-300 font-black text-xs uppercase tracking-[0.3em] opacity-40">Section Initializing...</div>;
        }
    };

    return (
        <div className="space-y-10 max-w-7xl mx-auto animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="p-4 bg-white border border-slate-100 rounded-3xl text-slate-400 hover:text-[#6C3BFF] hover:shadow-xl transition-all active:scale-95"><ArrowLeft size={28} /></button>
                    <div>
                         <div className="flex items-center gap-3 mb-1">
                             <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{event.title}</h1>
                             <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Live Portal</div>
                         </div>
                         <p className="text-slate-500 text-sm font-bold flex items-center gap-6"><span className="flex items-center gap-2 text-[#6C3BFF]"><MapPin size={16} /> Hybrid Environment</span><span className="flex items-center gap-2"><Users size={16} /> {event.participant_count || 0} Authenticated Participants</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handleSaveEvent} disabled={saving} className={`px-10 py-5 ${showSaveSuccess ? 'bg-emerald-500' : 'bg-slate-900'} text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest hover:scale-[1.05] active:scale-95 transition-all shadow-2xl shadow-black/10 flex items-center gap-3`}>
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : showSaveSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                        {saving ? 'Syncing...' : showSaveSuccess ? 'Vaulted' : 'Sync Changes'}
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100/40 p-2 rounded-[2.5rem] overflow-x-auto no-scrollbar shadow-inner backdrop-blur-md">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-8 py-4 rounded-[1.8rem] font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white text-[#6C3BFF] shadow-2xl shadow-purple-200' : 'text-slate-400 hover:text-slate-600'}`}>
                        <tab.icon size={20} className={activeTab === tab.id ? 'text-[#6C3BFF]' : 'text-slate-300'} /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white/40 backdrop-blur-xl border border-white/20 p-2.5 rounded-[4rem] shadow-2xl shadow-slate-200/50">
                <div className="bg-white p-12 rounded-[3.5rem] shadow-inner min-h-[600px] border border-slate-50">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderTabContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <QuizDesignerModal 
                isOpen={isQuizModalOpen} 
                onClose={() => setIsQuizModalOpen(false)} 
                onSave={handleCreateQuiz}
                loading={isCreatingQuiz}
            />
            <JudgeInviteModal isOpen={isJudgeModalOpen} onClose={() => setIsJudgeModalOpen(false)} onInvite={handleInviteJudge} loading={isInviting} />
        </div>
    );
};

export default EventDetails;
