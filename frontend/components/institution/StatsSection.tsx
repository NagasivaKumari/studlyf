import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, Trophy, ClipboardCheck, Lock } from 'lucide-react';
import { API_BASE_URL, authHeaders } from '../../apiConfig';

interface StatsSectionProps {
    institutionId?: string;
    onUpgrade?: () => void;
    onContact?: () => void;
    onNavigate?: (tab: string) => void;
}

const StatsSection: React.FC<StatsSectionProps> = ({ institutionId, onUpgrade, onContact, onNavigate }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!institutionId) {
                setStats(null);
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const res = await fetch(
                    `${API_BASE_URL}/api/institution/dashboard/stats?institution_id=${encodeURIComponent(institutionId)}`,
                    { headers: { ...authHeaders() } }
                );
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error("Failed to load dynamic stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [institutionId]);

    if (!institutionId) {
        return (
            <div className="mb-8 rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-600">
                Stats load after your account is linked to an institution.
            </div>
        );
    }

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <div key={i} className="h-40 bg-slate-50 rounded-2xl animate-pulse" />)}
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8 font-sans">
            {/* Total Candidates - Primary Blue Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0A2E5C] p-5 rounded-2xl flex flex-col justify-between text-white min-h-[160px] shadow-xl shadow-blue-900/10"
            >
                <div className="flex justify-between items-start">
                    <span className="text-3xl font-black">{stats?.total_participants || 0}</span>
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <Users size={20} className="text-blue-300" />
                    </div>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest opacity-80">Total Participants</p>
            </motion.div>

            {/* Active J&I */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => onNavigate?.('events')}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[160px] cursor-pointer hover:shadow-md hover:border-blue-100 transition-all group"
            >
                <div className="flex justify-between items-start">
                    <span className="text-3xl font-black text-slate-900">{stats?.active_ji || 0}</span>
                    <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
                        <Briefcase size={20} className="text-pink-500" />
                    </div>
                </div>
                <div className="space-y-3">
                    <p className="text-[11px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-2">Active J&I</p>
                    <div className="flex justify-between items-center text-[10px] font-medium text-slate-400">
                        <span>Total</span>
                        <span className="font-bold text-slate-900">{stats?.active_ji || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-medium text-slate-400">
                        <span>Registrations</span>
                        <span className="font-bold text-slate-900">{stats?.ji_registrations || 0}</span>
                    </div>
                </div>
            </motion.div>

            {/* Active Opportunities */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => onNavigate?.('opportunities')}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[160px] cursor-pointer hover:shadow-md hover:border-amber-100 transition-all group"
            >
                <div className="flex justify-between items-start">
                    <span className="text-3xl font-black text-slate-900">{stats?.active_events || 0}</span>
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                        <Trophy size={20} className="text-amber-500" />
                    </div>
                </div>
                <div className="space-y-3">
                    <p className="text-[11px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-2">Active Opportunities</p>
                    <div className="flex justify-between items-center text-[10px] font-medium text-slate-400">
                        <span>Total</span>
                        <span className="font-bold text-slate-900">{stats?.active_events || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-medium text-slate-400">
                        <span>Registrations</span>
                        <span className="font-bold text-slate-900">{stats?.opp_registrations || 0}</span>
                    </div>
                </div>
            </motion.div>

            {/* Active Assessments */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[160px]"
            >
                <div className="flex justify-between items-start">
                    <span className="text-3xl font-black text-slate-300">{stats?.active_assessments || 0}</span>
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                        <ClipboardCheck size={20} className="text-orange-500" />
                    </div>
                </div>
                <div className="space-y-4">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Assessments</p>
                    <button 
                        onClick={onContact}
                        className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-100 transition-all border border-blue-100"
                    >
                        <Lock size={12} /> Upgrade to unlock
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default StatsSection;
