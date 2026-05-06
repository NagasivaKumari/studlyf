
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
    const [submissions, setSubmissions] = useState<any>({ shortlisted: [], approved: [], pending: [], rejected: [], summary: {}, all: [] });
    const [stageSubmissions, setStageSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('shortlisted');
    const [submissionSubTab, setSubmissionSubTab] = useState<'projects' | 'assets'>('projects');
    const [availableJudges, setAvailableJudges] = useState<any[]>([]);
    const [judgeAssignmentModal, setJudgeAssignmentModal] = useState<{isOpen: boolean, submissionId: string | null}>({ isOpen: false, submissionId: null });
    const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [refreshCounter, setRefreshCounter] = useState(0);

    const fetchAll = async () => {
        if (!institutionId) return;
        try {
            setLoading(true);
            const bundleRes = await fetch(
                `${API_BASE_URL}/api/v1/institution/submissions/${encodeURIComponent(institutionId)}`,
                { headers: { ...authHeaders() } }
            );
            const bundleData = await bundleRes.json();
            setSubmissions(bundleData);

            const assetRes = await fetch(
                `${API_BASE_URL}/api/v1/institution/submissions/all-deliverables?institution_id=${institutionId}`,
                { headers: { ...authHeaders() } }
            );
            if (assetRes.ok) {
                const assetData = await assetRes.json();
                setStageSubmissions(Array.isArray(assetData) ? assetData : []);
            }
        } catch (error) {
            console.error('Error fetching submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [institutionId, refreshCounter]);

    const handleOpenJudgeAssignment = async (submissionId: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/judges`, { headers: { ...authHeaders() } });
            if (res.ok) {
                const judges = await res.json();
                setAvailableJudges(judges);
                setJudgeAssignmentModal({ isOpen: true, submissionId });
            } else {
                alert('Failed to load available judges');
            }
        } catch (error) {
            console.error('Failed to fetch judges:', error);
            alert('Failed to load available judges');
        }
    };

    const handleAssignJudge = async (judgeId: string) => {
        const isBulk = selectedSubmissions.length > 0 && judgeAssignmentModal.submissionId === 'bulk';
        try {
            const body: any = { judge_id: judgeId };
            if (isBulk) body.submission_ids = selectedSubmissions;
            else body.submission_id = judgeAssignmentModal.submissionId;

            const res = await fetch(`${API_BASE_URL}/api/judges/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const result = await res.json();
                let msg = isBulk ? `Successfully assigned judge to ${selectedSubmissions.length} projects!` : 'Judge assigned successfully!';
                if (result.email_sent === false) {
                    msg += "\n\n⚠️ NOTE: Invitation email could not be sent. Please share the evaluation link manually.";
                }
                alert(msg);
                setJudgeAssignmentModal({ isOpen: false, submissionId: null });
                setSelectedSubmissions([]);
                setRefreshCounter(prev => prev + 1);
            } else {
                const error = await res.json();
                alert(error.detail || 'Failed to assign judge');
            }
        } catch (error) {
            console.error('Error assigning judge:', error);
            alert('Network error while assigning judge');
        }
    };

    const handleUpdateStatus = async (submissionId: string, status: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/submissions/${submissionId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setRefreshCounter(prev => prev + 1);
                setSelectedSubmission(null);
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Link copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy link: ', err);
        });
    };

    const getStatusColor = (status: string) => {
        const s = (status || '').toLowerCase();
        if (s === 'approved' || s === 'accepted') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (s === 'shortlisted') return 'bg-blue-50 text-blue-600 border-blue-100';
        if (s === 'rejected') return 'bg-rose-50 text-rose-600 border-rose-100';
        return 'bg-slate-50 text-slate-500 border-slate-100';
    };

    const currentBundle = (submissions[activeTab] || []) as any[];
    
    const filteredSubmissions = currentBundle.filter(s => {
        const matchesSearch = (s.project_title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (s.team_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (s.event_title || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
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
                                {submissions?.summary?.total || 0} Active Protocols
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
                                    { label: 'Shortlisted', val: submissions?.summary?.shortlisted || 0, color: 'bg-blue-500' },
                                    { label: 'Authorized', val: submissions?.summary?.approved || 0, color: 'bg-emerald-500' }
                                ].map((m, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-400">{m.label}</span>
                                            <span className="text-white">{m.val}</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div className={`h-full ${m.color}`} style={{ width: `${(m.val / (submissions?.summary?.total || 1)) * 100}%` }}></div>
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
                                    {tab} ({submissions?.summary?.[tab] || 0})
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
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Judge Status</th>
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
                                            <div className="flex flex-col gap-2">
                                                {item.total_judges > 0 ? (
                                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider w-fit ${
                                                        item.judges_completed >= item.total_judges 
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                        : 'bg-purple-50 text-purple-600 border-purple-100'
                                                    }`}>
                                                        <CheckCircle2 size={12} />
                                                        {item.judges_completed}/{item.total_judges} Judges Verified
                                                    </div>
                                                ) : null}
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenJudgeAssignment(item.submission_id || item.team_id);
                                                    }}
                                                    className="text-[10px] font-black text-[#6C3BFF] uppercase tracking-widest hover:underline flex items-center gap-2 transition-all w-fit"
                                                >
                                                    <Plus size={14} /> {item.total_judges > 0 ? 'Re-assign Judge' : 'Assign Judge'}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                                <Trophy size={14} className="text-[#6C3BFF]" />
                                                <span className="line-clamp-1">{item.event_title}</span>
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
                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUpdateStatus(item.submission_id || item.team_id, 'Approved');
                                                    }}
                                                    className="p-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                    title="Approve"
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUpdateStatus(item.submission_id || item.team_id, 'Rejected');
                                                    }}
                                                    className="p-3 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                    title="Reject"
                                                >
                                                    <X size={18} />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedSubmission(item);
                                                    }}
                                                    className="p-3 text-slate-400 bg-white border border-slate-100 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm"
                                                >
                                                    <ArrowRight size={18} />
                                                </button>
                                            </div>
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
                                                    href={sub.data.file_url.startsWith('http') ? sub.data.file_url : `${API_BASE_URL}${sub.data.file_url}`}
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
                                        <button 
                                            onClick={() => handleUpdateStatus(selectedSubmission.submission_id || selectedSubmission.team_id, 'Approved')}
                                            className="px-8 py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
                                        >
                                            Approve Bundle
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateStatus(selectedSubmission.submission_id || selectedSubmission.team_id, 'Rejected')}
                                            className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all"
                                        >
                                            Reject Bundle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Judge Assignment Modal */}
            <AnimatePresence>
                {judgeAssignmentModal.isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100"
                        >
                            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Assign Evaluator</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select a verified expert to review this bundle</p>
                                </div>
                                <button onClick={() => setJudgeAssignmentModal({ isOpen: false, submissionId: null })} className="p-4 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="p-10 space-y-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
                                {availableJudges.length > 0 ? availableJudges.map((judge) => {
                                    // Robust evaluation link generation for manual sharing
                                    const currentSub = submissions.all?.find((s: any) => 
                                        (String(s.submission_id) === String(judgeAssignmentModal.submissionId) || 
                                         String(s.team_id) === String(judgeAssignmentModal.submissionId))
                                    );
                                    const existingAssignment = currentSub?.assigned_judges?.find((aj: any) => String(aj.judge_id) === String(judge._id));
                                    
                                    return (
                                        <div key={judge._id} className="p-6 bg-slate-50 border border-slate-50 rounded-[2rem] flex items-center justify-between group hover:bg-white hover:border-purple-100 transition-all shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">🎓</div>
                                                <div>
                                                    <p className="font-black text-slate-900">{judge.full_name || judge.name}</p>
                                                    <p className="text-xs font-bold text-slate-400">{judge.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {existingAssignment?.evaluation_url && (
                                                    <button 
                                                        onClick={() => copyToClipboard(existingAssignment.evaluation_url)}
                                                        className="p-3 bg-white text-slate-400 hover:text-[#6C3BFF] border border-slate-100 rounded-xl transition-all"
                                                        title="Copy Evaluation Link"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleAssignJudge(judge._id)}
                                                    className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#6C3BFF] transition-all"
                                                >
                                                    Assign
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="py-20 text-center space-y-4 opacity-40">
                                        <User size={48} className="mx-auto" />
                                        <p className="font-black text-[10px] uppercase tracking-widest">No verified evaluators found</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SubmissionList;
