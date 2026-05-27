
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    onPost: () => void;
}

import { 
    LayoutDashboard, 
    Briefcase, 
    ClipboardList, 
    Users, 
    UserCircle, 
    Download, 
    Settings,
    Plus,
    LogOut,
    UserCheck,
    Trophy,
    BarChart3,
    Award
} from 'lucide-react';

const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events Management', icon: Briefcase },
    { id: 'participants', label: 'Participants', icon: Users },
    { id: 'teams', label: 'Teams', icon: UserCircle },
    { id: 'submissions', label: 'Submissions', icon: ClipboardList },
    { id: 'judges', label: 'Judge Management', icon: UserCheck },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'downloads', label: 'Downloads', icon: Download },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'settings', label: 'Settings', icon: Settings },
];


const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onPost }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = async () => {
        logout();
    };


    return (
        <div className="w-60 h-screen bg-white border-r border-gray-100 flex flex-col shrink-0 sticky top-0 overflow-hidden z-10">
            <div className="p-6 pb-2 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <img src="/images/studlyf_secondary.png" alt="Studlyf" className="h-8" />
            </div>

            <div className="px-4 mb-4">
                <button 
                    onClick={onPost}
                    className="w-full py-2.5 bg-gradient-to-r from-[#6C3BFF] to-[#9F6BFF] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-200 hover:scale-[1.02] transition-all text-sm"
                >
                    <Plus size={20} />
                    Post
                </button>
            </div>

            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar py-2">
                {sidebarItems.map((item) => (
                    <motion.button
                        key={item.id}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onTabChange(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all text-left whitespace-nowrap text-xs ${
                            activeTab === item.id 
                                ? 'bg-purple-50 text-[#6C3BFF] shadow-sm' 
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        <item.icon size={18} className={activeTab === item.id ? 'text-[#6C3BFF]' : 'text-gray-400'} />
                        {item.label}
                        {activeTab === item.id && (
                            <motion.div 
                                layoutId="activePill"
                                className="ml-auto w-1 h-5 bg-[#6C3BFF] rounded-full"
                            />
                        )}
                    </motion.button>
                ))}
            </nav>

            <div className="p-3 mt-auto border-t border-gray-50 bg-white">
                <div className="bg-purple-50 p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-purple-600 uppercase tracking-widest mb-1">Support</p>
                    <p className="text-[10px] text-gray-600 mb-2">Facing any issues? Our team is here to help.</p>
                    <a 
                        href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL || 'support@studlyf.com'}`}
                        className="text-[10px] font-bold text-[#6C3BFF] hover:underline"
                    >
                        Contact Support
                    </a>
                </div>
            </div>
        </div>

    );
};

export default Sidebar;
