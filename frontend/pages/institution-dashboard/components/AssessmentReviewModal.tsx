
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2, XCircle, AlertCircle, Send, Search } from 'lucide-react';
import { API_BASE_URL, authHeaders } from '../../../apiConfig';

interface QuizResult {
    user_id: string;
    name: string;
    email: string;
    team_id: string | null;
    team_name: string | null;
    score: number;
    correct?: number;
    total?: number;
    pass_mark: number;
    passed: boolean;
    submitted_at: string;
    participant_status: string;
    coding_pending_review: boolean;
}

interface AssessmentReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    quizId: string;
    quizTitle: string;
    stageName: string;
}

const AssessmentReviewModal: React.FC<AssessmentReviewModalProps> = ({ isOpen, onClose, eventId, quizId, quizTitle, stageName }) => {
    const [results, setResults] = useState<QuizResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [shortlisting, setShortlisting] = useState(false);
    const [notifying, setNotifying] = useState(false);
    const [shortlistDone, setShortlistDone] = useState(false);
    const [notifyDone, setNotifyDone] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchResults = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/v1/institution/events/${eventId}/quizzes/${quizId}/results`,
                { headers: { ...authHeaders() } }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'Failed to load results');
            }
            const data = await res.json();
            setResults(data.results || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [eventId, quizId]);

    useEffect(() => {
        if (isOpen) {
            fetchResults();
            setSelectedIds(new Set());
            setShortlistDone(false);
            setNotifyDone(false);
        }
    }, [isOpen, fetchResults]);

    const toggleSelect = (uid: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(uid)) next.delete(uid);
            else next.add(uid);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(r => r.user_id)));
        }
    };

    const handleShortlist = async () => {
        const ids = Array.from(selectedIds);
        if (!ids.length) return;
        setShortlisting(true);
        setError('');
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/v1/institution/events/${eventId}/quizzes/${quizId}/shortlist`,
                {
                    method: 'POST',
                    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_ids: ids }),
                }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'Shortlist failed');
            }
            setShortlistDone(true);
            await fetchResults();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setShortlisting(false);
        }
    };

    const handleNotifyShortlisted = async () => {
        setNotifying(true);
        setError('');
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/v1/institution/events/${eventId}/quizzes/${quizId}/notify-shortlisted`,
                {
                    method: 'POST',
                    headers: { ...authHeaders() },
                }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'Notify failed');
            }
            setNotifyDone(true);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setNotifying(false);
        }
    };

    const passedCount = results.filter(r => r.passed).length;
    const filtered = results.filter(r =>
        !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Assessment Review</h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    {quizTitle} — {stageName}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                                <X size={16} className="text-slate-500" />
                            </button>
                        </div>

                        {/* Summary bar */}
                        <div className="flex items-center gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500">
                            <span>Total: <strong className="text-slate-800">{results.length}</strong></span>
                            <span>Passed: <strong className="text-emerald-600">{passedCount}</strong></span>
                            <span>Failed: <strong className="text-red-500">{results.length - passedCount}</strong></span>
                            <div className="flex-1" />
                            {shortlistDone && (
                                <span className="flex items-center gap-1 text-emerald-600">
                                    <CheckCircle2 size={14} /> Shortlisted
                                </span>
                            )}
                        </div>

                        {/* Search */}
                        <div className="px-6 py-3 border-b border-slate-100">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-100"
                                />
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 size={24} className="animate-spin text-purple-600" />
                                </div>
                            ) : error ? (
                                <div className="flex items-center gap-2 p-4 bg-red-50 rounded-2xl text-red-600 text-sm">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            ) : results.length === 0 ? (
                                <div className="text-center py-16 text-slate-400 text-sm font-medium">
                                    No quiz attempts yet.
                                </div>
                            ) : (
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-left text-slate-400 font-black uppercase tracking-wider">
                                            <th className="pb-3 pr-2">
                                                <input
                                                    type="checkbox"
                                                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                                                    onChange={toggleSelectAll}
                                                    className="rounded border-slate-300"
                                                />
                                            </th>
                                            <th className="pb-3 pr-3">Participant</th>
                                            <th className="pb-3 pr-3">Score</th>
                                            <th className="pb-3 pr-3">Result</th>
                                            <th className="pb-3 pr-3">Submitted</th>
                                            <th className="pb-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filtered.map(r => {
                                            const isShortlisted = r.participant_status === 'shortlisted' || r.participant_status === 'accepted';
                                            return (
                                                <tr key={r.user_id} className={isShortlisted ? 'bg-emerald-50/50' : ''}>
                                                    <td className="py-3 pr-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.has(r.user_id)}
                                                            onChange={() => toggleSelect(r.user_id)}
                                                            disabled={isShortlisted}
                                                            className="rounded border-slate-300"
                                                        />
                                                    </td>
                                                    <td className="py-3 pr-3">
                                                        <div className="font-bold text-slate-800">{r.name}</div>
                                                        <div className="text-slate-400">{r.email}</div>
                                                    </td>
                                                    <td className="py-3 pr-3">
                                                        <span className={`font-black ${r.passed ? 'text-emerald-600' : 'text-red-500'}`}>
                                                            {r.correct !== undefined && r.total !== undefined ? `${r.correct}/${r.total}` : `${r.score}%`}
                                                        </span>
                                                        <span className="text-slate-400"> ({r.score}%)</span>
                                                        <span className="text-[10px] text-slate-400 block mt-0.5">Cutoff: {r.pass_mark}%</span>
                                                    </td>
                                                    <td className="py-3 pr-3">
                                                        {r.passed ? (
                                                            <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                                                <CheckCircle2 size={12} /> Pass
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-red-400 font-bold">
                                                                <XCircle size={12} /> Fail
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 pr-3 text-slate-500">
                                                        {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '-'}
                                                    </td>
                                                    <td className="py-3">
                                                        {isShortlisted ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                                                                <CheckCircle2 size={10} /> Shortlisted
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 font-medium">{r.participant_status}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-100">
                            {error && (
                                <span className="flex items-center gap-1 text-xs text-red-500 mr-auto">
                                    <AlertCircle size={12} /> {error}
                                </span>
                            )}
                            {notifyDone && (
                                <span className="flex items-center gap-1 text-xs text-emerald-600 mr-auto">
                                    <CheckCircle2 size={12} /> Notification sent
                                </span>
                            )}
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleNotifyShortlisted}
                                disabled={notifying || !results.some(r => r.participant_status === 'shortlisted' || r.participant_status === 'accepted')}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
                                title="Send email to all currently shortlisted participants"
                            >
                                {notifying ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Send size={14} />
                                )}
                                Notify All
                            </button>
                            <button
                                onClick={handleShortlist}
                                disabled={selectedIds.size === 0 || shortlisting}
                                className="px-6 py-2.5 bg-[#6C3BFF] hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
                            >
                                {shortlisting ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : null}
                                Shortlist ({selectedIds.size})
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AssessmentReviewModal;
