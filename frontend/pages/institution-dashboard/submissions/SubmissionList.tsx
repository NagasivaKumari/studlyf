
import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, ExternalLink, Github, Play, FileText, MessageSquare, TrendingUp, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, authHeaders } from '../../../apiConfig';

interface SubmissionListProps {
    institutionId?: string;
}

const SubmissionList: React.FC<SubmissionListProps> = ({ institutionId }) => {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
    const [isAssigning, setIsAssigning] = useState<string | null>(null); // Submission ID being assigned
    const [assigningJudgeId, setAssigningJudgeId] = useState<string | null>(null); // Judge being assigned
    const [judges, setJudges] = useState<any[]>([]);
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('All');

    useEffect(() => {
        const fetchSubmissions = async () => {
            if (!institutionId) {
                setSubmissions([]);
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await fetch(
                    `${API_BASE_URL}/api/v1/institution/submissions/${encodeURIComponent(institutionId)}`,
                    { headers: { ...authHeaders() } }
                );
                const data = await response.json();
                
                // Ensure data is an array
                if (Array.isArray(data)) {
                    setSubmissions(data);
                } else {
                    console.error('API returned non-array data:', data);
                    setSubmissions([]);
                }
            } catch (error) {
                console.error('Error fetching submissions:', error);
                setSubmissions([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSubmissions();
    }, [institutionId]);

    useEffect(() => {
        if (!isAssigning) {
            setJudges([]);
            return;
        }
        const sub = submissions.find((s) => s._id === isAssigning);
        const eventId = sub?.event_id;
        if (!eventId) {
            setJudges([]);
            return;
        }
        (async () => {
            try {
                const res = await fetch(
                    `${API_BASE_URL}/api/v1/institution/events/${encodeURIComponent(String(eventId))}/details`,
                    { headers: { ...authHeaders() } }
                );
                if (!res.ok) {
                    setJudges([]);
                    return;
                }
                const ev = await res.json();
                const panel = Array.isArray(ev?.judges) ? ev.judges : [];
                setJudges(
                    panel
                        .filter((j: any) => j?.email)
                        .map((j: any) => ({
                            _id: j.id || j.email,
                            full_name: j.name || j.email || 'Judge',
                            email: j.email,
                            specialization: j.expertise,
                        }))
                );
            } catch {
                setJudges([]);
            }
        })();
    }, [isAssigning, submissions]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-700';
            case 'Rejected': return 'bg-red-100 text-red-700';
            case 'Under Review': return 'bg-blue-100 text-blue-700';
            case 'Scored': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/institution/submissions/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                setSubmissions(submissions.map(s => s._id === id ? { ...s, status: newStatus } : s));
                if (selectedSubmission?._id === id) {
                    setSelectedSubmission({ ...selectedSubmission, status: newStatus });
                }
            }
        } catch (error) {
            console.error("Failed to update status");
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredSubmissions.map(s => s._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    if (loading) return (
        <div className="space-y-6">
            <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-96 bg-white border border-slate-100 rounded-2xl animate-pulse" />
        </div>
    );

    const filteredSubmissions = filterStatus === 'All' || filterStatus === 'All Status'
        ? submissions 
        : submissions.filter(s => s.status === filterStatus);

    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Submissions Management</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Total {submissions.length} Submissions • Round 01</p>
                </div>
                <div className="flex gap-3">
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl border border-purple-100 animate-in fade-in zoom-in duration-300">
                            <span className="text-[10px] font-black text-[#6C3BFF] uppercase tracking-widest">{selectedIds.length} Selected</span>
                            <button className="px-3 py-1.5 bg-[#6C3BFF] text-white text-[9px] font-black uppercase rounded-lg hover:bg-purple-700 transition-all">Bulk Approve</button>
                            <button className="px-3 py-1.5 bg-white text-slate-400 text-[9px] font-black uppercase rounded-lg border border-slate-100 hover:text-red-500 transition-all">Bulk Reject</button>
                        </div>
                    )}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#6C3BFF] transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search projects..." 
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-50 focus:border-[#6C3BFF] transition-all w-64 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Unstop Tabs */}
            <div className="flex items-center gap-8 border-b border-slate-100 px-4">
                {['All', 'Under Review', 'Shortlisted', 'Evaluated'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`text-[10px] font-black uppercase tracking-[0.2em] pb-4 relative transition-all ${activeTab === tab ? 'text-[#6C3BFF]' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <motion.div layoutId="subTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#6C3BFF] rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/20">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-8 py-5 w-10">
                                <input 
                                    type="checkbox" 
                                    onChange={handleSelectAll}
                                    checked={selectedIds.length === filteredSubmissions.length && filteredSubmissions.length > 0}
                                    className="w-4 h-4 rounded border-slate-300 text-[#6C3BFF] focus:ring-[#6C3BFF]"
                                />
                            </th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Team & Project</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Judge</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Score</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredSubmissions.length > 0 ? filteredSubmissions.map((sub, idx) => (
                            <motion.tr 
                                key={sub._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`hover:bg-slate-50/30 transition-colors group ${selectedIds.includes(sub._id) ? 'bg-purple-50/50' : ''}`}
                            >
                                <td className="px-8 py-6">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(sub._id)}
                                        onChange={() => handleSelect(sub._id)}
                                        className="w-4 h-4 rounded border-slate-300 text-[#6C3BFF] focus:ring-[#6C3BFF]"
                                    />
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 group-hover:text-[#6C3BFF] transition-colors">{sub.project_title}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{sub.team_name}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    {sub.assigned_judges && sub.assigned_judges.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {sub.assigned_judges.map((judge: any, jIdx: number) => (
                                                <span key={jIdx} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wider border border-emerald-100">
                                                    {judge.name || judge.email}
                                                </span>
                                            ))}
                                        </div>
                                    ) : sub.judge_id ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-[#6C3BFF] text-[8px] font-black uppercase">
                                                {sub.judge_name?.charAt(0) || 'J'}
                                            </div>
                                            <span className="text-xs font-bold text-slate-600">{sub.judge_name || 'Assigned'}</span>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setIsAssigning(sub._id)}
                                            className="text-[9px] font-black text-[#6C3BFF] uppercase tracking-widest hover:underline"
                                        >
                                            + Assign Judge
                                        </button>
                                    )}
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${sub.status === 'Scored' ? 'bg-purple-100 text-purple-700 border-purple-200' : getStatusColor(sub.status)}`}>
                                        {sub.status || 'Submitted'}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        <span className={`text-sm font-black ${sub.score >= 8 ? 'text-emerald-600' : 'text-slate-700'}`}>
                                            {sub.score ? sub.score.toFixed(1) : '—'}
                                        </span>
                                        {sub.score && (
                                            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-[#6C3BFF]" 
                                                    style={{ width: `${(sub.score / 10) * 100}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => setSelectedSubmission(sub)}
                                            className="p-2 text-slate-400 hover:text-[#6C3BFF] hover:bg-purple-50 rounded-lg transition-all"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button 
                                            className="p-2 text-slate-400 hover:text-[#6C3BFF] hover:bg-purple-50 rounded-lg transition-all"
                                            title="Move to Final"
                                        >
                                            <TrendingUp size={18} />
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center text-slate-400 uppercase font-black tracking-[0.2em] text-xs">
                                    No submissions found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Submission Details Modal */}
            <AnimatePresence>
                {selectedSubmission && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20"
                        >
                            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedSubmission.project_title}</h2>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Team: {selectedSubmission.team_name}</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedSubmission(null)}
                                    className="p-3 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-slate-900 shadow-sm"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>
                            
                            <div className="p-10 overflow-y-auto flex-1 space-y-10 no-scrollbar">
                                <section>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Project Description</h3>
                                    <p className="text-slate-600 leading-relaxed font-medium">{selectedSubmission.description || "No description provided."}</p>
                                </section>

                                <div className="grid grid-cols-2 gap-8">
                                    <section>
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Resources</h3>
                                        <div className="space-y-3">
                                            {selectedSubmission.github_link && (
                                                <a href={selectedSubmission.github_link} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl hover:bg-[#6C3BFF] hover:text-white transition-all group/link shadow-sm">
                                                    <Github size={20} className="text-slate-400 group-hover/link:text-white" />
                                                    <span className="text-sm font-bold">GitHub Repo</span>
                                                    <ExternalLink size={14} className="ml-auto opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                </a>
                                            )}
                                            {selectedSubmission.demo_link && (
                                                <a href={selectedSubmission.demo_link} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all group/link shadow-sm">
                                                    <Play size={20} className="text-slate-400 group-hover/link:text-white" />
                                                    <span className="text-sm font-bold">Demo Video</span>
                                                    <ExternalLink size={14} className="ml-auto opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                </a>
                                            )}
                                        </div>
                                    </section>
                                    <section>
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Attachments</h3>
                                        <div className="p-10 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-3 text-slate-300">
                                            <FileText size={32} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">No files attached</span>
                                        </div>
                                    </section>
                                </div>

                                {selectedSubmission.internal_notes && (
                                    <section>
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Reviewer Notes</h3>
                                        <div className="bg-purple-50 p-6 rounded-3xl flex gap-4 border border-purple-100/50 shadow-sm shadow-purple-100/20">
                                            <MessageSquare size={20} className="text-[#6C3BFF] shrink-0" />
                                            <p className="text-sm text-purple-900 italic font-medium leading-relaxed">"{selectedSubmission.internal_notes}"</p>
                                        </div>
                                    </section>
                                )}
                            </div>

                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                                <button 
                                    onClick={() => handleStatusChange(selectedSubmission._id, 'Approved')}
                                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
                                >
                                    Approve Project
                                </button>
                                <button 
                                    onClick={() => handleStatusChange(selectedSubmission._id, 'Rejected')}
                                    className="flex-1 py-4 bg-white text-red-600 border border-red-100 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-50 transition-all"
                                >
                                    Reject
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Judge Selection Modal */}
            <AnimatePresence>
                {isAssigning && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl border border-white/20 relative"
                        >
                            {/* Close button */}
                            <button 
                                onClick={() => setIsAssigning(null)}
                                className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                            
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Assign Evaluator</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Select a judge for this submission</p>
                            
                            <div className="space-y-3 mb-8 max-h-60 overflow-y-auto no-scrollbar">
                                {judges.length > 0 ? judges.map((j) => (
                                    <button 
                                        key={j._id}
                                        disabled={assigningJudgeId === j._id}
                                        onClick={async () => {
                                            setAssigningJudgeId(j._id);
                                            try {
                                                const res = await fetch(`${API_BASE_URL}/api/judges/assign`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json', ...authHeaders() },
                                                    body: JSON.stringify({ submission_id: isAssigning, judge_id: j._id })
                                                });
                                                if (res.ok) {
                                                    // Refresh submissions to get updated assigned_judges from backend
                                                    const refreshRes = await fetch(
                                                        `${API_BASE_URL}/api/v1/institution/submissions/${encodeURIComponent(institutionId || '')}`,
                                                        { headers: { ...authHeaders() } }
                                                    );
                                                    if (refreshRes.ok) {
                                                        const refreshData = await refreshRes.json();
                                                        if (Array.isArray(refreshData)) {
                                                            setSubmissions(refreshData);
                                                        }
                                                    }
                                                    
                                                    // Send notification to judge
                                                    try {
                                                        await fetch(`${API_BASE_URL}/api/notifications/judge`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json', ...authHeaders() },
                                                            body: JSON.stringify({
                                                                judge_email: j.email,
                                                                notification_type: 'judge_assigned',
                                                                title: 'New Project Assignment',
                                                                message: `You have been assigned to evaluate a new submission. Please log in to the judge portal to review.`,
                                                                event_id: j.institution_id || '',
                                                                metadata: { submission_id: isAssigning }
                                                            })
                                                        });
                                                    } catch (e) {
                                                        console.log('Notification send failed (non-critical)');
                                                    }
                                                    
                                                    setIsAssigning(null);
                                                } else {
                                                    const errData = await res.json().catch(() => ({}));
                                                    alert(errData.detail || 'Failed to assign judge. Please try again.');
                                                }
                                            } catch (err) {
                                                console.error('Assign judge error:', err);
                                                alert('Network error. Please try again.');
                                            } finally {
                                                setAssigningJudgeId(null);
                                            }
                                        }}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                                            assigningJudgeId === j._id 
                                                ? 'bg-purple-50 border-purple-200 opacity-70' 
                                                : 'bg-slate-50 hover:bg-purple-50 border-slate-100 hover:border-purple-200'
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#6C3BFF] font-black shadow-sm group-hover:shadow-md transition-all">
                                            {assigningJudgeId === j._id ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                j.full_name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900 group-hover:text-[#6C3BFF] transition-colors">{j.full_name}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{j.specialization || 'General Judge'}</p>
                                        </div>
                                        {assigningJudgeId === j._id && (
                                            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Assigning...</span>
                                        )}
                                    </button>
                                )) : (
                                    <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No judges available</p>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => setIsAssigning(null)}
                                className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SubmissionList;
