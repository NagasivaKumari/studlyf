import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, ExternalLink, Save, Gavel, Users, Calendar, FileText, X, Download, CheckCircle2, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../apiConfig';
import { useAuth } from '../AuthContext';

const EvaluationPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    
    const { user, role } = useAuth();
    
    const [submission, setSubmission] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [score, setScore] = useState('');
    const [recommendation, setRecommendation] = useState('');
    const [comments, setComments] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [previewAsset, setPreviewAsset] = useState<{ url: string; filename: string } | null>(null);
    const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({});

    // No forced redirect - allow judges to use the direct evaluation page
    // even if they are logged in. This prevents access issues if they
    // don't have full dashboard permissions.
    
    useEffect(() => {
        if (!token) {
            setError('The evaluation link is missing or invalid.');
            setLoading(false);
            return;
        }
        fetchSubmission();
    }, [token]);

    const fetchSubmission = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/evaluation/${token}`);
            if (res.ok) {
                const data = await res.json();
                setSubmission(data);
                if (data.existing_evaluation) {
                    setScore(String(data.existing_evaluation.score || ''));
                    setRecommendation(data.existing_evaluation.recommendation || '');
                    setComments(data.existing_evaluation.comments || '');
                }
                // Initialize rubric scores
                if (data.criteria?.length) {
                    const init: Record<string, number> = {};
                    data.criteria.forEach((c: any) => {
                        init[c.name] = (data.existing_evaluation?.criteria_scores?.[c.name]) || 0;
                    });
                    setCriteriaScores(init);
                }
            } else {
                setError('Invalid or expired evaluation link');
            }
        } catch (err) {
            setError('Failed to load submission');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitEvaluation = async () => {
        if (!score) {
            setError('Please enter a score');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/evaluation/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    score: parseInt(score),
                    recommendation,
                    comments,
                    criteria_scores: criteriaScores
                })
            });

            if (res.ok) {
                setSuccess('Evaluation submitted successfully!');
                // Don't redirect - just show success message
            } else {
                setError('Failed to submit evaluation');
            }
        } catch (err) {
            setError('Network error while submitting');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading evaluation...</p>
                </div>
            </div>
        );
    }

    if (error || !submission) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Gavel size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Evaluation Link Error</h3>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Gavel size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">Project Evaluation</h1>
                    <p className="text-slate-600">Please review and evaluate this submission</p>
                </motion.div>

                {/* Submission Info */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-lg p-8 mb-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">{submission.title}</h2>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Users size={16} />
                                    {submission.team_name}
                                </div>
                                {submission.judge_name && (
                                    <div className="flex items-center gap-2 text-purple-600 font-bold">
                                        <Gavel size={16} />
                                        Judge: {submission.judge_name}
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    {new Date(submission.submitted_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className="px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-sm font-medium">
                                {submission.status}
                            </span>
                            {submission.existing_evaluation && (
                                <span className="px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    Already Evaluated
                                </span>
                            )}
                        </div>
                    </div>

                    {submission.description && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Description</h3>
                            <p className="text-slate-700">{submission.description}</p>
                        </div>
                    )}

                    {/* Files/Links */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">Submission Files & Links</h3>
                        
                        {/* Display submission data (files, URLs, etc.) */}
                        {submission.data && (
                            <div className="space-y-4">
                                {/* File submissions */}
                                {submission.data.file_url && (
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                        <FileText size={20} className="text-slate-500" />
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{submission.data.filename || 'Submitted File'}</p>
                                            <p className="text-sm text-slate-500">Click to preview the submitted file</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => {
                                                    const rawUrl = submission.data.file_url;
                                                    const fixedUrl = rawUrl.startsWith('/api/files/') 
                                                        ? `/api/opportunities/files/${rawUrl.split('/').pop()}` 
                                                        : rawUrl;
                                                    
                                                    setPreviewAsset({
                                                        url: `${API_BASE_URL}${fixedUrl}`,
                                                        filename: submission.data.filename || 'Deliverable'
                                                    });
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                <Eye size={16} />
                                                Preview
                                            </button>
                                            <a 
                                                href={`${API_BASE_URL}${submission.data.file_url.startsWith('/api/files/') ? '/api/opportunities' + submission.data.file_url : submission.data.file_url}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-900 hover:text-white transition-colors"
                                                title="Open Original"
                                            >
                                                <ExternalLink size={18} />
                                            </a>
                                        </div>
                                    </div>
                                )}
                                
                                {/* URL submissions */}
                                {submission.data.url && (
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                        <ExternalLink size={20} className="text-slate-500" />
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">Project Link</p>
                                            <p className="text-sm text-slate-500 truncate">{submission.data.url}</p>
                                        </div>
                                        <a 
                                            href={submission.data.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                                        >
                                            <ExternalLink size={16} />
                                            Visit Project
                                        </a>
                                    </div>
                                )}
                                
                                {/* Description */}
                                {submission.data.description && (
                                    <div className="p-4 bg-blue-50 rounded-xl">
                                        <h4 className="font-medium text-slate-900 mb-2">Project Description</h4>
                                        <p className="text-slate-700">{submission.data.description}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Legacy file display */}
                        {submission.files?.map((file: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                <FileText size={20} className="text-slate-500" />
                                <div className="flex-1">
                                    <p className="font-medium text-slate-900">{file.filename}</p>
                                    <p className="text-sm text-slate-500">{file.size}</p>
                                </div>
                                <button 
                                    onClick={() => setPreviewAsset({
                                        url: file.url,
                                        filename: file.filename
                                    })}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    <Eye size={16} />
                                    Preview
                                </button>
                            </div>
                        ))}
                        {submission.external_links?.map((link: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                <ExternalLink size={20} className="text-slate-500" />
                                <div className="flex-1">
                                    <p className="font-medium text-slate-900">{link.title}</p>
                                    <p className="text-sm text-slate-500 truncate">{link.url}</p>
                                </div>
                                <a 
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    <ExternalLink size={16} />
                                    Visit
                                </a>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Evaluation Form */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-lg p-8"
                >
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Evaluation</h3>
                    
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">
                            {success}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Rubric Criteria Scoring */}
                        {submission.criteria?.length > 0 && (
                            <div className="space-y-4 p-6 bg-purple-50 rounded-2xl border border-purple-100">
                                <h4 className="text-sm font-bold text-purple-900 uppercase tracking-wider flex items-center gap-2">
                                    <ClipboardList size={16} /> Scoring Rubrics
                                </h4>
                                {submission.criteria.map((criterion: any, idx: number) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold text-slate-700">{criterion.name}</label>
                                            <span className="text-xs font-bold text-slate-400">Max {criterion.max_points}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min={0}
                                                max={criterion.max_points}
                                                value={criteriaScores[criterion.name] || 0}
                                                onChange={(e) => setCriteriaScores({
                                                    ...criteriaScores,
                                                    [criterion.name]: parseInt(e.target.value)
                                                })}
                                                disabled={!!submission.existing_evaluation}
                                                className="flex-1 accent-purple-600"
                                            />
                                            <input
                                                type="number"
                                                min={0}
                                                max={criterion.max_points}
                                                value={criteriaScores[criterion.name] || 0}
                                                onChange={(e) => setCriteriaScores({
                                                    ...criteriaScores,
                                                    [criterion.name]: Math.min(criterion.max_points, Math.max(0, parseInt(e.target.value) || 0))
                                                })}
                                                disabled={!!submission.existing_evaluation}
                                                className="w-16 px-3 py-2 text-center border border-slate-300 rounded-lg text-sm font-bold disabled:bg-slate-50"
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-3 border-t border-purple-200 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-700">Total</span>
                                    <span className="text-lg font-black text-purple-700">
                                        {Object.values(criteriaScores).reduce((a, b) => a + b, 0)} / {submission.criteria.reduce((a: number, c: any) => a + c.max_points, 0)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Overall Score (0-100)</label>
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                                disabled={!!submission.existing_evaluation}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-slate-50 disabled:text-slate-500"
                                placeholder="Enter score from 0 to 100"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Recommendation</label>
                            <select 
                                value={recommendation}
                                onChange={(e) => setRecommendation(e.target.value)}
                                disabled={!!submission.existing_evaluation}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-slate-50 disabled:text-slate-500"
                            >
                                <option value="">Select recommendation...</option>
                                <option value="shortlist">Shortlist</option>
                                <option value="reject">Reject</option>
                                <option value="hold">Hold for consideration</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Comments</label>
                            <textarea 
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                disabled={!!submission.existing_evaluation}
                                rows={4}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none disabled:bg-slate-50 disabled:text-slate-500"
                                placeholder="Add your evaluation comments..."
                            />
                        </div>

                        {!submission.existing_evaluation ? (
                            <button 
                                onClick={handleSubmitEvaluation}
                                disabled={saving}
                                className="w-full py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Submit Evaluation
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="w-full py-4 bg-slate-100 text-slate-500 rounded-lg font-bold flex items-center justify-center gap-2 border-2 border-dashed border-slate-200">
                                <CheckCircle2 size={20} className="text-emerald-500" />
                                Project Already Evaluated
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
            {/* Asset Preview Modal */}
            <AnimatePresence>
                {previewAsset && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">{previewAsset.filename}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Judge Evaluation System • Secure Asset Preview</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <a 
                                        href={previewAsset.url} 
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#6C3BFF] hover:text-white transition-all"
                                    >
                                        <ExternalLink size={14} /> Open Original
                                    </a>
                                    <a 
                                        href={previewAsset.url} 
                                        download 
                                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl transition-all"
                                    >
                                        <Download size={14} /> Download
                                    </a>
                                    <button 
                                        onClick={() => setPreviewAsset(null)}
                                        className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-100 p-8 relative">
                                <div className="w-full h-full rounded-[2rem] overflow-hidden shadow-2xl bg-white relative">
                                    {/* File Preview by type */}
                                    {previewAsset.filename.toLowerCase().match(/\.(pdf)$/) ? (
                                        <iframe 
                                            src={previewAsset.url}
                                            className="w-full h-full border-none"
                                            title="PDF Preview"
                                        />
                                    ) : previewAsset.filename.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/) ? (
                                        <img 
                                            src={previewAsset.url}
                                            className="w-full h-full object-contain"
                                            alt={previewAsset.filename}
                                        />
                                    ) : previewAsset.filename.toLowerCase().match(/\.(mp4|webm|mov)$/) ? (
                                        <video 
                                            src={previewAsset.url}
                                            controls
                                            className="w-full h-full"
                                        />
                                    ) : previewAsset.filename.toLowerCase().match(/\.(pptx|ppt|docx|doc|xlsx|xls)$/) ? (
                                        <div className="w-full h-full flex flex-col bg-slate-50 relative">
                                            <div className="absolute inset-0 flex items-center justify-center -z-0">
                                                <div className="w-12 h-12 border-4 border-slate-200 border-t-[#6C3BFF] rounded-full animate-spin"></div>
                                            </div>
                                            <iframe 
                                                src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewAsset.url)}&embedded=true`}
                                                className="flex-1 w-full border-none bg-white relative z-10"
                                                title="Office Preview"
                                            />
                                            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between px-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 font-black text-xs">PPT</div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Intelligence Protocol Active</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <a 
                                                        href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewAsset.url)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                                                    >
                                                        Alternative Viewer (MS Office)
                                                    </a>
                                                </div>
                                            </div>
                                            {/* Localhost / Offline Fallback */}
                                            {previewAsset.url.includes('localhost') && (
                                                <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex items-center justify-center p-12 text-center">
                                                    <div className="max-w-md space-y-6">
                                                        <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center text-4xl mx-auto shadow-inner">🚧</div>
                                                        <div className="space-y-2">
                                                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Localhost Preview Blocked</h4>
                                                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                                                Cloud viewers (Google/Microsoft) cannot access files stored on your local machine (localhost).
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col gap-3">
                                                            <a 
                                                                href={previewAsset.url} 
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="w-full py-4 bg-[#6C3BFF] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-500/20"
                                                            >
                                                                Open File Directly
                                                            </a>
                                                            <a 
                                                                href={previewAsset.url} 
                                                                download
                                                                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest"
                                                            >
                                                                Download & View
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
                                            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center text-5xl">📁</div>
                                            <div>
                                                <p className="text-2xl font-black text-slate-900">{previewAsset.filename}</p>
                                                <p className="text-slate-500 mt-2">Interactive preview not available for this file type.</p>
                                            </div>
                                            <div className="flex gap-4">
                                                <a 
                                                    href={previewAsset.url} 
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-10 py-5 bg-[#6C3BFF] text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl transition-all"
                                                >
                                                    Open Original
                                                </a>
                                                <a 
                                                    href={previewAsset.url} 
                                                    download
                                                    className="px-10 py-5 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl transition-all"
                                                >
                                                    Download File
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EvaluationPage;
