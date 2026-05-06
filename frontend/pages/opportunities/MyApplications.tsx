import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL, authHeaders } from '../../apiConfig';
import { useAuth } from '../../AuthContext';
import { ChevronLeft, Bell, ExternalLink, Loader2, CheckCircle2, UsersRound } from 'lucide-react';

type ApplicationRow = {
    _id: string;
    opportunity_id?: string;
    status?: string;
    applied_at?: string;
    opportunity_title?: string;
    institution_name?: string;
    event_id?: string;
};

type NotifRow = { _id: string; message?: string; is_read?: boolean; created_at?: string; type?: string };

const MyApplications: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [applications, setApplications] = useState<ApplicationRow[]>([]);
    const [notifications, setNotifications] = useState<NotifRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user?.user_id) {
            navigate('/login', { replace: true });
            return;
        }
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                console.log('DEBUG: Fetching applications from:', `${API_BASE_URL}/api/opportunities/me/applications`);
            const [appRes, notifRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/opportunities/me/applications`, { headers: { ...authHeaders() } }),
                    fetch(`${API_BASE_URL}/api/opportunities/me/notifications?limit=30`, { headers: { ...authHeaders() } }),
                ]);
                if (cancelled) return;
                if (appRes.ok) {
                    const data = await appRes.json();
                    console.log('DEBUG: Applications data received:', data);
                    setApplications(Array.isArray(data) ? data : []);
                } else {
                    console.log('DEBUG: Failed to fetch applications, status:', appRes.status);
                    setApplications([]);
                }
                if (notifRes.ok) {
                    const n = await notifRes.json();
                    setNotifications(Array.isArray(n) ? n : []);
                } else {
                    setNotifications([]);
                }
            } catch {
                if (!cancelled) {
                    setApplications([]);
                    setNotifications([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [authLoading, user?.user_id, navigate]);

    const statusLabel = (s: string | undefined) => {
        const x = (s || 'pending').toLowerCase();
        if (x === 'accepted' || x === 'shortlisted') return { text: 'Shortlisted', cls: 'bg-emerald-50 text-emerald-800 border-emerald-100' };
        if (x === 'rejected') return { text: 'Not selected', cls: 'bg-red-50 text-red-800 border-red-100' };
        return { text: 'Pending review', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
    };

    const markRead = async (id: string) => {
        try {
            await fetch(`${API_BASE_URL}/api/opportunities/me/notifications/${id}/read`, {
                method: 'POST',
                headers: { ...authHeaders() },
            });
            setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, is_read: true } : n)));
        } catch {
            /* ignore */
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
            <div className="max-w-4xl mx-auto px-6 pt-12">
                <button
                    type="button"
                    onClick={() => navigate('/opportunities')}
                    className="flex items-center gap-2 text-slate-500 hover:text-purple-700 font-bold text-sm mb-8"
                >
                    <ChevronLeft size={20} /> Back to opportunities
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My applications</h1>
                        <p className="text-slate-500 font-medium mt-2 max-w-xl">
                            Portal applications only. Hackathon team scoring and judge workflows are separate — your registration status for each listing appears here.
                        </p>
                    </div>
                </div>

                {notifications.filter((n) => !n.is_read).length > 0 ? (
                    <section className="mb-10 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-widest">
                            <Bell size={18} className="text-purple-600" /> Recent updates
                        </div>
                        <ul className="space-y-3">
                            {notifications
                                .filter((n) => !n.is_read)
                                .slice(0, 5)
                                .map((n) => (
                                    <li
                                        key={n._id}
                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-purple-50/50 border border-purple-100"
                                    >
                                        <p className="text-sm font-bold text-slate-800">{n.message}</p>
                                        <button
                                            type="button"
                                            onClick={() => markRead(n._id)}
                                            className="text-xs font-black uppercase text-purple-700 hover:underline whitespace-nowrap"
                                        >
                                            Dismiss
                                        </button>
                                    </li>
                                ))}
                        </ul>
                    </section>
                ) : null}

                <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    {applications.length === 0 ? (
                        <div className="p-16 text-center text-slate-400 font-bold">
                            You have not applied to any opportunities yet.{' '}
                            <Link to="/opportunities" className="text-purple-600 hover:underline">
                                Browse listings
                            </Link>
                            .
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {applications.map((a) => {
                                const st = statusLabel(a.status);
                                const oid = a.opportunity_id;
                                const canTeams = Boolean(a.event_id);
                                return (
                                    <li key={a._id} className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 hover:bg-slate-50/80 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-slate-900 text-lg truncate">
                                                {a.opportunity_title || 'Opportunity'}
                                            </p>
                                            <p className="text-sm text-slate-500 font-medium mt-1">
                                                {a.institution_name ? `${a.institution_name}` : 'Host institution'}
                                                {a.applied_at ? ` · Applied ${new Date(a.applied_at).toLocaleString()}` : ''}
                                            </p>
                                        </div>
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${st.cls}`}
                                        >
                                            {st.text === 'Shortlisted' ? <CheckCircle2 size={14} /> : null}
                                            {st.text}
                                        </span>
                                        {canTeams ? (
                                            <Link
                                                to={`/events/${a.event_id}`}
                                                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100 text-xs font-black uppercase tracking-widest hover:bg-purple-100 transition-colors shrink-0"
                                                title="Open team & submissions hub"
                                            >
                                                Team hub <UsersRound size={14} />
                                            </Link>
                                        ) : null}
                                        {oid ? (
                                            <Link
                                                to={`/opportunities/${oid}`}
                                                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition-colors shrink-0"
                                            >
                                                Open <ExternalLink size={14} />
                                            </Link>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
};

export default MyApplications;
