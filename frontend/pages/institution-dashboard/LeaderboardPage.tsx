import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Star, TrendingUp, QrCode, Search, Download, Award } from 'lucide-react';
import { API_BASE_URL, authHeaders } from '../../apiConfig';



interface LeaderboardEntry {
    rank: number;
    team_name: string;
    project_title: string;
    total_score: number;
    college?: string;
    prize?: string;
}

interface LeaderboardPageProps {
    eventId?: string;
    refreshCounter?: number;
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ eventId, refreshCounter }) => {
    const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

    useEffect(() => {
        const fetchRankings = async () => {
            if (!eventId) return;
            try {
                // Primary: hackathon submissions leaderboard (scores live in hackathon_submissions)
                let res = await fetch(`${API_BASE_URL}/api/hackathons/events/${eventId}/leaderboard?include_all=true`, {
                    headers: { ...authHeaders() }
                });

                // Fallback: legacy judging leaderboard (submissions_col)
                if (!res.ok) {
                    res = await fetch(`${API_BASE_URL}/api/judging/leaderboard/${eventId}`, {
                        headers: { ...authHeaders() }
                    });
                }

                if (res.ok) {
                    const data = await res.json();
                    const mapped = (Array.isArray(data) ? data : []).map((d: any) => ({
                        rank: d.rank,
                        team_name: d.teamName || d.team_name || d.student_name || '',
                        project_title: d.projectTitle || d.project_title || d.teamLead || d.student_name || '',
                        total_score: Number(d.totalScore ?? d.total_score ?? 0),
                        college: d.college || d.institution || d.institution_name,
                        criteria_scores: d.rubricScores || d.rubric_scores || {}
                    }));
                    setRankings(mapped);
                } else {
                    setRankings([]);
                }
            } catch (error) {
                console.error("Integration Error:", error);
                setRankings([]);
            } finally {
                setLoading(false);
            }
        };
        fetchRankings();
    }, [eventId, refreshCounter]);

    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-[#fafafa] text-gray-400 italic">Synchronizing Live Standings...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#fafafa]">

            
            <main className="p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-2">
                                <TrendingUp size={14} />
                                Live Results
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Hall of Fame</h1>
                            <p className="text-gray-500 mt-1">Dynamic rankings powered by institutional scoring.</p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={async () => {
                                    if (window.confirm("Issue certificates to the Top 3 winners?")) {
                                        const res = await fetch(`${API_BASE_URL}/api/judging/issue-certificates`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json', ...authHeaders() },
                                            body: JSON.stringify({
                                                event_id: eventId,
                                                winners: rankings.slice(0, 3)
                                            })
                                        });
                                        if (res.ok) alert("Certificates issued successfully!");
                                    }
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-[#6C3BFF] text-white rounded-xl font-bold shadow-xl shadow-purple-900/20 hover:scale-[1.02] transition-all"
                            >
                                <Award size={18} />
                                Issue Winner Certificates
                            </button>
                            <button 
                                onClick={() => window.open(`${API_BASE_URL}/api/v1/institution/leaderboard/${eventId}/export-pdf`, '_blank')}
                                className="flex items-center gap-2 px-6 py-3 bg-[#0f172a] text-white rounded-xl font-bold shadow-sm hover:scale-[1.02] transition-all"
                            >
                                <Download size={18} />
                                Export as PDF
                            </button>
                            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 shadow-sm hover:border-blue-400 transition-all">
                                <QrCode size={18} />
                                Verify Results
                            </button>
                        </div>
                    </div>

                    {/* Podium (Top 3) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {rankings.length >= 2 && (
                            <div className="mt-8 order-2 md:order-1">
                                <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center relative shadow-sm hover:shadow-xl transition-all group">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                                        <Medal className="text-slate-400" size={24} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-400 mt-4 uppercase">2nd Place</p>
                                    <h3 className="text-xl font-black text-gray-900 mt-1">{rankings[1].team_name}</h3>
                                    {rankings[1].college && <p className="text-xs text-gray-500 mb-6">{rankings[1].college}</p>}
                                    <div className="text-3xl font-black text-blue-600">{rankings[1].total_score}</div>
                                </div>
                            </div>
                        )}

                        {rankings.length >= 1 && (
                            <div className="order-1 md:order-2">
                                <div className="bg-white p-10 rounded-[2.5rem] border-4 border-yellow-400/30 text-center relative shadow-2xl shadow-yellow-100 transform scale-105">
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center border-8 border-white shadow-xl">
                                        <Trophy className="text-white" size={36} />
                                    </div>
                                    <div className="mt-8">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-black uppercase mb-4">
                                            <Star size={10} fill="currentColor" /> Champion <Star size={10} fill="currentColor" />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900">{rankings[0].team_name}</h3>
                                        {rankings[0].college && <p className="text-xs text-gray-500 mb-6">{rankings[0].college}</p>}
                                        <div className="text-5xl font-black text-blue-600 mb-2">{rankings[0].total_score}</div>
                                        <div className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">Validated Performance</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {rankings.length >= 3 && (
                            <div className="mt-12 order-3">
                                <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center relative shadow-sm hover:shadow-xl transition-all">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                                        <Medal className="text-orange-300" size={24} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-400 mt-4 uppercase">3rd Place</p>
                                    <h3 className="text-xl font-black text-gray-900 mt-1">{rankings[2].team_name}</h3>
                                    {rankings[2].college && <p className="text-xs text-gray-500 mb-6">{rankings[2].college}</p>}
                                    <div className="text-3xl font-black text-blue-600">{rankings[2].total_score}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Overall Standings Table */}
                    <div className="bg-white rounded-[3rem] border border-gray-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Overall Standings</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input type="text" placeholder="Search team..." className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-100 transition-all w-48" />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-slate-50/30">
                                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Rank</th>
                                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Team & Project</th>
                                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Score Breakdown</th>
                                        <th className="px-10 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Final Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rankings.length === 0 ? (
                                        <tr><td className="p-24 text-center text-gray-400 font-medium">Synchronizing live data...</td></tr>
                                    ) : (
                                        rankings.map((r: any) => (
                                            <React.Fragment key={r.rank}>
                                                <tr 
                                                    onClick={() => setExpandedTeam(expandedTeam === r.team_name ? null : r.team_name)}
                                                    className={`border-b border-gray-50 last:border-0 hover:bg-slate-50/80 transition-all cursor-pointer group ${expandedTeam === r.team_name ? 'bg-slate-50' : ''}`}
                                                >
                                                    <td className="px-10 py-8 w-16">
                                                        <span className="text-2xl font-black text-slate-300 group-hover:text-blue-500 transition-colors">#{r.rank}</span>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className="font-black text-gray-900 text-lg tracking-tight">{r.team_name}</div>
                                                        <div className="text-xs font-medium text-gray-400 mt-1">{r.project_title || 'Unlisted Project'}</div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className="flex gap-2">
                                                            {r.criteria_scores ? Object.entries(r.criteria_scores).slice(0, 3).map(([key, val]: any) => (
                                                                <div key={key} className="px-3 py-1 bg-white border border-slate-100 rounded-lg shadow-sm">
                                                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{key}</div>
                                                                    <div className="text-xs font-black text-blue-600">{val}</div>
                                                                </div>
                                                            )) : (
                                                                <span className="text-xs text-slate-300 italic font-medium">Click for details</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8 text-right">
                                                        <div className="text-3xl font-black text-slate-900 tracking-tighter">{r.total_score}</div>
                                                        <div className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1">Verified</div>
                                                    </td>
                                                </tr>
                                                <AnimatePresence>
                                                    {expandedTeam === r.team_name && (
                                                        <tr>
                                                            <td colSpan={4} className="bg-white border-b border-gray-100">
                                                                <motion.div 
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="p-10 bg-slate-50/50 grid grid-cols-1 md:grid-cols-4 gap-8">
                                                                        {r.criteria_scores ? Object.entries(r.criteria_scores).map(([key, val]: any) => (
                                                                            <div key={key} className="space-y-3">
                                                                                <div className="flex justify-between items-center">
                                                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key}</label>
                                                                                    <span className="text-sm font-black text-blue-600">{val}</span>
                                                                                </div>
                                                                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                                                                    <motion.div 
                                                                                        initial={{ width: 0 }}
                                                                                        animate={{ width: `${(val/25)*100}%` }}
                                                                                        className="h-full bg-blue-500 rounded-full"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )) : (
                                                                            <div className="col-span-4 text-center py-6 text-slate-400 italic">No dimension scores found for this entry.</div>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </AnimatePresence>
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>


        </div>
    );
};

export default LeaderboardPage;
