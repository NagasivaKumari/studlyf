import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle2, AlertTriangle, Loader2, LinkIcon, Users, Zap, ExternalLink } from 'lucide-react';
import { API_BASE_URL, authHeaders } from '../../apiConfig';
import { useAuth } from '../../AuthContext';

interface HackathonSubmissionFormProps {
    eventId: string;
    opportunityId?: string;
    onSuccess?: () => void;
    existingSubmission?: any;
}

const WORD_LIMITS = {
    problem_statement: 50,
    solution: 80,
    domain: 3,
};

/** Count words, trimming excess whitespace. */
const countWords = (text: string) =>
    text.trim().split(/\s+/).filter(Boolean).length;

/** Truncate text to a given word limit. */
const limitWords = (text: string, limit: number) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= limit) return text;
    return words.slice(0, limit).join(' ');
};

const WordCounter: React.FC<{ current: number; max: number }> = ({ current, max }) => {
    const pct = current / max;
    const color = pct >= 1 ? 'text-red-500' : pct >= 0.8 ? 'text-amber-500' : 'text-slate-400';
    return (
        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${color}`}>
            {current}/{max} words
        </span>
    );
};

const HackathonSubmissionForm: React.FC<HackathonSubmissionFormProps> = ({
    eventId,
    opportunityId,
    onSuccess,
    existingSubmission,
}) => {
    const { user } = useAuth();
    const [form, setForm] = useState({
        problem_statement: existingSubmission?.problem_statement || '',
        solution: existingSubmission?.solution || '',
        domain: existingSubmission?.domain || '',
        ppt_link: existingSubmission?.ppt_link || '',
        deployed_link: existingSubmission?.deployed_link || '',
        team_name: existingSubmission?.team_name || '',
        team_members: existingSubmission?.team_members || '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    /** Handle textarea change with word-limit enforcement. */
    const handleWordLimited = (field: keyof typeof WORD_LIMITS, value: string) => {
        const limited = limitWords(value, WORD_LIMITS[field]);
        setForm(prev => ({ ...prev, [field]: limited }));
    };

    const validate = () => {
        if (!form.problem_statement.trim()) return 'Problem statement is required';
        if (countWords(form.problem_statement) > WORD_LIMITS.problem_statement)
            return `Problem statement must be ≤${WORD_LIMITS.problem_statement} words`;
        if (!form.solution.trim()) return 'Solution description is required';
        if (countWords(form.solution) > WORD_LIMITS.solution)
            return `Solution must be ≤${WORD_LIMITS.solution} words`;
        if (!form.domain.trim()) return 'Domain is required (2-3 words max)';
        if (!form.ppt_link.trim()) return 'PPT / presentation link is required';
        if (!form.ppt_link.startsWith('http')) return 'PPT link must be a valid https:// URL';
        if (form.deployed_link && !form.deployed_link.startsWith('http'))
            return 'Deployed link must be a valid https:// URL';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }
        setError(null);
        setSubmitting(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/opportunities/events/${eventId}/hackathon-submit`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders() },
                    body: JSON.stringify({ ...form, opportunity_id: opportunityId }),
                }
            );
            if (res.ok) {
                setSubmitted(true);
                onSuccess?.();
            } else {
                const data = await res.json();
                setError(data.detail || 'Submission failed. Please try again.');
            }
        } catch {
            setError('Network error. Please check your connection.');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-12 bg-white border border-slate-100 rounded-[3rem] shadow-xl text-center space-y-6"
            >
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-100">
                    <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-900">Project Submitted!</h3>
                    <p className="text-slate-500 font-medium mt-2">
                        Your project has been submitted and is now pending evaluation by the institution.
                    </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Submission summary</p>
                    <p className="text-sm font-bold text-slate-700">Domain: <span className="text-[#6C3BFF]">{form.domain}</span></p>
                    <p className="text-sm font-bold text-slate-700">Team: <span className="text-slate-900">{form.team_name || user?.full_name}</span></p>
                    {form.ppt_link && (
                        <a href={form.ppt_link} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#6C3BFF] hover:underline">
                            <ExternalLink size={12} /> View PPT
                        </a>
                    )}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-8"
        >
            {/* Error banner */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl"
                    >
                        <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm font-bold text-red-600">{error}</p>
                        <button type="button" onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-red-600">✕</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Problem Statement */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-slate-900 uppercase tracking-widest">
                        Problem Statement <span className="text-red-500">*</span>
                    </label>
                    <WordCounter current={countWords(form.problem_statement)} max={WORD_LIMITS.problem_statement} />
                </div>
                <textarea
                    rows={3}
                    value={form.problem_statement}
                    onChange={e => handleWordLimited('problem_statement', e.target.value)}
                    placeholder="What problem are you solving? Keep it concise and clear..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-purple-50 focus:border-[#6C3BFF]/30 transition-all resize-none"
                />
                <p className="text-[10px] text-slate-400 font-medium">Maximum 50 words — be crisp and specific</p>
            </div>

            {/* Solution */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-slate-900 uppercase tracking-widest">
                        Your Solution <span className="text-red-500">*</span>
                    </label>
                    <WordCounter current={countWords(form.solution)} max={WORD_LIMITS.solution} />
                </div>
                <textarea
                    rows={4}
                    value={form.solution}
                    onChange={e => handleWordLimited('solution', e.target.value)}
                    placeholder="Describe your approach, key innovation, and how it solves the problem..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-purple-50 focus:border-[#6C3BFF]/30 transition-all resize-none"
                />
                <p className="text-[10px] text-slate-400 font-medium">Maximum 80 words — focus on impact and innovation</p>
            </div>

            {/* Domain + Team Name — side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">
                            Domain <span className="text-red-500">*</span>
                        </label>
                        <WordCounter current={countWords(form.domain)} max={WORD_LIMITS.domain} />
                    </div>
                    <input
                        type="text"
                        value={form.domain}
                        onChange={e => handleWordLimited('domain', e.target.value)}
                        placeholder="e.g. AI / Healthcare / Fintech"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-purple-50 focus:border-[#6C3BFF]/30 transition-all"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">2-3 words only</p>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Team Name</label>
                    <input
                        type="text"
                        value={form.team_name}
                        onChange={e => setForm(prev => ({ ...prev, team_name: e.target.value }))}
                        placeholder="Your team name..."
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-purple-50 focus:border-[#6C3BFF]/30 transition-all"
                    />
                </div>
            </div>

            {/* Team Members */}
            <div className="space-y-3">
                <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} className="text-[#6C3BFF]" /> Team Members
                    <span className="text-slate-400 font-medium normal-case text-xs">(optional)</span>
                </label>
                <input
                    type="text"
                    value={form.team_members}
                    onChange={e => setForm(prev => ({ ...prev, team_members: e.target.value }))}
                    placeholder="e.g. Alice, Bob, Carol"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-purple-50 focus:border-[#6C3BFF]/30 transition-all"
                />
            </div>

            {/* Links */}
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-6">
                <div className="flex items-center gap-2 text-slate-700">
                    <LinkIcon size={16} className="text-[#6C3BFF]" />
                    <span className="text-sm font-black uppercase tracking-widest">Project Links</span>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-black text-slate-900 uppercase tracking-widest">
                        PPT / Presentation Link <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="url"
                        value={form.ppt_link}
                        onChange={e => setForm(prev => ({ ...prev, ppt_link: e.target.value }))}
                        placeholder="https://drive.google.com/..."
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-purple-50 focus:border-[#6C3BFF]/30 transition-all"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">Share a Google Drive public link — no file uploads required</p>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        Deployed Link <span className="text-slate-400 font-medium normal-case text-xs">(optional)</span>
                    </label>
                    <input
                        type="url"
                        value={form.deployed_link}
                        onChange={e => setForm(prev => ({ ...prev, deployed_link: e.target.value }))}
                        placeholder="https://your-project.vercel.app"
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-purple-50 focus:border-[#6C3BFF]/30 transition-all"
                    />
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={submitting}
                className="w-full py-5 bg-gradient-to-r from-[#6C3BFF] to-purple-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
                {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Submitting Project...</>
                ) : (
                    <><Zap size={16} /> Submit Project</>
                )}
            </button>

            <p className="text-center text-[10px] text-slate-400 font-medium">
                You can re-submit before the deadline to update your project.
            </p>
        </motion.form>
    );
};

export default HackathonSubmissionForm;
