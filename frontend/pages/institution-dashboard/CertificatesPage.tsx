import React, { useState, useEffect, useMemo } from 'react';
import { Award, Search, Download, ExternalLink, Calendar, CheckCircle2, ShieldCheck, Loader2, LayoutTemplate, Sparkles, Send, Trophy, Medal, Users, Info } from 'lucide-react';
import { API_BASE_URL, authHeaders } from '../../apiConfig';
import CertificateTemplateBuilder from './components/CertificateTemplateBuilder';

interface Certificate {
    _id: string; student_name: string; event_title: string;
    certificate_id: string; issue_date: string; category: string;
}
interface EventOption {
    _id: string;
    title: string;
    status?: string;
    finalized_at?: string;
}
interface TemplateOption {
    template_id: string;
    name: string;
    description?: string;
}
interface LeaderboardEntry {
    rank: number;
    team_name?: string;
    student_name?: string;
    project_title?: string;
    total_score?: number;
}
interface AwardBand {
    id: string;
    label: string;
    achievement_type: string;
    min_score: string;
    max_score: string;
    limit: string;
    template_id?: string;
}
interface CertificatesPageProps { institutionId: string; }

const TABS = [
    { id: 'registry', label: 'Achievement Registry', icon: Award },
    { id: 'builder', label: 'Template Builder', icon: LayoutTemplate },
] as const;

const CertificatesPage: React.FC<CertificatesPageProps> = ({ institutionId }) => {
    const [tab, setTab] = useState<'registry' | 'builder'>('registry');
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [events, setEvents] = useState<EventOption[]>([]);
    const [templates, setTemplates] = useState<TemplateOption[]>([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [issueMode, setIssueMode] = useState<'ranked' | 'participation'>('ranked');
    const [awardPolicy, setAwardPolicy] = useState<'all_ranked' | 'top_n' | 'min_score' | 'bands'>('bands');
    const [topNValue, setTopNValue] = useState('3');
    const [minScoreValue, setMinScoreValue] = useState('80');
    const [awardBands, setAwardBands] = useState<AwardBand[]>([
        { id: 'winner', label: 'Winner', achievement_type: 'winner', min_score: '90', max_score: '', limit: '1' },
        { id: 'runner-up', label: 'Runner Up', achievement_type: 'runner_up', min_score: '80', max_score: '89.99', limit: '1' },
        { id: 'finalist', label: 'Finalist', achievement_type: 'finalist', min_score: '70', max_score: '79.99', limit: '' },
    ]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [loading, setLoading] = useState(true);
    const [issuing, setIssuing] = useState(false);
    const [issueMessage, setIssueMessage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!institutionId) return;
        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${institutionId}`, { headers: { ...authHeaders() } });
                if (!res.ok) return;
                const data = await res.json();
                const mapped = (Array.isArray(data) ? data : []).map((event: any) => ({
                    _id: String(event._id || event.id || ''),
                    title: event.title || event.name || 'Untitled Event',
                    status: event.status || 'Unknown',
                    finalized_at: event.finalized_at,
                }));
                setEvents(mapped);
                if (!selectedEventId && mapped.length > 0) {
                    setSelectedEventId(mapped[0]._id);
                }
            } catch (error) {
                console.error(error);
            }
        })();
    }, [institutionId]);

    useEffect(() => {
        if (!selectedEventId) {
            setLeaderboard([]);
            return;
        }

        (async () => {
            try {
                const detailRes = await fetch(`${API_BASE_URL}/api/v1/institution/events/${selectedEventId}/details`, {
                    headers: { ...authHeaders() },
                });
                if (!detailRes.ok) return;
                const detail = await detailRes.json();
                const savedConfig = detail?.certificate_award_config;
                if (savedConfig) {
                    if (savedConfig.awardPolicy) {
                        setAwardPolicy(savedConfig.awardPolicy);
                    }
                    if (savedConfig.topNValue !== undefined && savedConfig.topNValue !== null) {
                        setTopNValue(String(savedConfig.topNValue));
                    }
                    if (savedConfig.minScoreValue !== undefined && savedConfig.minScoreValue !== null) {
                        setMinScoreValue(String(savedConfig.minScoreValue));
                    }
                    if (Array.isArray(savedConfig.awardBands) && savedConfig.awardBands.length > 0) {
                        setAwardBands(savedConfig.awardBands.map((band: any, index: number) => ({
                            id: String(band.id || `saved-band-${index}`),
                            label: String(band.label || 'Award'),
                            achievement_type: String(band.achievement_type || 'top_performer'),
                            min_score: band.min_score === undefined || band.min_score === null ? '' : String(band.min_score),
                            max_score: band.max_score === undefined || band.max_score === null ? '' : String(band.max_score),
                            limit: band.limit === undefined || band.limit === null ? '' : String(band.limit),
                            template_id: band.template_id || undefined,
                        })));
                    }
                }
            } catch (error) {
                console.error(error);
            }
        })();

        (async () => {
            try {
                setLoadingPreview(true);
                const res = await fetch(`${API_BASE_URL}/api/judging/leaderboard/${selectedEventId}`);
                if (!res.ok) {
                    setLeaderboard([]);
                    return;
                }

                const data = await res.json();
                const mapped = (Array.isArray(data) ? data : []).map((entry: any) => ({
                    rank: Number(entry.rank || 0),
                    team_name: entry.teamName || entry.team_name || entry.student_name || '',
                    student_name: entry.student_name || entry.recipient_name || '',
                    project_title: entry.projectTitle || entry.project_title || '',
                    total_score: Number(entry.totalScore ?? entry.total_score ?? 0),
                }));
                setLeaderboard(mapped);
            } catch (error) {
                console.error(error);
                setLeaderboard([]);
            } finally {
                setLoadingPreview(false);
            }
        })();
    }, [selectedEventId]);

    useEffect(() => {
        if (!institutionId) return;
        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/cert-templates`, { headers: { ...authHeaders() } });
                if (!res.ok) return;
                const data = await res.json();
                const mapped = (Array.isArray(data) ? data : []).map((template: any) => ({
                    template_id: String(template.template_id || template.id || ''),
                    name: template.name || template.template_name || 'Certificate Template',
                    description: template.description || '',
                })).filter((template: TemplateOption) => template.template_id);
                setTemplates(mapped);
                if (!selectedTemplateId && mapped.length > 0) {
                    setSelectedTemplateId(mapped[0].template_id);
                }
            } catch (error) {
                console.error(error);
            }
        })();
    }, [institutionId]);

    useEffect(() => {
        if (tab !== 'registry') return;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE_URL}/api/v1/institution/certificates/${institutionId}`, { headers: { ...authHeaders() } });
                if (res.ok) setCertificates(await res.json());
            } catch (e) { console.error(e); } finally { setLoading(false); }
        })();
    }, [institutionId, tab]);

    const refreshCertificates = async () => {
        const res = await fetch(`${API_BASE_URL}/api/v1/institution/certificates/${institutionId}`, { headers: { ...authHeaders() } });
        if (res.ok) setCertificates(await res.json());
    };

    const saveAwardSetup = async () => {
        if (!selectedEventId) {
            setIssueMessage('Select an event first.');
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${selectedEventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    certificate_award_config: {
                        awardPolicy,
                        topNValue,
                        minScoreValue,
                        awardBands,
                    },
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || err.message || 'Failed to save award setup');
            }

            setIssueMessage('Award setup saved for this event.');
        } catch (error: any) {
            setIssueMessage(error?.message || 'Failed to save award setup.');
        }
    };

    const awardPreview = useMemo(() => {
        const limit = awardPolicy === 'top_n' ? Math.max(Number(topNValue) || 0, 0) : leaderboard.length;
        const minScore = awardPolicy === 'min_score' ? Number(minScoreValue) || 0 : null;
        const selected = awardPolicy === 'bands'
            ? (() => {
                const seen = new Set<number>();
                const results: LeaderboardEntry[] = [];
                awardBands.forEach((band) => {
                    const min = band.min_score !== '' ? Number(band.min_score) : Number.NEGATIVE_INFINITY;
                    const max = band.max_score !== '' ? Number(band.max_score) : Number.POSITIVE_INFINITY;
                    let rows = leaderboard.filter(item => Number(item.total_score || 0) >= min && Number(item.total_score || 0) <= max);
                    if (band.limit !== '') {
                        rows = rows.slice(0, Math.max(Number(band.limit) || 0, 0));
                    }
                    rows.forEach((row) => {
                        const key = row.rank || results.length;
                        if (!seen.has(key)) {
                            seen.add(key);
                            results.push(row);
                        }
                    });
                });
                return results;
            })()
            : awardPolicy === 'min_score'
                ? leaderboard.filter(item => Number(item.total_score || 0) >= Number(minScore))
                : leaderboard.slice(0, limit || leaderboard.length);
        return {
            limit,
            minScore,
            bands: awardBands,
            winnerCount: selected.filter(item => item.rank === 1).length,
            runnerUpCount: selected.filter(item => item.rank === 2).length,
            secondRunnerUpCount: selected.filter(item => item.rank === 3).length,
            finalistCount: Math.max(selected.length - 3, 0),
            total: selected.length,
            selected,
        };
    }, [awardPolicy, leaderboard]);

    const handleIssueCertificates = async () => {
        if (!selectedEventId) {
            setIssueMessage('Select an event first.');
            return;
        }

        setIssuing(true);
        setIssueMessage(null);
        try {
            const isParticipation = issueMode === 'participation';
            const endpoint = isParticipation
                ? `${API_BASE_URL}/api/v1/events/${selectedEventId}/certificates/generate`
                : `${API_BASE_URL}/api/v1/institution/events/${selectedEventId}/certificates/issue-ranked`;
            const body = isParticipation
                ? JSON.stringify({ achievement_type: 'participation' })
                : JSON.stringify({
                    template_id: selectedTemplateId || undefined,
                    limit: awardPolicy === 'top_n' ? Number(topNValue) || undefined : undefined,
                    min_score: awardPolicy === 'min_score' ? Number(minScoreValue) || undefined : undefined,
                    bands: awardPolicy === 'bands' ? awardBands.map((band) => ({
                        label: band.label,
                        achievement_type: band.achievement_type,
                        min_score: band.min_score === '' ? undefined : Number(band.min_score),
                        max_score: band.max_score === '' ? undefined : Number(band.max_score),
                        limit: band.limit === '' ? undefined : Number(band.limit),
                        template_id: band.template_id || undefined,
                    })) : undefined,
                    send_email: true,
                });

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders(),
                },
                body,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || err.message || 'Failed to issue certificates');
            }

            const data = await res.json().catch(() => ({}));
            setIssueMessage(isParticipation
                ? 'Participation certificates queued for generation.'
                : `Ranked certificates issued.${data.certificates_issued ? ` Issued ${data.certificates_issued} certificates.` : ''}`);
            await refreshCertificates();
        } catch (error: any) {
            setIssueMessage(error?.message || 'Failed to issue certificates.');
        } finally {
            setIssuing(false);
        }
    };

    const filtered = certificates.filter(c =>
        c.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.event_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.certificate_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 font-sans">
            {/* Tab Bar */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl w-fit border border-slate-100">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === t.id ? 'bg-white text-[#6C3BFF] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                        <t.icon size={15} />{t.label}
                    </button>
                ))}
            </div>

            {tab === 'builder' ? (
                <CertificateTemplateBuilder institutionId={institutionId} />
            ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Achievement Registry</h1>
                            <p className="text-slate-500 mt-1 font-medium">Verify and manage official recognition issued by your institution.</p>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#6C3BFF] transition-colors" size={18} />
                            <input type="text" placeholder="Search name or ID..." value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-purple-50 focus:border-[#6C3BFF] transition-all w-72 font-medium text-slate-700 placeholder:text-slate-300 text-sm" />
                        </div>
                    </div>

                    {/* Issuance Panel */}
                    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-900/10 border border-slate-800/70 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at top left, rgba(255,255,255,0.25), transparent 28%), radial-gradient(circle at bottom right, rgba(124,58,237,0.25), transparent 24%)' }} />
                        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-[0.25em] mb-4">
                                    <Sparkles size={12} /> Unstop-style issuance
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black tracking-tight">Issue certificates in one action</h2>
                                <p className="text-white/70 mt-3 leading-relaxed">
                                    Select one template, pick an award policy, and issue either ranked awards or participation certificates in a controlled batch.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[860px]">
                                <select
                                    value={selectedEventId}
                                    onChange={e => setSelectedEventId(e.target.value)}
                                    className="sm:col-span-2 px-4 py-3 rounded-2xl bg-white text-slate-900 font-medium outline-none"
                                >
                                    <option value="">Select event</option>
                                    {events.map(event => (
                                        <option key={event._id} value={event._id}>
                                            {event.title} {event.status ? `(${event.status})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={awardPolicy}
                                    onChange={e => setAwardPolicy(e.target.value as 'all_ranked' | 'top_n' | 'min_score' | 'bands')}
                                    className="px-4 py-3 rounded-2xl bg-white text-slate-900 font-medium outline-none"
                                    disabled={issueMode === 'participation'}
                                >
                                    <option value="bands">Custom bands</option>
                                    <option value="top_n">Top N by rank</option>
                                    <option value="min_score">Minimum score cutoff</option>
                                    <option value="all_ranked">All ranked</option>
                                </select>
                                <select
                                    value={selectedTemplateId}
                                    onChange={e => setSelectedTemplateId(e.target.value)}
                                    className="px-4 py-3 rounded-2xl bg-white text-slate-900 font-medium outline-none"
                                >
                                    <option value="">Default template</option>
                                    {templates.map(template => (
                                        <option key={template.template_id} value={template.template_id}>
                                            {template.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={issueMode}
                                    onChange={e => setIssueMode(e.target.value as 'ranked' | 'participation')}
                                    className="px-4 py-3 rounded-2xl bg-white text-slate-900 font-medium outline-none"
                                >
                                    <option value="ranked">Ranked Awards</option>
                                    <option value="participation">Participation</option>
                                </select>
                                {issueMode === 'ranked' && awardPolicy === 'top_n' && (
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={topNValue}
                                        onChange={e => setTopNValue(e.target.value)}
                                        placeholder="Top N"
                                        className="px-4 py-3 rounded-2xl bg-white text-slate-900 font-medium outline-none"
                                    />
                                )}
                                {issueMode === 'ranked' && awardPolicy === 'min_score' && (
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={minScoreValue}
                                        onChange={e => setMinScoreValue(e.target.value)}
                                        placeholder="Min score"
                                        className="px-4 py-3 rounded-2xl bg-white text-slate-900 font-medium outline-none"
                                    />
                                )}
                                <button
                                    onClick={handleIssueCertificates}
                                    disabled={issuing}
                                    className="sm:col-span-3 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#6C3BFF] hover:bg-[#5B2EEB] transition-all font-black uppercase tracking-[0.2em] text-[10px] disabled:opacity-60"
                                >
                                    {issueMode === 'participation' ? <Send size={16} /> : <Trophy size={16} />}
                                    {issuing ? 'Processing...' : issueMode === 'participation' ? 'Queue Participation Certificates' : 'Issue Ranked Awards'}
                                </button>
                                <button
                                    onClick={saveAwardSetup}
                                    disabled={issuing}
                                    className="sm:col-span-3 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all font-black uppercase tracking-[0.2em] text-[10px] disabled:opacity-60"
                                >
                                    Save Award Setup
                                </button>
                            </div>
                        </div>

                        {issueMode === 'ranked' && awardPolicy === 'bands' && (
                            <div className="relative mt-6 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Custom Award Bands</p>
                                        <p className="text-sm text-white/70">Admin decides the labels and score windows for certificates.</p>
                                    </div>
                                    <button
                                        onClick={() => setAwardBands(prev => [...prev, { id: `band-${Date.now()}`, label: 'New Band', achievement_type: 'top_performer', min_score: '', max_score: '', limit: '' }])}
                                        className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em]"
                                    >
                                        Add Band
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {awardBands.map((band, index) => (
                                        <div key={band.id} className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr_0.8fr_0.6fr_1.2fr_auto] gap-3 items-center bg-white/5 rounded-2xl p-3">
                                            <input
                                                value={band.label}
                                                onChange={e => setAwardBands(prev => prev.map(item => item.id === band.id ? { ...item, label: e.target.value } : item))}
                                                className="px-3 py-2 rounded-xl bg-white text-slate-900 text-sm font-medium outline-none"
                                                placeholder="Band label"
                                            />
                                            <input
                                                value={band.achievement_type}
                                                onChange={e => setAwardBands(prev => prev.map(item => item.id === band.id ? { ...item, achievement_type: e.target.value } : item))}
                                                className="px-3 py-2 rounded-xl bg-white text-slate-900 text-sm font-medium outline-none"
                                                placeholder="achievement_type"
                                            />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={band.min_score}
                                                onChange={e => setAwardBands(prev => prev.map(item => item.id === band.id ? { ...item, min_score: e.target.value } : item))}
                                                className="px-3 py-2 rounded-xl bg-white text-slate-900 text-sm font-medium outline-none"
                                                placeholder="Min score"
                                            />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={band.max_score}
                                                onChange={e => setAwardBands(prev => prev.map(item => item.id === band.id ? { ...item, max_score: e.target.value } : item))}
                                                className="px-3 py-2 rounded-xl bg-white text-slate-900 text-sm font-medium outline-none"
                                                placeholder="Max score"
                                            />
                                            <input
                                                type="number"
                                                step="1"
                                                value={band.limit}
                                                onChange={e => setAwardBands(prev => prev.map(item => item.id === band.id ? { ...item, limit: e.target.value } : item))}
                                                className="px-3 py-2 rounded-xl bg-white text-slate-900 text-sm font-medium outline-none"
                                                placeholder="Limit"
                                            />
                                            <select
                                                value={band.template_id || ''}
                                                onChange={e => setAwardBands(prev => prev.map(item => item.id === band.id ? { ...item, template_id: e.target.value } : item))}
                                                className="px-3 py-2 rounded-xl bg-white text-slate-900 text-sm font-medium outline-none"
                                            >
                                                <option value="">Default</option>
                                                {templates.map(t => <option key={t.template_id} value={t.template_id}>{t.name}</option>)}
                                            </select>
                                            <button
                                                onClick={() => setAwardBands(prev => prev.filter(item => item.id !== band.id))}
                                                className="px-3 py-2 rounded-xl bg-rose-500/20 text-rose-200 text-[10px] font-black uppercase tracking-[0.2em]"
                                                disabled={awardBands.length === 1}
                                            >
                                                Remove
                                            </button>
                                            <div className="lg:col-span-7 text-[10px] uppercase tracking-[0.2em] text-white/40 pl-1">Band {index + 1}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {issueMessage && (
                            <div className="relative mt-6 text-sm font-medium text-white/80 bg-white/10 border border-white/10 rounded-2xl px-4 py-3">
                                {issueMessage}
                            </div>
                        )}

                        <div className="relative mt-6 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/60 mb-3">
                                    <Info size={12} /> Award Rule
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                    <div className="rounded-2xl bg-white/10 p-3">
                                        <p className="text-white font-black">Admin decides</p>
                                        <p className="text-white/70">Top N or minimum score</p>
                                    </div>
                                    <div className="rounded-2xl bg-white/10 p-3">
                                        <p className="text-white font-black">Snapshot based</p>
                                        <p className="text-white/70">Uses current leaderboard</p>
                                    </div>
                                    <div className="rounded-2xl bg-white/10 p-3">
                                        <p className="text-white font-black">One template</p>
                                        <p className="text-white/70">Chosen by admin</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/60 mb-3">
                                    <Medal size={12} /> Preview
                                </div>
                                {loadingPreview ? (
                                    <p className="text-sm text-white/60">Loading leaderboard preview...</p>
                                ) : (
                                    <div className="space-y-2 text-sm text-white/80">
                                        <p><span className="font-black text-white">{awardPreview.total}</span> recipients in this issuance set</p>
                                                {awardPolicy === 'bands' ? (
                                                    <p>Custom bands: <span className="font-black text-white">{awardBands.length}</span></p>
                                                ) : awardPreview.minScore !== null ? (
                                                    <p>Minimum score: <span className="font-black text-white">{awardPreview.minScore}</span></p>
                                                ) : (
                                                    <p>Top N: <span className="font-black text-white">{awardPreview.limit}</span></p>
                                                )}
                                                <p>Winners: <span className="font-black text-white">{awardPreview.winnerCount}</span></p>
                                                <p>Runner Ups: <span className="font-black text-white">{awardPreview.runnerUpCount}</span></p>
                                                <p>Second Runner Ups: <span className="font-black text-white">{awardPreview.secondRunnerUpCount}</span></p>
                                                <p>Other finalists: <span className="font-black text-white">{awardPreview.finalistCount}</span></p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Total Issued', value: certificates.length, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
                            { label: 'Verified Today', value: certificates.filter(c => new Date(c.issue_date).toDateString() === new Date().toDateString()).length, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Pending', value: 0, icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50' },
                        ].map((s, i) => (
                            <div key={i} className="p-8 bg-white rounded-[2rem] border border-slate-50 shadow-sm flex items-center gap-6">
                                <div className={`w-16 h-16 ${s.bg} rounded-2xl flex items-center justify-center ${s.color}`}><s.icon size={28} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                                    <h4 className="text-3xl font-black text-slate-900">{s.value}</h4>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="animate-spin text-[#6C3BFF]" size={36} />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading records...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/70">
                                        {['Recipient', 'Event', 'Issue Date', 'Certificate ID', 'Actions'].map(h => (
                                            <th key={h} className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtered.length > 0 ? filtered.map(cert => (
                                        <tr key={cert._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-[#6C3BFF] font-black text-sm">{cert.student_name[0]}</div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm">{cert.student_name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{cert.category || 'Participant'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-medium text-slate-600">{cert.event_title}</td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                    <Calendar size={14} />
                                                    {new Date(cert.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6"><code className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-600">{cert.certificate_id}</code></td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
<button className="p-2.5 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl hover:text-[#6C3BFF] hover:border-purple-100 transition-all"
    onClick={() => window.open(`${API_BASE_URL}/api/v1/institution/download-certificate/${cert.certificate_id}`, '_blank')}><Download size={16} /></button>
<button className="p-2.5 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl hover:text-[#6C3BFF] hover:border-purple-100 transition-all"
    onClick={() => window.open(`/verify/${cert.certificate_id}`, '_blank')}><ExternalLink size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-20">
                                                <Award size={48} />
                                                <p className="text-lg font-black uppercase tracking-widest">No Certificates Yet</p>
                                            </div>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CertificatesPage;
