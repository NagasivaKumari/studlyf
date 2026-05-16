import React, { useState, useEffect } from 'react';
import { Award, Search, Download, ExternalLink, Calendar, CheckCircle2, ShieldCheck, Loader2, LayoutTemplate } from 'lucide-react';
import CertificateTemplateBuilder from './components/CertificateTemplateBuilder';

interface Certificate {
    _id: string; student_name: string; event_title: string;
    certificate_id: string; issue_date: string; category: string;
}
interface CertificatesPageProps { institutionId: string; }

const TABS = [
    { id: 'registry', label: 'Achievement Registry', icon: Award },
    { id: 'builder', label: 'Template Builder', icon: LayoutTemplate },
] as const;

const CertificatesPage: React.FC<CertificatesPageProps> = ({ institutionId }) => {
    const [tab, setTab] = useState<'registry' | 'builder'>('registry');
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (tab !== 'registry') return;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/v1/institution/certificates/${institutionId}`);
                if (res.ok) setCertificates(await res.json());
            } catch (e) { console.error(e); } finally { setLoading(false); }
        })();
    }, [institutionId, tab]);

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
