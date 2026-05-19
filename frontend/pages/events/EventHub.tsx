import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { API_BASE_URL, authHeaders, FRONTEND_URL } from '../../apiConfig';
import { useAuth } from '../../AuthContext';
import { ChevronLeft, UsersRound, Link as LinkIcon, Loader2, Upload, FileText, CheckCircle2, Clock, Trophy, Share2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IEvent, IParticipant, ITeam } from '../../types/event';
import HackathonSubmissionForm from './HackathonSubmissionForm';

type HubResp = { participant?: IParticipant; team?: ITeam };

const EventHub: React.FC = () => {
    const { eventId } = useParams();
    const { user } = useAuth();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<IEvent | null>(null);
    const [participant, setParticipant] = useState<IParticipant | null>(null);
    const [team, setTeam] = useState<ITeam | null>(null);
    const [activeTab, setActiveTab] = useState('timeline');
    const [isEvaluated, setIsEvaluated] = useState(false);
    const [evaluation, setEvaluation] = useState<any>(null);
    
    // Team management state
    const [teamName, setTeamName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [working, setWorking] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [showInviteLink, setShowInviteLink] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);

    // Submission state
    const [submitting, setSubmitting] = useState<string | null>(null); // stage_id
    const [submissionData, setSubmissionData] = useState<Record<string, string | boolean>>({});
    const [submissionError, setSubmissionError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [evRes, hubRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/v1/events/${eventId}`, { headers: { ...authHeaders() } }),
                fetch(`${API_BASE_URL}/api/v1/events/${eventId}/hub`, { headers: { ...authHeaders() } })
            ]);

            if (evRes.ok) setEvent(await evRes.json());
            if (hubRes.ok) {
                const data: any = await hubRes.json();
                setParticipant(data.participant);
                setTeam(data.team);
                setIsEvaluated(!!data.is_evaluated);
                setEvaluation(data.evaluation);
                // Auto-surface the most recent active invite code so leader
                // doesn't have to click "Generate" just to see it.
                const invites: any[] = (data.team as any)?.invites || [];
                const now = Date.now();
                const active = [...invites].reverse().find(
                    (inv: any) => !inv.revoked && (!inv.expires_at || new Date(inv.expires_at).getTime() > now)
                );
                if (active) setGeneratedCode(active.code);
            }
        } catch (error) {
            console.error("Failed to fetch hub data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinByUrl = async (code: string) => {
        setWorking(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/teams/join-by-invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ code })
            });
            if (res.ok) {
                alert("Successfully joined team via invite link!");
                await fetchData();
                setActiveTab('team');
            }
        } catch (e) {
            console.error("Auto-join failed", e);
        } finally {
            setWorking(false);
        }
    };

    useEffect(() => {
        fetchData().then(() => {
            // Check for join code in URL
            const params = new URLSearchParams(location.search);
            const code = params.get('join');
            if (code && !team) {
                handleJoinByUrl(code);
            }
        });
        
        // Real-time polling for team/submission updates
        const interval = setInterval(async () => {
            try {
                const hubRes = await fetch(`${API_BASE_URL}/api/v1/events/${eventId}/hub`, { headers: { ...authHeaders() } });
                if (hubRes.ok) {
                    const data: HubResp = await hubRes.json();
                    setParticipant(data.participant || null);
                    setTeam(data.team || null);
                }
            } catch (e) {
                /* non-fatal */
            }
        }, 15000); // Poll every 15s

        return () => clearInterval(interval);
    }, [eventId]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [location.search]);

    const createTeam = async () => {
        if (!teamName.trim()) return;
        setWorking(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/teams/create-secure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ event_id: eventId, team_name: teamName })
            });
            if (res.ok) {
                await fetchData();
                setTeamName('');
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to create team");
            }
        } finally {
            setWorking(false);
        }
    };

    const joinByCode = async () => {
        if (!inviteCode.trim()) return;
        setWorking(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/teams/join-by-invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ code: inviteCode })
            });
            if (res.ok) {
                await fetchData();
                setInviteCode('');
            } else {
                const err = await res.json();
                alert(err.detail || "Invalid invite code");
            }
        } finally {
            setWorking(false);
        }
    };

    const generateInvite = async () => {
        setWorking(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/teams/${team?._id}/invites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ ttl_hours: 72 })
            });
            if (res.ok) {
                const data = await res.json();
                setGeneratedCode(data.code);
                // If code was reused from DB, nothing new was written — that's fine
            }
        } finally {
            setWorking(false);
        }
    };

    const handleFileUpload = async (stageId: string, file: File) => {
        setSubmitting(stageId);
        setSubmissionError(null);
        
        // Check file size (50MB limit)
        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            setSubmissionError(`File too large. Maximum size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
            setSubmitting(null);
            return;
        }

        // Check file extension
        const allowedExtensions = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.zip', '.rar', '.txt', '.jpg', '.jpeg', '.png', '.gif'];
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedExtensions.includes(fileExt)) {
            setSubmissionError(`File type ${fileExt} is not allowed. Allowed types: ${allowedExtensions.join(', ')}`);
            setSubmitting(null);
            return;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('stage_id', stageId);
        formData.append('user_email', user?.email || '');
        formData.append('user_name', user?.full_name || '');

        try {
            const res = await fetch(`${API_BASE_URL}/api/opportunities/events/${eventId}/stages/${stageId}/upload`, {
                method: 'POST',
                headers: { ...authHeaders() },
                body: formData
            });
            
            if (res.ok) {
                alert("File uploaded successfully!");
                await fetchData();
            } else {
                const err = await res.json();
                setSubmissionError(err.detail || "Upload failed. Please check your file and try again.");
            }
        } catch (e) {
            setSubmissionError("Network error during upload. Please check your connection and try again.");
        } finally {
            setSubmitting(null);
        }
    };

    const handleSubmission = async (stageId: string) => {
        const stage = event?.stages?.find((s: any) => s.id === stageId);
        const fields = stage?.config?.fields || [];
        
        // Collect all field data for this stage
        const fieldData: any = {};
        let hasData = false;
        
        for (const field of fields) {
            const key = `${stageId}-${field.id}`;
            const value = submissionData[key];
            
            if (field.required && !value) {
                setSubmissionError(`${field.label} is required`);
                return;
            }
            
            if (value) {
                fieldData[field.id] = value;
                hasData = true;
            }
        }
        
        if (!hasData) {
            setSubmissionError("Please fill in at least one field");
            return;
        }
        
        setSubmitting(stageId);
        setSubmissionError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/opportunities/events/${eventId}/stages/${stageId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ 
                    data: {
                        ...fieldData,
                        user_email: user?.email || '',
                        user_name: user?.full_name || ''
                    } 
                })
            });
            if (res.ok) {
                alert("Submitted successfully!");
                await fetchData();
                // Clear submission data for this stage
                const newData = { ...submissionData };
                for (const field of fields) {
                    delete newData[`${stageId}-${field.id}`];
                }
                setSubmissionData(newData);
            } else {
                const err = await res.json();
                setSubmissionError(err.detail || "Submission failed. Please try again.");
            }
        } catch (e) {
            setSubmissionError("Network error during submission. Please check your connection and try again.");
        } finally {
            setSubmitting(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
        </div>
    );

    if (!participant) {
        const params = new URLSearchParams(location.search);
        const joinCode = params.get('join');
        
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl shadow-purple-500/10 flex items-center justify-center mb-8 border border-slate-100">
                    {joinCode ? <UsersRound size={40} className="text-purple-600" /> : <LinkIcon size={40} className="text-purple-600" />}
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                    {joinCode ? "You're Invited!" : "Application Required"}
                </h1>
                <p className="text-slate-600 max-w-md mb-8 font-medium">
                    {joinCode 
                        ? "A teammate has invited you to join their unit! To accept this invitation and access the project hub, you must first register for the event."
                        : "You are not registered for this event. Please apply through the opportunities portal to access this hub and begin your collaborative phase."}
                </p>
                <Link 
                    to={`/opportunities/${eventId}${joinCode ? `?join=${joinCode}` : ''}`} 
                    className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-purple-700 transition-all shadow-2xl shadow-slate-900/20"
                >
                    {joinCode ? "Register to Join Team" : "View Opportunity Details"}
                </Link>
            </div>
        );
    }

    const event_id_as_opp = event?.opportunity_id || eventId;
    const isLeader = team && (String(team.leader_id || team.team_leader_id) === String(user?.user_id));

    const tabs = [
        { id: 'timeline', label: 'Timeline', icon: <Clock size={14} /> },
        { id: 'submissions', label: 'Submissions', icon: <FileText size={14} /> },
        { id: 'team', label: 'My Team', icon: <UsersRound size={14} /> }
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            {/* Navigation Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link to="/opportunities/my-applications" className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
                            <ChevronLeft size={24} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">{event?.title || 'Event Hub'}</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Participation Protocol Alpha</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-100">
                            {participant.status || 'Active'}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="space-y-12">
                    {/* Tab Navigation */}
                    <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-100 rounded-[2rem] w-fit shadow-sm">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab.id 
                                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' 
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-12">
                        {activeTab === 'timeline' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                <div className="lg:col-span-8 space-y-8">
                                    <h2 className="text-2xl font-black text-slate-900">Event Timeline</h2>
                                    <div className="relative pl-8 space-y-12 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-slate-100 before:rounded-full">
                                        {(event.stages || []).map((stage: any, idx: number) => {
                                            const isCompleted = participant.last_stage_submitted && event.stages.findIndex((s: any) => s.id === participant.last_stage_submitted) >= idx;
                                            const stype = stage.type?.toUpperCase();
                                            
                                            return (
                                                <div key={idx} className="relative">
                                                    <div className={`absolute left-[-40px] top-0 w-6 h-6 rounded-full border-4 border-slate-50 flex items-center justify-center ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200 shadow-inner'}`}>
                                                        {isCompleted && <CheckCircle2 size={12} className="text-white" />}
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h3 className={`text-lg font-black ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>{stage.name}</h3>
                                                                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xl">{stage.description}</p>
                                                            </div>
                                                            
                                                            {/* Contextual Action Button */}
                                                            {!isCompleted && (
                                                                <div className="shrink-0">
                                                                    {stype === 'TEAM FORMATION' || stype === 'TEAM_FORMATION' || stage.name?.toUpperCase().includes('TEAM') ? (
                                                                        <button 
                                                                            onClick={() => setActiveTab('team')}
                                                                            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                                                                        >
                                                                            Manage My Team
                                                                        </button>
                                                                    ) : stype === 'SUBMISSION' ? (
                                                                        <button 
                                                                            onClick={() => setActiveTab('submissions')}
                                                                            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                                                                        >
                                                                            Enter Submission Portal
                                                                        </button>
                                                                    ) : stype === 'QUIZ' ? (
                                                                        <Link 
                                                                            to={`/events/${eventId}/quiz/${stage.config?.quiz_id}`}
                                                                            className="px-6 py-3 bg-purple-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-purple-700 transition-all shadow-xl shadow-purple-900/20"
                                                                        >
                                                                            Start Assessment
                                                                        </Link>
                                                                    ) : null}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">Type: {stage.type}</span>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${new Date() > new Date(new Date(stage.end_date).setHours(23,59,59,999)) ? 'text-red-600 bg-red-50' : 'text-purple-600 bg-purple-50'}`}>
                                                                Deadline: {new Date(stage.end_date).toLocaleDateString()}
                                                                {new Date() > new Date(new Date(stage.end_date).setHours(23,59,59,999)) && " (PASSED)"}
                                                            </span>
                                                            {isCompleted && (
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg flex items-center gap-1">
                                                                    <CheckCircle2 size={10} /> Completed
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="lg:col-span-4">
                                    <div className="p-8 bg-gradient-to-br from-slate-900 to-purple-900 rounded-[2.5rem] text-white shadow-2xl shadow-purple-900/20 sticky top-32">
                                        <Trophy size={40} className="text-yellow-400 mb-6" />
                                        <h3 className="text-2xl font-black tracking-tight mb-4">Your Progress</h3>
                                        <p className="text-purple-200 text-sm font-medium leading-relaxed mb-8 opacity-80">
                                            Keep track of your milestones. Every stage completed brings you closer to the championship.
                                        </p>
                                        {(() => {
                                            const totalStages = event?.stages?.length || 1;
                                            const lastSubmitted = participant?.last_stage_submitted;
                                            const completedIdx = lastSubmitted 
                                                ? (event?.stages || []).findIndex((s: any) => s.id === lastSubmitted) + 1
                                                : (participant ? 1 : 0); // registered = at least 1
                                            const pct = Math.round((completedIdx / totalStages) * 100);
                                            return (
                                                <div className="space-y-4">
                                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                                                        {completedIdx} of {totalStages} Stages Cleared
                                                    </p>
                                                    {team && (
                                                        <div className="mt-4 pt-4 border-t border-white/10">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Your Team</p>
                                                            <p className="text-lg font-black">{team.team_name}</p>
                                                            <p className="text-xs text-purple-300 font-bold">{team.members?.length || 0} member{(team.members?.length || 0) !== 1 ? 's' : ''}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'submissions' && (() => {
                            const minTeam = (event as any)?.min_team_size ?? 1;
                            const maxTeam = (event as any)?.max_team_size ?? 99;
                            const needsTeam = minTeam > 1;
                            const memberCount = team?.members?.length || 0;
                            const teamMeetsSize = !needsTeam || (team && memberCount >= minTeam);

                            // Find SUBMISSION stage and its dynamic fields
                            const submissionStage = (event?.stages || []).find(
                                (s: any) => s.type?.toUpperCase() === 'SUBMISSION'
                            );
                            const dynamicFields = submissionStage?.config?.fields || [];
                            const hasDynamicFields = dynamicFields.length > 0;

                            return (
                            <div className="space-y-10 max-w-3xl">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                        {submissionStage?.name || 'Submit Your Project'}
                                    </h2>
                                    <p className="text-slate-500 font-medium mt-2">
                                        {submissionStage?.description || 'Fill in your project details below.'}
                                    </p>
                                </div>

                                {/* Team Size Enforcement Block */}
                                {needsTeam && !teamMeetsSize ? (
                                    <div className="p-10 bg-white border-2 border-amber-200 rounded-[3rem] shadow-xl shadow-amber-900/5 space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                                                <UsersRound size={28} className="text-amber-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900">Team Required</h3>
                                                <p className="text-slate-600 font-medium mt-1 leading-relaxed">
                                                    This event requires a team of <strong className="text-amber-700">{minTeam}–{maxTeam} members</strong> to submit. 
                                                    {!team ? (
                                                        <> You haven't formed a team yet. Please go to the <strong>Team</strong> tab to create or join one.</>
                                                    ) : (
                                                        <> Your team <strong>"{team.team_name}"</strong> currently has <strong className="text-red-600">{memberCount} member{memberCount !== 1 ? 's' : ''}</strong>. You need at least <strong>{minTeam}</strong> to submit.</>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-amber-500 rounded-full transition-all" 
                                                    style={{ width: `${Math.min(100, (memberCount / minTeam) * 100)}%` }} 
                                                />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0">
                                                {memberCount}/{minTeam} min
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab('team')}
                                            className="w-full py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-xl shadow-slate-900/10"
                                        >
                                            Go to Team Tab →
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Team info banner (if team exists and meets requirement) */}
                                        {team && needsTeam && (
                                            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                                                <p className="text-sm font-bold text-emerald-800">
                                                    Team "{team.team_name}" ({memberCount} members) — ready to submit
                                                </p>
                                            </div>
                                        )}

                                        <div className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-xl shadow-slate-900/5">
                                            {hasDynamicFields ? (
                                                /* Dynamic form from admin-defined stage config */
                                                <form onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    if (!submissionStage) return;
                                                    setSubmissionError(null);

                                                    // Validate required fields
                                                    for (const field of dynamicFields) {
                                                        const key = `${submissionStage.id}-${field.id}`;
                                                        const val = submissionData[key];
                                                        if (field.required && !val) {
                                                            setSubmissionError(`"${field.label}" is required`);
                                                            return;
                                                        }
                                                    }

                                                    await handleSubmission(submissionStage.id);
                                                }} className="space-y-8">
                                                    <AnimatePresence>
                                                        {submissionError && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -8 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -8 }}
                                                                className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl"
                                                            >
                                                                <p className="text-sm font-bold text-red-600">{submissionError}</p>
                                                                <button type="button" onClick={() => setSubmissionError(null)} className="ml-auto text-red-300 hover:text-red-600">✕</button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    {dynamicFields.map((field: any) => {
                                                        const key = `${submissionStage!.id}-${field.id}`;
                                                        const fieldType = (field.type || 'text').toLowerCase();
                                                        const inputClass = "w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-purple-50 focus:border-[#6C3BFF]/30 transition-all";

                                                        return (
                                                            <div key={field.id} className="space-y-3">
                                                                <label className="text-sm font-black text-slate-900 uppercase tracking-widest">
                                                                    {field.label}
                                                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                                                </label>
                                                                {fieldType === 'textarea' ? (
                                                                    <textarea
                                                                        rows={4}
                                                                        placeholder={field.placeholder || ''}
                                                                        className={`${inputClass} resize-none`}
                                                                        value={String(submissionData[key] || '')}
                                                                        onChange={(e) => setSubmissionData(prev => ({ ...prev, [key]: e.target.value }))}
                                                                    />
                                                                ) : fieldType === 'url' ? (
                                                                    <input
                                                                        type="url"
                                                                        placeholder={field.placeholder || 'https://...'}
                                                                        className={inputClass}
                                                                        value={String(submissionData[key] || '')}
                                                                        onChange={(e) => setSubmissionData(prev => ({ ...prev, [key]: e.target.value }))}
                                                                    />
                                                                ) : fieldType === 'number' ? (
                                                                    <input
                                                                        type="number"
                                                                        placeholder={field.placeholder || ''}
                                                                        className={inputClass}
                                                                        value={String(submissionData[key] || '')}
                                                                        onChange={(e) => setSubmissionData(prev => ({ ...prev, [key]: e.target.value }))}
                                                                    />
                                                                ) : fieldType === 'file' ? (
                                                                    <div className="relative border-2 border-dashed rounded-2xl p-6 text-center bg-purple-50/30 border-purple-100 hover:border-purple-300 cursor-pointer transition-all"
                                                                        onClick={() => document.getElementById(`dyn-file-${field.id}`)?.click()}
                                                                    >
                                                                        <Upload size={24} className="mx-auto mb-2 text-purple-400" />
                                                                        <p className="text-xs font-black uppercase tracking-widest text-purple-600">
                                                                            {submissionData[key] ? 'File selected' : 'Choose file'}
                                                                        </p>
                                                                        <input
                                                                            id={`dyn-file-${field.id}`}
                                                                            type="file"
                                                                            className="hidden"
                                                                            onChange={(e) => {
                                                                                const f = e.target.files?.[0];
                                                                                if (f && submissionStage) {
                                                                                    handleFileUpload(submissionStage.id, f);
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ) : fieldType === 'checkbox' ? (
                                                                    <label className="flex items-center gap-3 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="w-5 h-5 rounded accent-purple-600"
                                                                            checked={submissionData[key] === true || submissionData[key] === 'true'}
                                                                            onChange={(e) => setSubmissionData(prev => ({ ...prev, [key]: e.target.checked }))}
                                                                        />
                                                                        <span className="text-sm text-slate-700 font-medium">{field.placeholder || field.label}</span>
                                                                    </label>
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        placeholder={field.placeholder || ''}
                                                                        className={inputClass}
                                                                        value={String(submissionData[key] || '')}
                                                                        onChange={(e) => setSubmissionData(prev => ({ ...prev, [key]: e.target.value }))}
                                                                    />
                                                                )}
                                                            </div>
                                                        );
                                                    })}

                                                    <button
                                                        type="submit"
                                                        disabled={submitting === submissionStage?.id}
                                                        className="w-full py-5 bg-gradient-to-r from-[#6C3BFF] to-purple-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                                    >
                                                        {submitting === submissionStage?.id ? (
                                                            <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                                                        ) : (
                                                            <><FileText size={16} /> Submit</>
                                                        )}
                                                    </button>
                                                </form>
                                            ) : (
                                                /* Fallback: hardcoded form for events without dynamic stage config */
                                                <HackathonSubmissionForm
                                                    eventId={eventId!}
                                                    opportunityId={event_id_as_opp}
                                                    onSuccess={fetchData}
                                                />
                                            )}
                                        </div>

                                        {/* General Guidelines */}
                                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-3">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Submission Guidelines</p>
                                            <ul className="space-y-2 text-sm text-slate-600 font-medium">
                                                <li className="flex items-start gap-2"><span className="text-[#6C3BFF] font-black mt-0.5">→</span> Fill all required fields marked with *.</li>
                                                <li className="flex items-start gap-2"><span className="text-[#6C3BFF] font-black mt-0.5">→</span> You can re-submit before the deadline to update your project.</li>
                                                <li className="flex items-start gap-2"><span className="text-[#6C3BFF] font-black mt-0.5">→</span> Scores and rubrics are confidential — managed by institution judges.</li>
                                                {needsTeam && (
                                                    <li className="flex items-start gap-2"><span className="text-amber-500 font-black mt-0.5">⚠</span> Only the team leader can submit on behalf of the team.</li>
                                                )}
                                            </ul>
                                        </div>
                                    </>
                                )}
                            </div>
                            );
                        })()}

                        {activeTab === 'team' && (
                            <div className="space-y-12">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                                            <UsersRound className="text-purple-600" /> Team Hub
                                        </h1>
                                        <p className="text-slate-500 font-medium mt-2">
                                            Manage your collaborative protocol. Create, invite, and sync with your team.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm space-y-6">
                                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Team Status</h2>
                                        {team ? (
                                            <div className="space-y-6">
                                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                                    <p className="text-2xl font-black text-slate-900">{team.team_name}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Active Unit • {(team.members || []).length} Members</p>
                                                    
                                                    {/* Team Members List */}
                                                    {(team.members || []).length > 0 && (
                                                        <div className="mt-4 space-y-2">
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Team Members</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {(team.members || []).map((member: any, idx: number) => (
                                                                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-xl">
                                                                        <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                                                                            {member.name?.charAt(0) || member.email?.charAt(0) || '?'}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs font-bold text-slate-700">{member.name || member.email || 'Member'}</span>
                                                                            {member.email && (
                                                                                <span className="text-[9px] text-slate-400">{member.email}</span>
                                                                            )}
                                                                        </div>
                                                                        {member.is_leader && (
                                                                            <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white rounded text-[8px] font-black uppercase tracking-widest">Lead</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                                                {isLeader && (
                                                    <div className="space-y-4">
                                                        <button
                                                            onClick={generateInvite}
                                                            disabled={working}
                                                            className="w-full py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
                                                        >
                                                            {working ? 'Processing...' : generatedCode ? 'Share Team Invite' : 'Generate Invite Code'}
                                                        </button>
                                                    </div>
                                                )}

                                                {generatedCode && (
                                                    <div className="space-y-4 mt-4">
                                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-purple-50 border border-purple-100 rounded-[2rem] text-center">
                                                                <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-2">Team Invite Code</p>
                                                                <p className="text-3xl font-black text-purple-700 tracking-tighter font-mono">{generatedCode}</p>
                                                                <p className="text-[10px] text-purple-400 font-bold mt-2">Share this code to let teammates join</p>
                                                                <button
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(generatedCode);
                                                                        setCodeCopied(true);
                                                                        setTimeout(() => setCodeCopied(false), 2000);
                                                                    }}
                                                                    className="mt-4 flex items-center gap-2 mx-auto text-[10px] font-black text-purple-600 uppercase tracking-widest hover:underline"
                                                                >
                                                                    {codeCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                                                    {codeCopied ? 'Copied!' : 'Copy Code'}
                                                                </button>
                                                            </motion.div>
                                                            
                                                            <button 
                                                                onClick={() => setShowInviteLink(!showInviteLink)}
                                                                className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-purple-600 transition-colors"
                                                            >
                                                                <Share2 size={12} /> {showInviteLink ? 'Hide Invite Link' : 'Show Shareable Join Link'}
                                                            </button>

                                                            <AnimatePresence>
                                                                {showInviteLink && (
                                                                    <motion.div 
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: 'auto' }}
                                                                        exit={{ opacity: 0, height: 0 }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                                                                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                                                                                Share this direct link with your teammates.
                                                                            </p>
                                                                            <div className="flex gap-2">
                                                                                <div className="flex-grow p-3 bg-white border border-slate-200 rounded-xl text-[10px] font-mono text-slate-500 truncate">
                                                                                    {`${FRONTEND_URL}/#/events/${eventId}?join=${generatedCode}`}
                                                                                </div>
                                                                                <button 
                                                                                    onClick={() => {
                                                                                        navigator.clipboard.writeText(`${FRONTEND_URL}/#/events/${eventId}?join=${generatedCode}`);
                                                                                        setLinkCopied(true);
                                                                                        setTimeout(() => setLinkCopied(false), 2000);
                                                                                    }}
                                                                                    className="p-3 bg-slate-900 text-white rounded-xl hover:bg-purple-600 transition-colors"
                                                                                >
                                                                                    {linkCopied ? <Check size={14} /> : <Copy size={14} />}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                    </div>
                                                )}

                                                {!isLeader && !generatedCode && (
                                                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                                                        <p className="text-xs font-bold text-slate-500 text-center">Only the unit leader can generate new invite codes.</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            // Check if this is a solo-only event
                                            (event as any)?.min_team_size === 1 && (event as any)?.max_team_size === 1 ? (
                                                <div className="space-y-6">
                                                    <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center">
                                                                <Check size={16} />
                                                            </div>
                                                            <p className="text-lg font-black text-emerald-900">Solo Participation</p>
                                                        </div>
                                                        <p className="text-sm text-emerald-700 font-medium">
                                                            This event is designed for individual participants only. You're all set to participate solo!
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-slate-400 text-center">
                                                        No team formation required for this event.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    <p className="text-sm text-slate-500 font-medium">Initialize a new team to begin the collaborative phase.</p>
                                                    <input
                                                        value={teamName}
                                                        onChange={(e) => setTeamName(e.target.value)}
                                                        placeholder="Unit Designation (Team Name)"
                                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-purple-50 focus:border-purple-200"
                                                    />
                                                    <button
                                                        onClick={createTeam}
                                                        disabled={working || !teamName.trim()}
                                                        className="w-full py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all"
                                                    >
                                                        Initialize Team
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {(event as any)?.min_team_size === 1 && (event as any)?.max_team_size === 1 ? (
                                        // Hide join section for solo-only events
                                        <div className="p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                                            <div className="text-center py-8">
                                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Check size={24} className="text-slate-400" />
                                                </div>
                                                <p className="text-sm text-slate-400 font-medium">Team joining not available for solo events</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm space-y-6">
                                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Join Existing</h2>
                                            <div className="space-y-6">
                                                <p className="text-sm text-slate-500 font-medium">Synchronize with an existing unit using a secure invite code.</p>
                                                <input
                                                    value={inviteCode}
                                                    onChange={(e) => setInviteCode(e.target.value)}
                                                    disabled={Boolean(team)}
                                                    placeholder="Invite Code"
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-purple-50 focus:border-purple-200"
                                                />
                                                <button
                                                    onClick={joinByCode}
                                                    disabled={working || !inviteCode.trim() || Boolean(team)}
                                                    className="w-full py-4 rounded-2xl bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-xl shadow-purple-900/10 disabled:opacity-50"
                                                >
                                                    Sync with Team
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EventHub;
