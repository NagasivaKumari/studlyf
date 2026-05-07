import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Star, TrendingUp, Users, Search, RefreshCw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, authHeaders } from '../../apiConfig';

interface LeaderboardEntry {
    rank: number;
    team_id: string;
    team_name: string;
    project_title: string;
    score: number;
    evaluations_count: number;
    status: string;
}

interface LeaderboardProps {
    eventId: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ eventId }) => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/judging/leaderboard/${eventId}`, {
                headers: { ...authHeaders() }
            });
            if (res.ok) {
                const data = await res.json();
                const mapped = data.map((d: any) => ({
                    rank: d.rank,
                    team_id: d.student_id,
                    team_name: d.team_name,
                    project_title: d.student_name || 'Individual',
                    score: d.total_score,
                    evaluations_count: 1, // Placeholder
                    status: 'Evaluated'
                }));
                setEntries(mapped);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch leaderboard", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchLeaderboard, 300000);
        return () => clearInterval(interval);
    }, [eventId]);

    const getRankStyle = (rank: number) => {
        switch (rank) {
            case 1: return { 
                bg: 'bg-gradient-to-br from-yellow-400 to-amber-600', 
                text: 'text-white', 
                icon: <Crown className="text-yellow-400 fill-yellow-400" size={24} />,
                glow: 'shadow-yellow-500/30'
            };
            case 2: return { 
                bg: 'bg-gradient-to-br from-slate-300 to-slate-500', 
                text: 'text-white', 
                icon: <Medal className="text-slate-300 fill-slate-300" size={24} />,
                glow: 'shadow-slate-400/20'
            };
            case 3: return { 
                bg: 'bg-gradient-to-br from-orange-400 to-orange-700', 
                text: 'text-white', 
                icon: <Medal className="text-orange-400 fill-orange-400" size={24} />,
                glow: 'shadow-orange-500/20'
            };
            default: return { 
                bg: 'bg-slate-800', 
                text: 'text-slate-400', 
                icon: <span className="font-black text-lg">#{rank}</span>,
                glow: ''
            };
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto py-12 px-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 text-purple-400 text-xs font-black uppercase tracking-[0.2em] mb-2">
                        <Trophy size={16} /> Championship Rankings
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Event Leaderboard</h1>
                    <p className="text-slate-500 text-sm font-medium mt-2">Real-time rankings calculated from evaluator protocols.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Synced</p>
                        <p className="text-xs font-bold text-slate-300">{lastUpdated.toLocaleTimeString()}</p>
                    </div>
                    <button 
                        onClick={fetchLeaderboard}
                        className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group"
                    >
                        <RefreshCw size={20} className={`text-slate-400 group-hover:text-white transition-all ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Top 3 Spotlight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                {/* 2nd Place */}
                {entries.length > 1 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="order-2 md:order-1 p-8 bg-white/5 border border-white/5 rounded-[2.5rem] text-center space-y-4 relative group"
                    >
                        <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Silver Medal</div>
                        <div className="w-20 h-20 bg-slate-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-slate-500/50">
                            <Medal size={32} className="text-slate-300" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">{entries[1].team_name}</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{entries[1].project_title}</p>
                        </div>
                        <div className="text-3xl font-black text-slate-300">{entries[1].score}<span className="text-sm font-bold text-slate-500 ml-1">pts</span></div>
                    </motion.div>
                )}

                {/* 1st Place */}
                {entries.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="order-1 md:order-2 p-10 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/30 rounded-[3rem] text-center space-y-6 relative shadow-2xl shadow-yellow-500/10"
                    >
                        <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 px-6 py-2 bg-yellow-500 text-slate-900 text-xs font-black uppercase tracking-[0.2em] rounded-full shadow-xl">Grand Champion</div>
                        <motion.div 
                            animate={{ rotateY: 360 }}
                            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                            className="w-28 h-28 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto border-4 border-yellow-500/50 shadow-inner"
                        >
                            <Crown size={48} className="text-yellow-400 fill-yellow-400" />
                        </motion.div>
                        <div>
                            <h3 className="text-3xl font-black text-white tracking-tighter">{entries[0].team_name}</h3>
                            <p className="text-xs font-black text-yellow-500/80 uppercase tracking-widest mt-2">{entries[0].project_title}</p>
                        </div>
                        <div className="text-5xl font-black text-yellow-400 tracking-tighter">
                            {entries[0].score}
                            <span className="text-lg font-bold text-yellow-500/50 ml-1 uppercase">Points</span>
                        </div>
                        <div className="pt-4 flex justify-center gap-6 border-t border-yellow-500/10">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Judges</p>
                                <p className="text-sm font-bold text-white">{entries[0].evaluations_count}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Efficiency</p>
                                <p className="text-sm font-bold text-white">98%</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 3rd Place */}
                {entries.length > 2 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="order-3 p-8 bg-white/5 border border-white/5 rounded-[2.5rem] text-center space-y-4 relative"
                    >
                        <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Bronze Medal</div>
                        <div className="w-20 h-20 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto border-2 border-orange-600/50">
                            <Medal size={32} className="text-orange-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">{entries[2].team_name}</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{entries[2].project_title}</p>
                        </div>
                        <div className="text-3xl font-black text-orange-400">{entries[2].score}<span className="text-sm font-bold text-slate-500 ml-1">pts</span></div>
                    </motion.div>
                )}
            </div>

            {/* Remaining Rankings */}
            <div className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Rank</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Contender</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Project</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Score</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {entries.slice(3).map((entry, idx) => (
                                <motion.tr 
                                    key={entry.team_id || idx}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-white/5 transition-colors group"
                                >
                                    <td className="px-10 py-8">
                                        <span className="text-lg font-black text-slate-600 group-hover:text-white transition-colors">#{entry.rank}</span>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-black text-slate-400 border border-white/5">
                                                {entry.team_name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-white text-sm">{entry.team_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className="text-xs font-bold text-slate-400 group-hover:text-slate-300 transition-colors">{entry.project_title}</span>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-sm font-black text-white">{entry.score}</span>
                                            <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500" style={{ width: `${(entry.score / 10) * 100}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${entry.status === 'Scored' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-white/5 text-slate-500 border-white/5'}`}>
                                            {entry.status}
                                        </span>
                                    </td>
                                </motion.tr>
                            ))}
                            {entries.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-10 py-24 text-center">
                                        <Zap size={32} className="text-slate-800 mx-auto mb-4" />
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Data not yet available in current sector</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
