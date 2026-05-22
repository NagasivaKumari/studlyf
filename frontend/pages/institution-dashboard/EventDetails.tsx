import React, { useState, useEffect } from 'react';
import { API_BASE_URL, authHeaders } from '../../apiConfig';
import EmailTemplatesManager from './components/EmailTemplatesManager';
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
    Eye, EyeOff,
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
    Trash2,
    Zap,
    Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence as FramerAnimatePresence } from 'framer-motion';
import LeaderboardPage from './LeaderboardPage';
import { useNavigate } from 'react-router-dom';
import StageBuilder from './components/StageBuilder';
import QuizDesignerModal from './components/QuizDesignerModal';
import JudgeInviteModal from './components/JudgeInviteModal';
import EvaluationMatrixView from './components/EvaluationMatrixView';
import PipelineView from './components/PipelineView';
import HackathonEventPackage from './components/HackathonEventPackage';
import { IEvent, IParticipant, ITeam, IStage, ISubmission } from '../../types/event';
import { useAuth } from '../../AuthContext';
import { sanitizePresentationHtml } from '../../utils/text';

interface EventDetailsProps {
    eventId: string | null;
    onBack: () => void;
    institutionId?: string;
    initialSection?: string;
    onEditEvent?: (eventId: string) => void;
}

const BUNDLE_TABS = ['shortlisted', 'approved', 'pending', 'rejected'] as const;
const BUNDLE_TAB_LABEL: Record<string, string> = {
    shortlisted: 'Shortlisted',
    approved: 'Approved',
    pending: 'Pending',
    rejected: 'Rejected',
};

const EventDetails: React.FC<EventDetailsProps> = ({ eventId, onBack, institutionId: institutionIdProp, initialSection, onEditEvent }) => {
    const navigate = useNavigate();
    const { user, role } = useAuth();
    const [activeTab, setActiveTab] = useState(initialSection || 'dashboard');
    const [event, setEvent] = useState<IEvent | null>(null);
    const [institution, setInstitution] = useState<any>(null);
    const [participants, setParticipants] = useState<IParticipant[]>([]);
    const [stages, setStages] = useState<IStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [criteria, setCriteria] = useState<any[]>([]);
    const [bundleData, setBundleData] = useState<any>(null);
    const [threshold, setThreshold] = useState(0);
    const [debouncedThreshold, setDebouncedThreshold] = useState(0);
    const [bundleTab, setBundleTab] = useState<string>('shortlisted');
    const [teams, setTeams] = useState<ITeam[]>([]);
    const [submissions, setSubmissions] = useState<ISubmission[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (initialSection) setActiveTab(initialSection);
    }, [initialSection, eventId]);
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

    const [hackathonPackageEnabled, setHackathonPackageEnabled] = useState(false);
    const [hackathonSubmissions, setHackathonSubmissions] = useState<any[]>([]);
    const [domainFilter, setDomainFilter] = useState('All Domains');
    const [judgeFilter, setJudgeFilter] = useState('All Judges');
    const [institutionJudges, setInstitutionJudges] = useState<any[]>([]);
    const [isBulkNotifyModalOpen, setIsBulkNotifyModalOpen] = useState(false);
    const [bulkNotifyMessage, setBulkNotifyMessage] = useState('');
    const [bulkNotifySubject, setBulkNotifySubject] = useState('');
    const [bulkNotifyNextStage, setBulkNotifyNextStage] = useState('');
    const [bulkNotifyTemplates, setBulkNotifyTemplates] = useState<any[]>([]);
    const [bulkNotifySelectedTemplate, setBulkNotifySelectedTemplate] = useState<string>('default');
    const [bulkNotifyMinScore, setBulkNotifyMinScore] = useState<string>('');
    const [showBulkPreview, setShowBulkPreview] = useState(false);

    const normalizeStageType = (rawType?: string) => {
        const cleaned = String(rawType || '').trim();
        if (!cleaned) return 'CUSTOM';
        const normalized = cleaned.replace(/\s+/g, '_').toUpperCase();
        switch (normalized) {
            case 'REGISTRATION':
            case 'TEAM_FORMATION':
            case 'QUIZ':
            case 'SUBMISSION':
            case 'REVIEW':
            case 'FINAL':
            case 'CUSTOM':
                return normalized;
            default:
                return 'CUSTOM';
        }
    };

    const buildUiFieldsFromBackend = (fields: any[]) =>
        fields.map((field: any, idx: number) => ({
            id: String(field.field_id || field.id || field.label || `field-${idx}`),
            label: String(field.label || field.field_id || 'Field'),
            type: String(field.field_type || field.type || 'text'),
            required: field.required !== false,
            placeholder: field.placeholder || field.help_text || '',
        }));

    const buildBackendFieldsFromConfig = (stage: IStage) => {
        const configFields = Array.isArray(stage.config?.fields) ? stage.config.fields : [];
        if (configFields.length === 0) {
            const existing = (stage as any).fields;
            return Array.isArray(existing) ? existing : [];
        }
        return configFields.map((field: any) => ({
            field_id: field.id,
            label: field.label,
            field_type: field.type,
            required: field.required !== false,
            placeholder: field.placeholder || '',
            help_text: field.helpText || field.description || '',
            options: field.options,
            max_length: field.maxLength,
        }));
    };

    const DEFAULT_SHORTLIST_MESSAGE = '';

    /** Fetch judges for this institution from the judges collection */
    const fetchJudges = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/judges/`, { headers: authHeaders() });
            if (res.ok) {
                const data = await res.json();
                // Filter by institution_id matching current institution
                const instId = institutionIdProp || user?.institution_id;
                const filtered = instId ? data.filter((j: any) => j.institution_id === instId) : data;
                setInstitutionJudges(filtered);
            }
        } catch (e) {
            console.error('Failed to fetch judges:', e);
        }
    };

    useEffect(() => {
        const fetchPackageStatus = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/institution/hackathon/package-status`, { headers: authHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    setHackathonPackageEnabled(!!data.enabled);
                }
            } catch { /* silent */ }
        };
        fetchPackageStatus();
    }, []);

    // Fetch judges whenever refreshCounter changes or on mount
    useEffect(() => {
        fetchJudges();
    }, [refreshCounter, institutionIdProp, user?.institution_id]);

    const [notifying, setNotifying] = useState(false);
    const [evaluatingSubmission, setEvaluatingSubmission] = useState<any>(null);
    const [evaluationScores, setEvaluationScores] = useState<Record<string, number>>({});
    const [evaluationComment, setEvaluationComment] = useState('');
    
    // Track unsaved changes to lifecycle or criteria
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        if (!event) return;
        const stagesChanged = JSON.stringify(stages) !== JSON.stringify(event.stages);
        const criteriaChanged = JSON.stringify(criteria) !== JSON.stringify(event.judging_criteria);
        setHasUnsavedChanges(stagesChanged || criteriaChanged);
    }, [stages, criteria, event]);
    
    // Auto-save logic
    useEffect(() => {
        if (!hasUnsavedChanges || saving) return;
        
        const autoSaveTimer = setTimeout(() => {
            console.log('AUTO-SAVE: Triggering synchronization...');
            handleSaveEvent();
        }, 3000); // 3 seconds debounce for auto-save

        return () => clearTimeout(autoSaveTimer);
    }, [hasUnsavedChanges, stages, criteria]);

    useEffect(() => {
        if (eventId) {
            const fetchHackathonSubs = async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/api/hackathons/events/${eventId}/submissions`, {
                        headers: { ...authHeaders() }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setHackathonSubmissions(Array.isArray(data) ? data : []);
                    }
                } catch (err) {
                    // Not all events have hackathon submissions — that's fine
                }
            };
            fetchHackathonSubs();
        }
    }, [eventId, refreshCounter]);
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
                
                // Proactively strip ProseMirror attributes (like data-start, data-end, data-section-id) to make the text clean and readable
                if (eventData && typeof eventData.description === 'string') {
                    eventData.description = eventData.description
                        .replace(/data-start="[^"]*"/g, '')
                        .replace(/data-end="[^"]*"/g, '')
                        .replace(/data-section-id="[^"]*"/g, '')
                        .replace(/&amp;/g, '&')
                        .replace(/\s\s+/g, ' ')
                        .trim();
                }
                
                setEvent(eventData);
                setStages(
                    (Array.isArray(eventData.stages) ? eventData.stages : []).map((s: any, idx: number) => ({
                        ...s,
                        // Critical: ensure stable id so edits don't apply to every row
                        id: s?.id || `${eventId}-${idx}-${Math.random().toString(36).slice(2, 9)}`,
                        roundMode: s?.roundMode || s?.mode || s?.round_mode || '',
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

                // Fetch teams for overview
                try {
                    const teamsRes = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/teams`, { headers: { ...authHeaders() } });
                    const teamsData = await teamsRes.json();
                    setTeams(Array.isArray(teamsData) ? teamsData : []);
                } catch { setTeams([]); }

                // Fetch submissions for overview
                try {
                    const subRes = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/submissions`, { headers: { ...authHeaders() } });
                    const subData = await subRes.json();
                    setSubmissions(Array.isArray(subData) ? subData : []);
                } catch { setSubmissions([]); }
                
                // Only use judging criteria from DB — no static fallback
                setCriteria(eventData.judging_criteria || []);
            } catch (err) {
                console.error("Failed to load event data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [eventId, refreshCounter]);

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
        const scoreRaw = window.prompt('Manual score (%)');
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
                        // Removed alert and reload to prevent logout/flicker
                    } else {
                        const errorData = await syncRes.json().catch(() => ({}));
                        console.error('DIRECT SYNC: Force update failed:', errorData);
                    }
                } catch (syncErr) {
                    console.error('DIRECT SYNC: Network error:', syncErr);
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

    // Helper to resolve dynamic or absolute image URLs to the correct backend host
    const getImageUrl = (url: string | undefined) => {
        if (!url) return '';
        if (url.includes('/uploads/')) {
            const path = url.substring(url.indexOf('/uploads/'));
            return `${API_BASE_URL}${path}`;
        }
        return url;
    };

    // Logo / banner upload handler (used in Basic Info tab)
    const handleMediaUpload = async (file: File, field: 'logo_url' | 'banner_url') => {
        if (!eventId) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('field', field);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/upload-media`, {
                method: 'POST',
                headers: { ...authHeaders() },
                body: formData,
            });
            const data = await res.json();
            console.log('[MediaUpload] response OK', { field, url: data.url, data });
            setEvent((prev: any) => {
                const updated = prev ? { ...prev, [field]: data.url } : prev;
                console.log('[MediaUpload] updated event state', { field, url: data.url, updated });
                return updated;
            });
            setShowSaveSuccess(true);
            if (!res.ok) {
                alert('Upload failed: ' + (data.detail || 'Unknown error'));
                return;
            }
        } catch (err) {
            console.error('[MediaUpload] network error', err);
            alert('Network error during upload.');
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
            const bodyPayload: Record<string, any> = { ...quizData, stage_id: quizStageId };
            if (stage?.config?.pass_mark != null) {
                bodyPayload.pass_mark = Number(stage.config.pass_mark);
            }
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/quizzes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify(bodyPayload),
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

        const stageInfo = getCurrentStageInfo();
        if (!stageInfo.next_stage_name) {
            alert('No next stage available for this event. Define stages first.');
            return;
        }
        const nextStageName = stageInfo.next_stage_name;
        
        setBulkNotifyNextStage(nextStageName);
        setBulkNotifySubject(`Congratulations! You've been shortlisted for ${event?.title || ''}`);
        setBulkNotifyMessage(DEFAULT_SHORTLIST_MESSAGE.replace(/{next_stage}/g, nextStageName));
        setBulkNotifySelectedTemplate('default');
        setBulkNotifyMinScore('');
        // Fetch available templates
        try {
            const tmplRes = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/email-templates`, {
                headers: { ...authHeaders() }
            });
            if (tmplRes.ok) {
                const tmplData = await tmplRes.json();
                setBulkNotifyTemplates(tmplData.filter((t: any) => ['stage_advancement', 'announcement'].includes(t.type)));
            }
        } catch (e) {}
        setIsBulkNotifyModalOpen(true);
    };

    const confirmBulkDispatch = async () => {
        const currentBundle = bundleData?.[bundleTab] || [];
        const teamIds = currentBundle.map((item: any) => item.team_id);
        
        setNotifying(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${eventId}/bulk-notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ 
                    team_ids: teamIds, 
                    next_stage: bulkNotifyNextStage,
                    custom_message: bulkNotifyMessage,
                    subject: bulkNotifySubject,
                    min_score: bulkNotifyMinScore ? Number(bulkNotifyMinScore) : undefined
                })
            });

            if (res.ok) {
                const result = await res.json();
                alert(`Successfully dispatched notifications to ${result.sent_to} candidates/teams!`);
                setIsBulkNotifyModalOpen(false);
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
                if (eventData && typeof eventData.description === 'string') {
                    eventData.description = eventData.description
                        .replace(/data-start="[^"]*"/g, '')
                        .replace(/data-end="[^"]*"/g, '')
                        .replace(/data-section-id="[^"]*"/g, '')
                        .replace(/&amp;/g, '&')
                        .replace(/\s\s+/g, ' ')
                        .trim();
                }
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
        const stageName = sortedStages[activeStageIndex]?.name || '';
        const isFinalStage = stageNumber === totalStages && totalStages > 0;
        
        // Get next stage name if available (for "advance to" messages)
        const nextStageIndex = activeStageIndex + 1;
        const nextStageName = nextStageIndex < totalStages 
            ? sortedStages[nextStageIndex]?.name || ''
            : "";
        
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
            const targetIds = isBulk ? selectedSubmissions : [String(judgeAssignmentModal.submissionId || '')].filter(Boolean);
            const hackathonIdSet = new Set((hackathonSubmissions || []).map((s: any) => String(s?._id || s?.id || s?.submissionId)));
            const isHackathonSubmission = targetIds.length > 0 && targetIds.every((id) => hackathonIdSet.has(String(id)));

            // Hackathon submissions live in hackathon_submissions -> use hackathon assignment endpoint
            // Legacy submissions use /api/judges/assign (submission_data_col pipeline)
            const res = isHackathonSubmission
                ? await fetch(`${API_BASE_URL}/api/hackathons/submissions/assign-judge`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json', ...authHeaders() },
                      body: JSON.stringify({ submission_ids: targetIds, judge_id: judgeId }),
                  })
                : await fetch(`${API_BASE_URL}/api/judges/assign`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', ...authHeaders() },
                      body: JSON.stringify(
                          isBulk
                              ? { judge_id: judgeId, submission_ids: selectedSubmissions }
                              : { judge_id: judgeId, submission_id: judgeAssignmentModal.submissionId }
                      ),
                  });

            if (res.ok) {
                const result = await res.json();
                
                let msg = isBulk ? `Successfully assigned judge to ${selectedSubmissions.length} projects!` : 'Judge assigned successfully!';
                
                // NEW: Handle email delivery feedback
                if (result?.email_sent === false) {
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

    const handleDeleteJudge = async (judgeId: string) => {
        if (!window.confirm('Remove this judge?')) return;
        try {
            await fetch(`${API_BASE_URL}/api/judges/${judgeId}`, {
                method: 'DELETE',
                headers: authHeaders()
            });
            setRefreshCounter(prev => prev + 1);
        } catch (e) {
            console.error('Delete judge error:', e);
        }
    };

    const handleInviteJudge = async (judgeData: any) => {
        setIsInvitingJudge(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/judges/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    name: judgeData.name,
                    domain: judgeData.expertise,
                    institution_id: institutionIdProp || user?.institution_id,
                    is_test: false
                })
            });
            if (res.ok) {
                setIsJudgeInviteOpen(false);
                setRefreshCounter(prev => prev + 1); // triggers fetchJudges
            } else {
                const error = await res.json();
                alert(error.detail || 'Failed to add judge');
            }
        } catch (error) {
            console.error('Error adding judge:', error);
            alert('Network error while adding judge');
        } finally {
            setIsInvitingJudge(false);
        }
    };

    const handleEvaluateSubmission = async () => {
        if (!evaluatingSubmission || !user) return;
        try {
            const payload = {
                judgeId: user.user_id,
                rubricScores: evaluationScores,
                feedback: evaluationComment
            };
            const res = await fetch(`${API_BASE_URL}/api/hackathons/submissions/${evaluatingSubmission._id}/evaluate`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setEvaluatingSubmission(null);
                setRefreshCounter(prev => prev + 1);
                alert("Evaluation submitted!");
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to submit evaluation");
            }
        } catch (err) {
            console.error("Evaluation error:", err);
            alert("Network error while submitting evaluation");
        }
    };

    const handleBulkAssign = async (judgeId: string, specificIds?: string[]) => {
        const targetIds = specificIds || selectedSubmissions;
        if (targetIds.length === 0) {
            alert("Please select at least one submission");
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/hackathons/submissions/assign-judge`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    submission_ids: targetIds,
                    judge_id: judgeId
                })
            });
            if (res.ok) {
                setSelectedSubmissions([]);
                setRefreshCounter(prev => prev + 1);
                alert(`Judge assigned to ${targetIds.length} submission(s)`);
                setIsBulkMode(false);
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to assign judge");
            }
        } catch (err) {
            console.error("Bulk assign error:", err);
            alert("Network error while assigning judge");
        }
    };


    const tabs = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'basic', label: 'Basic Info', icon: Info },
        { id: 'stages', label: 'Stages & Timeline', icon: Clock },
        { id: 'teams', label: 'Teams', icon: Layers },
        { id: 'submissions', label: 'Submissions', icon: FileText },
        { id: 'criteria', label: 'Scoring Rubrics', icon: ShieldCheck },
        { id: 'evaluation-matrix', label: 'Evaluation Matrix', icon: TrendingUp },
        { id: 'leaderboard', label: 'Leaderboard', icon: BarChart3 },
        { id: 'pipeline', label: 'Pipeline', icon: Zap },
        ...(hackathonPackageEnabled ? [{ id: 'package', label: 'Event Package', icon: Lightbulb }] : []),
        { id: 'judges', label: 'Judges', icon: Gavel },
        { id: 'email-templates', label: 'Communications', icon: Mail },
    ];

    
    const renderTabContent_SubmissionManagement = () => {
        // Merge hackathon + regular submissions for ALL event types
        const allSubmissions = [
            ...(hackathonSubmissions || []).map((s: any) => ({ ...s, _sourceType: 'hackathon' })),
            ...(submissions || []).map((s: any) => ({ ...s, _sourceType: 'regular' })),
        ];
        const allDomains = [...new Set(allSubmissions.map(s => s.domain).filter(Boolean))];
        const domains = ['All Domains', ...allDomains];
        const filtered = allSubmissions.filter(s => {
            const name = s.teamName || s.team_name || s.user_name || '';
            const lead = s.teamLead || s.team_lead || '';
            const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || lead.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDomain = domainFilter === 'All Domains' || s.domain === domainFilter;
            const matchesJudge = judgeFilter === 'All Judges' || s.assignedJudgeId === judgeFilter;
            return matchesSearch && matchesDomain && matchesJudge;
        });

        return (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-12 bg-slate-900 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                    <div className="relative z-10">
                        <h3 className="text-4xl font-black tracking-tight mb-4">Submission Management</h3>
                        <p className="text-slate-400 font-bold max-w-xl leading-relaxed">Review submissions, assign judges, and evaluate in real-time.</p>
                    </div>
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px]"></div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-6 px-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search teams or leads..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-14 pr-8 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all w-80"
                            />
                        </div>
                        <select 
                            value={domainFilter}
                            onChange={(e) => setDomainFilter(e.target.value)}
                            className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-purple-50 transition-all"
                        >
                            {domains.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select 
                            value={judgeFilter}
                            onChange={(e) => setJudgeFilter(e.target.value)}
                            className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-purple-50 transition-all max-w-[200px] truncate"
                        >
                            <option value="All Judges">All Judges</option>
                            <option value="">Unassigned</option>
                            {institutionJudges.map(j => <option key={j._id} value={j._id}>{j.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsBulkMode(!isBulkMode)}
                            className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isBulkMode ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            Bulk Assignment
                        </button>
                        {isBulkMode && selectedSubmissions.length > 0 && (
                            <select 
                                onChange={(e) => handleBulkAssign(e.target.value)}
                                className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest outline-none shadow-xl cursor-pointer"
                            >
                                <option value="">Assign Judge to ({selectedSubmissions.length})</option>
                                {(institutionJudges || []).map((j: any) => (
                                    <option key={j._id} value={j._id}>{j.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/20">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                {isBulkMode && <th className="px-10 py-6 w-10"></th>}
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Detail</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Idea & Solution</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Judge</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Score</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.length > 0 ? (
                                filtered.map((sub, idx) => (
                                    <tr key={sub._id} className="hover:bg-slate-50/30 transition-colors group">
                                        {isBulkMode && (
                                            <td className="px-10 py-8">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedSubmissions.includes(sub._id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedSubmissions([...selectedSubmissions, sub._id]);
                                                        else setSelectedSubmissions(selectedSubmissions.filter(id => id !== sub._id));
                                                    }}
                                                    className="w-5 h-5 rounded border-2 border-slate-200 text-purple-600 focus:ring-purple-500"
                                                />
                                            </td>
                                        )}
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 text-lg tracking-tight">{sub.teamName}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lead: {sub.teamLead || "N/A"}</span>
                                                <span className="text-[9px] font-black text-purple-600 uppercase tracking-[0.2em] mt-2">{sub.domain}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 max-w-md">
                                            <div className="space-y-2">
                                                <p className="text-sm font-bold text-slate-800 line-clamp-2">{sub.problemStatement}</p>
                                                <div className="flex items-center gap-3">
                                                    <a href={sub.pptLink} target="_blank" className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-wider border border-amber-100"><FileText size={12} /> PPT</a>
                                                    {sub.githubLink && <a href={sub.githubLink} target="_blank" className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wider"><LinkIcon size={12} /> Git</a>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <select 
                                                    value={sub.assignedJudgeId || ""}
                                                    onChange={(e) => {
                                                        handleBulkAssign(e.target.value, [sub._id]);
                                                    }}
                                                    className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-purple-500"
                                                >
                                                    <option value="">No Judge Assigned</option>
                                                    {(institutionJudges || []).map((j: any) => (
                                                        <option key={j._id} value={j._id}>{j.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-2xl font-black text-purple-600">{(sub.totalScore || 0).toFixed(1)}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase">Avg Pts</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => {
                                                        setEvaluatingSubmission(sub);
                                                        const myEval = sub.evaluations?.find((e: any) => e.judgeId === user?.user_id);
                                                        setEvaluationScores(myEval?.scores || {});
                                                        setEvaluationComment(myEval?.comment || '');
                                                    }}
                                                    className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all shadow-sm"
                                                >
                                                    Evaluate
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={isBulkMode ? 6 : 5} className="px-10 py-32 text-center text-slate-300 font-black text-[10px] uppercase tracking-[0.4em]">No submissions match your filters</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderTabContent_HackathonParticipants = () => {
        // Build a flat list of all participants derived from hackathon submissions
        const allParticipants: { name: string; team: string; role: 'Team Lead' | 'Member' | 'Solo' }[] = [];
        hackathonSubmissions.forEach(sub => {
            const isTeam = sub.teamType === 'Team' || (sub.teamMembers && String(sub.teamMembers).trim().length > 0);
            if (sub.teamLead) {
                allParticipants.push({ name: sub.teamLead, team: sub.teamName, role: isTeam ? 'Team Lead' : 'Solo' });
            }
            if (sub.teamMembers) {
                const members: string[] = typeof sub.teamMembers === 'string'
                    ? sub.teamMembers.split(',').map((m: string) => m.trim()).filter(Boolean)
                    : (Array.isArray(sub.teamMembers) ? sub.teamMembers : []);
                members.forEach(name => {
                    if (name && name.toLowerCase() !== sub.teamLead?.toLowerCase()) {
                        allParticipants.push({ name, team: sub.teamName, role: 'Member' });
                    }
                });
            }
        });

        const filtered = allParticipants.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.team.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-12 bg-blue-900 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-4xl font-black tracking-tight mb-4">Event Participants</h3>
                            <p className="text-blue-200 font-bold max-w-xl leading-relaxed">All individuals from submitted projects — team leads and members.</p>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="text-center">
                                <span className="text-5xl font-black">{allParticipants.length}</span>
                                <p className="text-blue-300 text-xs font-black uppercase tracking-widest mt-1">Total People</p>
                            </div>
                            <div className="text-center">
                                <span className="text-5xl font-black">{hackathonSubmissions.length}</span>
                                <p className="text-blue-300 text-xs font-black uppercase tracking-widest mt-1">Teams</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px]"></div>
                </div>

                <div className="px-4">
                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or team..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-14 pr-8 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all w-full md:w-96"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/20">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Team</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.length > 0 ? (
                                filtered.map((p, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-10 py-6 text-sm font-black text-slate-300">{idx + 1}</td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm border border-blue-100">
                                                    {p.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-black text-slate-900">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-sm font-bold text-slate-500">{p.team}</td>
                                        <td className="px-10 py-6">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                p.role === 'Team Lead' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                                                p.role === 'Solo' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                'bg-blue-50 text-blue-600 border border-blue-100'
                                            }`}>{p.role}</span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-10 py-32 text-center text-slate-300 font-black text-[10px] uppercase tracking-[0.4em]">No participants found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderTabContent_HackathonTeams = () => {
        // Parse each submission into a team row
        const teamRows = hackathonSubmissions.map(sub => {
            const memberNames: string[] = typeof sub.teamMembers === 'string'
                ? sub.teamMembers.split(',').map((m: string) => m.trim()).filter(Boolean)
                : (Array.isArray(sub.teamMembers) ? sub.teamMembers : []);
            // Deduplicate lead from members list
            const members = memberNames.filter(n => n.toLowerCase() !== (sub.teamLead || '').toLowerCase());
            const totalCount = (sub.teamLead ? 1 : 0) + members.length;
            return { ...sub, parsedMembers: members, totalCount };
        });

        const totalParticipants = teamRows.reduce((acc, t) => acc + t.totalCount, 0);

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-12 bg-purple-900 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-4xl font-black tracking-tight mb-3">Registered Teams</h3>
                            <p className="text-purple-200 font-bold">All teams and their members across this hackathon.</p>
                        </div>
                        <div className="flex items-center gap-10">
                            <div className="text-center">
                                <span className="text-5xl font-black">{teamRows.length}</span>
                                <p className="text-purple-300 text-xs font-black uppercase tracking-widest mt-1">Teams</p>
                            </div>
                            <div className="text-center">
                                <span className="text-5xl font-black">{totalParticipants}</span>
                                <p className="text-purple-300 text-xs font-black uppercase tracking-widest mt-1">Participants</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px]"></div>
                </div>

                <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/20">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/60 border-b border-slate-100">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Name</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Lead</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Members</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Domain</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Submitted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {teamRows.length > 0 ? teamRows.map((team, idx) => (
                                <tr key={idx} className="hover:bg-purple-50/20 transition-colors">
                                    <td className="px-10 py-6 text-sm font-black text-slate-300">{idx + 1}</td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm border border-purple-100">
                                                {(team.teamName || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-black text-slate-900">{team.teamName}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-xs font-black border border-purple-100">
                                            {team.teamLead || '—'}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-sm font-bold text-slate-600 max-w-[220px]">
                                        {team.parsedMembers.length > 0
                                            ? team.parsedMembers.join(', ')
                                            : <span className="text-slate-300 italic">Solo</span>
                                        }
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                            {team.domain || '—'}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-center">
                                        <span className="w-8 h-8 bg-[#6C3BFF]/10 text-[#6C3BFF] rounded-xl flex items-center justify-center font-black text-sm mx-auto">
                                            {team.totalCount}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-right text-xs font-bold text-slate-400">
                                        {team.submittedAt ? new Date(team.submittedAt).toLocaleDateString() : '—'}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-10 py-32 text-center text-slate-300 font-black text-[10px] uppercase tracking-[0.4em]">
                                        No teams yet — they'll appear as submissions arrive
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderTabContent_Judges = () => (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-12 bg-amber-900 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="space-y-4">
                        <h3 className="text-4xl font-black tracking-tight">Event Judges</h3>
                        <p className="text-amber-200 font-bold max-w-xl leading-relaxed">{institutionJudges.length} judge{institutionJudges.length !== 1 ? 's' : ''} registered for this institution.</p>
                    </div>
                    <button
                        onClick={() => setIsJudgeInviteOpen(true)}
                        className="px-10 py-5 bg-white text-amber-900 rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-3"
                    >
                        <UserPlus size={20} /> Add Judge
                    </button>
                </div>
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-600/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 px-4">
                {institutionJudges.map((j: any, i: number) => (
                    <div key={j._id || i} className="p-10 bg-white border border-slate-100 rounded-[3.5rem] shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col">
                        <div className="flex justify-between items-start mb-8">
                            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center font-black text-2xl group-hover:bg-amber-600 group-hover:text-white transition-all shadow-inner border border-amber-100">
                                {(j.name || '?').charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{j.name}</h4>
                        <p className="text-sm font-bold text-purple-600 uppercase tracking-widest mb-8">{j.domain}</p>

                        <div className="pt-8 border-t border-slate-50 flex items-center justify-between mt-auto">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Added {j.created_at ? new Date(j.created_at).toLocaleDateString() : '—'}
                            </span>
                            <button
                                onClick={() => handleDeleteJudge(j._id)}
                                className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
                {institutionJudges.length === 0 && (
                    <div className="col-span-full py-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3.5rem] flex flex-col items-center justify-center text-center">
                        <Gavel size={64} className="text-slate-200 mb-6" />
                        <h4 className="text-xl font-black text-slate-400 uppercase tracking-widest">No Judges Added Yet</h4>
                        <p className="text-sm font-bold text-slate-300 mt-2">Click "Add Judge" to add your first evaluator.</p>
                    </div>
                )}
            </div>
        </div>
    );

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
                                { label: 'Registered Teams', val: hackathonSubmissions.length > 0 ? hackathonSubmissions.length : (teams?.length || 0), icon: Layers, color: 'text-[#6C3BFF]', bg: 'bg-purple-50', tab: 'teams' },
                                { label: 'Total Participants', val: hackathonSubmissions.length > 0 ? hackathonSubmissions.reduce((acc: number, sub: any) => {
                                    // Count unique members across all submissions
                                    const members = sub.teamMembers || sub.team_members || [];
                                    return acc + (members.length > 0 ? members.length : 1);
                                }, 0) : (participants?.length || 0), icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50', tab: 'participants' },
                                { label: 'Submissions', val: Math.max(hackathonSubmissions?.length || 0, submissions?.length || 0), icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50', tab: 'submissions' },
                                { label: 'Judges Active', val: institutionJudges.length, icon: Gavel, color: 'text-amber-600', bg: 'bg-amber-50', tab: 'judges' }
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
            case 'stages':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {hasUnsavedChanges && (
                            <div className="p-6 bg-amber-50 border border-amber-200 rounded-[2rem] flex items-center justify-between gap-6">
                                <div className="flex items-center gap-4 text-amber-900">
                                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shadow-inner">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold leading-tight">Unsaved Lifecycle Changes Detected</p>
                                        <p className="text-[10px] font-medium opacity-70 mt-0.5">Automated synchronization will trigger in 3 seconds, or click Sync Now.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSaveEvent}
                                    className="px-6 py-3 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-colors shadow-lg shadow-amber-900/10"
                                >
                                    Sync Now
                                </button>
                            </div>
                        )}
                        <StageBuilder stages={stages} onUpdate={setStages} onConfigureQuiz={openQuizForStage} availableJudges={institutionJudges} />
                    </div>
                );
            case 'teams':
                if (hackathonSubmissions.length > 0) return renderTabContent_HackathonTeams();
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
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
                        {/* Header Action Card */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                                    <Info size={28} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">Opportunity Information</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1">This opportunity's details are fully managed through the creation wizard.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => onEditEvent?.(event._id)}
                                className="flex items-center gap-2.5 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-purple-200"
                            >
                                <Edit3 size={14} /> Edit Opportunity
                            </button>
                        </div>

                        {/* Detailed Grid Card */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-10 space-y-10">
                            {/* Images Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Logo</span>
                                    <label className="group relative w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden p-4 cursor-pointer hover:border-purple-400 transition-all">
                                        {event.logo_url ? (
                                            <img src={getImageUrl(event.logo_url)} alt="Logo" className="max-w-full max-h-full object-contain" />
                                        ) : (
                                            <div className="text-slate-300 font-bold text-xs uppercase tracking-wider group-hover:text-purple-500 transition-colors">Click to upload Logo</div>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { await handleMediaUpload(f, 'logo_url'); e.target.value = ''; } }} />
                                    </label>
                                </div>
                                <div className="md:col-span-2 space-y-3">
                                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Banner</span>
                                    <label className="group relative w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-purple-400 transition-all">
                                        {event.banner_url ? (
                                            <img src={getImageUrl(event.banner_url)} alt="Banner" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-slate-300 font-bold text-xs uppercase tracking-wider group-hover:text-purple-500 transition-colors">Click to upload Banner</div>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { await handleMediaUpload(f, 'banner_url'); e.target.value = ''; } }} />
                                    </label>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                                <div className="space-y-2">
                                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Opportunity Title</span>
                                    <p className="text-[15px] font-black text-slate-800 leading-tight">{event.title || '—'}</p>
                                </div>

                                <div className="space-y-2">
                                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</span>
                                    <p className="text-[15px] font-black text-slate-800 leading-tight">{event.category || '—'}</p>
                                </div>

                                <div className="space-y-2">
                                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Opportunity Mode</span>
                                    <p className="text-[15px] font-black text-slate-800 leading-tight capitalize">{event.opportunityMode || '—'}</p>
                                </div>

                                {event.skills && (
                                    <div className="space-y-2">
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessed Skills</span>
                                        <p className="text-[15px] font-black text-slate-800 leading-tight">{event.skills}</p>
                                    </div>
                                )}

                                {event.prize_pool && (
                                    <div className="space-y-2">
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Prize Pool</span>
                                        <p className="text-[15px] font-black text-slate-800 leading-tight">{event.prize_pool}</p>
                                    </div>
                                )}
                            </div>

                            {/* Description / Strategic Overview */}
                            <div className="space-y-4 pt-8 border-t border-slate-50">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Overview</span>
                                <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem]">
                                    <div 
                                        className="opportunity-rich-text text-slate-600 font-medium leading-relaxed [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 [&_strong]:font-bold [&_em]:italic [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_a]:text-purple-600 [&_a]:underline outline-none"
                                        dangerouslySetInnerHTML={{ __html: sanitizePresentationHtml(event.description || '') }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'participants':
            case 'registrations':
                if (hackathonSubmissions.length > 0) return renderTabContent_HackathonParticipants();
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
            case 'judges':
                return renderTabContent_Judges();
            case 'submissions':
                return renderTabContent_SubmissionManagement();
            case '_submissions_legacy':
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
                                            Dynamically aggregate and approve candidate bundles using {event?.name || ''}'s scoring protocol. View deliverables or dispatch final authorizations.
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
                                                                const status = item.status || '';
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
                                                    {sub.status ? (
                                                        <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                                                            sub.status.toLowerCase() === 'submitted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                                        }`}>
                                                            {sub.status}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 text-[9px] font-black uppercase tracking-widest">—</span>
                                                    )}
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
            case 'submission-management':
                return renderTabContent_SubmissionManagement();

























            case 'criteria':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-12 bg-slate-900 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl border border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-4xl font-black tracking-tight mb-3">Scoring Rubrics</h3>
                                <p className="text-slate-400 font-bold">Define evaluation dimensions. Judges will score each team against these criteria.</p>
                            </div>
                            <button
                                onClick={() => {
                                    const newCriteria = [...criteria, { name: '', max_points: 10 }];
                                    setCriteria(newCriteria);
                                }}
                                className="px-8 py-4 bg-[#6C3BFF] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-purple-900/30 flex items-center gap-3 shrink-0"
                            >
                                <Plus size={18} /> Add Rubric
                            </button>
                        </div>

                        {criteria.length === 0 && (
                            <div className="py-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center">
                                <ShieldCheck size={56} className="text-slate-200 mb-4" />
                                <h4 className="text-lg font-black text-slate-400 uppercase tracking-widest">No Rubrics Yet</h4>
                                <p className="text-sm font-bold text-slate-300 mt-1">Click "Add Rubric" to define your first evaluation dimension.</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {criteria.map((criterion: any, idx: number) => (
                                <div key={idx} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex items-center gap-8 group hover:border-[#6C3BFF]/30 transition-all">
                                    <div className="w-14 h-14 bg-purple-50 text-[#6C3BFF] rounded-[1.2rem] flex items-center justify-center font-black text-lg shadow-inner shrink-0">{idx + 1}</div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dimension Name</label>
                                            <input
                                                value={criterion.name}
                                                onChange={(e) => {
                                                    const nc = [...criteria];
                                                    nc[idx] = { ...nc[idx], name: e.target.value };
                                                    setCriteria(nc);
                                                }}
                                                placeholder="e.g. Innovation, Technical Depth"
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Max Points</label>
                                            <input
                                                type="number"
                                                min={1} max={100}
                                                value={criterion.max_points}
                                                onChange={(e) => {
                                                    const nc = [...criteria];
                                                    nc[idx] = { ...nc[idx], max_points: parseInt(e.target.value) || 0 };
                                                    setCriteria(nc);
                                                }}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setCriteria(criteria.filter((_: any, i: number) => i !== idx))}
                                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-50 text-red-400 hover:bg-red-600 hover:text-white transition-all shrink-0"
                                        title="Remove"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {criteria.length > 0 && (
                            <div className="flex justify-end">
                                <button
                                    onClick={handleSaveEvent}
                                    className="px-10 py-5 bg-[#6C3BFF] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-purple-600/20"
                                >
                                    Save Rubrics
                                </button>
                            </div>
                        )}
                    </div>
                );
            case 'evaluation-matrix':
                return eventId ? <EvaluationMatrixView eventId={eventId} criteria={criteria} refreshCounter={refreshCounter} /> : null;
            case 'leaderboard':
                return <LeaderboardPage eventId={eventId} refreshCounter={refreshCounter} />;
            case 'pipeline':
                return <PipelineView eventId={eventId} stages={stages} />;
            case 'package':
            case 'problems':
                return <HackathonEventPackage institutionId={institutionIdProp} eventId={eventId} />;
            case 'email-templates':
                return <EmailTemplatesManager eventId={eventId} institutionId={institutionIdProp || ''} />;
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

            {!hackathonPackageEnabled && role !== 'judge' && (
                <div className="p-4 rounded-[2.5rem] bg-amber-50 border border-amber-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Lightbulb size={18} className="text-amber-600 shrink-0" />
                        <p className="text-sm font-bold text-amber-800">Enable the <span className="underline decoration-amber-400">Hackathon Event Package</span> in Settings → Plans &amp; Subscription to unlock Problem Statements, Team Selections, and Participant Portal features.</p>
                    </div>
                    <button onClick={() => navigate('/institution-dashboard/settings?section=plan')} className="shrink-0 px-5 py-3 rounded-full bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all">
                        Enable
                    </button>
                </div>
            )}

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

            {/* Bulk Notification Modal */}
            <FramerAnimatePresence>
                {isBulkNotifyModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Bulk Communication Hub</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Targeted: Shortlisted Members • Elite Protocol</p>
                                </div>
                                <button 
                                    onClick={() => setIsBulkNotifyModalOpen(false)}
                                    className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="flex-1 p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                                {/* Template selector */}
                                {bulkNotifyTemplates.length > 0 && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Template</label>
                                        <select
                                            value={bulkNotifySelectedTemplate}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setBulkNotifySelectedTemplate(val);
                                                if (val !== 'default') {
                                                    const t = bulkNotifyTemplates.find((tm: any) => tm._id === val);
                                                    if (t) {
                                                        setBulkNotifySubject(t.subject);
                                                        setBulkNotifyMessage(t.body_html);
                                                    }
                                                }
                                            }}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all outline-none"
                                        >
                                            <option value="default">Default Template (System)</option>
                                            {bulkNotifyTemplates.map((t: any) => (
                                                <option key={t._id} value={t._id}>
                                                    {t.name}{t.is_active ? ' (Active)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Subject</label>
                                    <input 
                                        value={bulkNotifySubject}
                                        onChange={(e) => setBulkNotifySubject(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all outline-none"
                                        placeholder="Enter email subject..."
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex justify-between">
                                        <span>Message Content</span>
                                        <span className="text-[#6C3BFF]">Personalization Active</span>
                                    </label>
                                    <textarea 
                                        value={bulkNotifyMessage}
                                        onChange={(e) => setBulkNotifyMessage(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all h-64 resize-none outline-none font-mono text-xs"
                                        placeholder="Compose your custom message..."
                                    />
                                                    <div className="flex flex-wrap gap-2 px-2">
                                                        {['{team_name}', '{event_name}', '{stage_name}', '{participant_name}'].map(tag => (
                                                            <button 
                                                                key={tag}
                                                                onClick={() => setBulkNotifyMessage(prev => prev + ' ' + tag)}
                                                                className="px-3 py-1.5 bg-purple-50 text-[#6C3BFF] rounded-lg text-[10px] font-black tracking-wider border border-purple-100 hover:bg-purple-600 hover:text-white transition-all"
                                                            >
                                                                + {tag}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Email Preview Toggle */}
                                                <div className="flex items-center gap-3 px-2">
                                                    <button
                                                        onClick={() => setShowBulkPreview(!showBulkPreview)}
                                                        className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                                            showBulkPreview ? 'bg-[#6C3BFF] text-white' : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {showBulkPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                                                        {showBulkPreview ? 'Hide Preview' : 'Preview Email'}
                                                    </button>
                                                    <span className="text-[10px] text-slate-400 font-bold">
                                                        Placeholders shown with sample data
                                                    </span>
                                                </div>

                                                {/* Live Preview */}
                                                {showBulkPreview && (
                                                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                                                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                                                            <Mail size={16} className="text-slate-400" />
                                                            <span className="text-xs font-bold text-slate-600">
                                                                To: <span className="text-slate-400">[recipient email]</span>
                                                            </span>
                                                            <span className="text-xs font-bold text-slate-500 ml-auto">
                                                                Subject:{' '}
                                                                <span className="text-slate-900">
                                                                    {bulkNotifySubject
                                                                        .replace(/\{team_name\}/g, '[Team Name]')
                                                                        .replace(/\{event_name\}/g, event?.title || '[Event Name]')
                                                                        .replace(/\{stage_name\}/g, bulkNotifyNextStage || '[Stage Name]')
                                                                        .replace(/\{participant_name\}/g, '[Participant Name]')
                                                                        .replace(/\{custom_message\}/g, '[Custom Message]')
                                                                    }
                                                                </span>
                                                            </span>
                                                        </div>
                                                        <div
                                                            className="p-6 max-h-[400px] overflow-y-auto"
                                                            dangerouslySetInnerHTML={{
                                                                __html: bulkNotifyMessage
                                                                    .replace(/\{team_name\}/g, '[Team Name]')
                                                                    .replace(/\{event_name\}/g, event?.title || '[Event Name]')
                                                                    .replace(/\{stage_name\}/g, bulkNotifyNextStage || '[Stage Name]')
                                                                    .replace(/\{participant_name\}/g, '[Participant Name]')
                                                                    .replace(/\{custom_message\}/g, '[Custom Message]')
                                                                    .replace(/\{deadline\}/g, '[Deadline Date]')
                                                                    .replace(/\{new_deadline\}/g, '[Extended Deadline]')
                                                                    .replace(/\{score\}/g, '[Score]')
                                                                    .replace(/\{frontend_url\}/g, '[App URL]')
                                                            }}
                                                        />
                                                    </div>
                                                )}

                                                {/* Score threshold */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                        Minimum Score Filter <span className="text-slate-300 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={bulkNotifyMinScore}
                                        onChange={(e) => setBulkNotifyMinScore(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all outline-none"
                                        placeholder="e.g. 80 — only send to teams with score >= this value"
                                    />
                                </div>

                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                            <Zap size={20} className="text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Professional Dispatch Protocol</p>
                                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed mt-1">
                                                This message will be wrapped in the selected template automatically.
                                                The round will be set to: <strong className="text-[#6C3BFF]">{bulkNotifyNextStage}</strong>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-slate-100 bg-white flex items-center justify-between">
                                <button 
                                    onClick={() => setIsBulkNotifyModalOpen(false)}
                                    className="px-8 py-4 text-sm font-black text-slate-400 hover:text-slate-600 transition-all"
                                >
                                    Discard Draft
                                </button>
                                <button 
                                    onClick={confirmBulkDispatch}
                                    disabled={notifying}
                                    className="px-10 py-4 bg-[#6C3BFF] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 hover:shadow-2xl hover:shadow-purple-200 transition-all shadow-xl shadow-purple-600/10 flex items-center gap-3"
                                >
                                    {notifying ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <Send size={18} />
                                    )}
                                    {notifying ? 'Dispatching...' : 'Dispatch Notifications'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </FramerAnimatePresence>
        {/* Hackathon Evaluation Modal */}
        <FramerAnimatePresence>
            {evaluatingSubmission && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
                    >
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Evaluate: {evaluatingSubmission.teamName}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Submission Analysis Protocol</p>
                            </div>
                            <button 
                                onClick={() => setEvaluatingSubmission(null)}
                                className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Solution Summary</h4>
                                <p className="text-sm font-medium text-slate-600 bg-slate-50 p-6 rounded-2xl border border-slate-100">{evaluatingSubmission.solution}</p>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Scoring Rubric</h4>
                                {criteria.length > 0 ? (
                                    criteria.map((c: any) => (
                                        <div key={c._id || c.name} className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-black text-slate-800">{c.name}</span>
                                                <span className="text-sm font-black text-purple-600">{evaluationScores[c.name] || 0} / {c.max_points}</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max={c.max_points}
                                                value={evaluationScores[c.name] || 0}
                                                onChange={(e) => setEvaluationScores({...evaluationScores, [c.name]: parseInt(e.target.value)})}
                                                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-purple-600"
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                                        <p className="text-xs font-bold text-amber-700">No scoring rubrics defined. Please add criteria in the "Scoring Rubrics" tab first.</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Feedback & Comments</label>
                                <textarea 
                                    value={evaluationComment}
                                    onChange={(e) => setEvaluationComment(e.target.value)}
                                    placeholder="Share detailed feedback with the team..."
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all h-32 resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-4">
                            <button 
                                onClick={() => setEvaluatingSubmission(null)}
                                className="px-8 py-4 text-sm font-black text-slate-400 hover:text-slate-600"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleEvaluateSubmission}
                                className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-xl shadow-black/10"
                            >
                                Submit Evaluation
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </FramerAnimatePresence>
        </div>
    );
};

export default EventDetails;
