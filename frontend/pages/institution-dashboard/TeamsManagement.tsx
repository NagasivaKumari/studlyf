import React, { useState } from 'react';

interface TeamMember {
    name: string;
    role: string;
}

interface Team {
    teamId: string;
    teamName: string;
    leader: string;
    members: TeamMember[];
    membersCount: number;
    formationDate: string;
    status: string;
    event: string;
}

const TeamsManagement: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTeam, setNewTeam] = useState({ teamName: '', leader: '', event: 'Hackathon' });
    const [filterEvent, setFilterEvent] = useState('All Events');
    const [filterStatus, setFilterStatus] = useState('All Statuses');
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

    // Filtering logic
    const filteredTeams = teams.filter(t => {
        const matchEvent = filterEvent === 'All Events' || t.event === filterEvent;
        const matchStatus = filterStatus === 'All Statuses' || t.status === filterStatus;
        return matchEvent && matchStatus;
    });

    // Actions (UI only for demonstration)
    const handleDelete = (id: string) => {
        if(window.confirm('Are you sure you want to delete this team?')) {
            setTeams(teams.filter(t => t.teamId !== id));
        }
    };

    const handleAddTeam = async () => {
        try {
            // Send team formation email
            const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
            const response = await fetch(`${API_BASE_URL}/api/team-formation/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({
                    teamName: newTeam.teamName,
                    leader: newTeam.leader,
                    event: newTeam.event
                })
            });

            if (response.ok) {
                alert('Team formation email sent successfully!');
                
                const newEntry: Team = {
                    teamId: `TM${teams.length + 1}`,
                    teamName: newTeam.teamName,
                    leader: newTeam.leader,
                    members: [],
                    membersCount: 1,
                    formationDate: new Date().toISOString(),
                    status: 'Email Sent',
                    event: newTeam.event
                };
                setTeams([...teams, newEntry]);
                setShowAddForm(false);
                setNewTeam({ teamName: '', leader: '', event: 'Hackathon' });
            } else {
                alert('Failed to send team formation email');
            }
        } catch (error) {
            console.error('Error sending team formation email:', error);
            alert('Error sending team formation email');
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-800 border border-green-200';
            case 'Pending Approval': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'Disqualified': return 'bg-red-100 text-red-800 border border-red-200';
            default: return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex pt-0">
            {/* Sidebar placeholder */}
            {/* <Sidebar /> */}
            
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Header Placeholder (Standard) */}
                {/* <Topbar /> */}

                <main className="p-8 pt-10 flex-1">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex justify-between items-center w-full">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Teams Management</h1>
                                <p className="text-gray-500 mt-2">View, edit, and manage teams for events.</p>
                            </div>
                            <button 
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors ml-4 whitespace-nowrap"
                            >
                                {showAddForm ? 'Cancel' : 'Add Team'}
                            </button>
                        </div>
                        
                        {/* View Mode Toggle */}
                        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm self-start md:self-end">
                            <button 
                                onClick={() => setViewMode('table')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                            >
                                Table View
                            </button>
                            <button 
                                onClick={() => setViewMode('card')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'card' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                            >
                                Card View
                            </button>
                        </div>
                    </div>

                    {/* Add Team Form */}
                    {showAddForm && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Team</h2>
                            <form onSubmit={handleAddTeam} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input required type="text" placeholder="Team Name" value={newTeam.teamName} onChange={e => setNewTeam({...newTeam, teamName: e.target.value})} className="px-4 py-2 border rounded-lg" />
                                <input required type="text" placeholder="Leader Name" value={newTeam.leader} onChange={e => setNewTeam({...newTeam, leader: e.target.value})} className="px-4 py-2 border rounded-lg" />
                                <select value={newTeam.event} onChange={e => setNewTeam({...newTeam, event: e.target.value})} className="px-4 py-2 border rounded-lg bg-white">
                                    <option value="Hackathon">Hackathon</option>
                                    <option value="AI Challenge">AI Challenge</option>
                                </select>
                                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">Submit</button>
                            </form>
                        </div>
                    )}

                    {/* Filters Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4">
                        <div className="flex-1 max-w-xs">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Filter</label>
                            <select 
                                value={filterEvent}
                                onChange={(e) => setFilterEvent(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 bg-white"
                            >
                                <option value="All Events">All Events</option>
                                <option value="Hackathon">Hackathon</option>
                                <option value="AI Challenge">AI Challenge</option>
                            </select>
                        </div>

                        <div className="flex-1 max-w-xs">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 bg-white"
                            >
                                <option value="All Statuses">All Statuses</option>
                                <option value="Pending Approval">Pending Approval</option>
                                <option value="Approved">Approved</option>
                                <option value="Disqualified">Disqualified</option>
                            </select>
                        </div>
                    </div>

                    {/* Content Area */}
                    {filteredTeams.length === 0 ? (
                        <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 text-center">
                            <p className="text-gray-500">No teams found matching your criteria.</p>
                        </div>
                    ) : viewMode === 'table' ? (
                        /* Table View */
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Name & ID</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Leader</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Members</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Formation Date</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredTeams.map((team) => (
                                            <tr key={team.teamId} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-semibold text-gray-900">{team.teamName}</div>
                                                    <div className="text-xs text-gray-500 mt-1">ID: {team.teamId}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{team.leader}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    <div className="flex items-center">
                                                        <span className="font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs mr-2">
                                                            {team.membersCount}
                                                        </span>
                                                        members
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{team.event}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.formationDate}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(team.status || 'Pending')}`}>
                                                        {team.status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-3">
                                                        <button className="text-indigo-600 hover:text-indigo-900 transition-colors">View</button>
                                                        <button className="text-gray-600 hover:text-gray-900 transition-colors">Edit</button>
                                                        <button 
                                                            onClick={() => handleDelete(team.teamId)}
                                                            className="text-red-600 hover:text-red-900 transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* Card View */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTeams.map((team) => (
                                <div key={team.teamId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{team.teamName}</h3>
                                            <span className="text-xs text-gray-500">ID: {team.teamId}</span>
                                        </div>
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(team.status)}`}>
                                            {team.status}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-3 flex-1 mb-6">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Event:</span>
                                            <span className="font-medium text-gray-900">{team.event}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Leader:</span>
                                            <span className="font-medium text-gray-900">{team.leader}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Formation:</span>
                                            <span className="font-medium text-gray-900">{team.formationDate}</span>
                                        </div>
                                        
                                        <div className="pt-3 border-t border-gray-100">
                                            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Members ({team.membersCount})</div>
                                            <div className="space-y-2">
                                                {team.members.map((member, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-800">{member.name}</span>
                                                        <span className="text-gray-500 text-xs">{member.role}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 flex justify-between">
                                        <button className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors w-full mr-2">
                                            View
                                        </button>
                                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors w-full mx-1">
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(team.teamId)}
                                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors w-full ml-2"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer Placeholder (Standard) */}
                    {/* <Footer /> */}
                </main>
            </div>
        </div>
    );
};

export default TeamsManagement;
