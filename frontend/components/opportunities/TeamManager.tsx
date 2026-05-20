import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { API_BASE_URL, FRONTEND_URL, authHeaders } from '../../apiConfig';
import { ChevronLeft, Users, Copy, Check, Link2, LogOut, Crown, UserPlus, Hash, Send, X, ThumbsUp, ThumbsDown } from 'lucide-react';

type TeamMember = {
    user_id?: string;
    name?: string;
    email?: string;
    role?: string;
    is_leader?: boolean;
};

type Team = {
    _id: string;
    team_name?: string;
    team_leader_id?: string;
    leader_name?: string;
    members?: TeamMember[];
    invite_code?: string;
};

type JoinRequest = {
    _id: string;
    requester_user_id: string;
    requester_name: string;
    requester_email: string;
    requester_college?: string;
    message?: string;
    status: string;
    created_at: string;
};

type TeamManagerProps = {
    eventId: string;
    opportunity?: any;
};

const TeamManager: React.FC<TeamManagerProps> = ({ eventId, opportunity }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteCode, setInviteCode] = useState('');
    const [generatedInvite, setGeneratedInvite] = useState<string | null>(null);
    const [teamName, setTeamName] = useState('');
    const [registered, setRegistered] = useState(true);
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const autoJoinAttempted = useRef(false);

    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [joinRequestMessage, setJoinRequestMessage] = useState('');
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [sentRequest, setSentRequest] = useState<string | null>(null);

    const minSize = opportunity?.minTeamSize ?? opportunity?.min_team_size ?? 1;
    const maxSize = opportunity?.maxTeamSize ?? opportunity?.max_team_size ?? 5;

    const shareableLink = generatedInvite
        ? `${FRONTEND_URL}/#/opportunities/${eventId}?tab=team&invite=${generatedInvite}`
        : null;

    const fetchProgress = async () => {
        if (!eventId) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/stages/events/${eventId}/progress`, {
                headers: { ...authHeaders() },
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || err.error || 'Failed to load team status.');
            }
            const data = await response.json();
            if (data.status === 'not_registered') {
                setRegistered(false);
                setTeam(null);
                return;
            }
            setRegistered(true);
            setTeam(data.team || null);
            if (data.team?.invite_code) {
                setGeneratedInvite(data.team.invite_code);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load team status.');
        } finally {
            setLoading(false);
        }
    };

    const fetchJoinRequests = async () => {
        if (!team?._id) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/teams/requests/teams/${team._id}/requests`, {
                headers: { ...authHeaders() },
            });
            if (res.ok) {
                const data = await res.json();
                setJoinRequests(data.requests || []);
            }
        } catch { }
    };

    useEffect(() => {
        if (!eventId) { setLoading(false); return; }
        fetchProgress();
    }, [eventId]);

    useEffect(() => {
        if (team?._id) {
            fetchJoinRequests();
        }
    }, [team?._id]);

    useEffect(() => {
        const codeFromUrl = searchParams.get('invite');
        if (codeFromUrl && !autoJoinAttempted.current) {
            autoJoinAttempted.current = true;
            setInviteCode(codeFromUrl.toUpperCase());
        }
    }, [searchParams]);

    useEffect(() => {
        if (inviteCode && !team && registered && !loading && autoJoinAttempted.current) {
            handleJoinTeam(new Event('submit') as any);
        }
    }, [inviteCode, team, registered, loading]);

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventId || !teamName.trim()) return;
        setError(null);
        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/stages/teams/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ event_id: eventId, team_name: teamName.trim(), min_size: minSize, max_size: maxSize }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || err.error || 'Failed to create team.');
            }
            await fetchProgress();
            setTeamName('');
        } catch (err: any) {
            setError(err.message || 'Failed to create team.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoinTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventId || !inviteCode.trim()) return;
        setError(null);
        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/stages/teams/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ event_id: eventId, invite_code: inviteCode.trim() }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || err.error || 'Invalid invite code.');
            }
            await fetchProgress();
            setInviteCode('');
        } catch (err: any) {
            setError(err.message || 'Failed to join team.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeaveTeam = async () => {
        if (!eventId || !team) return;
        const msg = isLeader
            ? 'Are you sure you want to delete this team? All members will be removed from the team.'
            : 'Are you sure you want to leave this team?';
        if (!window.confirm(msg)) return;
        setError(null);
        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/stages/teams/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ event_id: eventId }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || err.error || 'Failed to leave team.');
            }
            setTeam(null);
            setGeneratedInvite(null);
        } catch (err: any) {
            setError(err.message || 'Failed to leave team.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleGenerateInvite = async () => {
        if (!team?._id) return;
        setError(null);
        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/stages/teams/${team._id}/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ ttl_hours: 720 }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || err.error || 'Failed to generate invite code.');
            }
            const data = await response.json();
            setGeneratedInvite(data.invite_code || data.code || null);
        } catch (err: any) {
            setError(err.message || 'Failed to generate invite code.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendJoinRequest = async () => {
        if (!team?._id || !eventId) return;
        setError(null);
        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/teams/requests/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    event_id: eventId,
                    team_id: team._id,
                    message: joinRequestMessage,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setSentRequest(data.request_id || 'sent');
                setShowRequestForm(false);
            } else {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to send request');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to send join request.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApproveRequest = async (requestId: string) => {
        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/teams/requests/${requestId}/approve`, {
                method: 'POST',
                headers: { ...authHeaders() },
            });
            if (res.ok) {
                await fetchJoinRequests();
                await fetchProgress();
            } else {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to approve');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/teams/requests/${requestId}/reject`, {
                method: 'POST',
                headers: { ...authHeaders() },
                body: JSON.stringify({ reason: 'Declined by team leader' }),
            });
            if (res.ok) {
                await fetchJoinRequests();
            } else {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to reject');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const copyToClipboard = async (text: string, type: 'code' | 'link') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'code') { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }
            else { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }
        } catch { }
    };

    const isLeader = team && String(team.team_leader_id || '') === String(user?.user_id || '');
    const memberCount = team?.members?.length || 0;

    const handleBack = () => {
        const idx = window.history.state?.idx ?? 0;
        if (idx > 0) navigate(-1);
        else navigate(`/opportunities/${eventId}`);
    };

    const isTeamMember = team?.members?.some(m => String(m.user_id) === String(user?.user_id));

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 mb-6 transition-colors"
            >
                <ChevronLeft size={18} /> Back to Event
            </button>

            <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-900">Team Hub</h1>
                <p className="text-slate-500 font-medium mt-1">
                    {opportunity?.title || 'Event'} · {minSize}–{maxSize} members per team
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-semibold mb-5">
                    {error}
                </div>
            )}

            {!registered ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users size={28} className="text-purple-600" />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 mb-2">Register First</h2>
                    <p className="text-slate-500 font-medium text-sm">You need to register for this event before creating or joining a team.</p>
                    <button onClick={handleBack} className="mt-5 px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-black hover:bg-purple-700 transition-colors">
                        Go Back & Register
                    </button>
                </div>
            ) : team && isTeamMember ? (
                /* ── TEAM VIEW (member) ── */
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-200 text-xs font-black uppercase tracking-widest mb-1">Your Team</p>
                                    <h2 className="text-white text-xl font-black">{team.team_name}</h2>
                                </div>
                                <div className="bg-white/20 rounded-xl px-3 py-1.5 text-white text-sm font-black">
                                    {memberCount}/{maxSize}
                                </div>
                            </div>
                        </div>

                        <div className="p-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Members</p>
                            <div className="space-y-2">
                                {(team.members || []).map((member, i) => {
                                    const isThisLeader = member.role === 'LEADER' || member.is_leader ||
                                        String(member.user_id) === String(team.team_leader_id);
                                    return (
                                        <div key={member.user_id || i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${isThisLeader ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {isThisLeader ? <Crown size={14} /> : (member.name?.[0] || '?').toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">
                                                    {member.name || member.email || 'Member'}
                                                    {String(member.user_id) === String(user?.user_id) ? ' (You)' : ''}
                                                </p>
                                                {member.email && <p className="text-xs text-slate-400 truncate">{member.email}</p>}
                                            </div>
                                            {isThisLeader && (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Leader</span>
                                            )}
                                        </div>
                                    );
                                })}
                                {Array.from({ length: Math.max(0, maxSize - memberCount) }).map((_, i) => (
                                    <div key={`empty-${i}`} className="flex items-center gap-3 p-3 border-2 border-dashed border-slate-200 rounded-xl">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                            <UserPlus size={14} className="text-slate-300" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-300">Open slot</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Invite section — leader only */}
                    {isLeader && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Invite Members</p>

                            {!generatedInvite ? (
                                <button
                                    type="button"
                                    onClick={handleGenerateInvite}
                                    disabled={actionLoading}
                                    className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-black hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Hash size={16} /> Generate Invite Code
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <Hash size={16} className="text-purple-600 shrink-0" />
                                        <span className="flex-1 font-mono font-black text-slate-900 tracking-widest text-sm">{generatedInvite}</span>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(generatedInvite, 'code')}
                                            className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-500"
                                            title="Copy code"
                                        >
                                            {copiedCode ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                        </button>
                                    </div>

                                    {shareableLink && (
                                        <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100">
                                            <Link2 size={16} className="text-purple-600 shrink-0" />
                                            <span className="flex-1 text-xs text-purple-700 font-medium truncate">{shareableLink}</span>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(shareableLink, 'link')}
                                                className="p-1.5 rounded-lg hover:bg-purple-200 transition-colors text-purple-600"
                                                title="Copy link"
                                            >
                                                {copiedLink ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    )}

                                    <p className="text-xs text-slate-400 font-medium text-center">This code never expires — share it with your teammates</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Join Requests — leader can approve/reject */}
                    {isLeader && joinRequests.filter(r => r.status === 'PENDING').length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Pending Join Requests</p>
                            <div className="space-y-3">
                                {joinRequests.filter(r => r.status === 'PENDING').map(req => (
                                    <div key={req._id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900">{req.requester_name || req.requester_email}</p>
                                            <p className="text-xs text-slate-500 truncate">{req.requester_email}{req.requester_college ? ` · ${req.requester_college}` : ''}</p>
                                            {req.message && <p className="text-xs text-slate-400 mt-1 italic">"{req.message}"</p>}
                                        </div>
                                        <div className="flex gap-2 ml-3">
                                            <button
                                                onClick={() => handleApproveRequest(req._id)}
                                                disabled={actionLoading || memberCount >= maxSize}
                                                className="p-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors disabled:opacity-50"
                                                title="Approve"
                                            >
                                                <ThumbsUp size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleRejectRequest(req._id)}
                                                disabled={actionLoading}
                                                className="p-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50"
                                                title="Reject"
                                            >
                                                <ThumbsDown size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Leave team */}
                    <button
                        type="button"
                        onClick={handleLeaveTeam}
                        disabled={actionLoading}
                        className="w-full py-3 border border-red-200 text-red-600 rounded-xl text-sm font-black hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <LogOut size={16} /> {isLeader ? 'Delete Team' : 'Leave Team'}
                    </button>
                </div>
            ) : team && !isTeamMember ? (
                /* ── VIEWING SOMEONE ELSE'S TEAM (request to join) ── */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users size={28} className="text-purple-600" />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 mb-1">{team.team_name}</h2>
                    <p className="text-sm text-slate-500 font-medium mb-2">
                        Led by {team.leader_name || 'Team Leader'} · {memberCount}/{maxSize} members
                    </p>

                    {sentRequest ? (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
                            <p className="text-sm font-bold text-green-700">Request sent!</p>
                            <p className="text-xs text-green-600 mt-1">Waiting for the team leader to approve.</p>
                        </div>
                    ) : showRequestForm ? (
                        <div className="mt-6 space-y-3 text-left">
                            <textarea
                                value={joinRequestMessage}
                                onChange={(e) => setJoinRequestMessage(e.target.value)}
                                placeholder="Add a message to the team leader (optional)"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-purple-50 focus:border-purple-300 transition-all resize-none"
                                rows={3}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSendJoinRequest}
                                    disabled={actionLoading}
                                    className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-sm font-black hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Send size={14} /> Send Request
                                </button>
                                <button
                                    onClick={() => setShowRequestForm(false)}
                                    className="py-3 px-4 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ) : memberCount < maxSize ? (
                        <button
                            onClick={() => setShowRequestForm(true)}
                            disabled={actionLoading}
                            className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-black hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                        >
                            <Send size={14} /> Request to Join
                        </button>
                    ) : (
                        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                            <p className="text-sm font-medium text-slate-500">This team is full.</p>
                        </div>
                    )}
                </div>
            ) : (
                /* ── NO TEAM VIEW ── */
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                            <Users size={20} className="text-purple-600" />
                        </div>
                        <h3 className="text-base font-black text-slate-900 mb-1">Create a Team</h3>
                        <p className="text-xs text-slate-500 font-medium mb-4">Start a new team and invite others.</p>
                        <form onSubmit={handleCreateTeam} className="space-y-3">
                            <input
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="Team name"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-purple-50 focus:border-purple-300 outline-none transition-all"
                                required
                            />
                            <button
                                type="submit"
                                disabled={actionLoading || !teamName.trim()}
                                className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-black hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? 'Creating...' : 'Create Team'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                            <Hash size={20} className="text-green-600" />
                        </div>
                        <h3 className="text-base font-black text-slate-900 mb-1">Join a Team</h3>
                        <p className="text-xs text-slate-500 font-medium mb-4">Enter an invite code from your team leader.</p>
                        <form onSubmit={handleJoinTeam} className="space-y-3">
                            <input
                                type="text"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                placeholder="Invite code"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 tracking-widest focus:ring-4 focus:ring-green-50 focus:border-green-300 outline-none transition-all"
                                required
                            />
                            <button
                                type="submit"
                                disabled={actionLoading || !inviteCode.trim()}
                                className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-black hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? 'Joining...' : 'Join Team'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManager;
