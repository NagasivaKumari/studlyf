
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Info, ChevronRight } from 'lucide-react';
import Sidebar from '../../components/institution/Sidebar';
import InstitutionNavbar from '../../components/institution/InstitutionNavbar';
import StatsSection from '../../components/institution/StatsSection';
import RecentListings from '../../components/institution/RecentListings';
import AlertsPanel from '../../components/institution/AlertsPanel';
import PostOpportunityModal from '../../components/institution/PostOpportunityModal';
import PostSelectionModal from '../../components/institution/PostSelectionModal';
import ContactConsultationDrawer from '../../components/institution/ContactConsultationDrawer';
import CreditBalanceModal from '../../components/institution/CreditBalanceModal';
import DashboardTour from '../../components/institution/DashboardTour';
import PostJobModal from '../../components/institution/PostJobModal';
import PostInternshipModal from '../../components/institution/PostInternshipModal';

import EventsManagement from './EventsManagement';
import OpportunitiesManagement from './OpportunitiesManagement';
import EventDetails from './EventDetails';
import SettingsPage from './SettingsPage';
import SubmissionList from './submissions/SubmissionList';
import JudgeManagement from './JudgeManagement';
import ParticipantsManagement from './ParticipantsManagement';
import TeamsManagement from './TeamsManagement';
import LeaderboardPage from './LeaderboardPage';
import ReportsPage from './ReportsPage';
import CertificatesPage from './CertificatesPage';
import DownloadsPage from './DownloadsPage';
import Footer from '../../components/institution/Footer';
import { institutionIdFromUser, hasInstitutionScope } from '../../utils/institutionScope';

const InstitutionDashboard: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');

    // Handle URL-based navigation to set active tab
    useEffect(() => {
        const path = location.pathname;
        const searchParams = new URLSearchParams(location.search);
        const eventIdFromUrl = searchParams.get('eventId');

        if (eventIdFromUrl) {
            setSelectedEventId(eventIdFromUrl);
            setActiveTab('event-details');
            return;
        }

        if (path.includes('/judge')) {
            setActiveTab('judges');
        } else if (path.includes('/events')) {
            setActiveTab('events');
        } else if (path.includes('/opportunities')) {
            setActiveTab('opportunities');
        } else if (path.includes('/participants')) {
            setActiveTab('participants');
        } else if (path.includes('/teams')) {
            setActiveTab('teams');
        } else if (path.includes('/submissions')) {
            setActiveTab('submissions');
        } else if (path.includes('/leaderboard')) {
            setActiveTab('leaderboard');
        } else if (path.includes('/analytics')) {
            setActiveTab('analytics');
        } else if (path.includes('/downloads')) {
            setActiveTab('downloads');
        } else if (path.includes('/certificates')) {
            setActiveTab('certificates');
        } else if (path.includes('/settings')) {
            setActiveTab('settings');
        }
    }, [location.pathname, location.search]);

    // Update URL when tab changes
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        const basePath = '/institution-dashboard';
        const tabPath = tab === 'dashboard' ? basePath : `${basePath}/${tab}`;
        navigate(tabPath, { replace: true });
    };
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [isInternshipModalOpen, setIsInternshipModalOpen] = useState(false);
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [isConsultationOpen, setIsConsultationOpen] = useState(false);
    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
    const [isTourOpen, setIsTourOpen] = useState(false);
    const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);

    const { user, role } = useAuth();
    const institutionId = institutionIdFromUser(user);

    React.useEffect(() => {
        if (user && !hasInstitutionScope(user)) {
            console.warn('[Dashboard] Institution users should have institution_id set on their profile', user?.user_id);
        }
    }, [user]);

    const handleViewEvent = (eventId: string) => {
        setSelectedEventId(eventId);
        handleTabChange('event-details');
    };

    const handleProfileUpdate = () => {
        setProfileRefreshTrigger(prev => prev + 1);
    };

    const handlePostSelect = (type: string) => {
        setIsSelectionModalOpen(false);
        const opportunityTypes = ['opportunity', 'hackathon', 'competition', 'quiz', 'webinar'];
        if (opportunityTypes.includes(type)) {
            setIsPostModalOpen(true);
        } else if (type === 'job') {
            setIsJobModalOpen(true);
        } else if (type === 'internship') {
            setIsInternshipModalOpen(true);
        } else if (type === 'dashboard') {
            handleTabChange('dashboard');
        }
    };

    const renderContent = () => {
        console.log("[NAV] Rendering Content for Tab:", activeTab);
        if (!institutionId && role !== 'judge') {
            return (
                <div className="p-10 max-w-xl mx-auto rounded-3xl border border-amber-200 bg-amber-50 text-amber-950 text-sm font-bold leading-relaxed">
                    Your account is missing an <strong>institution_id</strong>. Ask your Studlyf administrator to link this login to your institution profile so dashboards load real data (no placeholder IDs).
                </div>
            );
        }
        switch (activeTab) {
            case 'events':
                return (
                    <EventsManagement 
                        institutionId={institutionId}
                        onViewEvent={handleViewEvent} 
                        onCreateEvent={() => setIsPostModalOpen(true)}
                    />
                );
            case 'opportunities':
                return (
                    <OpportunitiesManagement 
                        institutionId={institutionId}
                        onViewEvent={handleViewEvent} 
                        onCreateEvent={() => setIsPostModalOpen(true)}
                    />
                );
            case 'event-details':
                return <EventDetails institutionId={institutionId} eventId={selectedEventId} onBack={() => handleTabChange('events')} />;
            case 'participants':
                return <ParticipantsManagement institutionId={institutionId} />;
            case 'teams':
                return <TeamsManagement institutionId={institutionId} />;
            case 'submissions':
                return <SubmissionList institutionId={institutionId} />;
            case 'judges':
                return <JudgeManagement />;
            case 'leaderboard':
                return <LeaderboardPage institutionId={institutionId} />;
            case 'analytics':
                return <ReportsPage institutionId={institutionId} />;
            case 'downloads':
                return <DownloadsPage institutionId={institutionId} onNavigate={setActiveTab} />;
            case 'certificates':
                return <CertificatesPage institutionId={institutionId} />;
            case 'settings':
                return <SettingsPage institutionId={institutionId} onProfileUpdate={handleProfileUpdate} />;
            case 'dashboard':
            default:
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Header Area */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                            <div>
                                <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    Welcome Back, {user?.name || 'Admin'} <span className="animate-bounce">👋</span>
                                </h1>
                                <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-1">
                                    Here is the summary of overall performance <Info size={14} className="text-slate-300" />
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div id="team-manage-icon" className="px-2.5 py-1 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500">KN</div>
                                <button 
                                    onClick={() => setIsCreditModalOpen(true)}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                                >
                                    Credit Balance
                                </button>
                                <button 
                                    onClick={() => setIsTourOpen(true)}
                                    className="w-9 h-9 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-[#6C3BFF] transition-all shadow-sm"
                                >
                                    <Info size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Top Stats & Customise Grid */}
                        <div className="flex flex-col xl:flex-row gap-6">
                            <div className="flex-1" id="stats-section">
                                <StatsSection 
                                    institutionId={institutionId} 
                                    key={profileRefreshTrigger} 
                                    onUpgrade={() => handleTabChange('settings')} 
                                    onContact={() => setIsConsultationOpen(true)}
                                    onNavigate={(tab) => {
                                        if (tab === 'opportunities') handleTabChange('opportunities');
                                        else handleTabChange('events');
                                    }}
                                />
                            </div>
                            
                            {/* Customise Card */}
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="w-full xl:w-[340px] bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] rounded-2xl p-6 relative overflow-hidden group shadow-xl shadow-purple-900/5"
                            >
                                <div className="relative z-10">
                                    <h3 className="text-lg font-black text-slate-900 mb-1">Customise your Experience</h3>
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-4 max-w-[180px]">
                                        Enhance your experience with tailored services designed to meet your specific requirements.
                                    </p>
                                    <button 
                                        onClick={() => setIsConsultationOpen(true)}
                                        className="px-5 py-2 bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all"
                                    >
                                        Contact Us <ChevronRight size={12} />
                                    </button>
                                </div>
                                {/* 3D Icon Effect */}
                                <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-slate-50/50">
                                    <div className="w-20 h-20 bg-[#7C3AED] rounded-[1.5rem] flex items-center justify-center text-white text-3xl font-black rotate-[-15deg]">
                                        <span className="text-[12px] uppercase tracking-tighter">Studlyf</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Recent Listings & Alerts */}
                        <div className="flex flex-col lg:flex-row gap-8">
                            <div className="flex-1">
                                <RecentListings 
                                    institutionId={institutionId} 
                                    onViewEvent={handleViewEvent} 
                                    onViewAll={() => handleTabChange('events')}
                                />
                            </div>
                            <div className="w-full lg:w-80 xl:w-96" id="alerts-panel">
                                <AlertsPanel 
                                    institutionId={institutionId} 
                                    onUpgrade={() => handleTabChange('settings')}
                                />
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="h-screen bg-[#F8FAFC] flex overflow-hidden font-sans">
            {/* Sidebar: Fixed width, full height */}
            {role !== 'judge' && (
                <Sidebar 
                    activeTab={activeTab} 
                    onTabChange={handleTabChange} 
                    onPost={() => setIsSelectionModalOpen(true)}
                />
            )}

            {/* Main Content Area: Fills remaining width, has its own scrollbar */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {/* Navbar: In the flow, so it cannot overlap the sidebar logo */}
                <InstitutionNavbar 
                    refreshKey={profileRefreshTrigger}
                    onNavigate={handleTabChange}
                    onNavigateToSettings={() => handleTabChange('settings')}
                />
                
                <main className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
                    <div className="max-w-[1400px] mx-auto py-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderContent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            <PostSelectionModal 
                isOpen={isSelectionModalOpen} 
                onClose={() => setIsSelectionModalOpen(false)}
                onSelect={handlePostSelect}
            />

            <PostOpportunityModal 
                isOpen={isPostModalOpen} 
                onClose={() => setIsPostModalOpen(false)}
                institutionId={institutionId}
            />

            <PostJobModal 
                isOpen={isJobModalOpen} 
                onClose={() => setIsJobModalOpen(false)}
                institutionId={institutionId}
            />

            <PostInternshipModal 
                isOpen={isInternshipModalOpen} 
                onClose={() => setIsInternshipModalOpen(false)}
                onSuccess={() => handleTabChange('opportunities')}
                institutionId={institutionId}
            />

            <ContactConsultationDrawer 
                isOpen={isConsultationOpen}
                onClose={() => setIsConsultationOpen(false)}
                institutionId={institutionId} 
            />

            <CreditBalanceModal 
                isOpen={isCreditModalOpen} 
                onClose={() => setIsCreditModalOpen(false)} 
                onUpgrade={() => { setIsCreditModalOpen(false); handleTabChange('settings'); }} 
            />

            <DashboardTour 
                isOpen={isTourOpen} 
                onClose={() => setIsTourOpen(false)} 
            />
        </div>
    );
};

export default InstitutionDashboard;
