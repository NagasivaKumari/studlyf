
import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Filter, 
    Eye, 
    CheckCircle2, 
    X, 
    ExternalLink, 
    Github, 
    Play, 
    FileText, 
    TrendingUp, 
    Loader2, 
    ArrowRight, 
    Calendar, 
    User, 
    Trophy, 
    LayoutDashboard, 
    Bell, 
    Download, 
    ShieldCheck, 
    BarChart3,
    Plus,
    Gavel
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, authHeaders } from '../../../apiConfig';

interface SubmissionListProps {
    institutionId?: string;
}

const SubmissionList: React.FC<SubmissionListProps> = ({ institutionId }) => {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [stageSubmissions, setStageSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('shortlisted');
    const [submissionSubTab, setSubmissionSubTab] = useState<'projects' | 'assets'>('projects');

    useEffect(() => {
        const fetchAll = async () => {
            if (!institutionId) {
                setSubmissions([]);
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                // 1. Fetch Global Bundles (Project Submissions)
                const bundleRes = await fetch(
                    `${API_BASE_URL}/api/v1/institution/submissions/${encodeURIComponent(institutionId)}`,
                    { headers: { ...authHeaders() } }
                );
                const bundleData = await bundleRes.json();
                setSubmissions(Array.isArray(bundleData) ? bundleData : []);

                // 2. Fetch Global Stage Deliverables
                try {
                    const assetRes = await fetch(
                        `${API_BASE_URL}/api/v1/institution/submissions/all-deliverables?institution_id=${institutionId}`,
                        { headers: { ...authHeaders() } }
                    );
                    if (assetRes.ok) {
                        const assetData = await assetRes.json();
                        setStageSubmissions(Array.isArray(assetData) ? assetData : []);
                    }
                } catch (e) {
                    console.warn("Global deliverable fetch failed", e);
                }

            } catch (error) {
                console.error('Error fetching submissions:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [institutionId]);

    const getStatusColor = (status: string) => {
        const s = (status || '').toLowerCase();
        if (s === 'approved' || s === 'accepted') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (s === 'shortlisted') return 'bg-blue-50 text-blue-600 border-blue-100';
        if (s === 'rejected') return 'bg-rose-50 text-rose-600 border-rose-100';
        return 'bg-slate-50 text-slate-500 border-slate-100';
    };

    const filteredSubmissions = submissions.filter(s => {
        const matchesSearch = (s.project_title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (s.team_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (s.event_title || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const sStatus = (s.status || 'pending').toLowerCase();
        const matchesTab = activeTab === 'All' || 
                          (activeTab === 'pending' && sStatus === 'pending') ||
                          (activeTab === 'shortlisted' && sStatus === 'shortlisted') ||
                          (activeTab === 'approved' && (sStatus === 'approved' || sStatus === 'accepted')) ||
                          (activeTab === 'rejected' && sStatus === 'rejected');
        
        return matchesSearch && matchesTab;
    });

    if (loading) return (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-100 border-t-[#6C3BFF] rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Intelligence...</p>
        </div>
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Unified Command Center Banner */}
            <div className="p-12 bg-slate-950 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="space-y-6 max-w-2xl text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="px-5 py-2 bg-[#6C3BFF] text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(108,59,255,0.4)]">
                                Global Command
                            </div>
                            <div className="px-5 py-2 bg-white/10 backdrop-blur-md text-slate-300 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                                {submissions.length} Active Protocols
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-5xl font-black tracking-tighter leading-tight">Submissions Command Center</h3>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed opacity-90">
                                Dynamically aggregate and approve candidate bundles across all institutional opportunities. View deliverables or dispatch final authorizations.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <button 
                                onClick={async () => {
                                    try {
                                        const res = await fetch(`${API_BASE_URL}/api/v1/institution/trigger-global-reminders?institution_id=${institutionId}`, {
                                            method: 'POST',
                                            headers: { ...authHeaders() }
                                        });
                                        if (res.ok) alert("Global deadline alerts broadcasted successfully.");
                                        else alert("Failed to broadcast alerts.");
                                    } catch (e) {
                                        console.error(e);
                                        alert("Error broadcasting alerts.");
                                    }
                                }}
                                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 group"
                            >
                                <Bell size={18} className="text-[#6C3BFF] group-hover:scale-110 transition-transform" /> 
                                Broadcast Deadline Alerts
                            </button>
                            <button className="px-8 py-4 bg-slate-900 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3">
                                <Download size={18} /> Export Protocol Data
                            </button>
                        </div>
                    </div>
                    <div className="relative hidden xl:block">
                        <div className="w-64 h-64 bg-[#6C3BFF]/20 rounded-full blur-[100px] absolute -top-10 -right-10"></div>
                        <div className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl relative z-10 space-y-6 min-w-[280px]">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Progress</span>
                                <TrendingUp size={16} className="text-[#6C3BFF]" />
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: 'Shortlisted', val: submissions.filter(s => (s.status||'').toLowerCase() === 'shortlisted').length, color: 'bg-blue-500' },
                                    { label: 'Authorized', val: submissions.filter(s => ['approved','accepted'].includes((s.status||'').toLowerCase())).length, color: 'bg-emerald-500' }
                                ].map((m, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-400">{m.label}</span>
                                            <span className="text-white">{m.val}</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div className={`h-full ${m.color}`} style={{ width: `${(m.val / (submissions.length || 1)) * 100}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <LayoutDashboard size={280} className="absolute -right-20 -bottom-20 text-white/[0.03] -rotate-12 pointer-events-none" />
            </div>

            {/* View Selection Toggle */}
            <div className="flex justify-center">
                <div className="flex bg-slate-100 p-2 rounded-[2rem] shadow-inner border border-slate-200/50">
                    <button 
                        onClick={() => setSubmissionSubTab('projects')}
                        className={`px-10 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${submissionSubTab === 'projects' ? 'bg-slate-900 text-white shadow-2xl shadow-black/20' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Candidate Selection Bundles
                    </button>
                    <button 
                        onClick={() => setSubmissionSubTab('assets')}
                        className={`px-10 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${submissionSubTab === 'assets' ? 'bg-slate-900 text-white shadow-2xl shadow-black/20' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Phase Deliverables (PPT/PDF)
                    </button>
                </div>
            </div>

            {submissionSubTab === 'projects' ? (
                <>
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex items-center gap-10 border-b border-slate-100 px-6 w-full lg:w-auto">
                            {['shortlisted', 'approved', 'pending', 'rejected'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`text-[10px] font-black uppercase tracking-[0.2em] pb-5 relative transition-all ${activeTab === tab ? 'text-[#6C3BFF]' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {tab} ({submissions.filter(s => {
                                        const st = (s.status||'').toLowerCase();
                                        if (tab === 'approved') return st === 'approved' || st === 'accepted';
                                        return st === tab;
                                    }).length})
                                    {activeTab === tab && (
                                        <motion.div layoutId="subTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#6C3BFF] rounded-full shadow-[0_2px_10px_rgba(108,59,255,0.4)]" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full lg:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#6C3BFF] transition-all" size={18} />
                            <input 
                                type="text" 
                                placeholder="Filter selection..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-purple-50 focus:border-[#6C3BFF] transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/20">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-10 py-6 w-10">
                                        <div className="w-5 h-5 rounded border-2 border-slate-200" />
                                    </th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Identity</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Opportunity</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Authorization</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Score Aggregate</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredSubmissions.length > 0 ? filteredSubmissions.map((item, idx) => (
                                    <motion.tr 
                                        key={item._id || idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="hover:bg-slate-50/30 transition-colors group cursor-pointer"
                                        onClick={() => setSelectedSubmission(item)}
                                    >
                                        <td className="px-10 py-8">
                                            <div className="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-[#6C3BFF] transition-all" />
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 text-lg tracking-tight group-hover:text-[#6C3BFF] transition-colors line-clamp-1">
                                                    {item.project_title || item.team_name}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                    {item.team_name} • Protocol Alpha
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                                <Trophy size={14} className="text-[#6C3BFF]" />
                                                {item.event_title}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(item.status)}`}>
                                                {item.status || 'Pending'}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <span className={`text-base font-black ${item.score >= 8.0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                    {item.score ? item.score.toFixed(1) : '0.0'}
                                                </span>
                                                <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-[#6C3BFF] shadow-[0_0_10px_rgba(108,59,255,0.4)] transition-all duration-1000" 
                                                        style={{ width: `${(item.score || 0) * 10}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all shadow-sm">
                                                <ArrowRight size={20} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-10 py-24 text-center">
                                            <div className="flex flex-col items-center opacity-20">
                                                <Filter size={64} className="mb-6" />
                                                <p className="font-black text-[11px] uppercase tracking-[0.3em]">No items found in {activeTab} protocol</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                /* Global Phase Deliverables View */
                <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/20">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity & Opportunity</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Details</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Submitted At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {stageSubmissions.length > 0 ? stageSubmissions.map((sub: any, idx: number) => (
                                <tr key={sub._id || idx} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-10 py-8">
                                        <div className="font-black text-slate-900 text-lg tracking-tight">
                                            {sub.team_name || sub.user_name || 'Anonymous Participant'}
                                        </div>
                                        <div className="text-[10px] font-bold text-[#6C3BFF] uppercase tracking-widest mt-1">
                                            {sub.event_title || 'General Event'}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            {sub.data?.file_url ? (
                                                <a 
                                                    href={`${API_BASE_URL}${sub.data.file_url}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                                                >
                                                    <Eye size={14} /> Preview Asset
                                                </a>
                                            ) : sub.data?.url ? (
                                                <a href={sub.data.url} target="_blank" rel="noreferrer" className="px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-[#6C3BFF] transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                    <ExternalLink size={14} /> View Submission
                                                </a>
                                            ) : (
                                                <span className="text-slate-300 italic text-xs font-bold">No assets found</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                                            (sub.status || '').toLowerCase() === 'submitted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                        }`}>
                                            {sub.status || 'Received'}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="text-xs font-bold text-slate-500">{new Date(sub.submitted_at).toLocaleString()}</div>
                                        <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Global Sync Active</div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-10 py-24 text-center">
                                        <div className="flex flex-col items-center opacity-20">
                                            <FileText size={64} className="mb-6" />
                                            <p className="font-black text-[11px] uppercase tracking-[0.3em]">No phase deliverables detected globally</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <AnimatePresence>
                {selectedSubmission && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setSelectedSubmission(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-4xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-12 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="px-4 py-1 bg-purple-50 text-[#6C3BFF] rounded-full text-[9px] font-black uppercase tracking-widest">Submission Bundle</div>
                                            <span className="text-slate-300">•</span>
                                            <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(selectedSubmission.status)}`}>{selectedSubmission.status}</div>
                                        </div>
                                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">{selectedSubmission.project_title || selectedSubmission.team_name}</h2>
                                        <p className="text-slate-500 font-bold text-lg">{selectedSubmission.team_name} • {selectedSubmission.event_title}</p>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedSubmission(null)}
                                        className="p-4 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Metrics</p>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm font-bold text-slate-600">Aggregate Score</span>
                                                <span className="text-2xl font-black text-slate-900">{selectedSubmission.score ? selectedSubmission.score.toFixed(1) : '0.0'}</span>
                                            </div>
                                            <div className="h-2 bg-white rounded-full overflow-hidden">
                                                <div className="h-full bg-[#6C3BFF]" style={{ width: `${(selectedSubmission.score || 0) * 10}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="col-span-2 p-8 bg-white border border-slate-100 rounded-[2.5rem] space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Narrative</p>
                                        <p className="text-slate-600 leading-relaxed font-medium line-clamp-4">{selectedSubmission.project_description || "No description provided for this deliverable."}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                                    <div className="flex gap-4">
                                        {selectedSubmission.github_url && (
                                            <a href={selectedSubmission.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl transition-all">
                                                <Github size={16} /> Repository
                                            </a>
                                        )}
                                        {selectedSubmission.demo_url && (
                                            <a href={selectedSubmission.demo_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-3 bg-[#6C3BFF] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl transition-all">
                                                <Play size={16} /> Live Demo
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="px-8 py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">
                                            Approve Bundle
                                        </button>
                                        <button className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">
                                            Reject Bundle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SubmissionList;
