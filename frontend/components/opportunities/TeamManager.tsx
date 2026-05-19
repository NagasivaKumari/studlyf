import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { API_BASE_URL, authHeaders } from '../../apiConfig';

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
};

type TeamManagerProps = {
    eventId: string;
    opportunity?: any;
};

const TeamManager: React.FC<TeamManagerProps> = ({ eventId, opportunity }) => {
    const { user } = useAuth();

    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteCode, setInviteCode] = useState('');
    const [generatedInvite, setGeneratedInvite] = useState<string | null>(null);
    const [teamName, setTeamName] = useState('');
    const [registered, setRegistered] = useState(true);

    const minSize = opportunity?.minTeamSize ?? opportunity?.min_team_size ?? 1;
    const maxSize = opportunity?.maxTeamSize ?? opportunity?.max_team_size ?? 5;

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
        } catch (err: any) {
            setError(err.message || 'Failed to load team status.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!eventId) {
            setLoading(false);
            return;
        }
        fetchProgress();
    }, [eventId]);

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventId || !teamName.trim()) return;
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/stages/teams/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    event_id: eventId,
                    team_name: teamName.trim(),
                    min_size: minSize,
                    max_size: maxSize,
                }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || err.error || 'Failed to create team.');
            }
            await fetchProgress();
            setTeamName('');
        } catch (err: any) {
            setError(err.message || 'Failed to create team.');
        }
    };

    const handleJoinTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventId || !inviteCode.trim()) return;
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/stages/teams/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    event_id: eventId,
                    invite_code: inviteCode.trim(),
                }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || err.error || 'Failed to join team. Invalid code?');
            }
            await fetchProgress();
            setInviteCode('');
        } catch (err: any) {
            setError(err.message || 'Failed to join team.');
        }
    };

    const handleLeaveTeam = async () => {
        if (!eventId || !team) return;
        if (!window.confirm('Are you sure you want to leave this team?')) return;
        setError(null);
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
        } catch (err: any) {
            setError(err.message || 'Failed to leave team.');
        }
    };

    const handleGenerateInvite = async () => {
        if (!team?._id) return;
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/stages/teams/${team._id}/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ ttl_hours: 72 }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || err.error || 'Failed to generate invite code.');
            }
            const data = await response.json();
            setGeneratedInvite(data.invite_code || null);
        } catch (err: any) {
            setError(err.message || 'Failed to generate invite code.');
        }
    };

    const isLeader = team && String(team.team_leader_id || '') === String(user?.user_id || '');

    if (loading) {
        return <div className="text-center p-8">Loading team details...</div>;
    }

    if (!registered) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Team Management</h2>
                <p className="text-slate-600">Please register for this event to create or join a team.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Team Management</h2>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

            {team ? (
                <div>
                    <h3 className="text-xl font-semibold">Your Team: {team.team_name}</h3>
                    <p className="text-gray-600">Members ({team.members?.length || 0}/{maxSize})</p>
                    <div className="my-4">
                        <h4 className="font-bold">Members ({team.members?.length || 0}/{maxSize})</h4>
                        <ul className="list-disc list-inside">
                            {(team.members || []).map((member, index) => (
                                <li key={`${member.user_id || member.email || index}`}>
                                    {member.name || member.email || 'Member'} {member.role === 'LEADER' || member.is_leader ? '(Leader)' : ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {isLeader ? (
                        <div className="mb-4">
                            <button
                                type="button"
                                onClick={handleGenerateInvite}
                                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                            >
                                Generate Invite Code
                            </button>
                            {generatedInvite && (
                                <p className="text-gray-600 mt-2">
                                    Invite Code: <strong className="font-mono bg-gray-200 p-1 rounded">{generatedInvite}</strong>
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 mb-4">Only the team leader can generate invite codes.</p>
                    )}
                    <button onClick={handleLeaveTeam} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                        Leave Team
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Create Team */}
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Create a New Team</h3>
                        <form onSubmit={handleCreateTeam}>
                            <input
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="Enter your team name"
                                className="w-full p-2 border rounded mb-2"
                                required
                            />
                            <button type="submit" className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                                Create Team
                            </button>
                        </form>
                    </div>

                    {/* Join Team */}
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Join an Existing Team</h3>
                        <form onSubmit={handleJoinTeam}>
                            <input
                                type="text"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                placeholder="Enter invite code"
                                className="w-full p-2 border rounded mb-2"
                                required
                            />
                            <button type="submit" className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                                Join with Code
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManager;
