import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, authHeaders } from '../../apiConfig';
import { 
    Search, 
    Filter, 
    Plus, 
    MoreVertical, 
    Edit2, 
    Trash2, 
    Calendar, 
    Users, 
    ChevronRight,
    Trophy,
    ArrowUpRight,
    ChevronDown,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Event {
    id: string;
    name: string;
    status: string;
    type: string;
    startDate: string;
    participants: number;
    image: string;
    visibility: 'Public' | 'Private';
    registrationStatus: 'Open' | 'Close';
}

interface EventsManagementProps {
    institutionId?: string;
    onViewEvent: (id: string) => void;
    onCreateEvent: () => void;
}

const FilterDropdown = ({ label, options, value, onChange, onClear }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all flex items-center gap-3 ${
                    value ? 'border-blue-500 bg-blue-50/30 text-blue-600' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
            >
                {label} {value && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />} <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] overflow-hidden"
                    >
                        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{label}</span>
                            <button onClick={() => { onClear(); setIsOpen(false); }} className="text-xs font-bold text-orange-500 hover:text-orange-600">Clear</button>
                        </div>
                        <div className="p-2">
                            {options.map((opt: string) => (
                                <button 
                                    key={opt}
                                    onClick={() => { onChange(opt); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-all group"
                                >
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${value === opt ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                                        {value === opt && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    <span className={`text-sm font-medium ${value === opt ? 'text-blue-600' : 'text-slate-600'}`}>{opt}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const EventsManagement: React.FC<EventsManagementProps> = ({ institutionId, onViewEvent, onCreateEvent }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [visibilityFilter, setVisibilityFilter] = useState('');
    const [registrationFilter, setRegistrationFilter] = useState('');
    const [typeTab, setTypeTab] = useState('All');

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!institutionId) {
                setEvents([]);
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/institution/events/${institutionId}`, { headers: { ...authHeaders() } });
                if (!response.ok) throw new Error("Fetch failed");
                const data = await response.json();
                
                // STRICT FILTER: Only include Jobs and Internships
                const filteredData = data.filter((e: any) => 
                    e.category === 'Job' || e.category === 'Internship'
                );

                setEvents(filteredData.map((e: any) => ({
                    id: e._id,
                    name: e.title,
                    status: e.status || 'Live',
                    type: e.category || 'Job',
                    startDate: new Date(e.start_date).toLocaleDateString(),
                    participants: e.participant_count || 0,
                    image: e.image_url || 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
                    visibility: e.visibility || 'Public',
                    registrationStatus: e.registration_status || 'Open'
                })));
            } catch (err) {
                console.error("Dynamic events fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || event.status === statusFilter;
        const matchesVisibility = !visibilityFilter || event.visibility === visibilityFilter;
        const matchesRegistration = !registrationFilter || event.registrationStatus === registrationFilter;
        const matchesTab = typeTab === 'All' || event.type === typeTab.slice(0, -1);
        return matchesSearch && matchesStatus && matchesVisibility && matchesRegistration && matchesTab;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-700 font-sans">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-black text-slate-900">My Jobs & Internships</h1>
            </div>

            <div className="flex flex-wrap gap-3">
                {['All', 'Jobs', 'Internships'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setTypeTab(tab)}
                        className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                            typeTab === tab ? 'bg-[#0A2E5C] text-white shadow-lg shadow-blue-900/20' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search Job/Internship"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-full focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-3">
                    <FilterDropdown 
                        label="Visibility" 
                        options={['Public', 'Private']} 
                        value={visibilityFilter} 
                        onChange={setVisibilityFilter} 
                        onClear={() => setVisibilityFilter('')}
                    />
                    <FilterDropdown 
                        label="Registration" 
                        options={['Open', 'Close']} 
                        value={registrationFilter} 
                        onChange={setRegistrationFilter} 
                        onClear={() => setRegistrationFilter('')}
                    />
                    <FilterDropdown 
                        label="Status" 
                        options={['Live', 'Draft', 'Under Moderation', 'Rejected', 'Needs Review', 'Completed', 'Upcoming']} 
                        value={statusFilter} 
                        onChange={setStatusFilter} 
                        onClear={() => setStatusFilter('')}
                    />
                </div>
            </div>

            <div className="min-h-[500px] flex flex-col items-center justify-center text-center">
                <div className="relative w-80 h-80 mb-8 opacity-80">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent rounded-full blur-3xl" />
                    <img 
                        src="https://img.freepik.com/free-vector/no-data-concept-illustration_114360-536.jpg" 
                        alt="No results" 
                        className="w-full h-full object-contain relative z-10 mix-blend-multiply"
                    />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">No results found for the applied filter or search terms!</h2>
                <p className="text-sm text-slate-400 font-medium max-w-sm">Try adjusting your search terms or filters and try again</p>
            </div>
        </div>
    );
};

export default EventsManagement;
