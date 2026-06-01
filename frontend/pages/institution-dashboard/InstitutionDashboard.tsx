
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Info, ChevronRight, Zap, Clock } from 'lucide-react';
import Sidebar from '../../components/institution/Sidebar';

import InviteAudit from './InviteAudit';
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
        } else if (path.includes('/invite-audit')) {
            setActiveTab('invite-audit');
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
    const [selectedEventSection, setSelectedEventSection] = useState<string | undefined>(undefined);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [isInternshipModalOpen, setIsInternshipModalOpen] = useState(false);
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [isConsultationOpen, setIsConsultationOpen] = useState(false);
    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
    const [isTourOpen, setIsTourOpen] = useState(false);
    const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);

    const { user, role } = useAuth();
    const institutionId = (user as any)?.institution_id || user?.user_id || 'default_inst';

    React.useEffect(() => {
        if (user && !hasInstitutionScope(user)) {
            console.warn('[Dashboard] Institution users should have institution_id set on their profile', user?.user_id);
        }
    }, [user]);

    const handleViewEvent = async (eventId: string, status?: string, section?: string) => {
        setSelectedEventId(eventId);
        setSelectedEventSection(section);
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
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                            <Building2 size={32} className="text-amber-600" />
                        </div>
                        <h3 className="text-xl font-black text-center">Institution Setup Required</h3>
                        <p className="text-center leading-relaxed">
                            Your institution account needs to be properly configured to access the dashboard. 
                            Please contact your Studlyf administrator to complete the institution profile setup.
                        </p>
                        <div className="bg-amber-100 rounded-2xl p-4 text-xs font-medium text-amber-800">
                            <p className="font-black mb-2">What's needed:</p>
                            <ul className="space-y-1">
                                <li>• Institution profile creation</li>
                                <li>• Account linking to institution</li>
                                <li>• Proper permissions setup</li>
                            </ul>
                        </div>
                    </div>
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
                return (
                    <EventDetails 
                        institutionId={institutionId} 
                        eventId={selectedEventId} 
                        initialSection={selectedEventSection}
                        onBack={() => handleTabChange('events')} 
                        onEditEvent={(eventId) => {
                            setEditingEventId(eventId);
                            setIsPostModalOpen(true);
                        }}
                    />
                );
            case 'participants':
                return <ParticipantsManagement institutionId={institutionId} />;
            case 'teams':
                return <TeamsManagement institutionId={institutionId} />;
            case 'submissions':
                return selectedEventId ? (
                    <EventDetails
                        institutionId={institutionId}
                        eventId={selectedEventId}
                        onBack={() => handleTabChange('events')}
                        initialSection="submissions"
                        onEditEvent={(eventId) => {
                            setEditingEventId(eventId);
                            setIsPostModalOpen(true);
                        }}
                    />
                ) : (
                    <div className="py-24 text-center text-slate-400 font-bold">
                        Select an event to view its submissions.
                    </div>
                );
            case 'judges':
                return <JudgeManagement />;
            case 'leaderboard':
                return selectedEventId ? (
                    <EventDetails
                        institutionId={institutionId}
                        eventId={selectedEventId}
                        onBack={() => handleTabChange('events')}
                        initialSection="leaderboard"
                        onEditEvent={(eventId) => {
                            setEditingEventId(eventId);
                            setIsPostModalOpen(true);
                        }}
                    />
                ) : (
                    <div className="py-24 text-center text-slate-400 font-bold">
                        Select an event to view its live leaderboard.
                    </div>
                );
            case 'analytics':
                return <ReportsPage institutionId={institutionId} />;
            case 'invite-audit':
                return <InviteAudit />;
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
                                    Institution Dashboard <span className="animate-bounce">🏢</span>
                                </h1>
                                <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-1">
                                    Manage your events, opportunities, and participants <Info size={14} className="text-slate-300" />
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

                        {/* Stats Section - High Fidelity Dynamic Metrics */}
                        <StatsSection 
                            institutionId={institutionId} 
                            onNavigate={handleTabChange}
                            onContact={() => setIsConsultationOpen(true)}
                        />

                        <div className="flex flex-col xl:flex-row gap-8">
                             {/* Main Activity Column */}
                            <div className="flex-1 space-y-8">
                                <RecentListings 
                                    institutionId={institutionId} 
                                    onViewEvent={handleViewEvent}
                                    onViewAll={() => handleTabChange('opportunities')}
                                />
                            </div>

                            {/* Secondary Column - Intelligence & Utilities */}
                            <div className="w-full xl:w-[400px] space-y-8">
                                <AlertsPanel institutionId={institutionId} />
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
                <div className="shrink-0">
                    <Sidebar 
                        activeTab={activeTab} 
                        onTabChange={handleTabChange} 
                        onPost={() => setIsSelectionModalOpen(true)}
                    />
                </div>
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
                onClose={() => {
                    setIsPostModalOpen(false);
                    setEditingEventId(null);
                }}
                institutionId={institutionId}
                eventId={editingEventId || undefined}
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
