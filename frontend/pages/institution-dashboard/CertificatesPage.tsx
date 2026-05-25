import React, { useState, useEffect } from 'react';
import { Award, Search, Download, ExternalLink, Calendar, CheckCircle2, ShieldCheck, Loader2, LayoutTemplate, Sparkles, Send, Trophy } from 'lucide-react';
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
    const [issueMode, setIssueMode] = useState<'finalize' | 'participation'>('finalize');
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

    const handleIssueCertificates = async () => {
        if (!selectedEventId) {
            setIssueMessage('Select an event first.');
            return;
        }

        setIssuing(true);
        setIssueMessage(null);
        try {
            const endpoint = issueMode === 'finalize'
                ? `${API_BASE_URL}/api/v1/institution/finalize-event/${selectedEventId}`
                : `${API_BASE_URL}/api/v1/events/${selectedEventId}/certificates/generate`;
            const requestUrl = selectedTemplateId ? `${endpoint}?template_id=${encodeURIComponent(selectedTemplateId)}` : endpoint;

            const res = await fetch(requestUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders(),
                },
                body: issueMode === 'finalize'
                    ? undefined
                    : JSON.stringify({ achievement_type: 'participation' }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || err.message || 'Failed to issue certificates');
            }

            const data = await res.json().catch(() => ({}));
            setIssueMessage(issueMode === 'finalize'
                ? `Event finalized. Certificates are being generated automatically.${data.certificates_issued ? ` Issued ${data.certificates_issued} certificates.` : ''}`
                : 'Participation certificates queued for generation.');
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
                                    Finalize the event to automatically award winners, runner-ups, and participants, or queue participation certificates for the full event audience.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[720px]">
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
                                    onChange={e => setIssueMode(e.target.value as 'finalize' | 'participation')}
                                    className="px-4 py-3 rounded-2xl bg-white text-slate-900 font-medium outline-none"
                                >
                                    <option value="finalize">Final Results</option>
                                    <option value="participation">Participation</option>
                                </select>
                                <button
                                    onClick={handleIssueCertificates}
                                    disabled={issuing}
                                    className="sm:col-span-3 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#6C3BFF] hover:bg-[#5B2EEB] transition-all font-black uppercase tracking-[0.2em] text-[10px] disabled:opacity-60"
                                >
                                    {issueMode === 'finalize' ? <Trophy size={16} /> : <Send size={16} />}
                                    {issuing ? 'Processing...' : issueMode === 'finalize' ? 'Finalize & Issue Awards' : 'Queue Participation Certificates'}
                                </button>
                            </div>
                        </div>

                        {issueMessage && (
                            <div className="relative mt-6 text-sm font-medium text-white/80 bg-white/10 border border-white/10 rounded-2xl px-4 py-3">
                                {issueMessage}
                            </div>
                        )}
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
                                                    <button className="p-2.5 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl hover:text-[#6C3BFF] hover:border-purple-100 transition-all"><Download size={16} /></button>
                                                    <button className="p-2.5 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl hover:text-[#6C3BFF] hover:border-purple-100 transition-all"><ExternalLink size={16} /></button>
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
