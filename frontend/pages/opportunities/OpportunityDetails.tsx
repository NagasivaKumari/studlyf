import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    Calendar, 
    MapPin, 
    ChevronLeft, 
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, authHeaders } from '../../apiConfig';
import { useAuth } from '../../AuthContext';
import TeamManager from './TeamManager';
import {
    formatOpportunityLocation,
    plainTextFromRichContent,
    richHtmlFromOpportunityField,
    sanitizePresentationHtml,
} from '../../utils/text';

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
    const [activeSection, setActiveSection] = useState<'details' | 'dates' | 'prizes' | 'reviews' | 'faq'>('details');

    const detailsRef = useRef<HTMLDivElement>(null);
    const datesRef = useRef<HTMLDivElement>(null);
    const prizesRef = useRef<HTMLDivElement>(null);
    const reviewsRef = useRef<HTMLDivElement>(null);
    const faqRef = useRef<HTMLDivElement>(null);

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
        const t = opportunity.type || 'Hackathon';
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
                const [oppRes, appRes] = await Promise.all([
                    fetch(oppUrl),
                    user
                        ? fetch(`${API_BASE_URL}/api/opportunities/me/applications`, {
                              headers: { ...authHeaders() },
                          })
                        : Promise.resolve({ ok: false, json: async () => [] } as Response),
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

    const registrationFields: RegField[] = Array.isArray(opportunity?.registrationFields)
        ? opportunity.registrationFields
        : [];
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

        if (useInstitutionForm) {
            for (const f of registrationFields) {
                if (!f.required) continue;
                const t = (f.type || 'text').toLowerCase();
                if (t === 'file' || t === 'upload') {
                    if (!regFiles[f.id]) {
                        alert(`Please complete: ${f.label}`);
                        return;
                    }
                } else if (t === 'accept') {
                    if (regAnswers[f.id] !== 'on' && regAnswers[f.id] !== 'true') {
                        alert(`Please accept: ${f.label}`);
                        return;
                    }
                } else if (t === 'checkbox' && f.options && f.options.length > 0) {
                    const anyOn = f.options.some((opt) => regAnswers[`${f.id}:${opt}`] === 'on');
                    if (!anyOn) {
                        alert(`Please complete: ${f.label}`);
                        return;
                    }
                } else if (!(regAnswers[f.id] || '').trim()) {
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
                headers: { 'Content-Type': 'application/json' },
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
                
                // If there's a join code in the URL, redirect back to the hub to complete joining
                const params = new URLSearchParams(window.location.search);
                const joinCode = params.get('join');
                if (joinCode) {
                    const eid = opportunity.event_link_id || id;
                    setTimeout(() => {
                        navigate(`/events/${eid}?join=${joinCode}`);
                    }, 1500);
                }
            } else {
                const errData = await response.json().catch(() => ({}));
                alert(errData.detail || "Failed to submit application. Please check your details and try again.");
            }
        } catch (err) {
            console.error("Apply error:", err);
        } finally {
            setSubmitting(false);
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

    const scrollToSection = (key: 'details' | 'dates' | 'prizes' | 'reviews' | 'faq') => {
        setActiveSection(key);
        const ref =
            key === 'details'
                ? detailsRef
                : key === 'dates'
                  ? datesRef
                  : key === 'prizes'
                    ? prizesRef
                    : key === 'reviews'
                      ? reviewsRef
                      : faqRef;
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            <header className="sticky top-16 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
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
                        {hasDatesSection ? (
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
                        ) : null}
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
                                    const dec = applicationDecisionCopy(myApplication?.status);
                                    return (
                                        <>
                                            <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                                                <CheckCircle2 size={22} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
                                                    {dec.headline}
                                                </p>
                                                <p className="font-black text-emerald-900">{dec.title}</p>
                                                <p className="text-sm text-emerald-800/90 mt-0.5">{dec.sub}</p>
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
                                        {opportunity.stages.map((s: any, i: number) => (
                                            <li
                                                key={s.id || i}
                                                className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100"
                                            >
                                                <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-purple-600/10 text-purple-600 font-black flex items-center justify-center text-sm">
                                                    {i + 1}
                                                </span>
                                                <div>
                                                    <p className="font-bold text-slate-900">{s.name || `Stage ${i + 1}`}</p>
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
                                                    {isApplied && (() => {
                                                        const stype = s.type?.toUpperCase();
                                                        const event_hub_id = String(opportunity.event_link_id || opportunity.event_id || id);
                                                        
                                                        if (stype === 'TEAM_FORMATION' || s.name?.toUpperCase().includes('TEAM')) {
                                                            return (
                                                                <Link 
                                                                    to={`/events/${encodeURIComponent(event_hub_id)}`}
                                                                    className="inline-flex mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-slate-900/10"
                                                                >
                                                                    Manage team & members
                                                                </Link>
                                                            );
                                                        }
                                                        if (stype === 'SUBMISSION') {
                                                            return (
                                                                <Link 
                                                                    to={`/events/${encodeURIComponent(event_hub_id)}`}
                                                                    className="inline-flex mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/10"
                                                                >
                                                                    Enter submission portal
                                                                </Link>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            </li>
                                        ))}
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
                                            className="opportunity-rich-text text-slate-600 font-medium leading-relaxed [&_p]:mb-3 [&_strong]:font-bold [&_blockquote]:border-l-4 [&_blockquote]:border-purple-200 [&_blockquote]:pl-4"
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
                                        <h2 className="text-2xl font-black text-slate-900">Apply Now</h2>
                                        <p className="text-slate-400 font-bold text-sm">Join {opportunity.organization} to start your journey</p>
                                    </div>

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
            </div>
        </div>
    );
};

export default OpportunityDetails;
