import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
    Calendar, 
    MapPin, 
    ChevronLeft, 
    ChevronRight,
    CheckCircle2, 
    Upload, 
    Send,
    Users,
    Clock,
    Building2,
    Loader2,
    ExternalLink,
    Home,
    CalendarPlus,
    Heart,
    Share2,
    Paperclip,
    Mail,
    Phone,
    XCircle,
    Video,
    Search,
    Star,
    CheckSquare,
    DollarSign,
    CalendarX,
} from 'lucide-react';
import { getStatusById, getStatusColor, getStatusLabel } from '../../utils/calendarStatuses';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, authHeaders } from '../../apiConfig';
import { useAuth } from '../../AuthContext';
import SubmissionForm from '../../components/opportunities/SubmissionForm';
import TeamManager from '../../components/opportunities/TeamManager';
import {
    formatOpportunityLocation,
    plainTextFromRichContent,
    richHtmlFromOpportunityField,
    sanitizePresentationHtml,
} from '../../utils/text';

// Define User type for the component
interface User {
  user_id?: string;
  full_name?: string;
  name?: string;
  email?: string;
}

type RegField = {
    id: string;
    label: string;
    type: string;
    required?: boolean;
    isFixed?: boolean;
    options?: string[];
    hint?: string;
};

function applicationDecisionCopy(status: string | undefined) {
    const s = (status || 'pending').toLowerCase();
    if (s === 'accepted' || s === 'shortlisted') {
        return {
            headline: 'Shortlisted',
            title: 'Shortlisted',
            sub: 'The host has shortlisted your application. Check your email and this page for next steps.',
            tone: 'text-emerald-200',
        };
    }
    if (s === 'rejected') {
        return {
            headline: 'Not selected',
            title: 'Not selected',
            sub: 'This opportunity will not move forward for you right now. Other listings are still open on Studlyf.',
            tone: 'text-red-200',
        };
    }
    return {
        headline: 'Already applied',
        title: 'Under review',
        sub: 'Your application is being reviewed. This page updates when the host changes your status.',
        tone: 'text-green-200/80',
    };
}

const OpportunityDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab');
    
    const [opportunity, setOpportunity] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isApplied, setIsApplied] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.full_name || user?.name || '',
        email: user?.email || '',
        resume: null as File | null,
        interest: ''
    });
    const [regAnswers, setRegAnswers] = useState<Record<string, string>>({});
    const [regFiles, setRegFiles] = useState<Record<string, File | null>>({});
    const [myApplication, setMyApplication] = useState<any>(null);
    const [related, setRelated] = useState<any[]>([]);
    const [favorited, setFavorited] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);
    const [activeSection, setActiveSection] = useState<'details' | 'dates' | 'prizes' | 'reviews' | 'faq' | 'submissions' | 'leaderboard'>('details');

    const detailsRef = useRef<HTMLDivElement>(null);
    const datesRef = useRef<HTMLDivElement>(null);
    const prizesRef = useRef<HTMLDivElement>(null);
    const reviewsRef = useRef<HTMLDivElement>(null);
    const faqRef = useRef<HTMLDivElement>(null);
    const submissionsRef = useRef<HTMLDivElement>(null);
    const leaderboardRef = useRef<HTMLDivElement>(null);

    // Context derived from opportunity data — never type-based branching
    const [stats, setStats] = useState({ participants: 0, teams: 0, submissions: 0 });
    const [eventSubmissions, setEventSubmissions] = useState<any[]>([]);
    const [eventLeaderboard, setEventLeaderboard] = useState<any[]>([]);
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);
    const [isSubmittingHackathon, setIsSubmittingHackathon] = useState(false);
    const [hackathonSubmission, setHackathonSubmission] = useState({
        teamName: '',
        teamType: 'Solo',
        teamLead: user?.full_name || user?.name || '',
        teamMembers: '',
        problemStatement: '',
        solution: '',
        pptLink: '',
        domain: 'Artificial Intelligence',
        githubLink: '',
        deployedLink: ''
    });

    const [stageRegistrationFields, setStageRegistrationFields] = useState<any>(null);
    const [prefilledFields, setPrefilledFields] = useState<Record<string, any>>({});
    const [loadingFields, setLoadingFields] = useState(false);
    const eventId = String(opportunity?.event_link_id || opportunity?.event_id || id || '');

    const computeStageStatus = (stage: any) => {
        const now = new Date();
        const startRaw = stage?.startDate || stage?.start_date;
        const endRaw = stage?.endDate || stage?.end_date;
        const start = startRaw ? new Date(startRaw) : null;
        const end = endRaw ? new Date(endRaw) : null;

        if (end && end.getHours() === 0 && end.getMinutes() === 0 && !String(endRaw).includes('T')) {
            end.setHours(23, 59, 59, 999);
        }

        if (start && now < start) return 'upcoming';
        if (end && now > end) return 'completed';
        return 'active';
    };

    useEffect(() => {
        if (!id) return;
        // Fetch live stats
        fetch(`${API_BASE_URL}/api/hackathons/events/${id}/stats`)
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error("Stats fetch error:", err));

        // Fetch submissions
        fetch(`${API_BASE_URL}/api/hackathons/events/${id}/submissions`)
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setEventSubmissions(data); })
            .catch(err => console.error("Submissions fetch error:", err));

        // Fetch leaderboard
        const title = String(
            opportunity?.title ||
            opportunity?.name ||
            opportunity?.opportunity_title ||
            opportunity?.opportunityName ||
            ''
        );
        const loc = String(opportunity?.location || opportunity?.venue || '');
        const hideLeaderboard =
            /hyderabad/i.test(title) || /hyderabad/i.test(loc);

        if (!hideLeaderboard) {
            fetch(`${API_BASE_URL}/api/hackathons/events/${id}/leaderboard`)
                .then(res => res.json())
                .then(data => setEventLeaderboard(data))
                .catch(err => console.error("Leaderboard fetch error:", err));
        } else {
            setEventLeaderboard([]);
        }
    }, [id, opportunity?.title, opportunity?.name, opportunity?.location, opportunity?.venue, opportunity?.opportunity_title, opportunity?.opportunityName]);

    const FAV_KEY = 'studlyf_opp_favorites';

    useEffect(() => {
        if (!id) return;
        try {
            const raw = localStorage.getItem(FAV_KEY);
            const arr = raw ? (JSON.parse(raw) as string[]) : [];
            setFavorited(new Set(arr.map(String)).has(String(id)));
        } catch {
            setFavorited(false);
        }
    }, [id]);

    useEffect(() => {
        if (!opportunity?._id) return;
        const t = opportunity.type || 'General';
        fetch(`${API_BASE_URL}/api/opportunities?type=${encodeURIComponent(t)}`)
            .then((r) => r.json())
            .then((rows) => {
                const list = Array.isArray(rows) ? rows : [];
                setRelated(list.filter((o: any) => String(o._id) !== String(id)).slice(0, 6));
            })
            .catch(() => setRelated([]));
    }, [opportunity?._id, opportunity?.type, id]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const oppUrl = user?.user_id
                    ? `${API_BASE_URL}/api/opportunities/${id}?applicant_user_id=${encodeURIComponent(user.user_id)}`
                    : `${API_BASE_URL}/api/opportunities/${id}`;
                const [oppRes, appRes, subRes] = await Promise.all([
                    fetch(oppUrl, { headers: { ...authHeaders() } }),
                    user
                        ? fetch(`${API_BASE_URL}/api/opportunities/me/applications`, {
                              headers: { ...authHeaders() },
                          })
                        : Promise.resolve({ ok: false, json: async () => [] } as Response),
                    user
                        ? fetch(`${API_BASE_URL}/api/hackathons/my-submission/${id}`, {
                              headers: { ...authHeaders() },
                          })
                        : Promise.resolve({ ok: false, json: async () => ({ hasSubmitted: false }) } as Response),
                ]);

                const opp = await oppRes.json();
                let apps: unknown = [];
                if (user && appRes.ok) {
                    try {
                        apps = await appRes.json();
                    } catch {
                        apps = [];
                    }
                }

                if (!oppRes.ok) {
                    setOpportunity(null);
                } else {
                    setOpportunity(opp);
                }
                const list = Array.isArray(apps) ? apps : [];
                const mine =
                    list &&
                    Array.isArray(list) &&
                    list.find((app: any) => String(app.opportunity_id) === String(id));
                setMyApplication(mine);
                if (user && subRes && subRes.ok) {
                    try {
                        const subData = await subRes.json();
                        if (subData.hasSubmitted) {
                            setSubmitted(true);
                        }
                    } catch (err) {
                        console.error("Failed to parse submission status", err);
                    }
                }

                setIsApplied(Boolean(mine));
            } catch (error) {
                console.error('Failed to fetch opportunity details', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        
        // Set up periodic refresh to check for stage updates
        const refreshInterval = setInterval(fetchData, 30000); // Refresh every 30 seconds
        
        return () => clearInterval(refreshInterval);
    }, [id, user?.user_id]);

        useEffect(() => {
                if (!user || !eventId || isApplied) return;
        
                setLoadingFields(true);
                fetch(`${API_BASE_URL}/api/v1/stages/events/${eventId}/registration-fields`, {
                    headers: authHeaders()
                })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setStageRegistrationFields(data);
            // Extract prefilled values
            const prefilled = {};
            data.prefilled_fields?.forEach(field => {
              if (field.prefilled_value) {
                prefilled[field.id] = field.prefilled_value;
              }
            });
            setPrefilledFields(prefilled);
          }
        })
                .finally(() => setLoadingFields(false));
            }, [user, eventId, isApplied]);

    const registrationFields: RegField[] = Array.isArray(stageRegistrationFields?.custom_fields)
        ? stageRegistrationFields.custom_fields.map((field: any) => ({
            id: String(field.id || field.field_id || field.name || field.label),
            label: String(field.label || field.name || 'Field'),
            type: String(field.type || field.field_type || 'text'),
            required: Boolean(field.required),
            isFixed: Boolean(field.isFixed || field.prefilled),
            options: Array.isArray(field.options) ? field.options : undefined,
            hint: field.hint || field.placeholder || field.help_text || '',
        }))
        : Array.isArray(opportunity?.registrationFields)
            ? opportunity.registrationFields
            : [];
    const useStageRegistration = Array.isArray(stageRegistrationFields?.custom_fields);
    const useInstitutionForm = registrationFields.length > 0;

    const buildLegacyPayload = () => {
        const name = formData.name || user?.full_name || user?.name || 'Anonymous Applicant';
        const email = formData.email || user?.email || '';
        return {
            name,
            email,
            interest_reason: formData.interest || '',
            resume_url: formData.resume
                ? `https://studlyf-storage.s3.amazonaws.com/resumes/${formData.resume.name}`
                : '',
        };
    };

    const buildInstitutionPayload = () => {
        const responses: { field_id: string; label: string; value: string }[] = [];
        let derivedName = user?.full_name || user?.name || '';
        let derivedEmail = user?.email || '';
        let derivedInterest = '';
        let derivedResume = '';

        for (const f of registrationFields) {
            const t = (f.type || 'text').toLowerCase();
            const labelLow = (f.label || '').toLowerCase();
            let val = '';

            if (t === 'file' || t === 'upload') {
                const file = regFiles[f.id];
                val = file
                    ? `https://studlyf-storage.s3.amazonaws.com/resumes/${file.name}`
                    : '';
                if (/resume|cv/i.test(f.label) && val) derivedResume = val;
            } else if (t === 'checkbox' && f.options && f.options.length > 0) {
                const selected = f.options.filter((opt) => regAnswers[`${f.id}:${opt}`] === 'on');
                val = selected.join(', ');
            } else if (t === 'accept') {
                val = regAnswers[f.id] === 'on' || regAnswers[f.id] === 'true' ? 'yes' : '';
            } else if (t === 'checkbox') {
                val = regAnswers[f.id] === 'on' ? 'yes' : '';
            } else {
                val = regAnswers[f.id] ?? '';
            }

            responses.push({ field_id: f.id, label: f.label, value: val });

            if (/full name|^name$|your name/i.test(labelLow) || labelLow.includes('full name')) {
                derivedName = val || derivedName;
            } else if (t === 'email' || labelLow.includes('email')) {
                derivedEmail = val || derivedEmail;
            } else if (t === 'textarea' || labelLow.includes('why') || labelLow.includes('interest')) {
                derivedInterest = [derivedInterest, val].filter(Boolean).join('\n');
            }
        }

        return {
            name: derivedName || 'Anonymous Applicant',
            email: derivedEmail || 'unknown@applicant.local',
            interest_reason: derivedInterest || '(see registration_responses)',
            resume_url: derivedResume,
            registration_responses: responses,
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }

        if (!eventId) {
            alert('Event data is still loading. Please try again.');
            return;
        }

        // NEW: Use the new registration endpoint if registrationFields are present
        if (useStageRegistration) {
            const customFieldPayload: Record<string, any> = {};
            let allRequiredFilled = true;

            registrationFields.forEach((field: any) => {
                if (field.required) {
                    if (field.type === 'file' && !regFiles[field.id]) {
                        alert(`Please upload a file for: ${field.label}`);
                        allRequiredFilled = false;
                    } else if (!regAnswers[field.id]) {
                        alert(`Please fill out: ${field.label}`);
                        allRequiredFilled = false;
                    }
                }
                customFieldPayload[field.id] = regAnswers[field.id] || '';
            });

            if (!allRequiredFilled) {
                return;
            }

            setSubmitting(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/stages/events/${eventId}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeaders(),
                    },
                    body: JSON.stringify({
                        custom_fields: customFieldPayload,
                        institution_id: opportunity.createdBy || opportunity.institution_id,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setMyApplication(data.participant);
                    setSubmitted(true);
                    setIsApplied(true);
                } else {
                    const errorData = await response.json();
                    alert(`Registration failed: ${errorData.detail || 'Unknown error'}`);
                }
            } catch (err) {
                console.error("Registration error:", err);
                alert("An error occurred during registration.");
            } finally {
                setSubmitting(false);
            }
            return;
        }

        // Fallback to old logic if new registration fields are not used
        if (useInstitutionForm) {
            for (const f of registrationFields) {
                if (!(regAnswers[f.id] || '').trim()) {
                    alert(`Please complete: ${f.label}`);
                    return;
                }
            }
        }

        const instId = opportunity.createdBy || opportunity.institution_id;

        setSubmitting(true);
        try {
            const payload = useInstitutionForm ? buildInstitutionPayload() : buildLegacyPayload();
            const response = await fetch(`${API_BASE_URL}/api/opportunities/apply`, {
                method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    opportunity_id: id,
                    user_id: user.user_id,
                    institution_id: instId,
                    ...payload,
                })
            });

            if (response.ok) {
                const data = await response.json().catch(() => null);
                if (data) setMyApplication(data);
                setSubmitted(true);
                setIsApplied(true);
            }
        } catch (err) {
            console.error("Apply error:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleHackathonSubmit = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (!hackathonSubmission.teamName || !hackathonSubmission.teamLead || !hackathonSubmission.problemStatement || !hackathonSubmission.solution || !hackathonSubmission.pptLink) {
            alert("Please fill all required fields");
            return;
        }

        // Simple word count validation
        const problemWords = hackathonSubmission.problemStatement.trim().split(/\s+/).length;
        const solutionWords = hackathonSubmission.solution.trim().split(/\s+/).length;

        if (problemWords > 50) {
            alert("Problem Statement exceeds 50 words");
            return;
        }
        if (solutionWords > 100) {
            alert("Solution exceeds 100 words");
            return;
        }

        if (!hackathonSubmission.pptLink.includes("drive.google.com")) {
            alert("PPT Link must be a Google Drive link");
            return;
        }

        setIsSubmittingHackathon(true);
        try {
            const payload = {
                ...hackathonSubmission,
                hackathonId: id,
                institutionId: opportunity.createdBy || opportunity.institution_id,
                submittedBy: user.user_id,
                teamMembers: hackathonSubmission.teamMembers ? hackathonSubmission.teamMembers.split(",").map(m => m.trim()) : []
            };

            const response = await fetch(`${API_BASE_URL}/api/hackathons/submissions`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...authHeaders()
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setShowSubmissionModal(false);
                setSubmitted(true);
                setIsApplied(true);
                alert("Submission successful!");
                // Refresh stats and submissions
                const statsRes = await fetch(`${API_BASE_URL}/api/hackathons/events/${id}/stats`);
                if (statsRes.ok) setStats(await statsRes.json());
                const subsRes = await fetch(`${API_BASE_URL}/api/hackathons/events/${id}/submissions`);
                if (subsRes.ok) { const data = await subsRes.json(); if (Array.isArray(data)) setEventSubmissions(data); }
            } else {
                const err = await response.json();
                const msg = Array.isArray(err.detail) 
                    ? err.detail.map((e: any) => `${e.loc.join('.')}: ${e.msg}`).join('\n')
                    : err.detail || "Submission failed";
                alert(msg);
            }
        } catch (err) {
            console.error("Hackathon submit error:", err);
            alert("An error occurred during submission");
        } finally {
            setIsSubmittingHackathon(false);
        }
    };

    const toggleFavorite = () => {
        if (!id) return;
        try {
            const raw = localStorage.getItem(FAV_KEY);
            const arr = raw ? ([...(JSON.parse(raw) as string[])].filter(Boolean)) : [];
            const s = new Set(arr.map(String));
            if (s.has(String(id))) s.delete(String(id));
            else s.add(String(id));
            localStorage.setItem(FAV_KEY, JSON.stringify([...s]));
            setFavorited(s.has(String(id)));
        } catch {
            /* ignore */
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!opportunity) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[#F8FAFC] space-y-4">
                <h1 className="text-2xl font-black text-slate-800">Opportunity Not Found</h1>
                <button onClick={() => navigate('/opportunities')} className="text-purple-600 font-bold flex items-center gap-2">
                    <ChevronLeft size={20} /> Back to Listings
                </button>
            </div>
        );
    }

    const descriptionHtmlRaw = richHtmlFromOpportunityField(opportunity.description);
    const descriptionSafe = sanitizePresentationHtml(descriptionHtmlRaw);
    const descriptionPlain = plainTextFromRichContent(opportunity.description);
    const useRichDescription = Boolean(descriptionSafe.trim());

    const handleBack = () => {
        const idx =
            window.history.state && typeof window.history.state.idx === 'number'
                ? window.history.state.idx
                : 0;
        if (idx > 0) navigate(-1);
        else navigate('/opportunities');
    };

    const buildVenueLine = (o: typeof opportunity) => {
        if (!o) return '';
        const vd = (o.venueDisplay || '').trim();
        if (vd) return vd;
        const va = (o.venueAddress || '').trim();
        const c = (o.city || '').trim();
        const parts: string[] = [];
        if (va) parts.push(va);
        if (c && !va.toLowerCase().includes(c.toLowerCase())) parts.push(c);
        if (parts.length) return parts.join(', ');
        return formatOpportunityLocation(o.location);
    };

    const teamSizeLabel = (o: typeof opportunity): string | null => {
        if (!o) return null;
        const minT = o.minTeamSize ?? (o as any).min_team_size;
        const maxT = o.maxTeamSize ?? (o as any).max_team_size;
        if (minT != null && maxT != null) return `${minT} - ${maxT} Members`;
        if (String(o.participationType || '').toLowerCase() === 'individual') return 'Individual participation';
        return null;
    };

    const modeLabel = (o: typeof opportunity) => {
        const m = String(o?.opportunityMode || 'online').toLowerCase();
        return m === 'offline' ? 'Offline' : 'Online';
    };

    const eligibilityList = (o: typeof opportunity): string[] => {
        const raw = o?.candidateTypes;
        if (!Array.isArray(raw) || raw.length === 0) return [];
        return raw.map((x: unknown) => String(x));
    };

    const shareListing = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title: opportunity.title, text: opportunity.organization, url });
            } else {
                await navigator.clipboard.writeText(url);
                alert('Link copied to clipboard');
            }
        } catch {
            /* cancelled */
        }
    };

    const addToCalendar = () => {
        const title = opportunity.title || 'Opportunity';
        const end = opportunity.deadline ? new Date(opportunity.deadline) : new Date();
        const start = opportunity.eventStartDate
            ? new Date(opportunity.eventStartDate)
            : new Date(end.getTime() - 24 * 3600 * 1000);
        const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '');
        const loc = buildVenueLine(opportunity);
        const u = new URL('https://calendar.google.com/calendar/render');
        u.searchParams.set('action', 'TEMPLATE');
        u.searchParams.set('text', title);
        u.searchParams.set('dates', `${fmt(start)}/${fmt(end)}`);
        u.searchParams.set('details', `${opportunity.organization || ''}\n${window.location.href}`);
        if (loc) u.searchParams.set('location', loc);
        window.open(u.toString(), '_blank');
    };

    const scrollToSection = (key: 'details' | 'dates' | 'prizes' | 'reviews' | 'faq' | 'submissions' | 'leaderboard') => {
        setActiveSection(key as any);
        const ref =
            key === 'details'
                ? detailsRef
                : key === 'dates'
                  ? datesRef
                  : key === 'prizes'
                    ? prizesRef
                    : key === 'reviews'
                      ? reviewsRef
                      : key === 'submissions'
                        ? submissionsRef
                        : key === 'leaderboard'
                          ? leaderboardRef
                          : faqRef;
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleStageClick = (s: any) => {
        const stype = s.type?.toUpperCase();
        const sname = s.name?.toUpperCase() || '';
        const event_hub_id = String(opportunity.event_link_id || opportunity.event_id || id);

        if (stype === 'REGISTRATION' || sname.includes('REGISTER') || sname.includes('REGISTRATION')) {
            // Scroll to the registration / apply form
            const formElement = document.querySelector('form') || document.querySelector('.sticky');
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
            return;
        }

        // For all other stages, they require registration first!
        if (!isApplied) {
            alert(`Please register/apply for "${opportunity.title}" first to participate in this stage!`);
            const formElement = document.querySelector('form') || document.querySelector('.sticky');
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
            return;
        }

        // Check if stage is active based on dates
        const start = s.startDate || s.start_date;
        const end = s.endDate || s.end_date;
        const now = new Date();
        
        if (start && new Date(start) > now) {
            alert(`This stage hasn't started yet. It will start on ${new Date(start).toLocaleString()}.`);
            return;
        }
        
        if (end) {
            const endDate = new Date(end);
            if (endDate.getHours() === 0 && endDate.getMinutes() === 0 && !String(end).includes('T')) {
                endDate.setHours(23, 59, 59, 999);
            }
            if (now > endDate) {
                alert(`This stage has ended on ${endDate.toLocaleString()}. You can no longer participate.`);
                // We might still want to let them view results (if FINAL stage), but for now, we alert.
                if (stype !== 'FINAL' && !sname.includes('RESULT')) {
                    return;
                }
            }
        }

        // If already applied:
        const oppPath = id ? `/opportunities/${encodeURIComponent(String(id))}` : '';

        if ((stype === 'TEAM_FORMATION' || sname.includes('TEAM')) && oppPath) {
            navigate(`${oppPath}?tab=team`);
        } else if ((stype === 'SUBMISSION' || sname.includes('SUBMISSION')) && oppPath) {
            navigate(`${oppPath}?tab=submissions`);
        } else if (stype === 'QUIZ' || stype === 'ASSESSMENT' || sname.includes('QUIZ') || sname.includes('ASSESSMENT')) {
            const quizId = s.config?.quiz_id || s.quiz_id || s.config?.quizId || s.quizId;
            if (quizId) {
                navigate(`/events/${encodeURIComponent(event_hub_id)}/quiz/${quizId}`);
            } else {
                // Fallback: direct to timeline in event hub
                navigate(`/events/${encodeURIComponent(event_hub_id)}`);
            }
        } else {
            // Default fallback: direct to event hub timeline
            navigate(`/events/${encodeURIComponent(event_hub_id)}`);
        }
    };

    const venueLine = buildVenueLine(opportunity);
    const teamSize = teamSizeLabel(opportunity);
    const elig = eligibilityList(opportunity);
    const logoSrc = opportunity.logo_url || opportunity.institution_logo_url || '';
    const orgDisplay = opportunity.organization || opportunity.institution_profile_name || 'Host institution';
    const registeredCount = Number(opportunity.applicantsCount ?? opportunity.registeredCount ?? 0);
    const deadlineDate = (() => {
        if (!opportunity.deadline) return null;
        const d = new Date(opportunity.deadline);
        if (d.getHours() === 0 && d.getMinutes() === 0 && !String(opportunity.deadline).includes('T')) {
            d.setHours(23, 59, 59, 999);
        }
        return d;
    })();
    const daysLeft =
        deadlineDate && !Number.isNaN(deadlineDate.getTime())
            ? Math.max(0, Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : null;

    const processStats = opportunity.processStats || null;
    const shortlistedCount = processStats?.byStatus?.shortlisted ?? 0;
    const rejectedCount = processStats?.byStatus?.rejected ?? 0;
    const submissionStage =
        Array.isArray(opportunity?.stages)
            ? opportunity.stages.find((stage: any) => {
                  const type = String(stage.type || '').toUpperCase();
                  const name = String(stage.name || '').toUpperCase();
                  return type === 'SUBMISSION' || name.includes('SUBMISSION');
              })
            : null;

    const prizePoolLabel =
        String(opportunity.prize_pool ?? opportunity.prizePool ?? opportunity.prizePoolLabel ?? '').trim() || '';
    const prizesList = Array.isArray(opportunity.prize_distribution)
        ? opportunity.prize_distribution
        : Array.isArray(opportunity.prizeDistribution)
          ? opportunity.prizeDistribution
          : Array.isArray(opportunity.prizes)
            ? opportunity.prizes
            : [];

    const contactList: any[] = Array.isArray(opportunity.contact)
        ? opportunity.contact
        : Array.isArray(opportunity.contacts)
          ? opportunity.contacts
          : opportunity.contact && typeof opportunity.contact === 'object'
            ? [opportunity.contact]
            : [];
    const attachmentsList: any[] = Array.isArray(opportunity.attachments)
        ? opportunity.attachments
        : Array.isArray(opportunity.documents)
          ? opportunity.documents
          : [];
    const hasContactSection = contactList.length > 0;
    const hasAttachmentsSection = attachmentsList.length > 0;

    const hasDatesSection =
        Boolean(opportunity.deadline) ||
        Boolean(opportunity.eventStartDate) ||
        Boolean(opportunity.eventEndDate) ||
        (Array.isArray(opportunity.stages) &&
            opportunity.stages.some((s: any) => s?.startDate || s?.start_date || s?.endDate || s?.end_date || s?.deadline));
    const hasPrizesSection = Boolean(prizePoolLabel) || (Array.isArray(prizesList) && prizesList.length > 0);
    const hideLeaderboard =
        (() => {
            const title = String(
                opportunity?.title ||
                opportunity?.name ||
                opportunity?.opportunity_title ||
                opportunity?.opportunityName ||
                ''
            );
            const loc = String(opportunity?.location || opportunity?.venue || '');
            return /hyderabad/i.test(title) || /hyderabad/i.test(loc);
        })();
    const hideExtras = hideLeaderboard;

    const richTextClass =
        'opportunity-rich-text text-slate-600 font-medium leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_a]:text-purple-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-purple-600 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:text-slate-700 [&_h1]:text-xl [&_h1]:font-black [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold';

    return (
        <div className="min-h-screen bg-[#eef2f7] pb-16 font-sans text-slate-800">
            {opportunity.listingPendingPublish ? (
                <div className="bg-amber-50 border-b border-amber-100 text-amber-900 text-sm font-bold text-center py-3 px-4">
                    This listing is not public yet. You can open it because you already applied.
                </div>
            ) : null}

            {/* Sub navigation — reference: Details / Reviews / FAQs */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
                    <nav className="flex items-center gap-1 sm:gap-6 text-sm font-bold text-slate-500">
                        <button
                            type="button"
                            onClick={() => scrollToSection('details')}
                            className={`flex items-center gap-1.5 pb-0.5 border-b-2 transition-colors ${
                                activeSection === 'details' ? 'text-purple-600 border-purple-600' : 'border-transparent hover:text-slate-800'
                            }`}
                        >
                            <Home size={16} className="hidden sm:inline" />
                            Details
                        </button>
                        {Boolean(submissionStage) && (
                            <button
                                type="button"
                                onClick={() => scrollToSection('submissions')}
                                className={`pb-0.5 border-b-2 transition-colors ${
                                    activeSection === 'submissions' ? 'text-purple-600 border-purple-600' : 'border-transparent hover:text-slate-800'
                                }`}
                            >
                                Submissions
                            </button>
                        )}
                        {!hideLeaderboard && (
                            <button
                                type="button"
                                onClick={() => scrollToSection('leaderboard')}
                                className={`pb-0.5 border-b-2 transition-colors ${
                                    activeSection === 'leaderboard' ? 'text-purple-600 border-purple-600' : 'border-transparent hover:text-slate-800'
                                }`}
                            >
                                Leaderboard
                            </button>
                        )}
                        {hasDatesSection && (
                            <button
                                type="button"
                                onClick={() => scrollToSection('dates')}
                                className={`pb-0.5 border-b-2 transition-colors ${
                                    activeSection === 'dates'
                                        ? 'text-purple-600 border-purple-600'
                                        : 'border-transparent hover:text-slate-800'
                                }`}
                            >
                                Dates &amp; Deadlines
                            </button>
                        )}
                        {hasPrizesSection ? (
                            <button
                                type="button"
                                onClick={() => scrollToSection('prizes')}
                                className={`pb-0.5 border-b-2 transition-colors ${
                                    activeSection === 'prizes'
                                        ? 'text-purple-600 border-purple-600'
                                        : 'border-transparent hover:text-slate-800'
                                }`}
                            >
                                Prizes
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => scrollToSection('reviews')}
                            className={`pb-0.5 border-b-2 transition-colors ${
                                activeSection === 'reviews' ? 'text-purple-600 border-purple-600' : 'border-transparent hover:text-slate-800'
                            }`}
                        >
                            Reviews
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToSection('faq')}
                            className={`pb-0.5 border-b-2 transition-colors ${
                                activeSection === 'faq' ? 'text-purple-600 border-purple-600' : 'border-transparent hover:text-slate-800'
                            }`}
                        >
                            FAQs &amp; Discussions
                        </button>
                    </nav>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-purple-600"
                        >
                            <ChevronLeft size={18} /> Back
                        </button>
                        {user ? (
                            <Link
                                to="/dashboard/learner"
                                className="text-sm font-bold text-slate-600 hover:text-purple-600"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <Link
                                to={`/login?next=${encodeURIComponent(window.location.pathname)}`}
                                className="text-sm font-bold text-purple-600"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 pt-10">
                <button
                    type="button"
                    onClick={handleBack}
                    className="sm:hidden flex items-center gap-1 text-sm font-bold text-slate-500 mb-4"
                >
                    <ChevronLeft size={18} /> Back
                </button>

                {/* Conditional rendering for tabs */}
                {activeTab === 'team' && opportunity ? (
                    <div className="my-8">
                        {eventId ? (
                            <TeamManager eventId={eventId} opportunity={opportunity} />
                        ) : (
                            <div className="bg-white p-6 rounded-lg shadow-md text-slate-600">
                                Event data is still loading. Please refresh the page.
                            </div>
                        )}
                    </div>
                ) : activeTab === 'submissions' && opportunity ? (
                    <div className="my-8">
                        {eventId && submissionStage ? (
                            <div className="space-y-4">
                                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">Submission stage brief</p>
                                    <h3 className="mt-2 text-xl font-black text-slate-900">{submissionStage.name || 'Submission'}</h3>
                                    <p className="mt-2 text-sm font-medium text-slate-600 whitespace-pre-wrap">
                                        {submissionStage.description || submissionStage?.config?.description || 'Follow the host instructions carefully before submitting.'}
                                    </p>
                                    {Array.isArray(submissionStage?.config?.fields) && submissionStage.config.fields.length > 0 ? (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {submissionStage.config.fields.map((field: any) => (
                                                <span key={field.id || field.field_id || field.label} className="px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-black uppercase tracking-widest">
                                                    {field.label}
                                                    {field.required ? ' *' : ''}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                                <SubmissionForm eventId={eventId} stage={submissionStage} />
                            </div>
                        ) : (
                            <div className="bg-white p-6 rounded-lg shadow-md text-slate-600">
                                Submission stage is not configured for this event yet.
                            </div>
                        )}
                    </div>
                ) : (
                <>
                {/* Stages Timeline */}
                {Array.isArray(opportunity?.stages) && opportunity.stages.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-slate-800 mb-4">Event Timeline</h2>
                        <div className="flex items-center overflow-x-auto pb-4 -mb-4">
                            {opportunity.stages.map((stage: any, index: number) => {
                                const startDate = stage.startDate || stage.start_date ? new Date(stage.startDate || stage.start_date) : null;
                                const endDate = stage.endDate || stage.end_date ? new Date(stage.endDate || stage.end_date) : null;
                                const status = computeStageStatus(stage);
                                const isRegistration = (String(stage.type || '').toUpperCase() === 'REGISTRATION') || (String(stage.name || '').toUpperCase().includes('REGISTER'));
                                const canInteract = (status === 'active') && (isApplied || isRegistration);

                                return (
                                    <React.Fragment key={stage.id || index}>
                                        <div 
                                            className={`flex flex-col items-center ${canInteract ? 'cursor-pointer group' : 'cursor-not-allowed opacity-60'}`}
                                            onClick={canInteract ? () => handleStageClick(stage) : undefined}
                                            aria-disabled={!canInteract}
                                        >
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${
                                                status === 'active' ? 'bg-purple-100 border-purple-500' :
                                                status === 'completed' ? 'bg-green-100 border-green-500' :
                                                'bg-slate-100 border-slate-300'
                                            }`}>
                                                <span className={`text-2xl font-bold ${
                                                    status === 'active' ? 'text-purple-600' :
                                                    status === 'completed' ? 'text-green-600' :
                                                    'text-slate-500'
                                                }`}>{index + 1}</span>
                                            </div>
                                            <p className={`mt-2 text-sm font-bold text-center w-32 ${
                                                status === 'active' ? 'text-purple-700' :
                                                status === 'completed' ? 'text-green-700' :
                                                'text-slate-600'
                                            }`}>{stage.name}</p>
                                            <p className="text-xs text-slate-500 text-center">
                                                {status === 'active' ? 'Live Now' : 
                                                 status === 'completed' ? 'Finished' : 
                                                 status === 'upcoming' ? `Starts ${startDate?.toLocaleDateString()}` : 'Locked'}
                                            </p>
                                        </div>
                                        {index < opportunity.stages.length - 1 && (
                                            <div className={`flex-1 h-1 ${canInteract ? 'bg-slate-300 group-hover:bg-purple-300' : 'bg-slate-200'} transition-colors`} style={{minWidth: '50px'}}></div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Hero card — reference layout */}
                <article className="bg-white rounded-2xl border border-slate-200 shadow-sm border-t-4 border-purple-600 overflow-hidden mb-8">
                    <div className="p-6 md:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <MapPin
                                    size={18}
                                    className={modeLabel(opportunity) === 'Offline' ? 'text-red-500' : 'text-purple-600'}
                                />
                                <span className={modeLabel(opportunity) === 'Offline' ? 'text-red-600' : 'text-purple-600'}>
                                    {modeLabel(opportunity)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={addToCalendar}
                                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-purple-600"
                                    title="Add to calendar"
                                >
                                    <CalendarPlus size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={toggleFavorite}
                                    className={`p-2.5 rounded-xl border ${
                                        favorited ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                    title="Save"
                                >
                                    <Heart size={20} className={favorited ? 'fill-current' : ''} />
                                </button>
                                <button
                                    type="button"
                                    onClick={shareListing}
                                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-purple-600"
                                    title="Share"
                                >
                                    <Share2 size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col md:flex-row md:items-start gap-6">
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                    {opportunity.type || 'Opportunity'} {opportunity.category ? ` / ${opportunity.category}` : ''}
                                </p>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                    {opportunity.title}
                                </h1>
                                <p className="mt-3 text-lg font-bold text-slate-600 flex items-center gap-2">
                                    <Building2 size={20} className="text-purple-600 shrink-0" />
                                    {orgDisplay}
                                </p>

                                <div className="mt-8 grid sm:grid-cols-2 gap-6">
                                    {venueLine ? (
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-purple-600 mb-1 flex items-center gap-2">
                                                <MapPin size={14} /> Location
                                            </p>
                                            <p className="text-slate-700 font-semibold leading-snug">{venueLine}</p>
                                        </div>
                                    ) : null}
                                    {teamSize ? (
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-purple-600 mb-1 flex items-center gap-2">
                                                <Users size={14} /> Team size
                                            </p>
                                            <p className="text-slate-700 font-semibold">{teamSize}</p>
                                        </div>
                                    ) : null}
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-purple-600 mb-1 flex items-center gap-2">
                                            <Calendar size={14} /> Registration deadline
                                        </p>
                                        <p className="text-slate-700 font-semibold">
                                            {opportunity.deadline
                                                ? new Date(opportunity.deadline).toLocaleDateString('en-GB', {
                                                      day: '2-digit',
                                                      month: 'short',
                                                      year: 'numeric',
                                                  })
                                                : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {logoSrc ? (
                                <div className="shrink-0 mx-auto md:mx-0">
                                    <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-slate-100 shadow-md overflow-hidden bg-white">
                                        <img src={logoSrc} alt="" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {isApplied && !submitted ? (
                            <div className="mt-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-wrap items-center gap-4">
                                {(() => {
                                    const status = getStatusById(myApplication?.status || 'pending');
                                    const statusColor = getStatusColor(myApplication?.status || 'pending');
                                    const dec = applicationDecisionCopy(myApplication?.status);

                                    const IconComponent = (() => {
                                        const iconName = status.icon;
                                        if (iconName === 'calendar-plus') return CalendarPlus;
                                        if (iconName === 'calendar-x') return CalendarX;
                                        if (iconName === 'clock') return Clock;
                                        if (iconName === 'check-circle') return CheckCircle2;
                                        if (iconName === 'x-circle') return XCircle;
                                        if (iconName === 'video') return Video;
                                        if (iconName === 'users') return Users;
                                        if (iconName === 'upload') return Upload;
                                        if (iconName === 'search') return Search;
                                        if (iconName === 'star') return Star;
                                        if (iconName === 'check-circle-2') return CheckCircle2;
                                        if (iconName === 'dollar-sign') return DollarSign;
                                        if (iconName === 'check-square') return CheckSquare;
                                        return CheckCircle2;
                                    })();
                                    
                                    return (
                                        <>
                                            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: statusColor }}>
                                                <IconComponent size={22} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
                                                    {status.label}
                                                </p>
                                                <p className="font-black text-emerald-900">{dec.title}</p>
                                                <p className="text-sm text-emerald-800/90 mt-0.5">{dec.sub || ''}</p>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : null}
                    </div>
                </article>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-8">
                        <div ref={detailsRef}>
                            {elig.length > 0 ? (
                                <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-4">
                                        <span className="w-1 h-7 bg-purple-600 rounded-full" />
                                        Eligibility
                                    </h2>
                                    <div className="flex flex-wrap gap-x-3 gap-y-2 text-slate-700 font-medium text-sm">
                                        {elig.map((label, i) => (
                                            <span key={i} className="flex items-center gap-2">
                                                {i > 0 ? <span className="text-slate-300">•</span> : null}
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            ) : null}

                            <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                    <span className="w-1 h-7 bg-purple-600 rounded-full" />
                                    All that you need to know about {opportunity.title}
                                </h2>
                                <div className="border-t border-slate-100 pt-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-3">
                                        About the opportunity
                                    </h3>
                                    {useRichDescription ? (
                                        <div
                                            className={`${richTextClass} ${!descExpanded ? 'max-h-[28rem] overflow-hidden relative' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: descriptionSafe }}
                                        />
                                    ) : descriptionPlain ? (
                                        <p className="text-slate-600 font-medium leading-loose whitespace-pre-wrap">
                                            {descriptionPlain}
                                        </p>
                                    ) : (
                                        <p className="text-slate-400 text-sm font-medium italic">
                                            The host has not added a description for this listing.
                                        </p>
                                    )}
                                    {useRichDescription && descriptionSafe.length > 1200 ? (
                                        <button
                                            type="button"
                                            onClick={() => setDescExpanded((v) => !v)}
                                            className="mt-3 text-sm font-black text-purple-600 hover:underline"
                                        >
                                            {descExpanded ? 'Read less' : 'Read more'}
                                        </button>
                                    ) : null}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                                        <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Applicants
                                            </p>
                                            <p className="text-base font-black text-slate-800">
                                                {opportunity.applicantsCount ?? 0}+
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                                        <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm">
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Listing
                                            </p>
                                            <p
                                                className={`text-base font-black uppercase tracking-wide ${
                                                    opportunity.listingPendingPublish ? 'text-amber-600' : 'text-emerald-600'
                                                }`}
                                            >
                                                {opportunity.listingPendingPublish ? 'Awaiting publish' : 'Open'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {Array.isArray(opportunity.stages) && opportunity.stages.length > 0 ? (
                                <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                        <span className="w-1 h-7 bg-purple-600 rounded-full" />
                                        Competition structure &amp; stages
                                    </h2>
                                    <p className="text-sm text-slate-500 font-medium -mt-2">
                                        Defined by the host — each hackathon can have different stages.
                                    </p>
                                    <ol className="space-y-3">
                                        {opportunity.stages.map((s: any, i: number) => {
                                            const stype = s.type?.toUpperCase();
                                            const sname = s.name?.toUpperCase() || '';
                                            
                                            let actionLabel = 'Unlock';
                                            if (stype === 'REGISTRATION' || sname.includes('REGISTER') || sname.includes('REGISTRATION')) {
                                                actionLabel = isApplied ? 'Registered' : 'Apply Now';
                                            } else if (stype === 'TEAM_FORMATION' || sname.includes('TEAM')) {
                                                actionLabel = 'Manage Team';
                                            } else if (stype === 'SUBMISSION' || sname.includes('SUBMISSION')) {
                                                actionLabel = 'Submit Portal';
                                            } else if (stype === 'QUIZ' || stype === 'ASSESSMENT' || sname.includes('QUIZ') || sname.includes('ASSESSMENT')) {
                                                actionLabel = 'Take Assessment';
                                            } else {
                                                actionLabel = 'View Stage';
                                            }

                                            const stageStatus = computeStageStatus(s);
                                            const isReg = (String(s.type || '').toUpperCase() === 'REGISTRATION') || (String(s.name || '').toUpperCase().includes('REGISTER'));
                                            const canAct = (stageStatus === 'active') && (isApplied || isReg);

                                            return (
                                                <li
                                                    key={s.id || i}
                                                    onClick={canAct ? () => handleStageClick(s) : undefined}
                                                    className={`flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-all group animate-fade-in ${canAct ? 'hover:border-purple-300 hover:bg-purple-50/20 hover:scale-[1.01] hover:shadow-md cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                                                    aria-disabled={!canAct}
                                                >
                                                    <div className="flex gap-4 min-w-0 flex-grow">
                                                        <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-purple-600/10 text-purple-600 font-black flex items-center justify-center text-sm group-hover:bg-purple-600 group-hover:text-white transition-all">
                                                            {i + 1}
                                                        </span>
                                                        <div className="min-w-0 flex-grow">
                                                            <p className="font-bold text-slate-900 truncate">{s.name || `Stage ${i + 1}`}</p>
                                                            {s.type ? (
                                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                                    {s.type}
                                                                    {s.roundMode || s.mode || s.round_mode ? (
                                                                        <span className="ml-2 text-slate-300">
                                                                            • {String(s.roundMode || s.mode || s.round_mode)}
                                                                        </span>
                                                                    ) : null}
                                                                </p>
                                                            ) : null}
                                                            
                                                            {(s.startDate || s.endDate || s.start_date || s.end_date) && (() => {
                                                                const start = s.startDate || s.start_date;
                                                                const end = s.endDate || s.end_date;
                                                                const now = new Date();
                                                                let statusNode = null;
                                                                
                                                                if (start && end) {
                                                                    const startDate = new Date(start);
                                                                    const endDate = new Date(end);
                                                                    
                                                                    // If end date is just a date (00:00:00), treat as end of day
                                                                    if (endDate.getHours() === 0 && endDate.getMinutes() === 0 && !end.includes('T')) {
                                                                        endDate.setHours(23, 59, 59, 999);
                                                                    }
                                                                    
                                                                    if (now < startDate) {
                                                                        const days = Math.max(1, Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                                                                        statusNode = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">Starts in {days} day{days !== 1 ? 's' : ''}</span>;
                                                                    } else if (now > endDate) {
                                                                        statusNode = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400">Ended</span>;
                                                                    } else {
                                                                        const days = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                                                                        statusNode = (
                                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 flex items-center gap-1">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                                                                {days === 0 ? 'Ends today' : `Ends in ${days} day${days !== 1 ? 's' : ''}`}
                                                                            </span>
                                                                        );
                                                                    }
                                                                }
                                                                
                                                                return (
                                                                    <div className="mt-2.5 flex items-center gap-3">
                                                                        <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                                                                            <Calendar className="w-3.5 h-3.5 opacity-70" />
                                                                            <span>
                                                                                {start ? new Date(start).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'TBD'} 
                                                                                {' — '}
                                                                                {end ? new Date(end).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'TBD'}
                                                                            </span>
                                                                        </div>
                                                                        {statusNode}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center shrink-0 ml-2">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-purple-600 transition-colors flex items-center gap-1 bg-white border border-slate-150 px-3 py-1.5 rounded-xl shadow-sm">
                                                            {actionLabel} <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform text-slate-400 group-hover:text-purple-600" />
                                                        </span>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </section>
                            ) : null}

                            {hasDatesSection ? (
                                <div ref={datesRef}>
                                    <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                            <span className="w-1 h-7 bg-purple-600 rounded-full" />
                                            Dates &amp; deadlines
                                        </h2>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    Registration deadline
                                                </p>
                                                <p className="mt-1 font-black text-slate-900">
                                                    {opportunity.deadline
                                                        ? new Date(opportunity.deadline).toLocaleString('en-GB', {
                                                              day: '2-digit',
                                                              month: 'short',
                                                              year: 'numeric',
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          })
                                                        : '—'}
                                                </p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Start date</p>
                                                <p className="mt-1 font-black text-slate-900">
                                                    {opportunity.eventStartDate
                                                        ? new Date(opportunity.eventStartDate).toLocaleString('en-GB', {
                                                              day: '2-digit',
                                                              month: 'short',
                                                              year: 'numeric',
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          })
                                                        : '—'}
                                                </p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">End date</p>
                                                <p className="mt-1 font-black text-slate-900">
                                                    {opportunity.eventEndDate
                                                        ? new Date(opportunity.eventEndDate).toLocaleString('en-GB', {
                                                              day: '2-digit',
                                                              month: 'short',
                                                              year: 'numeric',
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          })
                                                        : '—'}
                                                </p>
                                            </div>
                                        </div>

                                        {Array.isArray(opportunity.stages) && opportunity.stages.length > 0 ? (
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                                                    Stage timeline
                                                </h3>
                                                <div className="space-y-3">
                                                    {opportunity.stages.map((s: any, i: number) => {
                                                        const start = s?.startDate || s?.start_date;
                                                        const end = s?.endDate || s?.end_date;
                                                        const dl = s?.deadline;
                                                        const anyDate = start || end || dl;
                                                        if (!anyDate) return null;
                                                        const fmt = (d: any) => {
                                                            try {
                                                                return new Date(d).toLocaleString('en-GB', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                });
                                                            } catch {
                                                                return String(d);
                                                            }
                                                        };
                                                        return (
                                                            <div
                                                                key={s.id || `dates-${i}`}
                                                                className="p-4 rounded-xl bg-white border border-slate-200"
                                                            >
                                                                <p className="font-black text-slate-900">
                                                                    {s.name || `Stage ${i + 1}`}
                                                                </p>
                                                                <p className="text-sm text-slate-600 font-medium mt-1">
                                                                    {start && end ? (
                                                                        <>
                                                                            {fmt(start)} → {fmt(end)}
                                                                        </>
                                                                    ) : start ? (
                                                                        <>Starts: {fmt(start)}</>
                                                                    ) : end ? (
                                                                        <>Ends: {fmt(end)}</>
                                                                    ) : null}
                                                                    {dl ? (
                                                                        <span className="ml-2 text-slate-400 font-bold">
                                                                            (Deadline: {fmt(dl)})
                                                                        </span>
                                                                    ) : null}
                                                                </p>
                                                                {s.description ? (
                                                                    <p className="text-sm text-slate-600 font-medium mt-2 whitespace-pre-wrap">
                                                                        {String(s.description)}
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : null}
                                    </section>
                                </div>
                            ) : null}

                            {hasPrizesSection ? (
                                <div ref={prizesRef}>
                                    <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                            <span className="w-1 h-7 bg-purple-600 rounded-full" />
                                            Rewards &amp; prizes
                                        </h2>
                                        {prizePoolLabel ? (
                                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    Prize pool
                                                </p>
                                                <p className="mt-1 text-xl font-black text-slate-900">{prizePoolLabel}</p>
                                            </div>
                                        ) : null}
                                        {Array.isArray(prizesList) && prizesList.length > 0 ? (
                                            <div className="space-y-3">
                                                {prizesList.map((p: any, idx: number) => (
                                                    <div
                                                        key={p.id || `${idx}`}
                                                        className="p-4 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-4"
                                                    >
                                                        <div>
                                                            <p className="font-black text-slate-900">
                                                                {p.rank || p.title || p.label || `Prize ${idx + 1}`}
                                                            </p>
                                                            {p.description ? (
                                                                <p className="text-sm text-slate-600 font-medium mt-1 whitespace-pre-wrap">
                                                                    {String(p.description)}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                        {p.amount || p.value ? (
                                                            <div className="text-right shrink-0">
                                                                <p className="text-sm font-black text-slate-900">
                                                                    {String(p.amount || p.value)}
                                                                </p>
                                                                {p.type ? (
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                                                                        {String(p.type)}
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-slate-600 text-sm font-medium">
                                                Prize details will be shared by the organiser.
                                            </p>
                                        )}
                                    </section>
                                </div>
                            ) : null}

                            {hasContactSection ? (
                                <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                        <span className="w-1 h-7 bg-purple-600 rounded-full" />
                                        Contact the organisers
                                    </h2>
                                    <div className="space-y-3">
                                        {contactList.map((c: any, idx: number) => {
                                            const name = String(c?.name || c?.full_name || c?.title || 'Organiser').trim();
                                            const email = String(c?.email || '').trim();
                                            const phone = String(c?.phone || c?.mobile || '').trim();
                                            return (
                                                <div
                                                    key={c?.id || `${idx}`}
                                                    className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                                                >
                                                    <p className="font-black text-slate-900">{name}</p>
                                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-slate-600">
                                                        {email ? (
                                                            <a
                                                                className="inline-flex items-center gap-2 hover:text-purple-600"
                                                                href={`mailto:${email}`}
                                                            >
                                                                <Mail size={16} /> {email}
                                                            </a>
                                                        ) : null}
                                                        {phone ? (
                                                            <a
                                                                className="inline-flex items-center gap-2 hover:text-purple-600"
                                                                href={`tel:${phone}`}
                                                            >
                                                                <Phone size={16} /> {phone}
                                                            </a>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            ) : null}

                            {hasAttachmentsSection ? (
                                <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                        <span className="w-1 h-7 bg-purple-600 rounded-full" />
                                        Download attachments
                                    </h2>
                                    <div className="space-y-3">
                                        {attachmentsList.map((a: any, idx: number) => {
                                            const label = String(a?.name || a?.title || a?.label || `Attachment ${idx + 1}`).trim();
                                            const url = String(a?.url || a?.href || a?.link || '').trim();
                                            return (
                                                <div
                                                    key={a?.id || `${idx}`}
                                                    className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="font-black text-slate-900 flex items-center gap-2">
                                                            <Paperclip size={16} className="text-purple-600 shrink-0" />
                                                            <span className="truncate">{label}</span>
                                                        </p>
                                                        {a?.type ? (
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                                                {String(a.type)}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                    {url ? (
                                                        <a
                                                            className="shrink-0 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-black text-purple-600 hover:bg-purple-50"
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            Download
                                                        </a>
                                                    ) : (
                                                        <span className="text-sm font-bold text-slate-400">—</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            ) : null}

                            {(opportunity.festivalName ||
                                opportunity.eventStartDate ||
                                opportunity.eventEndDate ||
                                opportunity.festivalDetails) ? (
                        <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                            <div className="space-y-4">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                    <span className="w-1 h-7 bg-purple-600 rounded-full" />
                                    Festival / program context
                                </h2>
                            </div>
                            {opportunity.festivalName ? (
                                <p className="text-lg font-black text-slate-800">{opportunity.festivalName}</p>
                            ) : null}
                            <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-600">
                                {opportunity.eventStartDate ? (
                                    <span>Starts: {new Date(opportunity.eventStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                ) : null}
                                {opportunity.eventEndDate ? (
                                    <span>Ends: {new Date(opportunity.eventEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                ) : null}
                            </div>
                            {opportunity.festivalDetails ? (
                                (() => {
                                    const fh = sanitizePresentationHtml(richHtmlFromOpportunityField(opportunity.festivalDetails));
                                    return fh.trim() ? (
                                        <div
                                            className="opportunity-rich-text text-slate-600 font-medium leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_a]:text-purple-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-purple-600 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:text-slate-700 [&_h1]:text-xl [&_h1]:font-black [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold"

                                            dangerouslySetInnerHTML={{ __html: fh }}
                                        />
                                    ) : (
                                        <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                                            {plainTextFromRichContent(opportunity.festivalDetails)}
                                        </p>
                                    );
                                })()
                            ) : null}
                            {opportunity.websiteUrl ? (
                                <a
                                    href={opportunity.websiteUrl.startsWith('http') ? opportunity.websiteUrl : `https://${opportunity.websiteUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-purple-600 font-black text-sm hover:underline"
                                >
                                    Official website / link <ExternalLink size={16} />
                                </a>
                            ) : null}
                        </section>
                    ) : null}

                    {opportunity.skills && String(opportunity.skills).trim() ? (
                        <section className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-slate-900">Skills & focus areas</h2>
                                <div className="h-1.5 w-16 bg-purple-600 rounded-full" />
                            </div>
                            {(() => {
                                const sh = sanitizePresentationHtml(richHtmlFromOpportunityField(opportunity.skills));
                                return sh.trim() ? (
                                    <div
                                        className="opportunity-rich-text text-slate-600 font-medium leading-relaxed [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-6"
                                        dangerouslySetInnerHTML={{ __html: sh }}
                                    />
                                ) : (
                                    <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                                        {plainTextFromRichContent(opportunity.skills)}
                                    </p>
                                );
                            })()}
                        </section>
                    ) : null}
                        </div>

                        {eventSubmissions.length > 0 || stats.submissions > 0 ? (
                            <>
                                {!hideExtras ? (
                                    <div ref={submissionsRef}>
                                        <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                                            <div className="flex items-center justify-between gap-4 mb-5">
                                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                                    <span className="w-1 h-7 bg-purple-600 rounded-full" />
                                                    Live Submissions
                                                </h2>
                                                <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                                                    Auto refresh 30s
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-3 mb-5">
                                                <span className="text-[10px] font-black uppercase tracking-widest bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full">
                                                    {stats.participants} Participants
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full">
                                                    {stats.teams} Teams
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">
                                                    {stats.submissions} Submissions
                                                </span>
                                            </div>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                {eventSubmissions.length > 0 ? (
                                                    eventSubmissions.slice(0, 6).map((sub: any, i: number) => (
                                                        <div key={sub._id || i} className={`p-4 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white flex items-center gap-4 ${i >= 4 ? 'hidden sm:flex' : ''} ${i >= 2 ? 'opacity-70' : ''}`}>
                                                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-black text-sm">
                                                                {(sub.teamName || sub.teamLead || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-black text-slate-900 truncate">{sub.teamName || sub.teamLead || 'Anonymous'}</p>
                                                                <p className="text-xs text-slate-500 font-bold">
                                                                    {sub.createdAt ? (() => {
                                                                        const mins = Math.floor((Date.now() - new Date(sub.createdAt).getTime()) / 60000);
                                                                        return mins < 1 ? 'Just now' : mins < 60 ? `${mins} minutes ago` : `${Math.floor(mins / 60)}h ago`;
                                                                    })() : sub.domain || `${Array.isArray(sub.teamMembers) ? sub.teamMembers.length : 0} members`}
                                                                </p>
                                                            </div>
                                                            {sub.totalScore > 0 && (
                                                                <div className="ml-auto text-right shrink-0">
                                                                    <p className="text-lg font-black text-purple-600">{Number(sub.totalScore).toFixed(1)}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-span-2 py-12 text-center text-slate-400 font-bold text-sm">
                                                        No submissions yet. Be the first to submit!
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    </div>
                                ) : (
                                    <div ref={submissionsRef} />
                                )}

                                {!hideLeaderboard ? (
                                    <div ref={leaderboardRef} className="mt-8">
                                        <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                                            <div className="flex items-center justify-between mb-6">
                                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                                    <span className="w-1 h-7 bg-amber-400 rounded-full" />
                                                    Leaderboard
                                                </h2>
                                                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-3 py-1 rounded-full">Top Teams</span>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                {eventLeaderboard.length > 0 ? (
                                                    eventLeaderboard.map((entry, idx) => (
                                                        <div key={entry._id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-purple-200 transition-colors">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                                                                    idx === 0 ? 'bg-amber-100 text-amber-700' : 
                                                                    idx === 1 ? 'bg-slate-200 text-slate-600' :
                                                                    idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'
                                                                }`}>
                                                                    {idx + 1}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-black text-slate-900 truncate">{entry.teamName}</p>
                                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{entry.domain}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg font-black text-purple-600">{Number(entry.totalScore || 0).toFixed(1)}</p>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="py-12 text-center">
                                                        <div className="inline-flex p-4 rounded-full bg-slate-50 mb-4">
                                                            <Users size={32} className="text-slate-200" />
                                                        </div>
                                                        <p className="text-slate-400 font-bold">The competition has just begun. Leaderboard will update soon.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    </div>
                                ) : null}
                            </>
                        ) : null}

                        <div ref={reviewsRef}>
                            <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-4">
                                    <span className="w-1 h-7 bg-purple-600 rounded-full" />
                                    Feedback &amp; rating
                                </h2>
                                <h3 className="text-sm font-black text-slate-800 mb-2">Write a review</h3>
                                {isApplied ? (
                                    <p className="text-slate-600 text-sm font-medium">
                                        Thanks for applying — you can share feedback with the host from your applications
                                        dashboard when messaging is enabled.
                                    </p>
                                ) : (
                                    <p className="text-slate-600 text-sm font-medium">
                                        Register for this opportunity to give your feedback and review.
                                    </p>
                                )}
                            </section>
                        </div>

                        {!hideExtras ? (
                            <div ref={faqRef}>
                                <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-4">
                                        <span className="w-1 h-7 bg-purple-600 rounded-full" />
                                        Frequently asked questions / discussions
                                    </h2>
                                    <p className="text-slate-600 text-sm font-medium mb-4">
                                        No posts yet. Start a new discussion.
                                    </p>
                                    {user ? (
                                        <p className="text-xs text-slate-400 font-bold">Discussion threads are coming soon.</p>
                                    ) : (
                                        <Link
                                            to={`/login?next=${encodeURIComponent(window.location.pathname)}`}
                                            className="text-sm font-black text-purple-600 hover:underline"
                                        >
                                            Please log in to start a comment.
                                        </Link>
                                    )}
                                </section>
                            </div>
                        ) : (
                            <div ref={faqRef} />
                        )}

                        {related.length > 0 ? (
                            <section className="space-y-4">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 px-1">
                                    <span className="w-1 h-7 bg-purple-600 rounded-full" />
                                    Related opportunities
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {related.map((r: any) => (
                                        <Link
                                            key={String(r._id)}
                                            to={`/opportunities/${r._id}`}
                                            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-purple-600/40 hover:shadow-md transition-all"
                                        >
                                            <p className="font-black text-slate-900 line-clamp-2">{r.title}</p>
                                            <p className="text-sm text-slate-500 font-semibold mt-1 line-clamp-1">
                                                {r.organization || r.institution_profile_name || 'Host'}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        <footer className="text-xs text-slate-500 font-medium space-y-3 pt-2 pb-4">
                            <p>
                                Updated on:{' '}
                                {opportunity.updatedAt || opportunity.updated_at
                                    ? new Date(opportunity.updatedAt || opportunity.updated_at).toLocaleString('en-GB', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: '2-digit',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          timeZoneName: 'short',
                                      })
                                    : '—'}
                            </p>
                            <p className="text-slate-400">Listing details may be refreshed periodically.</p>
                            <p>
                                This opportunity has been listed by {orgDisplay}. Studlyf is not liable for any content
                                mentioned in this opportunity or the process followed by the organizers. Contact support
                                if you need help or want to report an issue.
                            </p>
                        </footer>
                    </div>

                    {/* Right Column: Application Form */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-32">
                            <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                                            <Clock size={12} /> Days left
                                        </p>
                                        <p className="mt-1 text-xl font-black text-slate-900">
                                            {daysLeft != null ? daysLeft : '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                                            <Users size={12} /> Registered
                                        </p>
                                        <p className="mt-1 text-xl font-black text-slate-900">{registeredCount}</p>
                                    </div>
                                </div>
                                {processStats ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Shortlisted</p>
                                            <p className="mt-1 text-xl font-black text-slate-900">{shortlistedCount}</p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Eliminated</p>
                                            <p className="mt-1 text-xl font-black text-slate-900">{rejectedCount}</p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        <AnimatePresence mode="wait">
                            {submitted ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white rounded-[40px] p-10 border border-green-100 shadow-2xl shadow-green-900/5 text-center space-y-6"
                                >
                                    <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-green-500/20 rotate-12">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black text-slate-900">Application Sent!</h2>
                                        <p className="text-slate-400 font-bold">Great job! The team at {opportunity.organization} will review your profile soon.</p>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/dashboard/learner')}
                                        className="w-full bg-slate-900 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                                    >
                                        Go to Dashboard
                                    </button>
                                </motion.div>
                            ) : isApplied ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-[40px] p-10 border border-emerald-100 shadow-2xl shadow-emerald-900/5 space-y-6"
                                >
                                    {(() => {
                                        const dec = applicationDecisionCopy(myApplication?.status);
                                        const isPositive =
                                            (myApplication?.status || '').toLowerCase() === 'accepted' ||
                                            (myApplication?.status || '').toLowerCase() === 'shortlisted';
                                        const isNegative = (myApplication?.status || '').toLowerCase() === 'rejected';
                                        const ring = isNegative
                                            ? 'bg-red-50 border-red-100'
                                            : isPositive
                                              ? 'bg-emerald-50 border-emerald-100'
                                              : 'bg-green-50 border-green-100';
                                        const iconBg = isNegative ? 'bg-red-500' : isPositive ? 'bg-emerald-500' : 'bg-green-600';
                                        return (
                                            <>
                                                <div className={`rounded-3xl border p-6 ${ring}`}>
                                                    <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center text-white shadow-lg mb-4`}>
                                                        <CheckCircle2 size={28} />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{dec.headline}</p>
                                                    <h2 className="text-xl font-black text-slate-900 mt-1">{dec.title}</h2>
                                                    <p className="text-slate-600 text-sm font-medium mt-3 leading-relaxed">{dec.sub}</p>
                                                </div>
                                                <p className="text-[11px] text-slate-400 font-bold text-center">
                                                    You cannot submit again for this listing. Status updates when the host reviews your application.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/opportunities/my-applications')}
                                                    className="w-full bg-slate-900 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                                                >
                                                    My applications
                                                </button>
                                            </>
                                        );
                                    })()}
                                </motion.div>
                            ) : (
                                <motion.div 
                                    className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-2xl shadow-purple-900/5 space-y-8"
                                >
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black text-slate-900">{submissionStage ? 'Submit Your Idea' : 'Apply Now'}</h2>
                                        <p className="text-slate-400 font-bold text-sm">
                                            {submissionStage
                                                ? 'Share your solution and compete for prizes'
                                                : `Join ${opportunity.organization} to start your journey`}
                                        </p>
                                    </div>

                                    {submissionStage ? (
                                        <div className="space-y-4">
                                            <button 
                                                onClick={() => setShowSubmissionModal(true)}
                                                className="w-full py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-purple-600/30 active:scale-95"
                                            >
                                                Submit Your Idea <Send size={18} />
                                            </button>
                                            <p className="text-[11px] text-slate-400 font-bold text-center">
                                                By submitting, you agree to the hackathon rules and guidelines.
                                            </p>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="space-y-4">
                                            {useInstitutionForm ? (
                                                registrationFields.map((f) => {
                                                    const t = (f.type || 'text').toLowerCase();
                                                    const commonLabel = (
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                                            {f.label}
                                                            {f.required ? ' *' : ''}
                                                        </label>
                                                    );
                                                    const inputClass =
                                                        'w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-purple-50 focus:border-purple-200 outline-none transition-all';

                                                    if (t === 'textarea') {
                                                        return (
                                                            <div key={f.id} className="space-y-1.5">
                                                                {commonLabel}
                                                                <textarea
                                                                    required={!!f.required}
                                                                    disabled={isApplied}
                                                                    placeholder={f.hint || ''}
                                                                    className={`${inputClass} resize-none h-32 text-slate-600`}
                                                                    value={regAnswers[f.id] || ''}
                                                                    onChange={(e) =>
                                                                        setRegAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))
                                                                    }
                                                                />
                                                            </div>
                                                        );
                                                    }

                                                    if (t === 'file' || t === 'upload') {
                                                        return (
                                                            <div key={f.id} className="space-y-1.5">
                                                                {commonLabel}
                                                                <div
                                                                    onClick={() =>
                                                                        !isApplied &&
                                                                        document.getElementById(`reg-file-${f.id}`)?.click()
                                                                    }
                                                                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                                                                        isApplied || regFiles[f.id]
                                                                            ? 'bg-emerald-50/30 border-emerald-200'
                                                                            : 'bg-purple-50/30 border-purple-100 hover:border-purple-300'
                                                                    }`}
                                                                >
                                                                    {regFiles[f.id] ? (
                                                                        <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                                                                    ) : (
                                                                        <Upload size={24} className="mx-auto mb-2 text-purple-400" />
                                                                    )}
                                                                    <p
                                                                        className={`text-xs font-black uppercase tracking-widest ${
                                                                            regFiles[f.id] ? 'text-emerald-600' : 'text-purple-600'
                                                                        }`}
                                                                    >
                                                                        {regFiles[f.id]?.name || (isApplied ? 'Uploaded' : 'Choose file')}
                                                                    </p>
                                                                    {!isApplied && (
                                                                        <input
                                                                            id={`reg-file-${f.id}`}
                                                                            type="file"
                                                                            className="hidden"
                                                                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0] || null;
                                                                                setRegFiles((prev) => ({ ...prev, [f.id]: file }));
                                                                            }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    if (t === 'dropdown' && f.options && f.options.length > 0) {
                                                        return (
                                                            <div key={f.id} className="space-y-1.5">
                                                                {commonLabel}
                                                                <select
                                                                    required={!!f.required}
                                                                    disabled={isApplied}
                                                                    className={inputClass}
                                                                    value={regAnswers[f.id] || ''}
                                                                    onChange={(e) =>
                                                                        setRegAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))
                                                                    }
                                                                >
                                                                    <option value="">Select…</option>
                                                                    {f.options.map((opt) => (
                                                                        <option key={opt} value={opt}>
                                                                            {opt}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        );
                                                    }

                                                    if (t === 'radio' && f.options && f.options.length > 0) {
                                                        return (
                                                            <div key={f.id} className="space-y-2">
                                                                {commonLabel}
                                                                <div className="space-y-2 pl-2">
                                                                    {f.options.map((opt) => (
                                                                        <label key={opt} className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                                                            <input
                                                                                type="radio"
                                                                                name={`reg-${f.id}`}
                                                                                disabled={isApplied}
                                                                                checked={regAnswers[f.id] === opt}
                                                                                onChange={() =>
                                                                                    setRegAnswers((prev) => ({ ...prev, [f.id]: opt }))
                                                                                }
                                                                            />
                                                                            {opt}
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    if (t === 'checkbox' && f.options && f.options.length > 0) {
                                                        return (
                                                            <div key={f.id} className="space-y-2">
                                                                {commonLabel}
                                                                <div className="space-y-2 pl-2">
                                                                    {f.options.map((opt) => (
                                                                        <label key={opt} className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                                                            <input
                                                                                type="checkbox"
                                                                                disabled={isApplied}
                                                                                checked={(regAnswers[`${f.id}:${opt}`] || '') === 'on'}
                                                                                onChange={(e) =>
                                                                                    setRegAnswers((prev) => ({
                                                                                        ...prev,
                                                                                        [`${f.id}:${opt}`]: e.target.checked ? 'on' : '',
                                                                                    }))
                                                                                }
                                                                            />
                                                                            {opt}
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    if (t === 'accept') {
                                                        return (
                                                            <label
                                                                key={f.id}
                                                                className="flex items-start gap-3 text-sm font-bold text-slate-600 cursor-pointer"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    disabled={isApplied}
                                                                    checked={regAnswers[f.id] === 'on'}
                                                                    onChange={(e) =>
                                                                        setRegAnswers((prev) => ({
                                                                            ...prev,
                                                                            [f.id]: e.target.checked ? 'on' : '',
                                                                        }))
                                                                    }
                                                                    className="mt-1"
                                                                />
                                                                <span>{f.label}</span>
                                                            </label>
                                                        );
                                                    }

                                                    const inputType =
                                                        t === 'email' ? 'email' : t === 'tel' ? 'tel' : 'text';

                                                    return (
                                                        <div key={f.id} className="space-y-1.5">
                                                            {commonLabel}
                                                            <input
                                                                type={inputType}
                                                                required={!!f.required}
                                                                disabled={isApplied}
                                                                placeholder={f.hint || ''}
                                                                className={inputClass}
                                                                value={regAnswers[f.id] || ''}
                                                                onChange={(e) =>
                                                                    setRegAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))
                                                                }
                                                            />
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                                                        <input
                                                            type="text"
                                                            value={formData.name}
                                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                            placeholder="Enter your full name"
                                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-purple-50 focus:border-purple-200 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                                                        <input
                                                            type="email"
                                                            value={formData.email}
                                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                            placeholder="Enter your email"
                                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-purple-50 focus:border-purple-200 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Why are you interested? (optional)</label>
                                                        <textarea
                                                            placeholder="Share your motivation and relevant skills..."
                                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 focus:ring-4 focus:ring-purple-50 focus:border-purple-200 outline-none transition-all resize-none h-32"
                                                            value={formData.interest}
                                                            onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                                                            disabled={isApplied}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Resume / CV (optional)</label>
                                                        <div
                                                            onClick={() => !isApplied && document.getElementById('resume-upload')?.click()}
                                                            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                                                                isApplied || formData.resume ? 'bg-emerald-50/30 border-emerald-200' : 'bg-purple-50/30 border-purple-100 hover:border-purple-300'
                                                            }`}
                                                        >
                                                            {formData.resume ? (
                                                                <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                                                            ) : (
                                                                <Upload size={24} className="mx-auto mb-2 text-purple-400" />
                                                            )}
                                                            <p className={`text-xs font-black uppercase tracking-widest ${formData.resume ? 'text-emerald-600' : 'text-purple-600'}`}>
                                                                {formData.resume ? formData.resume.name : isApplied ? 'Resume Uploaded' : 'Upload Resume'}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-slate-400 mt-1">
                                                                {formData.resume ? `${(formData.resume.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, DOC (Max 5MB)'}
                                                            </p>
                                                            {!isApplied && (
                                                                <input
                                                                    id="resume-upload"
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept=".pdf,.doc,.docx"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) setFormData({ ...formData, resume: file });
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <button 
                                            type="submit"
                                            disabled={isApplied || submitting}
                                            className={`w-full py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${
                                                isApplied 
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                                                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-600/30 active:scale-95'
                                            }`}
                                        >
                                            {submitting ? (
                                                <Loader2 size={20} className="animate-spin" />
                                            ) : isApplied ? (
                                                'Application Submitted'
                                            ) : (
                                                <>Submit Application <Send size={18} /></>
                                            )}
                                        </button>
                                    </form>
                                )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {isApplied && String(opportunity.participationType || '').toLowerCase() !== 'individual' ? (
                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                                <h3 className="text-sm font-black text-slate-900">Team formation</h3>
                                <p className="text-xs text-slate-600 font-medium">
                                    This hackathon supports team participation. Teams must follow the host’s team size limits.
                                </p>
                                <p className="text-[11px] text-slate-400 font-semibold">
                                    I can add “Create team / Join team by ID” directly here next (backend APIs already exist).
                                </p>
                            </div>
                        ) : null}
                        </div>
                    </div>
                </div>
                </>
                )}

            {/* Hackathon Submission Modal */}
        <AnimatePresence>
            {showSubmissionModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowSubmissionModal(false)}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-3xl bg-white rounded-3xl sm:rounded-[32px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
                    >
                        <div className="p-5 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Submit Your Idea</h2>
                                <p className="text-slate-500 font-bold text-xs sm:text-sm">Tell us about your project</p>
                            </div>
                            <button 
                                onClick={() => setShowSubmissionModal(false)}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                            >
                                <ChevronLeft className="rotate-180" size={24} />
                            </button>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-8 space-y-5 sm:space-y-6">
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Team Name</label>
                                    <input 
                                        type="text" 
                                        maxLength={40}
                                        value={hackathonSubmission.teamName}
                                        onChange={(e) => setHackathonSubmission({...hackathonSubmission, teamName: e.target.value})}
                                        placeholder="Enter team name"
                                        className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-purple-50 focus:border-purple-200 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Team Type</label>
                                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                                        {['Solo', 'Team'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setHackathonSubmission({...hackathonSubmission, teamType: type})}
                                                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                                    hackathonSubmission.teamType === type ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Team Lead Name</label>
                                    <input 
                                        type="text" 
                                        value={hackathonSubmission.teamLead}
                                        onChange={(e) => setHackathonSubmission({...hackathonSubmission, teamLead: e.target.value})}
                                        placeholder="Lead name"
                                        className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-purple-50 focus:border-purple-200 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Domain</label>
                                    <select 
                                        value={hackathonSubmission.domain}
                                        onChange={(e) => setHackathonSubmission({...hackathonSubmission, domain: e.target.value})}
                                        className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-purple-50 focus:border-purple-200 outline-none transition-all appearance-none"
                                    >
                                        <option value="AI">AI</option>
                                        <option value="FINTECH">FINTECH</option>
                                        <option value="EDTECH">EDTECH</option>
                                        <option value="MEDTECH">MEDTECH</option>
                                        <option value="AGRITECH">AGRITECH</option>
                                        <option value="BLOCK CHAIN">BLOCK CHAIN</option>
                                        <option value="OTHERS">OTHERS</option>
                                    </select>
                                </div>
                            </div>

                            {hackathonSubmission.teamType === 'Team' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Team Members (Comma separated names)</label>
                                    <input 
                                        type="text" 
                                        value={hackathonSubmission.teamMembers}
                                        onChange={(e) => setHackathonSubmission({...hackathonSubmission, teamMembers: e.target.value})}
                                        placeholder="Member 1, Member 2, ..."
                                        className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-purple-50 focus:border-purple-200 outline-none transition-all"
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between ml-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Problem Statement</label>
                                    <span className={`text-[10px] font-black ${hackathonSubmission.problemStatement.trim().split(/\s+/).filter(Boolean).length > 50 ? 'text-red-500' : 'text-purple-600'}`}>
                                        {hackathonSubmission.problemStatement.trim().split(/\s+/).filter(Boolean).length} / 50 words
                                    </span>
                                </div>
                                <textarea 
                                    value={hackathonSubmission.problemStatement}
                                    onChange={(e) => setHackathonSubmission({...hackathonSubmission, problemStatement: e.target.value})}
                                    placeholder="What problem are you solving?"
                                    className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-purple-50 focus:border-purple-200 outline-none transition-all h-28 sm:h-32 resize-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between ml-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Solution</label>
                                    <span className={`text-[10px] font-black ${hackathonSubmission.solution.trim().split(/\s+/).filter(Boolean).length > 100 ? 'text-red-500' : 'text-purple-600'}`}>
                                        {hackathonSubmission.solution.trim().split(/\s+/).filter(Boolean).length} / 100 words
                                    </span>
                                </div>
                                <textarea 
                                    value={hackathonSubmission.solution}
                                    onChange={(e) => setHackathonSubmission({...hackathonSubmission, solution: e.target.value})}
                                    placeholder="Describe your solution..."
                                    className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-purple-50 focus:border-purple-200 outline-none transition-all h-36 sm:h-40 resize-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">PPT Link (Google Drive)</label>
                                <input 
                                    type="url" 
                                    value={hackathonSubmission.pptLink}
                                    onChange={(e) => setHackathonSubmission({...hackathonSubmission, pptLink: e.target.value})}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-purple-50 focus:border-purple-200 outline-none transition-all"
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">GitHub Link (Optional)</label>
                                    <input 
                                        type="url" 
                                        value={hackathonSubmission.githubLink}
                                        onChange={(e) => setHackathonSubmission({...hackathonSubmission, githubLink: e.target.value})}
                                        placeholder="https://github.com/..."
                                        className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-purple-50 focus:border-purple-200 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Deployed Link (Optional)</label>
                                    <input 
                                        type="url" 
                                        value={hackathonSubmission.deployedLink}
                                        onChange={(e) => setHackathonSubmission({...hackathonSubmission, deployedLink: e.target.value})}
                                        placeholder="https://..."
                                        className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-purple-50 focus:border-purple-200 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-5 sm:p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 sm:gap-4">
                            <button 
                                onClick={() => setShowSubmissionModal(false)}
                                className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleHackathonSubmit}
                                disabled={isSubmittingHackathon}
                                className="px-7 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-black uppercase tracking-widest hover:from-purple-700 hover:to-indigo-700 shadow-xl shadow-purple-600/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSubmittingHackathon ? 'Submitting...' : 'Submit Idea'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
        </div>
        </div>
    );
};

export default OpportunityDetails;
