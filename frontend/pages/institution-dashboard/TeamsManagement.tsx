import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, authHeaders } from '../../apiConfig';
import { Trash2, Users, Search, RefreshCw } from 'lucide-react';

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
    status?: string;
    event_id?: string;
    created_at?: string;
    size_min?: number;
    size_max?: number;
};

type Event = {
    _id: string;
    title?: string;
    name?: string;
};

interface TeamsManagementProps {
    institutionId: string;
}

const TeamsManagement: React.FC<TeamsManagementProps> = ({ institutionId }) => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [deleting, setDeleting] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const fetchEvents = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events-db-only/${institutionId}`, {
                headers: { ...authHeaders() },
            });
            if (res.ok) {
                const data = await res.json();
                setEvents(data || []);
            }
        } catch { }
    }, [institutionId]);

    const fetchTeams = useCallback(async () => {
        if (!selectedEventId) {
            setTeams([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${selectedEventId}/teams`, {
                headers: { ...authHeaders() },
            });
            if (res.ok) {
                const data = await res.json();
                setTeams(data || []);
            } else {
                setError('Failed to fetch teams');
            }
        } catch {
            setError('Failed to fetch teams');
        } finally {
            setLoading(false);
        }
    }, [selectedEventId]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    const handleDeleteTeam = async (teamId: string) => {
        if (!window.confirm('Delete this team? All members will be removed.')) return;
        setDeleting(teamId);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/institution/events/${selectedEventId}/teams/${teamId}`, {
                method: 'DELETE',
                headers: { ...authHeaders() },
            });
            if (res.ok) {
                setTeams(prev => prev.filter(t => t._id !== teamId));
            } else {
                const err = await res.json();
                alert(err.detail || 'Failed to delete team');
            }
        } catch {
            alert('Failed to delete team');
        } finally {
            setDeleting(null);
        }
    };

    const selectedEvent = events.find(e => e._id === selectedEventId);
    const filteredTeams = teams.filter(t =>
        !search || t.team_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Teams Management</h1>
                    <p className="text-gray-500 mt-2">View and manage teams for your events.</p>
                </div>
                <button
                    onClick={fetchTeams}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Event</label>
                    <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 bg-white"
                    >
                        <option value="">-- Choose an event --</option>
                        {events.map(ev => (
                            <option key={ev._id} value={ev._id}>{ev.title || ev.name || ev._id}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Teams</label>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by team name..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                        />
                    </div>
                </div>
            </div>

            {!selectedEventId ? (
                <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg font-medium">Select an event to view teams</p>
                </div>
            ) : loading ? (
                <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                    <p className="text-gray-500 mt-4">Loading teams...</p>
                </div>
            ) : filteredTeams.length === 0 ? (
                <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No teams found for this event</p>
                    <p className="text-gray-400 text-sm mt-1">Teams will appear here once participants create them.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Leader</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Members</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTeams.map(team => {
                                    const leader = team.members?.find(m =>
                                        m.is_leader || m.role === 'LEADER' || String(m.user_id) === String(team.team_leader_id)
                                    );
                                    const memberCount = team.members?.length || 0;
                                    return (
                                        <tr key={team._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-semibold text-gray-900">{team.team_name || 'Unnamed Team'}</div>
                                                <div className="text-xs text-gray-500 mt-1">ID: {team._id.slice(-8)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {leader?.name || leader?.email || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                <span className="font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs">
                                                    {memberCount}
                                                </span>
                                                <span className="ml-1 text-gray-500">/ {team.size_max || '?'} members</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    team.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    team.status === 'disqualified' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {team.status || ''}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => handleDeleteTeam(team._id)}
                                                    disabled={deleting === team._id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                                >
                                                    <Trash2 size={14} />
                                                    {deleting === team._id ? 'Deleting...' : 'Delete'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamsManagement;
