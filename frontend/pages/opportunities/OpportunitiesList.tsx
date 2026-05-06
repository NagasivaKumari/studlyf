import React, { useState, useEffect } from 'react';
import { Search, Filter, Briefcase, Calendar, MapPin, ChevronRight, ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, authHeaders } from '../../apiConfig';
import { useAuth } from '../../AuthContext';
import { plainTextFromRichContent, formatOpportunityLocation } from '../../utils/text';

const OpportunitiesList: React.FC = () => {
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('All');
    const [appliedIds, setAppliedIds] = useState<string[]>([]);
    const navigate = useNavigate();
    const { user } = useAuth();

    const types = ['All', 'My Events', 'Hackathon', 'Internship', 'Job', 'Competition'];

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

    const filteredOpportunities = opportunities.filter(opp => {
        const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             opp.organization.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === 'All' || 
                           (selectedType === 'My Events' && appliedIds.includes(opp._id)) ||
                           opp.type.toLowerCase() === selectedType.toLowerCase();
        return matchesSearch || matchesType;
    });

    const getTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'my events': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'hackathon': return 'text-purple-600 bg-purple-50 border-purple-100';
            case 'internship': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'job': return 'text-green-600 bg-green-50 border-green-100';
            case 'competition': return 'text-orange-600 bg-orange-50 border-orange-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
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

                    <div className="flex flex-wrap gap-3">
                        {types.map(type => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${
                                    selectedType === type 
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                    </div>

                                    <p className="text-sm font-medium text-slate-400 line-clamp-3 leading-relaxed">
                                        {plainTextFromRichContent(opp.description)}
                                    </p>

                                    <div className="flex flex-wrap gap-4 pt-2">
                                        <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                            <Calendar size={14} className="text-purple-500" />
                                            {new Date(opp.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                        {formatOpportunityLocation(opp.location) ? (
                                            <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                <MapPin size={14} className="text-purple-500" />
                                                {formatOpportunityLocation(opp.location)}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-xl border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${opp._id + i}`} alt="user" />
                                            </div>
                                        ))}
                                        <div className="w-8 h-8 rounded-xl border-2 border-white bg-purple-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-purple-200">
                                            +{opp.applicantsCount}
                                        </div>
                                    </div>

                                    <button className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                        appliedIds.includes(opp._id)
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-[#F4F1FF] text-purple-600 hover:bg-purple-600 hover:text-white group-hover:bg-purple-600 group-hover:text-white group-hover:shadow-xl group-hover:shadow-purple-600/20'
                                    }`}>
                                        {appliedIds.includes(opp._id) ? 'Applied' : 'View Details'}
                                        {!appliedIds.includes(opp._id) && <ChevronRight size={14} />}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
                        <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Briefcase size={40} className="text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">No opportunities found</h2>
                        <p className="text-slate-400 font-bold mb-8">Try adjusting your filters or search terms</p>
                        <button 
                            onClick={() => { setSelectedType('All'); setSearchQuery(''); }}
                            className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OpportunitiesList;
