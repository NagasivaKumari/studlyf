import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Briefcase, Calendar, MapPin, ChevronRight, ChevronLeft, Sparkles, Loader2, SlidersHorizontal, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, authHeaders } from '../../apiConfig';
import { useAuth } from '../../AuthContext';
import { plainTextFromRichContent, formatOpportunityLocation } from '../../utils/text';

const typeOptions = ['All', 'Hackathon', 'Competition', 'Challenge', 'Conference', 'Workshop', 'Internship', 'Job'];
const locationOptions = ['All', 'Remote', 'On-site', 'Hybrid'];
const sortOptions = ['Newest', 'Deadline soon', 'Most applied'];

const normalizeText = (value: unknown) => String(value ?? '').toLowerCase();

const matchesOpportunityType = (opportunityType: unknown, selectedType: string) => {
    if (selectedType === 'All') return true;

    const type = normalizeText(opportunityType);
    const keywordMap: Record<string, string[]> = {
        'my events': [],
        hackathon: ['hackathon', 'coding challenge'],
        competition: ['competition', 'case competition'],
        challenge: ['challenge', 'ideathon'],
        conference: ['conference', 'summit', 'expo', 'forum'],
        workshop: ['workshop', 'bootcamp', 'masterclass'],
        internship: ['internship', 'trainee', 'apprenticeship', 'placement'],
        job: ['job', 'role', 'career', 'hiring']
    };

    const selected = selectedType.toLowerCase();
    const keywords = keywordMap[selected] || [selected];
    return keywords.some((keyword) => type.includes(keyword));
};

const matchesLocation = (location: unknown, selectedLocation: string) => {
    if (selectedLocation === 'All') return true;
    const text = normalizeText(location);
    if (!text) return selectedLocation === 'Online' || selectedLocation === 'Remote' ? false : true;
    if (selectedLocation === 'Remote' || selectedLocation === 'Online') return text.includes('remote') || text.includes('online') || text.includes('virtual');
    if (selectedLocation === 'On-site' || selectedLocation === 'Offline') return text.includes('on-site') || text.includes('onsite') || text.includes('in-person') || text.includes('offline');
    if (selectedLocation === 'Hybrid') return text.includes('hybrid');
    return true;
};

const safeDateValue = (value: unknown) => {
    const date = new Date(String(value ?? ''));
    return Number.isNaN(date.getTime()) ? new Date(0) : date;
};

const OpportunitiesList: React.FC = () => {
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('All');
    const [selectedLocation, setSelectedLocation] = useState('All');
    const [selectedSort, setSelectedSort] = useState('Newest');
    const [showAppliedOnly, setShowAppliedOnly] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [selectedParticipation, setSelectedParticipation] = useState('All');
    const [selectedTeamSize, setSelectedTeamSize] = useState('All');
    const [selectedPayment, setSelectedPayment] = useState('All');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        location: false, status: false, teamSize: false, participation: false, skills: false
    });
    const [appliedIds, setAppliedIds] = useState<string[]>([]);
    const filtersRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [oppRes, appRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/opportunities`),
                    user ? fetch(`${API_BASE_URL}/api/opportunities/user/${user.user_id}/applications`, {
                        headers: { ...authHeaders() }
                    }) : Promise.resolve({ ok: true, json: () => [] } as any)
                ]);

                const opps = oppRes.ok ? await oppRes.json() : [];
                const apps = (appRes as any).ok ? await (appRes as any).json() : [];

                setOpportunities(Array.isArray(opps) ? opps : []);
                setAppliedIds(Array.isArray(apps) ? apps.map((a: any) => a.opportunity_id) : []);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const filteredOpportunities = useMemo(() => {
        const query = normalizeText(searchQuery).trim();

        const filtered = opportunities.filter((opp) => {
            const title = normalizeText(opp.title);
            const organization = normalizeText(opp.organization);
            const description = normalizeText(plainTextFromRichContent(opp.description));
            const locationLabel = normalizeText(formatOpportunityLocation(opp.location));
            const matchesSearch = !query || title.includes(query) || organization.includes(query) || description.includes(query) || locationLabel.includes(query);
            const matchesApplied = !showAppliedOnly || appliedIds.includes(opp._id);
            const matchesType = selectedType === 'My Events'
                ? appliedIds.includes(opp._id)
                : matchesOpportunityType(opp.type, selectedType);
            const matchesSelectedLocation = matchesLocation(opp.location, selectedLocation);

            const oppStatus = normalizeText(opp.status);
            const matchesStatus = selectedStatus === 'All' || oppStatus === normalizeText(selectedStatus);

            const oppParticipation = normalizeText(opp.participationType);
            const matchesParticipation = selectedParticipation === 'All' || oppParticipation === normalizeText(selectedParticipation);

            let matchesTeamSize = true;
            if (selectedTeamSize !== 'All') {
                const min = Number(opp.minTeamSize) || 0;
                const max = Number(opp.maxTeamSize) || 0;
                if (selectedTeamSize === '1-3') matchesTeamSize = (min >= 1 && max <= 3);
                else if (selectedTeamSize === '4-6') matchesTeamSize = (min >= 4 && max <= 6);
                else if (selectedTeamSize === '7+') matchesTeamSize = (max >= 7);
            }

            const matchesPayment = selectedPayment === 'All' || selectedPayment === 'Free';

            let matchesSkills = true;
            if (selectedSkills.length > 0) {
                const oppSkills = (opp.skills || []).map((s: string) => normalizeText(s));
                matchesSkills = selectedSkills.some((s) => oppSkills.includes(normalizeText(s)));
            }

            return matchesSearch && matchesApplied && matchesType && matchesSelectedLocation && matchesStatus && matchesParticipation && matchesTeamSize && matchesPayment && matchesSkills;
        });

        const sorted = [...filtered].sort((a, b) => {
            if (selectedSort === 'Most applied') {
                return (Number(b.applicantsCount) || 0) - (Number(a.applicantsCount) || 0);
            }

            const dateA = safeDateValue(a.deadline).getTime();
            const dateB = safeDateValue(b.deadline).getTime();

            if (selectedSort === 'Deadline soon') {
                return dateA - dateB;
            }

            return dateB - dateA;
        });

        return sorted;
    }, [appliedIds, opportunities, searchQuery, selectedLocation, selectedSort, selectedType, showAppliedOnly, selectedStatus, selectedParticipation, selectedTeamSize, selectedPayment, selectedSkills]);

    const getTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'my events': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'hackathon': return 'bg-purple-50 text-purple-700 border border-purple-200';
            case 'internship': return 'bg-blue-50 text-blue-700 border border-blue-200';
            case 'job': return 'bg-green-50 text-green-700 border border-green-200';
            case 'competition': return 'bg-orange-50 text-orange-700 border border-orange-200';
            case 'conference': return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
            case 'workshop': return 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200';
            case 'case study': return 'bg-amber-50 text-amber-700 border border-amber-200';
            case 'webinar': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
            default: return 'bg-slate-50 text-slate-700 border border-slate-200';
        }
    };

    const resetFilters = () => {
        setSelectedType('All');
        setSelectedLocation('All');
        setSelectedSort('Newest');
        setSearchQuery('');
        setShowAppliedOnly(false);
        setSelectedStatus('All');
        setSelectedParticipation('All');
        setSelectedTeamSize('All');
        setSelectedPayment('All');
        setSelectedSkills([]);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const isJob = selectedType === 'Job' || selectedType === 'Internship';
        const jobLocations = ['Remote', 'On-site', 'Hybrid', 'All'];
        const eventLocations = ['Online', 'Offline', 'Hybrid', 'All'];
        if (isJob && !jobLocations.includes(selectedLocation)) setSelectedLocation('All');
        if (!isJob && selectedType !== 'All' && !eventLocations.includes(selectedLocation)) setSelectedLocation('All');
    }, [selectedType]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans selection:bg-purple-200">
            {/* Massive Premium Hero Section */}
            <div className="relative pt-32 pb-20 px-6 overflow-hidden bg-white border-b border-slate-100">
                {/* Complex Mesh Background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                    <div className="absolute top-[0%] left-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-purple-500/10 via-fuchsia-500/5 to-transparent rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-tl from-indigo-500/10 via-cyan-500/5 to-transparent rounded-full blur-[100px]" />
                </div>

                <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center space-y-12">
                    {/* Top Navigation & Status */}
                    <div className="w-full flex justify-between items-center">
                        <button
                            onClick={() => navigate('/dashboard/learner')}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 bg-white/60 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200/60 shadow-sm transition-all hover:shadow-md hover:-translate-x-1 text-xs font-bold"
                        >
                            <ChevronLeft size={16} /> Dashboard
                        </button>

                        <div className="flex items-center gap-3">
                            {!loading && opportunities.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-xl shadow-sm"
                                >
                                    <div className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{opportunities.length} Active Roles</span>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Hero Typography */}
                    <div className="max-w-4xl mx-auto space-y-6 pt-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 shadow-inner"
                        >
                            <Sparkles size={14} className="text-purple-500" />
                            <span className="text-xs font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">Premium Discovery Engine</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.05]"
                        >
                            Your Next Big <br className="hidden md:block" />
                            <span className="relative inline-block mt-2">
                                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-purple-700 to-indigo-600">Opportunity</span>
                                <svg className="absolute w-full h-4 -bottom-1 left-0 -z-10 text-purple-200" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" />
                                </svg>
                            </span>
                            {' '}Awaits.
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed"
                        >
                            Connect with YC startups, global enterprises, and exclusive hackathons in a highly curated ecosystem built for top talent.
                        </motion.p>
                    </div>

                    {/* Apple-style Spotlight Search */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="w-full max-w-3xl relative group mt-8"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-fuchsia-500 rounded-[32px] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                        <div className="relative bg-white/80 backdrop-blur-2xl border border-white p-2.5 rounded-[32px] shadow-2xl flex items-center">
                            <div className="pl-6 pr-4">
                                <Search size={28} className="text-purple-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search roles, organizations, or keywords..."
                                className="w-full bg-transparent border-none outline-none py-5 text-lg font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="pr-4 hidden md:block">
                                <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-black text-slate-400 border border-slate-200 shadow-inner tracking-widest">
                                    SEARCH
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Floating Stat Cards (Desktop Only for visual depth) */}
                    <div className="hidden lg:block absolute left-4 top-[60%] -translate-y-1/2">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                            className="bg-white/80 backdrop-blur-xl border border-white p-5 rounded-[24px] shadow-xl shadow-slate-200/50 flex flex-col items-center space-y-2 transform -rotate-6 hover:rotate-0 transition-transform duration-500 w-40"
                        >
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-1 shadow-inner">
                                <Target size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overall Reach</span>
                            <span className="text-xl font-black text-slate-900">50+ Orgs</span>
                        </motion.div>
                    </div>
                    <div className="hidden lg:block absolute right-4 top-[40%] -translate-y-1/2">
                        <motion.div
                            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                            className="bg-white/80 backdrop-blur-xl border border-white p-5 rounded-[24px] shadow-xl shadow-slate-200/50 flex flex-col items-center space-y-2 transform rotate-6 hover:rotate-0 transition-transform duration-500 w-40"
                        >
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-1 shadow-inner">
                                <Zap size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registrations filling fast</span>
                            <span className="text-xl font-black text-slate-900 text-center leading-tight">&lt; Last 24h </span>
                        </motion.div>
                    </div>
                </div>
            </div>

                    {/* Category chips */}
                    <div className="flex items-center gap-3 py-4 flex-wrap">
                        <div className="flex gap-3 flex-wrap">
                            {typeOptions.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border flex-shrink-0 ${
                                        selectedType === type
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <div className="relative" ref={filtersRef}>
                            {(() => {
                                const activeCount = [selectedType !== 'All' && 'Category', selectedLocation !== 'All' && 'Location', selectedStatus !== 'All' && 'Status', selectedParticipation !== 'All' && 'Participation', selectedTeamSize !== 'All' && 'Team Size', selectedPayment !== 'All' && 'Payment', selectedSkills.length > 0 && 'Skills'].filter(Boolean).length;
                                const isJobType = selectedType === 'Job' || selectedType === 'Internship';
                                const filterLocationOptions = isJobType ? ['All', 'Remote', 'On-site', 'Hybrid'] : ['All', 'Online', 'Offline', 'Hybrid'];
                                return (
                            <>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${
                                    activeCount > 0
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <SlidersHorizontal size={12} />
                                Filters
                                {activeCount > 0 && (
                                    <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[9px] flex items-center justify-center font-black">{activeCount}</span>
                                )}
                            </button>

                            {showFilters && (
                                <div className="absolute right-0 top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-900/10 z-50 w-[320px] max-h-[70vh] overflow-y-auto">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                        <span className="text-sm font-black text-slate-900">All Filters</span>
                                        <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-slate-50 rounded-lg transition-colors">
                                            <X size={16} className="text-slate-400" />
                                        </button>
                                    </div>

                                    {/* Quick Filters */}
                                    {isJobType && (
                                        <div className="px-5 py-4 border-b border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Quick Filters</span>
                                            <div className="flex flex-wrap gap-2">
                                                <button className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 text-slate-500 hover:border-purple-200 hover:text-purple-600 transition-all">Open to all</button>
                                                <button className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 text-slate-500 hover:border-purple-200 hover:text-purple-600 transition-all">Quick Apply</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Category */}
                                    <div className="px-5 py-4 border-b border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Category</span>
                                        <div className="flex flex-wrap gap-2">
                                            {typeOptions.map((cat) => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setSelectedType(cat)}
                                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                                                        selectedType === cat
                                                        ? 'bg-slate-900 text-white border-slate-900'
                                                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                                    }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="px-5 py-4 border-b border-slate-100">
                                        <button onClick={() => setExpandedSections(s => ({ ...s, location: !s.location }))} className="w-full flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0">
                                            Location
                                            <ChevronRight size={12} className={`transition-transform ${expandedSections.location ? 'rotate-90' : ''}`} />
                                        </button>
                                        {expandedSections.location && (
                                            <div className="mt-3 space-y-1">
                                                {filterLocationOptions.map((loc) => (
                                                    <button key={loc} onClick={() => setSelectedLocation(loc)} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedLocation === loc ? 'bg-purple-50 text-purple-600' : 'text-slate-500 hover:bg-slate-50'}`}>{loc}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div className="px-5 py-4 border-b border-slate-100">
                                        <button onClick={() => setExpandedSections(s => ({ ...s, status: !s.status }))} className="w-full flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Status
                                            <ChevronRight size={12} className={`transition-transform ${expandedSections.status ? 'rotate-90' : ''}`} />
                                        </button>
                                        {expandedSections.status && (
                                            <div className="mt-3 space-y-1">
                                                {['All', 'Active', 'Closed'].map((s) => (
                                                    <button key={s} onClick={() => setSelectedStatus(s)} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedStatus === s ? 'bg-purple-50 text-purple-600' : 'text-slate-500 hover:bg-slate-50'}`}>{s}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Team Size (for events) */}
                                    {!isJobType && (
                                        <div className="px-5 py-4 border-b border-slate-100">
                                            <button onClick={() => setExpandedSections(s => ({ ...s, teamSize: !s.teamSize }))} className="w-full flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Team Size
                                                <ChevronRight size={12} className={`transition-transform ${expandedSections.teamSize ? 'rotate-90' : ''}`} />
                                            </button>
                                            {expandedSections.teamSize && (
                                                <div className="mt-3 space-y-1">
                                                    {['All', '1-3', '4-6', '7+'].map((s) => (
                                                        <button key={s} onClick={() => setSelectedTeamSize(s)} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedTeamSize === s ? 'bg-purple-50 text-purple-600' : 'text-slate-500 hover:bg-slate-50'}`}>{s}</button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Participation Type */}
                                    {!isJobType && (
                                        <div className="px-5 py-4 border-b border-slate-100">
                                            <button onClick={() => setExpandedSections(s => ({ ...s, participation: !s.participation }))} className="w-full flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Participation
                                                <ChevronRight size={12} className={`transition-transform ${expandedSections.participation ? 'rotate-90' : ''}`} />
                                            </button>
                                            {expandedSections.participation && (
                                                <div className="mt-3 space-y-1">
                                                    {['All', 'INDIVIDUAL', 'TEAM', 'BOTH'].map((s) => (
                                                        <button key={s} onClick={() => setSelectedParticipation(s)} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedParticipation === s ? 'bg-purple-50 text-purple-600' : 'text-slate-500 hover:bg-slate-50'}`}>{s}</button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Bottom bar */}
                                    <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                                        <button onClick={() => { resetFilters(); setShowFilters(false); }} className="text-xs font-black text-slate-500 hover:text-slate-700 uppercase tracking-widest transition-colors">Clear All</button>
                                        <button onClick={() => setShowFilters(false)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                                            Show Results {activeCount > 0 && <span className="ml-1">({activeCount})</span>}
                                        </button>
                                    </div>
                                </div>
                            )}
                            </>
                            );
                        })()}
                        </div>
                    </div>
                </div>
                </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-6 mt-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                            </div>
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Stream...</p>
                    </div>
                ) : filteredOpportunities.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredOpportunities.map((opp, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={opp._id}
                                onClick={() => navigate(`/opportunities/${opp._id}`)}
                                className="group bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-purple-900/5 transition-all cursor-pointer flex flex-col justify-between"
                            >
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getTypeColor(opp.type)}`}>
                                            {opp.type}
                                        </span>
                                        {appliedIds.includes(opp._id) && (
                                            <span className="bg-green-500 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20">
                                                Applied
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black text-slate-900 group-hover:text-purple-600 transition-colors leading-tight">
                                            {opp.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                                            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px]">🏢</div>
                                            {opp.organization}
                                        </div>
                                        <div className="space-y-3">
                                            <div className="w-3/4 h-8 bg-slate-100 rounded-xl animate-pulse" />
                                            <div className="w-1/3 h-5 bg-slate-50 rounded-lg animate-pulse" />
                                        </div>
                                        <div className="flex justify-between items-center pt-6 border-t border-slate-50 mt-auto">
                                            <div className="w-32 h-6 bg-slate-50 rounded-lg animate-pulse" />
                                            <div className="w-32 h-12 bg-slate-100 rounded-xl animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredOpportunities.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6">
                            {filteredOpportunities.map((opp, idx) => {
                                const isApplied = appliedIds.includes(opp._id);
                                const locationText = formatOpportunityLocation(opp.location);
                                const isRemote = locationText.toLowerCase().includes('remote') || locationText.toLowerCase().includes('online');

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05, duration: 0.5 }}
                                        key={opp._id}
                                        onClick={() => navigate(`/opportunities/${opp._id}`)}
                                        className="group bg-white rounded-[32px] p-[2px] shadow-sm hover:shadow-2xl hover:shadow-purple-900/10 transition-all duration-500 cursor-pointer relative overflow-hidden"
                                    >
                                        {/* Hover Gradient Border Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-indigo-200 to-purple-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <div className="bg-white rounded-[30px] p-6 sm:p-8 h-full flex flex-col sm:flex-row gap-6 sm:gap-8 relative z-10 overflow-hidden">
                                            {/* Subtle corner glow */}
                                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-purple-100 to-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                                            {/* Left Side: Org Icon (Desktop) */}
                                            <div className="hidden sm:flex flex-col items-center shrink-0">
                                                <div className="w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200/60 shadow-inner flex items-center justify-center text-slate-400 group-hover:border-purple-200 group-hover:text-purple-500 group-hover:bg-purple-50 transition-all">
                                                    <Building2 size={28} strokeWidth={1.5} />
                                                </div>
                                            </div>

                                            {/* Main Content */}
                                            <div className="flex-1 flex flex-col relative z-10">
                                                {/* Header Mobile Org */}
                                                <div className="flex sm:hidden items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400">
                                                        <Building2 size={18} />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500">{opp.organization}</span>
                                                </div>

                                                {/* Badges */}
                                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                                    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] shadow-sm ${getTypeColor(opp.type)}`}>
                                                        {opp.type}
                                                    </span>
                                                    {isRemote && (
                                                        <span className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1 shadow-sm">
                                                            <Globe size={10} /> Remote
                                                        </span>
                                                    )}
                                                    {isApplied && (
                                                        <span className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] bg-slate-900 text-white flex items-center gap-1 shadow-md shadow-slate-900/20">
                                                            Applied
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Title & Org (Desktop) */}
                                                <div className="mb-4">
                                                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-700 group-hover:to-indigo-700 transition-colors tracking-tight leading-[1.2]">
                                                        {opp.title}
                                                    </h3>
                                                    <span className="hidden sm:inline-block mt-2 text-sm font-bold text-slate-500">
                                                        {opp.organization}
                                                    </span>
                                                </div>

                                                <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed max-w-2xl mb-8">
                                                    {plainTextFromRichContent(opp.description)}
                                                </p>

                                                {/* Footer Metadata */}
                                                <div className="mt-auto pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                                                    <div className="flex flex-wrap items-center gap-4">
                                                        <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                                                            <Calendar size={14} className="text-slate-400" />
                                                            {new Date(opp.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        {locationText && !isRemote ? (
                                                            <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg max-w-[200px] truncate">
                                                                <MapPin size={14} className="text-slate-400 shrink-0" />
                                                                <span className="truncate">{locationText}</span>
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex -space-x-3 shrink-0">
                                                                {[1, 2, 3].map(i => (
                                                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                                                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${opp._id + i}`} alt="user" className="w-full h-full object-cover" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:block">+{opp.applicantsCount}</span>
                                                        </div>

                                                        <button className={`px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 shrink-0 ${isApplied
                                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-inner'
                                                                : 'bg-slate-900 text-white group-hover:bg-purple-600 shadow-xl shadow-slate-900/10 group-hover:shadow-purple-600/30 group-hover:-translate-y-0.5'
                                                            }`}>
                                                            {isApplied ? 'Applied' : 'Apply Now'}
                                                            {!isApplied && <ChevronRight size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">No opportunities found</h2>
                        <p className="text-slate-400 font-bold mb-8">Try adjusting your filters or search terms</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default OpportunitiesList;
