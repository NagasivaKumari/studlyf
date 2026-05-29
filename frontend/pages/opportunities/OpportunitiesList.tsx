import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Briefcase, Calendar, MapPin, ChevronRight, ChevronLeft, Sparkles, Loader2, Building2, Globe, Target, Zap, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, authHeaders } from '../../apiConfig';
import { useAuth } from '../../AuthContext';
import { plainTextFromRichContent, formatOpportunityLocation } from '../../utils/text';

const typeOptions = ['All', 'My Events', 'Hackathon', 'Competition', 'Challenge', 'Conference', 'Workshop', 'Case Study', 'Webinar', 'Internship', 'Job'];
const locationOptions = ['All', 'Remote', 'On-site', 'Hybrid'];
const sortOptions = ['Newest', 'Deadline soon', 'Most applied'];

const normalizeText = (value: unknown) => String(value ?? '').toLowerCase();

const matchesOpportunityType = (opportunityType: unknown, selectedType: string) => {
    if (selectedType === 'All') return true;

    const type = normalizeText(opportunityType);
    const keywordMap: Record<string, string[]> = {
        'my events': [],
        hackathon: ['hackathon', 'coding challenge', 'coding challenge', 'coding challenges', 'contest'],
        competition: ['competition', 'contest', 'challenge', 'case competition'],
        challenge: ['challenge', 'coding challenge', 'ideathon'],
        conference: ['conference', 'summit', 'expo', 'forum'],
        workshop: ['workshop', 'bootcamp', 'masterclass'],
        'case study': ['case study', 'case competition', 'case challenge'],
        webinar: ['webinar', 'virtual session', 'online session'],
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
    if (!text) return selectedLocation === 'Remote' ? false : true;
    if (selectedLocation === 'Remote') return text.includes('remote') || text.includes('online') || text.includes('virtual');
    if (selectedLocation === 'On-site') return text.includes('on-site') || text.includes('onsite') || text.includes('in-person') || text.includes('offline');
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
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [appliedIds, setAppliedIds] = useState<string[]>([]);
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

            return matchesSearch && matchesApplied && matchesType && matchesSelectedLocation;
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
    }, [appliedIds, opportunities, searchQuery, selectedLocation, selectedSort, selectedType, showAppliedOnly]);

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
    };

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

            {/* Category System */}
            <div className="border-b border-slate-200/60 bg-white/70 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4 overflow-x-auto scrollbar-hide">
                    {typeOptions.map((type) => {
                        const isActive = selectedType === type;
                        return (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all flex-shrink-0 flex items-center gap-2 ${isActive
                                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-105'
                                        : 'bg-slate-50 text-slate-500 border border-slate-200/60 hover:bg-white hover:border-slate-300 hover:text-slate-900 hover:shadow-sm hover:-translate-y-0.5'
                                    }`}
                            >
                                {isActive && <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />}
                                {type}
                            </button>
                        );
                    })}
                    <div className="flex-1" />
                    <button
                        onClick={() => setIsFiltersOpen((v) => !v)}
                        className="lg:hidden inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.15em] shadow-lg flex-shrink-0"
                    >
                        <Filter size={16} /> Filters
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isFiltersOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden overflow-hidden bg-white border-b border-slate-100"
                    >
                        <div className="px-6 py-8">
                            <FilterPanel
                                selectedType={selectedType}
                                setSelectedType={setSelectedType}
                                selectedLocation={selectedLocation}
                                setSelectedLocation={setSelectedLocation}
                                selectedSort={selectedSort}
                                setSelectedSort={setSelectedSort}
                                showAppliedOnly={showAppliedOnly}
                                setShowAppliedOnly={setShowAppliedOnly}
                                resetFilters={resetFilters}
                                getTypeColor={getTypeColor}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Grid */}
            <div className="max-w-7xl mx-auto px-6 mt-12 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:items-start relative">
                <div>
                    {loading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm h-[260px] flex gap-8">
                                    <div className="hidden sm:block w-16 h-16 bg-slate-100 rounded-2xl animate-pulse shrink-0" />
                                    <div className="flex-1 space-y-6">
                                        <div className="flex gap-2">
                                            <div className="w-20 h-6 bg-slate-100 rounded-lg animate-pulse" />
                                            <div className="w-20 h-6 bg-slate-100 rounded-lg animate-pulse" />
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
                    ) : (
                        <div className="bg-white rounded-[40px] p-16 md:p-24 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden h-[400px]">
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 to-transparent pointer-events-none" />
                            <div className="w-28 h-28 bg-white shadow-2xl shadow-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-purple-100 relative z-10">
                                <Search size={40} className="text-purple-400" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-4 relative z-10 tracking-tight">No roles found</h2>
                            <p className="text-slate-500 font-medium text-lg mb-8 max-w-md relative z-10">
                                We couldn't find any opportunities matching your exact criteria. Clear your filters to explore the ecosystem.
                            </p>
                            <button
                                onClick={resetFilters}
                                className="relative z-10 px-8 py-4 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-purple-600 hover:shadow-xl hover:shadow-purple-600/30 transition-all hover:-translate-y-0.5"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>

                <aside className="hidden lg:block sticky top-32">
                    <div className="bg-white/80 backdrop-blur-2xl border border-slate-200/60 rounded-[32px] shadow-xl shadow-slate-200/30 p-8 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />
                        <FilterPanel
                            selectedType={selectedType}
                            setSelectedType={setSelectedType}
                            selectedLocation={selectedLocation}
                            setSelectedLocation={setSelectedLocation}
                            selectedSort={selectedSort}
                            setSelectedSort={setSelectedSort}
                            showAppliedOnly={showAppliedOnly}
                            setShowAppliedOnly={setShowAppliedOnly}
                            resetFilters={resetFilters}
                            getTypeColor={getTypeColor}
                        />
                    </div>
                </aside>
            </div>
        </div>
    );
};

interface FilterPanelProps {
    selectedType: string;
    setSelectedType: React.Dispatch<React.SetStateAction<string>>;
    selectedLocation: string;
    setSelectedLocation: React.Dispatch<React.SetStateAction<string>>;
    selectedSort: string;
    setSelectedSort: React.Dispatch<React.SetStateAction<string>>;
    showAppliedOnly: boolean;
    setShowAppliedOnly: React.Dispatch<React.SetStateAction<boolean>>;
    resetFilters: () => void;
    getTypeColor: (type: string) => string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
    selectedType,
    setSelectedType,
    selectedLocation,
    setSelectedLocation,
    selectedSort,
    setSelectedSort,
    showAppliedOnly,
    setShowAppliedOnly,
    resetFilters,
    getTypeColor,
}) => {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-5">
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Discovery Filters</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 mt-1">Refine your search</p>
                </div>
                <button
                    onClick={resetFilters}
                    className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
                >
                    Reset
                </button>
            </div>

            <div className="space-y-4">
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Briefcase size={14} className="text-slate-300" /> Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {typeOptions.map((type) => {
                        const isActive = selectedType === type;
                        return (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border-2 transition-all text-left truncate ${isActive
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10'
                                        : `bg-white border-slate-100 hover:border-slate-300 ${getTypeColor(type)} hover:shadow-sm`
                                    }`}
                            >
                                {type}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <MapPin size={14} className="text-slate-300" /> Location
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {locationOptions.map((location) => {
                        const isActive = selectedLocation === location;
                        return (
                            <button
                                key={location}
                                onClick={() => setSelectedLocation(location)}
                                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border-2 transition-all ${isActive
                                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/15'
                                        : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:shadow-sm'
                                    }`}
                            >
                                {location}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Clock size={14} className="text-slate-300" /> Sort by
                </label>
                <div className="relative">
                    <select
                        value={selectedSort}
                        onChange={(e) => setSelectedSort(e.target.value)}
                        className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-300 transition-all appearance-none shadow-sm cursor-pointer hover:border-slate-200"
                    >
                        {sortOptions.map((sort) => (
                            <option key={sort} value={sort}>{sort}</option>
                        ))}
                    </select>
                    <ChevronRight size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                </div>
            </div>

            <div className="pt-6">
                <button
                    onClick={() => setShowAppliedOnly((value) => !value)}
                    className={`w-full px-5 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] border-2 transition-all flex justify-between items-center ${showAppliedOnly
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                            : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 shadow-sm'
                        }`}
                >
                    <span>{showAppliedOnly ? 'Applied Only Active' : 'Show Applied Only'}</span>
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors shadow-inner ${showAppliedOnly ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${showAppliedOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                </button>
            </div>
        </div>
    );
};

export default OpportunitiesList;
