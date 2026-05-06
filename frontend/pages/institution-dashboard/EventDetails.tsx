import React, { useState, useEffect } from 'react';
import { API_BASE_URL, authHeaders } from '../../apiConfig';
import { 
    ArrowLeft, 
    Save, 
    X, 
    ChevronLeft, 
    UsersRound, 
    Link as LinkIcon, 
    Loader2, 
    Upload, 
    FileText, 
    CheckCircle2, 
    Clock, 
    Trophy, 
    Share2, 
    Copy, 
    Check, 
    Filter, 
    Plus, 
    AlertCircle, 
    Download, 
    ExternalLink, 
    LayoutDashboard, 
    Bell, 
    TrendingUp, 
    HelpCircle, 
    BarChart3, 
    PieChart, 
    ShieldCheck, 
    Award, 
    Gavel, 
    Calendar, 
    RefreshCw, 
    Eye, 
    Star, 
    XCircle, 
    Users, 
    Layers, 
    Info, 
    MapPin, 
    ChevronRight, 
    Settings2, 
    Send, 
    Timer, 
    Search, 
    Mail, 
    Settings, 
    Edit3, 
    Building2, 
    Square, 
    CheckSquare, 
    UserPlus,
    FileCheck,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence as FramerAnimatePresence } from 'framer-motion';
import LeaderboardPage from './LeaderboardPage';
import { useNavigate } from 'react-router-dom';
import StageBuilder from './components/StageBuilder';
import QuizDesignerModal from './components/QuizDesignerModal';
import JudgeInviteModal from './components/JudgeInviteModal';
import { IEvent, IParticipant, ITeam, IStage, ISubmission } from '../../types/event';
import { useAuth } from '../../AuthContext';

interface EventDetailsProps {
    eventId: string | null;
    onBack: () => void;
    institutionId?: string;
}

const BUNDLE_TABS = ['shortlisted', 'approved', 'pending', 'rejected'] as const;
const BUNDLE_TAB_LABEL: Record<string, string> = {
    shortlisted: 'Shortlisted',
    approved: 'Approved',
    pending: 'Pending',
    rejected: 'Rejected',
};

const EventDetails: React.FC<EventDetailsProps> = ({ eventId, onBack, institutionId: institutionIdProp }) => {
    const navigate = useNavigate();
    const { user, role } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [event, setEvent] = useState<IEvent | null>(null);
    const [institution, setInstitution] = useState<any>(null);
    const [participants, setParticipants] = useState<IParticipant[]>([]);
    const [stages, setStages] = useState<IStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [criteria, setCriteria] = useState<any[]>([]);
    const [bundleData, setBundleData] = useState<any>(null);
    const [threshold, setThreshold] = useState(90);
    const [debouncedThreshold, setDebouncedThreshold] = useState(90);
    const [bundleTab, setBundleTab] = useState<string>('shortlisted');
    const [teams, setTeams] = useState<ITeam[]>([]);
    const [submissions, setSubmissions] = useState<ISubmission[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [previewAsset, setPreviewAsset] = useState<{ url: string; filename: string; type: string } | null>(null);
    const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
    const [quizStageId, setQuizStageId] = useState<string | null>(null);
    const [codingAttempts, setCodingAttempts] = useState<Record<string, any[]>>({});
    const [editDescription, setEditDescription] = useState(false);
    const [reviewingParticipantId, setReviewingParticipantId] = useState<string | null>(null);
    const [portalReviewNotice, setPortalReviewNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
    const [stageSubmissions, setStageSubmissions] = useState<ISubmission[]>([]);
    const [submissionSubTab, setSubmissionSubTab] = useState<'projects' | 'assets'>('projects');
    const [judgeAssignmentModal, setJudgeAssignmentModal] = useState<{ isOpen: boolean; submissionId: string | null }>({ isOpen: false, submissionId: null });
    const [availableJudges, setAvailableJudges] = useState<any[]>([]);
    const [isJudgeInviteOpen, setIsJudgeInviteOpen] = useState(false);
    const [isInvitingJudge, setIsInvitingJudge] = useState(false);
    const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [refreshCounter, setRefreshCounter] = useState(0);
    const [notifying, setNotifying] = useState(false);
    
    // Track unsaved changes to lifecycle or criteria
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        if (!event) return;
        const stagesChanged = JSON.stringify(stages) !== JSON.stringify(event.stages);
        const criteriaChanged = JSON.stringify(criteria) !== JSON.stringify(event.judging_criteria);
        setHasUnsavedChanges(stagesChanged || criteriaChanged);
    }, [stages, criteria, event]);
    
        
    
    
    const portalRegistrationStatusLabel = (raw: string | undefined) => {
        const s = (raw || 'pending').toLowerCase();
        if (s === 'accepted' || s === 'shortlisted') return 'SHORTLISTED';
        if (s === 'rejected') return 'REJECTED';
        return s.replace(/_/g, ' ').toUpperCase();
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!eventId) return;
            try {
                const eventRes = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/details`, { headers: { ...authHeaders() } });
                const eventData = await eventRes.json();
                setEvent(eventData);
                setStages(
                    (Array.isArray(eventData.stages) ? eventData.stages : []).map((s: any, idx: number) => ({
                        ...s,
                        // Critical: ensure stable id so edits don't apply to every row
                        id: s?.id || `${eventId}-${idx}-${Math.random().toString(36).slice(2, 9)}`,
                        roundMode: s?.roundMode || s?.mode || s?.round_mode || 'Online',
                    }))
                );

                // Fetch institution profile
                const instId = eventData.institution_id;
                if (instId) {
                    try {
                        const instRes = await fetch(`${API_BASE_URL}/api/v1/institution/profile/${instId}`, { headers: { ...authHeaders() } });
                        const instData = await instRes.json();
                        setInstitution(instData);
                    } catch { /* non-fatal */ }
                }

                // Fetch participants (always, even if institution_id missing)
                try {
                    const partRes = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/participants`, { headers: { ...authHeaders() } });
                    const partData = await partRes.json();
                    setParticipants(Array.isArray(partData) ? partData : []);
                } catch {
                    setParticipants([]);
                }

                const quizRes = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/quizzes`, { headers: { ...authHeaders() } });
                const quizData = await quizRes.json();
                setQuizzes(quizData || []);
                
                // Only use judging criteria from DB — no static fallback
                setCriteria(eventData.judging_criteria || []);
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
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/qualified-bundle?threshold=${val}`, { headers: { ...authHeaders() } });
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
        if (!eventId) return;
        if (activeTab === 'participants') {
            fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/participants`, { headers: { ...authHeaders() } })
                .then((res) => res.json())
                .then((data) => setParticipants(Array.isArray(data) ? data : []))
                .catch(() => setParticipants([]));
        }
    }, [eventId, activeTab]);

    useEffect(() => {
        if(activeTab === 'participants' || activeTab === 'submissions') {
            fetchBundle(debouncedThreshold);
        }
        if(activeTab === 'teams') {
            fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/teams`, { headers: { ...authHeaders() } })
                .then(res => res.json())
                .then(data => setTeams(Array.isArray(data) ? data : []))
                .catch(() => setTeams([]));
        }
        if(activeTab === 'submissions') {
            fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/submissions`, { headers: { ...authHeaders() } })
                .then(res => res.json())
                .then(data => setSubmissions(Array.isArray(data) ? data : []))
                .catch(() => setSubmissions([]));

            fetch(`${API_BASE_URL}/api/opportunities/events/${eventId}/stage-submissions`, { headers: { ...authHeaders() } })
                .then(res => res.json())
                .then(data => setStageSubmissions(Array.isArray(data) ? data : []))
                .catch(() => setStageSubmissions([]));
        }
    }, [eventId, activeTab, debouncedThreshold, refreshCounter]);

    useEffect(() => {
        if (activeTab !== 'assessments' || !eventId || quizzes.length === 0) return;
        let cancelled = false;
        (async () => {
            const map: Record<string, any[]> = {};
            for (const q of quizzes) {
                const qid = String(q?._id || '');
                if (!qid) continue;
                try {
                    const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/quizzes/${qid}/coding-attempts`, {
                        headers: { ...authHeaders() },
                    });
                    const body = await res.json().catch(() => ({}));
                    map[qid] = Array.isArray(body?.items) ? body.items : [];
                } catch {
                    map[qid] = [];
                }
            }
            if (!cancelled) setCodingAttempts(map);
        })();
        return () => {
            cancelled = true;
        };
    }, [activeTab, eventId, quizzes]);

    const evaluateCodingAttempt = async (quizId: string, participantUserId: string) => {
        const scoreRaw = window.prompt('Manual score (%)', '75');
        if (scoreRaw === null) return;
        const score = Number(scoreRaw);
        if (Number.isNaN(score) || score < 0 || score > 100) {
            alert('Enter a valid score between 0 and 100.');
            return;
        }
        const passed = window.confirm('Mark this coding attempt as qualified/shortlisted?');
        setReviewingParticipantId(participantUserId);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/quizzes/${quizId}/coding-attempts/${participantUserId}/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ score, passed }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body?.detail || 'Failed to evaluate');
            setPortalReviewNotice({ kind: 'success', text: 'Coding attempt evaluated successfully.' });
            setCodingAttempts((prev) => ({
                ...prev,
                [quizId]: (prev[quizId] || []).filter((x: any) => String(x.user_id) !== String(participantUserId)),
            }));
        } catch (e: any) {
            setPortalReviewNotice({ kind: 'error', text: e?.message || 'Evaluation failed.' });
        } finally {
            setReviewingParticipantId(null);
        }
    };

    const handleSaveEvent = async () => {
        if (!eventId || !event) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ ...event, stages, judging_criteria: criteria })
            });
            if(res.ok) {
                const updatedEvent = { ...event, stages, judging_criteria: criteria };
                setEvent(updatedEvent);
                setHasUnsavedChanges(false);
                setShowSaveSuccess(true);
                
                // Simple direct sync - update all opportunities
                try {
                    console.log('DIRECT SYNC: Force updating all opportunities for event:', eventId);
                    const syncRes = await fetch(`${API_BASE_URL}/api/direct-sync/force-update/${eventId}`, {
                        method: 'POST',
                        headers: { ...authHeaders() }
                    });
                    if (syncRes.ok) {
                        const syncData = await syncRes.json();
                        console.log('DIRECT SYNC: Force update successful:', syncData);
                        alert(`Direct sync successful: ${syncData.message}`);
                        
                        // Also refresh the page to show changes immediately
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    } else {
                        const errorData = await syncRes.json().catch(() => ({}));
                        console.error('DIRECT SYNC: Force update failed:', errorData);
                        alert(`Direct sync failed: ${errorData.message || 'Unknown error'}`);
                    }
                } catch (syncErr) {
                    console.error('DIRECT SYNC: Network error:', syncErr);
                    alert('Network error during direct sync');
                }
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert(`Failed to save event: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (err) {
            alert('Network error while saving event');
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        // Try the provided onBack function first
        if (onBack && typeof onBack === 'function') {
            onBack();
            return;
        }
        
        // Fallback to browser history
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            // Final fallback to events page
            navigate('/institution-dashboard/events');
        }
    };

    const openQuizForStage = (stageId: string) => {
        setQuizStageId(stageId);
        setIsQuizModalOpen(true);
    };

    const attachQuizToStage = async (quizData: any) => {
        if (!eventId || !quizStageId) return;
        setIsCreatingQuiz(true);
        try {
            const stage = stages.find((s) => s.id === quizStageId);
            const passMark = Number(stage?.config?.pass_mark ?? 70);
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/quizzes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ ...quizData, pass_mark: passMark, stage_id: quizStageId }),
            });
            const j = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(j?.detail || 'Failed to create quiz');
                return;
            }
            const qid = String(j.quiz_id);
            setStages((prev) =>
                prev.map((s) =>
                    s.id === quizStageId ? { ...s, config: { ...(s.config || {}), quiz_id: qid, pass_mark: passMark } } : s
                )
            );
            setIsQuizModalOpen(false);
        } finally {
            setIsCreatingQuiz(false);
        }
    };

    const handleDispatchProtocol = async () => {
        const currentBundle = bundleData?.[bundleTab] || [];
        if (currentBundle.length === 0) return;

        const teamIds = currentBundle.map((item: any) => item.team_id);
        const nextStage = prompt("Enter the name of the next stage (e.g. Semi-Finals, Finale):", "Next Round");
        
        if (!nextStage) return;

        setNotifying(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/bulk-notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ team_ids: teamIds, next_stage: nextStage })
            });

            if (res.ok) {
                const result = await res.json();
                alert(`Successfully dispatched approval protocols to ${result.sent_to} candidates/teams!`);
            } else {
                alert('Failed to dispatch notifications');
            }
        } catch (error) {
            console.error('Dispatch failed:', error);
            alert('Network error during dispatch');
        } finally {
            setNotifying(false);
        }
    };

    const handlePublishEvent = async () => {
        if (!eventId || !window.confirm('Publish this event? It will go Live for learners (portal listings) and allow standard event registration if you use that flow.')) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ status: 'LIVE' })
            });
            if (res.ok) {
                const eventRes = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/details`, { headers: { ...authHeaders() } });
                const eventData = await eventRes.json();
                setEvent(eventData);
                setShowSaveSuccess(true);
                setTimeout(() => setShowSaveSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Publish failed');
        } finally {
            setSaving(false);
        }
    };

    const handleReviewPortalApplication = async (p: any, status: string) => {
        const instId = event?.institution_id;
        if (!instId || !eventId) {
            setPortalReviewNotice({ kind: 'error', text: 'Missing institution or event.' });
            return;
        }
        const src = p.source || '';
        const appId =
            p.opportunity_application_id ||
            (['opportunity_application', 'opportunity_portal', 'opportunity_portal_backfill'].includes(src) ? p._id : null);
        const body: Record<string, string> = { institution_id: instId, status };
        if (appId) body.application_id = String(appId);
        else if (p.user_id && p.opportunity_id) {
            body.user_id = String(p.user_id);
            body.opportunity_id = String(p.opportunity_id);
        } else {
            setPortalReviewNotice({ kind: 'error', text: 'This row is not linked to a portal application.' });
            return;
        }
        const rowId = String(p._id ?? p.user_id ?? appId ?? '');
        setReviewingParticipantId(rowId);
        setPortalReviewNotice(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/opportunity-applications/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setPortalReviewNotice({ kind: 'error', text: String((err as any).detail || 'Update failed') });
                return;
            }
            const partRes = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/participants`, { headers: { ...authHeaders() } });
            const data = await partRes.json();
            setParticipants(Array.isArray(data) ? data : []);
            const label = status === 'shortlisted' || status === 'accepted' ? 'shortlisted' : status === 'rejected' ? 'rejected' : 'marked pending';
            setPortalReviewNotice({ kind: 'success', text: `Saved — applicant ${label}.` });
            window.setTimeout(() => setPortalReviewNotice((n) => (n?.kind === 'success' ? null : n)), 3200);
        } catch {
            setPortalReviewNotice({ kind: 'error', text: 'Network error — could not update status.' });
        } finally {
            setReviewingParticipantId(null);
        }
    };

    const handleSendReminders = async () => {
        if (!window.confirm('Send deadline reminder emails to all registered participants?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/send-reminders`, {
                method: 'POST',
                headers: { ...authHeaders() },
            });
            if (res.ok) {
                const data = await res.json();
                alert(`Successfully sent ${data.count} reminders for ${data.stage}.`);
            } else {
                alert('Failed to send reminders.');
            }
        } catch (err) {
            alert('Network error.');
        }
    };

    if (loading) return <div className="h-96 flex items-center justify-center"><div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div></div>;
    if (!event) return <div>Event not found</div>;

    const getCurrentStageInfo = () => {
        const now = new Date();
        const sortedStages = [...stages].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
        const totalStages = sortedStages.length;
        
        // Find active stage (today falls within its date range)
        let activeStageIndex = -1;
        for (let i = 0; i < sortedStages.length; i++) {
            const start = new Date(sortedStages[i].start_date);
            const end = new Date(sortedStages[i].end_date);
            end.setUTCHours(23, 59, 59, 999);
            if (now >= start && now <= end) {
                activeStageIndex = i;
                break;
            }
        }
        
        // If no active stage found, find the most recent completed or upcoming stage
        if (activeStageIndex === -1 && sortedStages.length > 0) {
            for (let i = sortedStages.length - 1; i >= 0; i--) {
                if (now >= new Date(sortedStages[i].end_date)) {
                    activeStageIndex = i;
                    break;
                }
            }
            if (activeStageIndex === -1) activeStageIndex = 0;
        }
        
        const stageNumber = activeStageIndex + 1; // 1-based
        const stageName = sortedStages[activeStageIndex]?.name || `Stage ${stageNumber}`;
        const isFinalStage = stageNumber === totalStages && totalStages > 0;
        
        // Get next stage name if available (for "advance to" messages)
        const nextStageIndex = activeStageIndex + 1;
        const nextStageName = nextStageIndex < totalStages 
            ? sortedStages[nextStageIndex]?.name || `Stage ${nextStageIndex + 1}`
            : isFinalStage ? "Final Round" : "";
        
        return {
            stage_number: stageNumber,
            total_stages: totalStages,
            stage_name: stageName,
            next_stage_name: nextStageName,
            is_final_stage: isFinalStage
        };
    };

    const handleUpdateStatus = async (teamId: string, newStatus: string, item?: any) => {
        const instId = institutionIdProp || event?.institution_id;
        if (teamId.startsWith('portal_app:')) {
            const appId = teamId.replace(/^portal_app:/, '');
            if (!appId) return;
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/portal-applications/${appId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', ...authHeaders() },
                    body: JSON.stringify({ status: newStatus })
                });
                if (res.ok) {
                    setBundleData(prev => ({
                        ...prev,
                        [bundleTab]: prev?.[bundleTab]?.map((item: any) => 
                            item.team_id === teamId ? { ...item, status: newStatus } : item
                        )
                    }));
                    setShowSaveSuccess(true);
                    setTimeout(() => setShowSaveSuccess(false), 2000);
                }
            } catch (err) {
                console.error('Failed to update application status:', err);
            }
        } else {
            // Update team status in participants collection
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/teams/${teamId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', ...authHeaders() },
                    body: JSON.stringify({ status: newStatus })
                });
                if (res.ok) {
                    setBundleData(prev => ({
                        ...prev,
                        [bundleTab]: prev?.[bundleTab]?.map((item: any) => 
                            item.team_id === teamId ? { ...item, status: newStatus } : item
                        )
                    }));
                    setShowSaveSuccess(true);
                    setTimeout(() => setShowSaveSuccess(false), 2000);
                    
                    // Send email notification with stage context
                    if (item) {
                        try {
                            const stageInfo = getCurrentStageInfo();
                            await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/send-status-email`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                                body: JSON.stringify({
                                    team_id: teamId,
                                    status: newStatus,
                                    team_name: item.team_name,
                                    emails: item.member_emails || [],
                                    stage_context: stageInfo
                                })
                            });
                        } catch (emailErr) {
                            console.error('Failed to send email:', emailErr);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to update team status:', err);
            }
        }
    };

    
    const handleCreateQuiz = async (quizData: any) => {
        await attachQuizToStage(quizData);
        try {
            const updatedQuizRes = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/quizzes`, { headers: { ...authHeaders() } });
            const updatedQuizzes = await updatedQuizRes.json();
            setQuizzes(updatedQuizzes || []);
        } catch {
            /* non-fatal */
        }
    };

    const handleOpenJudgeAssignment = async (submissionId: string) => {
        // Fetch available judges
        try {
            console.log('DEBUG: Fetching judges for submission:', submissionId);
            const res = await fetch(`${API_BASE_URL}/api/judges`, { headers: { ...authHeaders() } });
            console.log('DEBUG: Judges API response status:', res.status);
            if (res.ok) {
                const judges = await res.json();
                console.log('DEBUG: Judges data received:', judges);
                setAvailableJudges(judges);
                setJudgeAssignmentModal({ isOpen: true, submissionId });
            } else {
                console.log('DEBUG: Failed to fetch judges, status:', res.status);
                const errorData = await res.json().catch(() => ({}));
                console.log('DEBUG: Judges API error:', errorData);
                alert(`Failed to load judges: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to fetch judges:', error);
            alert('Failed to load available judges');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Link copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy link: ', err);
        });
    };

    const handleAssignJudge = async (judgeId: string, judgeEmail: string) => {
        const isBulk = selectedSubmissions.length > 0 && judgeAssignmentModal.submissionId === 'bulk';
        
        try {
            const body: any = { judge_id: judgeId };
            if (isBulk) {
                body.submission_ids = selectedSubmissions;
            } else {
                body.submission_id = judgeAssignmentModal.submissionId;
            }

            const res = await fetch(`${API_BASE_URL}/api/judges/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const result = await res.json();
                
                let msg = isBulk ? `Successfully assigned judge to ${selectedSubmissions.length} projects!` : 'Judge assigned successfully!';
                
                // NEW: Handle email delivery feedback
                if (result.email_sent === false) {
                    msg += "\n\n⚠️ NOTE: Invitation email could not be sent. Please share the evaluation link manually.";
                }
                
                alert(msg);
                
                setJudgeAssignmentModal({ isOpen: false, submissionId: null });
                setSelectedSubmissions([]);
                setIsBulkMode(false);
                // Refresh submissions
                setRefreshCounter(prev => prev + 1);
                fetchBundle(debouncedThreshold);
            } else {
                const error = await res.json();
                alert(error.detail || 'Failed to assign judge');
            }
        } catch (error) {
            console.error('Error assigning judge:', error);
            alert('Network error while assigning judge');
        }
    };

    const handleInviteJudge = async (judgeData: any) => {
        setIsInvitingJudge(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/judges`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    ...judgeData,
                    is_test: false
                })
            });

            if (res.ok) {
                alert('Judge invited successfully!');
                setIsJudgeInviteOpen(false);
                // Refresh judges list
                if (judgeAssignmentModal.submissionId) {
                    handleOpenJudgeAssignment(judgeAssignmentModal.submissionId);
                }
            } else {
                const error = await res.json();
                alert(error.detail || 'Failed to invite judge');
            }
        } catch (error) {
            console.error('Error inviting judge:', error);
            alert('Network error while inviting judge');
        } finally {
            setIsInvitingJudge(false);
        }
    };

    
    const tabs = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'basic', label: 'Basic Info', icon: Info },
        { id: 'stages', label: 'Stages & Timeline', icon: Clock },
        { id: 'participants', label: 'Participants', icon: Users },
        { id: 'teams', label: 'Teams', icon: Layers },
        { id: 'submissions', label: 'Submissions', icon: FileText },
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
                        {String(event.status || '').toUpperCase() === 'DRAFT' && (
                            <div className="p-6 rounded-3xl border border-amber-200 bg-amber-50 text-amber-950 text-sm font-bold leading-relaxed space-y-4">
                                <p>
                                    This event is still <span className="uppercase">draft</span>
                                    {(participants?.length || 0) > 0 && (
                                        <>, but <strong>{participants.length}</strong> student(s) already registered through the portal.</>
                                    )}
                                    . Publish when you want it to appear in learner opportunity listings.
                                </p>
                                <button
                                    type="button"
                                    onClick={handlePublishEvent}
                                    disabled={saving}
                                    className="px-6 py-3 rounded-2xl bg-amber-600 text-white text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-colors disabled:opacity-50"
                                >
                                    Publish event (go Live)
                                </button>
                            </div>
                        )}
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
                                        {stages.map((s, i) => {
                                            const calculateProgressHeight = (start: string, endStr: string) => {
                                                const now = new Date();
                                                const startDate = new Date(start);
                                                const endDate = new Date(endStr);
                                                endDate.setUTCHours(23, 59, 59, 999);
                                                
                                                if (now < startDate) return '0%';
                                                if (now > endDate) return '100%';
                                                
                                                const total = endDate.getTime() - startDate.getTime();
                                                const elapsed = now.getTime() - startDate.getTime();
                                                return `${Math.min(100, Math.max(0, (elapsed / total) * 100))}%`;
                                            };

                                            return (
                                                <div key={i} className="flex items-center gap-6 group">
                                                    <div className="relative">
                                                        <div className="w-2 h-14 bg-white/10 rounded-full relative overflow-hidden">
                                                            <div 
                                                                className="absolute top-0 left-0 right-0 bg-[#6C3BFF] transition-all duration-1000" 
                                                                style={{ height: calculateProgressHeight(s.start_date, s.end_date) }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm tracking-tight">{s.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.type}</span>
                                                            <span className="text-slate-700">•</span>
                                                            <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                                                new Date() > new Date(new Date(s.end_date).setUTCHours(23, 59, 59, 999)) 
                                                                    ? 'text-slate-500' 
                                                                    : new Date() < new Date(s.start_date)
                                                                        ? 'text-blue-400'
                                                                        : 'text-emerald-400'
                                                            }`}>
                                                                {new Date() > new Date(new Date(s.end_date).setUTCHours(23, 59, 59, 999)) ? 'Completed' : new Date() < new Date(s.start_date) ? 'Upcoming' : 'Active'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all">
                                                        <ChevronRight size={16} className="text-slate-500" />
                                                    </div>
                                                </div>
                                            );
                                        })}
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

                        <div className="space-y-4">
                            <h4 className="text-lg font-black text-slate-900">Manual coding evaluations</h4>
                            {quizzes.map((quiz) => {
                                const qid = String(quiz?._id || '');
                                const rows = codingAttempts[qid] || [];
                                if (!qid) return null;
                                return (
                                    <div key={`coding-${qid}`} className="bg-white border border-slate-100 rounded-2xl p-5">
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <p className="font-bold text-slate-900">{quiz.title || 'Assessment'}</p>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                Pending: {rows.length}
                                            </span>
                                        </div>
                                        {rows.length === 0 ? (
                                            <p className="text-sm text-slate-500 font-medium">No pending coding attempts.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {rows.map((row: any) => (
                                                    <div key={String(row.user_id)} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">User: {String(row.user_id)}</p>
                                                            <p className="text-xs text-slate-500">Submitted: {row.submitted_at ? new Date(row.submitted_at).toLocaleString() : '-'}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => evaluateCodingAttempt(qid, String(row.user_id))}
                                                            disabled={reviewingParticipantId === String(row.user_id)}
                                                            className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-60"
                                                        >
                                                            {reviewingParticipantId === String(row.user_id) ? 'Saving...' : 'Evaluate'}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
                return <StageBuilder stages={stages} onUpdate={setStages} onConfigureQuiz={openQuizForStage} />;
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

            case 'basic':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Opportunity Identity</label>
                                <input type="text" value={event.title} onChange={(e) => setEvent({...event, title: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none font-bold text-slate-900 focus:ring-4 focus:ring-[#6C3BFF]/5 transition-all" />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</label>
                                <select value={event.category || 'Hackathon'} onChange={(e) => setEvent({...event, category: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none font-bold text-slate-900 appearance-none">
                                    <option>Hackathon</option>
                                    <option>Coding Competition</option>
                                    <option>Design Challenge</option>
                                    <option>Case Study</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Overview</label>
                                <textarea rows={8} value={event.description} onChange={(e) => setEvent({...event, description: e.target.value})} className="w-full px-6 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none font-medium text-slate-600 resize-none leading-relaxed" />
                            </div>
                        </div>
                    </div>
                );
            case 'registrations':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-10 pt-10 pb-4 border-b border-slate-50">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Registrations</h2>
                                <p className="text-sm text-slate-500 font-medium mt-2 max-w-2xl">
                                    Everyone who applied through the opportunity portal or was added as a participant for this event ({participants.length} total).
                                    Judge scoring buckets below are separate — they only list teams that have submission scores.
                                </p>
                                {portalReviewNotice ? (
                                    <div
                                        className={`mt-4 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 ${
                                            portalReviewNotice.kind === 'success'
                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                                : 'bg-red-50 text-red-800 border border-red-100'
                                        }`}
                                    >
                                        {portalReviewNotice.kind === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                        {portalReviewNotice.text}
                                    </div>
                                ) : null}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/80">
                                        <tr>
                                            <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                            <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                                            <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Source</th>
                                            <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered</th>
                                            <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Review</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {participants.length > 0 ? (
                                            participants.map((p: any) => {
                                                const src = p.source || '';
                                                const canReview =
                                                    Boolean(p.opportunity_application_id) ||
                                                    ['opportunity_application', 'opportunity_portal', 'opportunity_portal_backfill'].includes(src) ||
                                                    Boolean(p.user_id && p.opportunity_id);
                                                const rowBusyId = String(p._id ?? p.user_id ?? p.opportunity_application_id ?? '');
                                                const rowBusy = reviewingParticipantId !== null && reviewingParticipantId === rowBusyId;
                                                return (
                                                <tr key={p._id} className="hover:bg-slate-50/50">
                                                    <td className="px-10 py-6 font-black text-slate-900">{p.full_name || p.name || '—'}</td>
                                                    <td className="px-10 py-6 text-sm font-bold text-slate-600">{p.email || '—'}</td>
                                                    <td className="px-10 py-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                        {src === 'opportunity_application' || src === 'opportunity_portal' || src === 'opportunity_portal_backfill'
                                                            ? 'Portal apply'
                                                            : 'Participant'}
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                                                            {portalRegistrationStatusLabel(p.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-10 py-6 text-sm font-bold text-slate-500">
                                                        {p.registered_at ? new Date(p.registered_at).toLocaleString() : '—'}
                                                    </td>
                                                    <td className="px-10 py-6 text-right">
                                                        {canReview ? (
                                                            <div className="flex flex-wrap justify-end gap-2 items-center">
                                                                <button
                                                                    type="button"
                                                                    disabled={rowBusy}
                                                                    onClick={() => handleReviewPortalApplication(p, 'shortlisted')}
                                                                    className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-600 hover:text-white disabled:opacity-50 disabled:pointer-events-none inline-flex items-center gap-1.5"
                                                                >
                                                                    {rowBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                                    Shortlist
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={rowBusy}
                                                                    onClick={() => handleReviewPortalApplication(p, 'rejected')}
                                                                    className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase bg-red-50 text-red-700 border border-red-100 hover:bg-red-600 hover:text-white disabled:opacity-50 disabled:pointer-events-none"
                                                                >
                                                                    Reject
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={rowBusy}
                                                                    onClick={() => handleReviewPortalApplication(p, 'pending')}
                                                                    className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200 disabled:opacity-50 disabled:pointer-events-none"
                                                                >
                                                                    Pending
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-300">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-10 py-16 text-center text-slate-400 font-bold text-sm">
                                                    No registrations yet for this event.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'submissions':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Selection Command Center Banner */}
                        <div className="p-12 bg-slate-950 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                <div className="space-y-6 max-w-2xl text-center md:text-left">
                                    <div className="flex flex-col md:flex-row items-center gap-4">
                                        <div className="px-5 py-2 bg-[#6C3BFF] text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(108,59,255,0.4)]">
                                            Selection Intelligence
                                        </div>
                                        <div className="px-5 py-2 bg-white/10 backdrop-blur-md text-[#6C3BFF] rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-[#6C3BFF]/20 animate-pulse">
                                            {(() => {
                                                const now = new Date();
                                                const active = stages.find(s => {
                                                    const start = new Date(s.start_date);
                                                    const end = new Date(s.end_date);
                                                    end.setUTCHours(23, 59, 59, 999);
                                                    return now >= start && now <= end;
                                                });
                                                return active ? `${active.name} Active` : 'No Active Stage';
                                            })()}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-5xl font-black tracking-tighter leading-tight">Selection Command Center</h3>
                                        <p className="text-slate-400 text-lg font-medium leading-relaxed opacity-90">
                                            Dynamically aggregate and approve candidate bundles using {event?.name || 'this event'}'s scoring protocol. View deliverables or dispatch final authorizations.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                        <button 
                                            onClick={handleSendReminders}
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
                                                { label: 'Shortlisted', val: bundleData?.summary?.shortlisted || 0, color: 'bg-blue-500' },
                                                { label: 'Evaluated', val: submissions.length, color: 'bg-emerald-500' }
                                            ].map((m, i) => {
                                                const total = (participants?.length || 1);
                                                const progress = Math.min(100, (m.val / total) * 100);
                                                return (
                                                    <div key={i} className="space-y-2">
                                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                                            <span className="text-slate-400">{m.label}</span>
                                                            <span className="text-white">{m.val}</span>
                                                        </div>
                                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                            <div className={`h-full ${m.color} transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
                                {hasUnsavedChanges && (
                                    <div className="mx-6 mb-8 p-6 bg-amber-50 border border-amber-200 rounded-[2rem] flex items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4">
                                        <div className="flex items-center gap-4 text-amber-900">
                                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shadow-inner">
                                                <AlertCircle size={20} />
                                            </div>
                                            <p className="text-sm font-bold leading-tight">
                                                Unsaved Lifecycle Changes Detected<br />
                                                <span className="text-[10px] font-medium opacity-70">Changes to your stages or deadlines might affect candidate qualification. Sync changes to refresh results.</span>
                                            </p>
                                        </div>
                                        <button 
                                            onClick={handleSaveEvent}
                                            className="px-6 py-3 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-colors shadow-lg shadow-amber-900/10"
                                        >
                                            Sync Now
                                        </button>
                                    </div>
                                )}
                                {/* Standardized Tabs (Matching Screenshot) */}
                                <div className="flex items-center gap-10 border-b border-slate-100 px-6">
                                    {['shortlisted', 'approved', 'pending', 'rejected'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setBundleTab(tab)}
                                            className={`text-[10px] font-black uppercase tracking-[0.2em] pb-5 relative transition-all ${
                                                bundleTab === tab ? 'text-[#6C3BFF]' : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                        >
                                            {tab} ({bundleData?.summary?.[tab] || 0})
                                            {bundleTab === tab && (
                                                <motion.div layoutId="subTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#6C3BFF] rounded-full shadow-[0_2px_10px_rgba(108,59,255,0.4)]" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/20">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-10 py-6 w-10">
                                                    <div className="w-5 h-5 rounded border-2 border-slate-200" />
                                                </th>
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Identity</th>
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Judge Status</th>
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Authorization</th>
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Score Aggregate</th>
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {(bundleData?.[bundleTab] || []).length > 0 ? (
                                                bundleData[bundleTab].map((item: any, idx: number) => (
                                                    <motion.tr 
                                                        key={item.team_id || idx}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.03 }}
                                                        className="hover:bg-slate-50/30 transition-colors group"
                                                    >
                                                        <td className="px-10 py-8">
                                                            <div className="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-[#6C3BFF] transition-all" />
                                                        </td>
                                                        <td className="px-10 py-8">
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-slate-900 text-lg tracking-tight group-hover:text-[#6C3BFF] transition-colors">
                                                                    {item.team_name}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                                    {item.source === 'portal_application' ? 'Portal Application' : 'Event Participant'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-8">
                                                            <div className="flex flex-col gap-2">
                                                                {item.total_judges > 0 || item.score > 0 ? (
                                                                    <>
                                                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider w-fit ${item.judges_completed >= item.total_judges ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                                                        <CheckCircle2 size={12} />
                                                                        {item.judges_completed}/{item.total_judges} Judges Verified
                                                                    </div>
                                                                    <div className="text-center mt-2">
                                                                        <span className="text-lg font-bold text-slate-900">{item.score || 0}%</span>
                                                                    </div>
                                                                    </>
                                                                ) : null}
                                                                <button 
                                                                    onClick={() => handleOpenJudgeAssignment(item.submission_id || item.team_id)}
                                                                    className="text-[10px] font-black text-[#6C3BFF] uppercase tracking-widest hover:underline flex items-center gap-2 transition-all w-fit"
                                                                >
                                                                    <Plus size={14} /> {item.total_judges > 0 ? 'Re-assign Judge' : 'Assign Judge'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-8 text-center">
                                                            {(() => {
                                                                const status = item.status || 'Pending';
                                                                const s = status.toLowerCase();
                                                                let colors = "bg-slate-50 text-slate-400 border-slate-100";
                                                                if (s === 'approved' || s === 'accepted') colors = "bg-emerald-50 text-emerald-600 border-emerald-100";
                                                                if (s === 'shortlisted') colors = "bg-blue-50 text-blue-600 border-blue-100";
                                                                if (s === 'rejected') colors = "bg-rose-50 text-rose-600 border-rose-100";
                                                                
                                                                return (
                                                                    <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${colors}`}>
                                                                        {status}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="px-10 py-8">
                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                <span className={`text-base font-black ${item.score >= 80 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                                    {item.score || 0}%
                                                                </span>
                                                                <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className="h-full bg-[#6C3BFF] shadow-[0_0_10px_rgba(108,59,255,0.4)] transition-all duration-1000" 
                                                                        style={{ width: `${item.score || 0}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-8 text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                {(() => {
                                                                    const status = (item.status || '').toLowerCase();
                                                                    if (status === 'approved') {
                                                                        return <div className="text-emerald-600 text-xs font-black uppercase">Approved</div>;
                                                                    }
                                                                    if (status === 'rejected') {
                                                                        return <div className="text-rose-600 text-xs font-black uppercase">Rejected</div>;
                                                                    }
                                                                    if (status === 'shortlisted') {
                                                                        return (
                                                                            <>
                                                                                <button 
                                                                                    onClick={() => handleUpdateStatus(item.team_id, 'Approved', item)}
                                                                                    className="p-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                                                    title="Approve"
                                                                                >
                                                                                    <CheckCircle2 size={18} />
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => handleUpdateStatus(item.team_id, 'Rejected', item)}
                                                                                    className="p-3 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                                                    title="Reject"
                                                                                >
                                                                                    <XCircle size={18} />
                                                                                </button>
                                                                            </>
                                                                        );
                                                                    }
                                                                    // Default: show all buttons for pending status
                                                                    return (
                                                                        <>
                                                                            <button 
                                                                                onClick={() => handleUpdateStatus(item.team_id, 'Approved', item)}
                                                                                className="p-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                                                title="Approve"
                                                                            >
                                                                                <CheckCircle2 size={18} />
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => handleUpdateStatus(item.team_id, 'Rejected', item)}
                                                                                className="p-3 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                                                title="Reject"
                                                                            >
                                                                                <XCircle size={18} />
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => handleUpdateStatus(item.team_id, 'Shortlisted', item)}
                                                                                className="p-3 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                                                title="Shortlist"
                                                                            >
                                                                                <Star size={18} />
                                                                            </button>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-10 py-24 text-center">
                                                        <div className="flex flex-col items-center opacity-20">
                                                            <Filter size={64} className="mb-6" />
                                                            <p className="font-black text-[11px] uppercase tracking-[0.3em]">No items found in {bundleTab} protocol</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            /* Phase Deliverables View */
                            <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/20">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Team/Participant</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Details</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Evaluation Dispatched</th>
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
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                        {sub.team_id ? 'Team Deliverable' : 'Solo Submission'}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-3">
                                                        {sub.data?.file_url ? (
                                                            <button 
                                                                onClick={() => setPreviewAsset({
                                                                    url: sub.data.file_url.startsWith('http') ? sub.data.file_url : `${API_BASE_URL}${sub.data.file_url}`,
                                                                    filename: sub.data.filename || 'Deliverable',
                                                                    type: 'file'
                                                                })}
                                                                className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                                                            >
                                                                <Eye size={14} /> Preview Asset
                                                            </button>
                                                        ) : sub.data?.url ? (
                                                            <a href={sub.data.url} target="_blank" rel="noreferrer" className="px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-[#6C3BFF] transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                                <ExternalLink size={14} /> View Submission
                                                            </a>
                                                        ) : (
                                                            <span className="text-slate-300 italic text-xs font-bold">No assets found</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="space-y-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            {(sub.assigned_judge_emails || []).length > 0 ? (
                                                                sub.assigned_judge_emails.map((email: string, i: number) => (
                                                                    <div key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 text-[9px] font-black uppercase tracking-wider flex items-center gap-2">
                                                                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                                                                        {email.split('@')[0]}
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <button 
                                                                    onClick={() => handleOpenJudgeAssignment(sub._id)}
                                                                    className="px-3 py-1.5 bg-white text-[#6C3BFF] border border-[#6C3BFF]/20 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-[#6C3BFF] hover:text-white transition-all"
                                                                >
                                                                    + Assign Evaluator
                                                                </button>
                                                            )}
                                                        </div>
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
                                                    <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Live Sync Active</div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-10 py-24 text-center">
                                                    <div className="flex flex-col items-center opacity-20">
                                                        <FileText size={64} className="mb-6" />
                                                        <p className="font-black text-[11px] uppercase tracking-[0.3em]">No phase deliverables detected yet</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
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
            case 'prizes':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-12 bg-slate-900 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                <div>
                                    <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-4 w-fit">Reward Protocol</div>
                                    <h3 className="text-4xl font-black tracking-tighter">Prizes & Incentives</h3>
                                    <p className="text-slate-400 mt-4 max-w-sm text-lg opacity-80 font-medium">Configure and dispatch rewards for winners and top performers.</p>
                                </div>
                                <button className="px-10 py-5 bg-[#6C3BFF] text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:scale-[1.05] transition-all shadow-2xl shadow-purple-900/40">Add Reward Category</button>
                            </div>
                            <Trophy size={180} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { rank: 'First Place', reward: '$5,000 + Gold Medal', color: 'text-amber-500', bg: 'bg-amber-50', icon: Trophy },
                                { rank: 'Runner Up', reward: '$2,500 + Silver Medal', color: 'text-slate-400', bg: 'bg-slate-50', icon: Award },
                                { rank: 'Third Place', reward: '$1,000 + Bronze Medal', color: 'text-orange-600', bg: 'bg-orange-50', icon: ShieldCheck }
                            ].map((p, i) => (
                                <div key={i} className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden border-b-4 border-transparent hover:border-b-[#6C3BFF]">
                                    <div className={`w-16 h-16 ${p.bg} ${p.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all shadow-inner`}>
                                        <p.icon size={32} />
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-900 mb-2">{p.rank}</h4>
                                    <p className="text-slate-500 font-bold text-sm leading-relaxed">{p.reward}</p>
                                    <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Locked Stage</span>
                                        <button className="text-[10px] font-black text-[#6C3BFF] uppercase tracking-widest">Edit Rules</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return <div className="py-32 text-center text-slate-300 font-black text-xs uppercase tracking-[0.3em] opacity-40">Section Initializing...</div>;
        }
    };

    return (
        <div className="space-y-10 max-w-7xl mx-auto animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    {role !== 'judge' && (
                        <button onClick={onBack} className="p-4 bg-white border border-slate-100 rounded-3xl text-slate-400 hover:text-[#6C3BFF] hover:shadow-xl transition-all active:scale-95">
                            <ArrowLeft size={28} />
                        </button>
                    )}
                    <div>
                         <div className="flex items-center gap-3 mb-1">
                             <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{event.title}</h1>
                             <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Live Portal</div>
                         </div>
                         <p className="text-slate-500 text-sm font-bold flex items-center gap-6"><span className="flex items-center gap-2 text-[#6C3BFF]"><MapPin size={16} /> Hybrid Environment</span><span className="flex items-center gap-2"><Users size={16} /> {event.participant_count || 0} Authenticated Participants</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {role !== 'judge' && (
                        <button 
                            onClick={handleSaveEvent} 
                            disabled={saving} 
                            className={`px-10 py-5 ${showSaveSuccess ? 'bg-emerald-500' : hasUnsavedChanges ? 'bg-[#6C3BFF] animate-pulse' : 'bg-slate-900'} text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest hover:scale-[1.05] active:scale-95 transition-all shadow-2xl shadow-black/10 flex items-center gap-3 relative`}
                        >
                            {hasUnsavedChanges && !saving && !showSaveSuccess && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-[8px] border-2 border-white animate-bounce shadow-lg">!</div>
                            )}
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : showSaveSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                            {saving ? 'Syncing...' : showSaveSuccess ? 'Vaulted' : hasUnsavedChanges ? 'Sync Changes' : 'All Changes Saved'}
                        </button>
                    )}
                </div>
            </div>

            {/* Bulk Action Bar */}
            <FramerAnimatePresence>
                {selectedSubmissions.length > 0 && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-6"
                    >
                        <div className="bg-slate-900 text-white rounded-[2.5rem] p-4 shadow-2xl flex items-center justify-between gap-6 border border-white/10 backdrop-blur-xl bg-opacity-95">
                            <div className="flex items-center gap-6 pl-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selection Active</span>
                                    <span className="text-xl font-black">{selectedSubmissions.length} <span className="text-slate-500">Teams Selected</span></span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 pr-2">
                                <button 
                                    onClick={() => handleOpenJudgeAssignment('bulk')}
                                    className="px-8 py-4 bg-[#6C3BFF] hover:bg-[#5a2ee6] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg shadow-purple-500/20"
                                >
                                    <Gavel size={16} />
                                    Assign Judge to Group
                                </button>
                                <button 
                                    onClick={() => setSelectedSubmissions([])}
                                    className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </FramerAnimatePresence>

            {role !== 'judge' && (
                <div className="flex items-center gap-1.5 bg-slate-100/40 p-2 rounded-[2.5rem] overflow-x-auto no-scrollbar shadow-inner backdrop-blur-md">
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-8 py-4 rounded-[1.8rem] font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white text-[#6C3BFF] shadow-2xl shadow-purple-200' : 'text-slate-400 hover:text-slate-600'}`}>
                            <tab.icon size={20} className={activeTab === tab.id ? 'text-[#6C3BFF]' : 'text-slate-300'} /> {tab.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="bg-white/40 backdrop-blur-xl border border-white/20 p-2.5 rounded-[4rem] shadow-2xl shadow-slate-200/50">
                <div className="bg-white p-12 rounded-[3.5rem] shadow-inner min-h-[600px] border border-slate-50">
                                        <FramerAnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderTabContent()}
                        </motion.div>
                    </FramerAnimatePresence>
                </div>
            </div>

            <QuizDesignerModal 
                isOpen={isQuizModalOpen} 
                onClose={() => setIsQuizModalOpen(false)} 
                onSave={handleCreateQuiz}
                loading={isCreatingQuiz}
            />

            {/* Asset Preview Modal */}
            <FramerAnimatePresence>
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
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Institutional Asset Intelligence Protocol • Secure Preview</p>
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
                                        <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
                                            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center text-5xl">📎</div>
                                            <div className="text-center space-y-2">
                                                <p className="text-xl font-black text-slate-900">{previewAsset.filename}</p>
                                                <p className="text-sm text-slate-500 font-medium">Preview not available for this file type</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <a 
                                                    href={previewAsset.url} 
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg"
                                                >
                                                    <ExternalLink size={18} /> Open File
                                                </a>
                                                <a 
                                                    href={previewAsset.url} 
                                                    download 
                                                    className="flex items-center gap-2 px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                                >
                                                    <Download size={18} /> Download
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </FramerAnimatePresence>
            
            {/* Judge Assignment Modal */}
            {judgeAssignmentModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70]">
                    <div className="bg-white rounded-[3rem] p-10 max-w-md w-full mx-4 shadow-2xl border border-slate-100">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                {judgeAssignmentModal.submissionId === 'bulk' ? 'Bulk Assignment' : 'Assign Judge'}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {judgeAssignmentModal.submissionId === 'bulk' ? `Assigning to ${selectedSubmissions.length} projects` : 'Single Project Evaluation'}
                            </p>
                        </div>
                        <div className="space-y-4 max-h-64 overflow-y-auto">
                            {availableJudges.length > 0 ? (
                                availableJudges.map((judge: any) => (
                                    <div key={judge._id} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold text-slate-900">{judge.name || 'Unknown Judge'}</h4>
                                                <p className="text-sm text-slate-600">{judge.email}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleAssignJudge(judge._id, judge.email)}
                                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                                                >
                                                    Assign
                                                </button>
                                                {judgeAssignmentModal.submissionId !== 'bulk' && (
                                                    <button 
                                                        onClick={() => copyToClipboard(`${window.location.origin}/evaluate/${judgeAssignmentModal.submissionId}`)}
                                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                                        title="Copy Evaluation Link"
                                                    >
                                                        <Copy size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                        <UserPlus size={24} />
                                    </div>
                                    <p className="text-slate-600 font-bold">No judges available</p>
                                    <p className="text-xs text-slate-400 mt-2 max-w-[200px] mx-auto">Invite professional evaluators to review this submission.</p>
                                    <button 
                                        onClick={() => setIsJudgeInviteOpen(true)}
                                        className="mt-6 px-6 py-3 bg-[#6C3BFF] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-purple-500/20"
                                    >
                                        Invite New Judge
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button 
                                onClick={() => setIsJudgeInviteOpen(true)}
                                className="flex-1 py-3 border border-slate-100 text-[#6C3BFF] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                                Add Another
                            </button>
                            <button 
                                onClick={() => setJudgeAssignmentModal({ isOpen: false, submissionId: null })}
                                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <JudgeInviteModal 
                isOpen={isJudgeInviteOpen}
                onClose={() => setIsJudgeInviteOpen(false)}
                onInvite={handleInviteJudge}
                loading={isInvitingJudge}
            />
        </div>
    );
};

export default EventDetails;
