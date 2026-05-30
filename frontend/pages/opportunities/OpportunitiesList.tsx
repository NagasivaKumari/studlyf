import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Briefcase, Calendar, MapPin, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, X, Globe, Users, DollarSign, Star, Sparkles, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, authHeaders } from '../../apiConfig';
import { useAuth } from '../../AuthContext';
import { plainTextFromRichContent, formatOpportunityLocation } from '../../utils/text';

const typeOptions = ['All', 'Hackathon', 'Competition', 'Challenge', 'Conference', 'Workshop', 'Internship', 'Job'];

const normalizeText = (value: unknown) => String(value ?? '').toLowerCase();

const matchesOpportunityType = (opportunityType: unknown, selectedType: string) => {
    if (selectedType === 'All') return true;

    const type = normalizeText(opportunityType);
    const keywordMap: Record<string, string[]> = {
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
    if (!text) return false;
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
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [selectedParticipation, setSelectedParticipation] = useState('All');
    const [selectedTeamSize, setSelectedTeamSize] = useState('All');
    const [selectedPayment, setSelectedPayment] = useState('All');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
        location: false, category: false, status: false, teamSize: false, participation: false, skills: false,
    });
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
            const matchesType = matchesOpportunityType(opp.type, selectedType);
            const matchesSelectedLocation = matchesLocation(opp.location, selectedLocation);
            const matchesStatus = selectedStatus === 'All' || normalizeText(opp.status ?? '').includes(normalizeText(selectedStatus));
            const matchesParticipation = selectedParticipation === 'All' || normalizeText(opp.participation_type ?? '').includes(normalizeText(selectedParticipation));
            const matchesTeamSize = selectedTeamSize === 'All' || (() => { try { const max = Number(opp.max_team_size); return selectedTeamSize === 'Solo' ? max <= 1 : selectedTeamSize === 'Small (2-5)' ? max >= 2 && max <= 5 : selectedTeamSize === 'Medium (6-10)' ? max >= 6 && max <= 10 : selectedTeamSize === 'Large (10+)' ? max > 10 : true; } catch { return true; } })();
            const matchesPayment = selectedPayment === 'All' || normalizeText(opp.prize_type ?? opp.compensation_type ?? '').includes(normalizeText(selectedPayment));
            const matchesSkills = selectedSkills.length === 0 || (opp.skills && opp.skills.some((s: string) => selectedSkills.some(sk => normalizeText(s).includes(normalizeText(sk)))));

            return matchesSearch && matchesType && matchesSelectedLocation && matchesStatus && matchesParticipation && matchesTeamSize && matchesPayment && matchesSkills;
        });

        const sorted = [...filtered].sort((a, b) => {
            const dateA = safeDateValue(a.deadline).getTime();
            const dateB = safeDateValue(b.deadline).getTime();
            return dateB - dateA;
        });

        return sorted;
    }, [appliedIds, opportunities, searchQuery, selectedLocation, selectedType, selectedStatus, selectedParticipation, selectedTeamSize, selectedPayment, selectedSkills]);

    const getTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'hackathon': return 'text-purple-600 bg-purple-50 border-purple-100';
            case 'internship': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'job': return 'text-green-600 bg-green-50 border-green-100';
            case 'competition': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'conference': return 'text-cyan-600 bg-cyan-50 border-cyan-100';
            case 'workshop': return 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    const resetFilters = () => {
        setSelectedType('All');
        setSelectedLocation('All');
        setSelectedStatus('All');
        setSelectedParticipation('All');
        setSelectedTeamSize('All');
        setSelectedPayment('All');
        setSelectedSkills([]);
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-100 pt-32 pb-12 px-6">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <button 
                                onClick={() => navigate('/dashboard/learner')}
                                className="flex items-center gap-2 text-slate-400 hover:text-purple-600 transition-colors font-bold text-xs mb-4 group"
                            >
                                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                Back to Dashboard
                            </button>
                            <div className="flex items-center gap-2 text-purple-600 font-black text-[10px] uppercase tracking-[0.2em]">
                                <Sparkles size={14} /> Discovery Engine
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                                Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Opportunities</span>
                            </h1>
                            <p className="text-slate-500 font-bold max-w-xl">
                                Connect with top organizations, showcase your skills, and kickstart your professional journey.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <div className="relative flex-grow sm:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search by role, company..."
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-50 focus:border-purple-200 transition-all outline-none text-sm font-bold shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category chips */}
                    <div className="flex items-center gap-3 py-4">
                        <div className="flex flex-wrap gap-3">
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
                        <div className="flex-1" />
                        <div className="hidden xl:flex items-center">
                            <button
                                onClick={() => setIsFilterDropdownOpen((v) => !v)}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-slate-900 text-white text-sm font-black uppercase tracking-widest shadow-xl shadow-slate-900/15"
                            >
                                <Filter size={16} /> Filters {isFilterDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Dropdown Mega Menu */}
            <AnimatePresence>
                {isFilterDropdownOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="px-6 pt-6"
                    >
                        <div className="max-w-7xl mx-auto bg-white border border-slate-100 rounded-[28px] shadow-lg p-6 space-y-6">
                            <AdvancedFilterPanel
                                selectedType={selectedType}
                                setSelectedType={setSelectedType}
                                selectedLocation={selectedLocation}
                                setSelectedLocation={setSelectedLocation}
                                selectedStatus={selectedStatus}
                                setSelectedStatus={setSelectedStatus}
                                selectedParticipation={selectedParticipation}
                                setSelectedParticipation={setSelectedParticipation}
                                selectedTeamSize={selectedTeamSize}
                                setSelectedTeamSize={setSelectedTeamSize}
                                selectedPayment={selectedPayment}
                                setSelectedPayment={setSelectedPayment}
                                selectedSkills={selectedSkills}
                                setSelectedSkills={setSelectedSkills}
                                collapsedSections={collapsedSections}
                                setCollapsedSections={setCollapsedSections}
                                resetFilters={resetFilters}
                                getTypeColor={getTypeColor}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredOpportunities.map((opp, idx) => {
                            const isApplied = appliedIds.includes(opp._id);
                            const locationText = formatOpportunityLocation(opp.location);
                            const isRemote = locationText.toLowerCase().includes('remote') || locationText.toLowerCase().includes('online');
                            const isEvent = ['Hackathon', 'Competition', 'Conference', 'Workshop', 'Challenge'].includes(opp.type);
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05, duration: 0.5 }}
                                    key={opp._id}
                                    onClick={() => navigate(`/opportunities/${opp._id}`)}
                                    className="group bg-white rounded-[32px] p-[2px] shadow-sm hover:shadow-2xl hover:shadow-purple-900/10 transition-all duration-500 cursor-pointer relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-indigo-200 to-purple-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="bg-white rounded-[30px] p-6 h-full flex flex-col relative z-10 overflow-hidden">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400">
                                                    <Building2 size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-slate-900">{opp.title}</h4>
                                                    <span className="text-[10px] font-bold text-slate-500">{opp.organization}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] shadow-sm ${getTypeColor(opp.type)}`}>
                                                {opp.type}
                                            </span>
                                            {isRemote && (
                                                <span className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1 shadow-sm">
                                                    <Globe size={10} /> {isEvent ? 'Online' : 'Remote'}
                                                </span>
                                            )}
                                            {isApplied && (
                                                <span className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] bg-slate-900 text-white flex items-center gap-1 shadow-md shadow-slate-900/20">
                                                    Applied
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs font-medium text-slate-500 line-clamp-2 leading-relaxed mb-auto">
                                            {plainTextFromRichContent(opp.description)}
                                        </p>

                                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <Calendar size={12} className="text-slate-400" />
                                                {new Date(opp.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400">+{opp.applicantsCount}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
                        <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Briefcase size={40} className="text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">No opportunities found</h2>
                        <p className="text-slate-400 font-bold mb-8">Try adjusting your filters or search terms</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const toggleSection = (section: string, setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>) => {
    setter(prev => ({ ...prev, [section]: !prev[section] }));
};

interface AdvancedFilterPanelProps {
    selectedType: string;
    setSelectedType: React.Dispatch<React.SetStateAction<string>>;
    selectedLocation: string;
    setSelectedLocation: React.Dispatch<React.SetStateAction<string>>;
    selectedStatus: string;
    setSelectedStatus: React.Dispatch<React.SetStateAction<string>>;
    selectedParticipation: string;
    setSelectedParticipation: React.Dispatch<React.SetStateAction<string>>;
    selectedTeamSize: string;
    setSelectedTeamSize: React.Dispatch<React.SetStateAction<string>>;
    selectedPayment: string;
    setSelectedPayment: React.Dispatch<React.SetStateAction<string>>;
    selectedSkills: string[];
    setSelectedSkills: React.Dispatch<React.SetStateAction<string[]>>;
    collapsedSections: Record<string, boolean>;
    setCollapsedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    resetFilters: () => void;
    getTypeColor: (type: string) => string;
}

const CollapsibleSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    sectionKey: string;
    collapsed: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}> = ({ title, icon, sectionKey, collapsed, onToggle, children }) => (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
        >
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-xs font-black uppercase tracking-widest text-slate-600">{title}</span>
            </div>
            {collapsed ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
        </button>
        {!collapsed && <div className="p-4">{children}</div>}
    </div>
);

const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
    selectedType, setSelectedType,
    selectedLocation, setSelectedLocation,
    selectedStatus, setSelectedStatus,
    selectedParticipation, setSelectedParticipation,
    selectedTeamSize, setSelectedTeamSize,
    selectedPayment, setSelectedPayment,
    selectedSkills, setSelectedSkills,
    collapsedSections, setCollapsedSections,
    resetFilters, getTypeColor,
}) => {
    const isEventCategory = ['Hackathon', 'Competition', 'Conference', 'Workshop', 'Challenge'].includes(selectedType);
    const dynamicLocationOptions = isEventCategory
        ? ['All', 'Online', 'Offline', 'Hybrid']
        : ['All', 'Remote', 'On-site', 'Hybrid'];

    const statusOptions = ['All', 'Live', 'Upcoming', 'Completed'];
    const participationOptions = ['All', 'Individual', 'Team', 'Both'];
    const teamSizeOptions = ['All', 'Solo', 'Small (2-5)', 'Medium (6-10)', 'Large (10+)'];
    const paymentOptions = ['All', 'Paid', 'Free'];
    const skillSuggestions = ['Python', 'JavaScript', 'React', 'Node.js', 'AI/ML', 'Data Science', 'UI/UX', 'Blockchain', 'Cloud', 'DevOps', 'Mobile', 'Web'];

    return (
        <>
            <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500">Filters</p>
                    <h2 className="text-lg font-black text-slate-900 mt-1">Narrow results</h2>
                </div>
                <button
                    onClick={resetFilters}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
                >
                    Reset
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <CollapsibleSection
                    title="Location" icon={<MapPin size={16} className="text-purple-500" />}
                    sectionKey="location" collapsed={collapsedSections.location}
                    onToggle={() => toggleSection('location', setCollapsedSections)}
                >
                    <div className="grid grid-cols-2 gap-2">
                        {dynamicLocationOptions.map((loc) => (
                            <button key={loc} onClick={() => setSelectedLocation(loc)}
                                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedLocation === loc ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                            >{loc}</button>
                        ))}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection
                    title="Category" icon={<Briefcase size={16} className="text-purple-500" />}
                    sectionKey="category" collapsed={collapsedSections.category}
                    onToggle={() => toggleSection('category', setCollapsedSections)}
                >
                    <div className="grid grid-cols-2 gap-2">
                        {typeOptions.map((type) => (
                            <button key={type} onClick={() => setSelectedType(type)}
                                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedType === type ? 'bg-slate-900 text-white border-slate-900' : `bg-white border-slate-200 hover:border-slate-300 ${getTypeColor(type)}`}`}
                            >{type}</button>
                        ))}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection
                    title="Status" icon={<Star size={16} className="text-purple-500" />}
                    sectionKey="status" collapsed={collapsedSections.status}
                    onToggle={() => toggleSection('status', setCollapsedSections)}
                >
                    <div className="grid grid-cols-2 gap-2">
                        {statusOptions.map((s) => (
                            <button key={s} onClick={() => setSelectedStatus(s)}
                                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedStatus === s ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                            >{s}</button>
                        ))}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection
                    title="Team Size" icon={<Users size={16} className="text-purple-500" />}
                    sectionKey="teamSize" collapsed={collapsedSections.teamSize}
                    onToggle={() => toggleSection('teamSize', setCollapsedSections)}
                >
                    <div className="grid grid-cols-2 gap-2">
                        {teamSizeOptions.map((t) => (
                            <button key={t} onClick={() => setSelectedTeamSize(t)}
                                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedTeamSize === t ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                            >{t}</button>
                        ))}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection
                    title="Participation" icon={<Users size={16} className="text-purple-500" />}
                    sectionKey="participation" collapsed={collapsedSections.participation}
                    onToggle={() => toggleSection('participation', setCollapsedSections)}
                >
                    <div className="grid grid-cols-2 gap-2">
                        {participationOptions.map((p) => (
                            <button key={p} onClick={() => setSelectedParticipation(p)}
                                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedParticipation === p ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                            >{p}</button>
                        ))}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection
                    title="Skills" icon={<Star size={16} className="text-purple-500" />}
                    sectionKey="skills" collapsed={collapsedSections.skills}
                    onToggle={() => toggleSection('skills', setCollapsedSections)}
                >
                    <div className="flex flex-wrap gap-2">
                        {skillSuggestions.map((skill) => {
                            const isSelected = selectedSkills.includes(skill);
                            return (
                                <button key={skill} onClick={() => setSelectedSkills(prev => isSelected ? prev.filter(s => s !== skill) : [...prev, skill])}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isSelected ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >{skill}</button>
                            );
                        })}
                    </div>
                    {selectedSkills.length > 0 && (
                        <button onClick={() => setSelectedSkills([])} className="mt-2 text-[10px] font-black uppercase tracking-widest text-purple-500 hover:text-purple-700 transition-colors">
                            Clear all ({selectedSkills.length})
                        </button>
                    )}
                </CollapsibleSection>
            </div>
        </>
    );
};

export default OpportunitiesList;
