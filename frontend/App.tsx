// Studlyf Engineering Protocol - Core Routing Engine
import React, { Suspense, useEffect, lazy, useMemo, useRef, useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';

import Navigation from './components/Navigation';
import Footer from './components/Footer';
import { AuthProvider, useAuth } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import { HeroUIProvider } from "@heroui/react";

// Pages
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import CareerFit from './pages/CareerFit';
import Assessment from './pages/Assessment';
import AssessmentIntro from './pages/AssessmentIntro';
import JobSimulation from './pages/JobSimulation';
import PortfolioBuilder from './pages/PortfolioBuilder';
import Projects from './pages/Projects';
import SystemDeconstructionLab from './pages/SystemDeconstructionLab';
import SDLProjectCreate from './pages/SDLProjectCreate';
import SDLProjectDetail from './pages/SDLProjectDetail';
import MockInterview from './pages/MockInterview';
import GroupDiscussion from './pages/GroupDiscussion';
import PlayLearnEarn from './pages/PlayLearnEarn';
import GoalSelector from './pages/GoalSelector';
import About from './pages/About';
import UnifiedAuth from './pages/UnifiedAuth';
import JudgeInvitation from './pages/JudgeInvitation';
import LearnerDashboard from './pages/LearnerDashboard';
import PartnerDashboard from './pages/PartnerDashboard';
import DashboardHome from './pages/DashboardHome';
import Blog from './pages/Blog';
import CompanyModules from './pages/CompanyModules';
import ResumeBuilder from './pages/ResumeBuilder';
import CoursePlayer from './pages/CoursePlayer';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyCourses from './pages/MyCourses';
import FeaturePreview from './pages/FeaturePreview';
import CareerOnboarding from './pages/CareerOnboarding';
import CoursesOverview from './pages/CoursesOverview';
import TrackDetail from './pages/TrackDetail';
import EnrollmentFlow from './pages/EnrollmentFlow';
import StackPage from './pages/StackPage';
import QueuePage from './pages/QueuePage';
import LinkedListPage from './pages/LinkedListPage';
import BSTPage from './pages/BSTPage';
import HashTablePage from './pages/HashTablePage';
import AITools from './pages/AITools';
import InstitutionDashboard from './pages/institution-dashboard/InstitutionDashboard';
import RoleFixer from './RoleFixer';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OpportunitiesList from './pages/opportunities/OpportunitiesList';
import OpportunityDetails from './pages/opportunities/OpportunityDetails';
import MyApplications from './pages/opportunities/MyApplications';
import EventHub from './pages/events/EventHub';
import EventQuizPage from './pages/events/EventQuizPage';
import JudgePortalLayout from './pages/judge/JudgePortalLayout';
import EvaluationPage from './pages/EvaluationPage';
import HackathonWelcomePopup from './components/HackathonWelcomePopup';


// Unique Components
import EnquiryForm from './components/EnquiryForm';
import ResourceCenter from './components/ResourceCenter';
import Testimonials from './components/Testimonials';
import Impact from './components/Impact';
import Achievements from './components/Achievements';

// Admin Pages
import AdminLayout from './pages/admin/layout/AdminLayout';
import AdminDashboardOverview from './pages/admin/dashboard/Overview';
import AdminStudentManagement from './pages/admin/students/StudentManagement';
import AdminCourseManagement from './pages/admin/courses/CourseManagement';
import AdminAssessmentManagement from './pages/admin/assessments/AssessmentManagement';
import AdminAnalytics from './pages/admin/analytics/Analytics';
import AdminSDLManagement from './pages/admin/sdl/SDLManagement';
import AdminProtectedRoute from './AdminProtectedRoute';
import AdsManagement from './pages/admin/ads/AdsManagement';
import AdminMentorManagement from './pages/admin/mentors/MentorManagement';
import AdminCompanyManagement from './pages/admin/companies/CompanyManagement';
import AdminPaymentManagement from './pages/admin/payments/PaymentManagement';
import AdminResumeManagement from './pages/admin/resumes/ResumeManagement';
import AdminAuditLogs from './pages/admin/audit/AuditLogs';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const CertificateVerification = lazy(() => import('./pages/CertificateVerification'));

const App: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const prevUserRef = useRef<any>(null);
  const [showHackPopup, setShowHackPopup] = useState(false);

  const HYD_HACK_OPP_ID = '69fb6bda6070fc83c566c5b1';
  const isHydHackOpportunity = useMemo(
    () => pathname === `/opportunities/${HYD_HACK_OPP_ID}`,
    [pathname]
  );

  useEffect(() => {
    if (loading) return;
    if (!user || role !== 'student') {
      if (!user) {
        sessionStorage.removeItem('studlyf_ai_popup_dismissed');
      }
      prevUserRef.current = user;
      return;
    }

    const dismissed = sessionStorage.getItem('studlyf_ai_popup_dismissed') === '1';
    if (dismissed) {
      prevUserRef.current = user;
      return;
    }

    // Show when a student session becomes authenticated (login) or when they open the shared hackathon link.
    const becameAuthed = !prevUserRef.current && user;
    if (becameAuthed || isHydHackOpportunity) {
      setShowHackPopup(true);
    }

    prevUserRef.current = user;
  }, [loading, user, role, isHydHackOpportunity]);

  const isLoginPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password';
  const isDashboard = pathname.startsWith('/dashboard');
  const isAdmin = pathname.startsWith('/admin');
  const isPlayer = pathname.startsWith('/learn/course-player');
  const isCheckout = pathname === '/learn/checkout';
  const isHome = pathname === '/';
  const isFeaturePreview = pathname.startsWith('/feature-preview');
  const isResume = pathname === '/job-prep/resume-builder';
  const isVisualizer = pathname.startsWith('/learn/visualizer') || 
                       ['/stack', '/queue', '/linked-list', '/bst', '/hash-table'].includes(pathname);
  const isCareerOnboarding = pathname === '/learn/career-onboarding';

  // Global Redirect Logic
  useEffect(() => {
    if (loading) return;
    console.log("[AuthDebug] Role:", role, "Path:", pathname);

    // CRITICAL: Allow evaluation access without authentication - COMPLETELY BYPASS ALL AUTH
    if (pathname.startsWith('/evaluate/')) {
      console.log('[EvaluationAccess] Bypassing all authentication for evaluation page:', pathname);
      return;
    }

    if (user?.email?.toLowerCase() === (import.meta.env.VITE_ADMIN_EMAIL || 'admin@studlyf.com')) {
      if (!pathname.startsWith('/admin')) {
        navigate('/admin', { replace: true });
      }
      return;
    }

    if (user && role) {
      if (role === 'institution') {
        if (!pathname.startsWith('/institution-dashboard') && (pathname.startsWith('/dashboard') || pathname === '/')) {
          navigate('/institution-dashboard', { replace: true });
        }
      } else if (role === 'judge') {
        // Judges ONLY get access to judge portal - multiple safety checks
        // CRITICAL: Allow judges to access institution dashboard for direct evaluation
        const isAllowedPath = pathname.startsWith('/judge-portal') ||
                            pathname.startsWith('/institution-dashboard') ||
                            pathname.startsWith('/evaluate/');

        if (!isAllowedPath || pathname.startsWith('/dashboard')) {
          console.log('[JudgeRedirect] CRITICAL: Judge user on forbidden path:', pathname, '- FORCING redirect to judge portal');
          navigate('/judge-portal', { replace: true });
          return;
        }
        console.log('[JudgeRedirect] Judge user correctly on allowed path:', pathname);
      }

      if (role === 'student') {
        console.log('[StudentCheck] Student user detected, current path:', pathname);
        // Students land on learner dashboard by default
        if (pathname === '/') {
          console.log('[StudentRedirect] Redirecting student from landing page to dashboard');
          navigate('/dashboard/learner', { replace: true });
          return;
        }
        // Also redirect if they try to access institution or judge pages
        if (pathname.startsWith('/institution-dashboard') || pathname.startsWith('/judge-portal')) {
          console.log('[StudentRedirect] Redirecting student from restricted pages to dashboard');
          navigate('/dashboard/learner', { replace: true });
          return;
        }
        // Redirect from base /dashboard to /dashboard/learner
        if (pathname === '/dashboard') {
          console.log('[StudentRedirect] Redirecting student from /dashboard to learner dashboard');
          navigate('/dashboard/learner', { replace: true });
          return;
        }
      }

      // CRITICAL: Allow judge access regardless of role mismatch
      if (user?.email && (localStorage.getItem('wasJudgeInvited') === 'true' ||
                              localStorage.getItem('pendingJudgeRole') === 'true' ||
                              pathname.startsWith('/judge-portal'))) {
        // Don't redirect judges away from judge portal
        console.log('[JudgeAccess] Allowing judge portal access for:', user.email);
        return;
      }

          }
    
      }, [user, role, pathname, loading, navigate]);


  return (
    <div className={`relative min-h-screen flex flex-col selection:bg-[#7C3AED] selection:text-white ${isDashboard || isAdmin ? 'bg-transparent' : 'bg-white'}`}>

      {/* Hackathon Popup Disabled for now as per user request */}
      {/* 
      <HackathonWelcomePopup
        open={showHackPopup}
        onClose={() => {
          sessionStorage.setItem('studlyf_ai_popup_dismissed', '1');
          setShowHackPopup(false);
        }}
        onProblemStatements={() => {
          if (!isHydHackOpportunity) navigate(`/opportunities/${HYD_HACK_OPP_ID}`);
          sessionStorage.setItem('studlyf_ai_popup_dismissed', '1');
          setShowHackPopup(false);
        }}
      />
      */}

      {(() => {
        const showNav = !isLoginPage && !isPlayer && !isCheckout && !isAdmin && !isHome && !isResume && !isVisualizer && !isCareerOnboarding && !pathname.startsWith('/evaluate/') && !pathname.startsWith('/institution-dashboard');
        if (!showNav && pathname.startsWith('/institution-dashboard')) {
          console.log("[AuthDebug] Navigation hidden for Institution Dashboard");
        }
        return showNav && <Navigation />;
      })()}

      <main className="flex-grow">
        <Suspense fallback={
          <div className="h-screen flex items-center justify-center font-mono text-xs tracking-widest uppercase text-[#7C3AED]">
            Synchronizing Protocol...
          </div>
        }>
          <Routes>

            <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />

            <Route path="/learn/courses-overview" element={<ProtectedRoute><CoursesOverview /></ProtectedRoute>} />
            <Route path="/learn/track/:trackId" element={<ProtectedRoute><TrackDetail /></ProtectedRoute>} />
            <Route path="/learn/enroll/:trackId" element={<ProtectedRoute><EnrollmentFlow /></ProtectedRoute>} />
            <Route path="/learn/courses" element={<Navigate to="/learn/courses-overview" replace />} />
            <Route path="/learn/courses/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/learn/course-player/:courseId" element={<ProtectedRoute><CoursePlayer /></ProtectedRoute>} />
            <Route path="/learn/career-fit" element={<ProtectedRoute><CareerFit /></ProtectedRoute>} />
            <Route path="/learn/assessment-intro" element={<ProtectedRoute><AssessmentIntro /></ProtectedRoute>} />
            <Route path="/learn/assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
            <Route path="/learn/company-modules" element={<ProtectedRoute><CompanyModules /></ProtectedRoute>} />
            <Route path="/learn/visualizer/stack" element={<ProtectedRoute><StackPage /></ProtectedRoute>} />
            <Route path="/learn/visualizer/queue" element={<ProtectedRoute><QueuePage /></ProtectedRoute>} />
            <Route path="/learn/visualizer/linked-list" element={<ProtectedRoute><LinkedListPage /></ProtectedRoute>} />
            <Route path="/learn/visualizer/bst" element={<ProtectedRoute><BSTPage /></ProtectedRoute>} />
            <Route path="/learn/visualizer/hash-table" element={<ProtectedRoute><HashTablePage /></ProtectedRoute>} />
            <Route path="/stack" element={<ProtectedRoute><StackPage /></ProtectedRoute>} />
            <Route path="/queue" element={<ProtectedRoute><QueuePage /></ProtectedRoute>} />
            <Route path="/linked-list" element={<ProtectedRoute><LinkedListPage /></ProtectedRoute>} />
            <Route path="/bst" element={<ProtectedRoute><BSTPage /></ProtectedRoute>} />
            <Route path="/hash-table" element={<ProtectedRoute><HashTablePage /></ProtectedRoute>} />
            <Route path="/learn/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/learn/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />

            <Route path="/job-prep/job-simulation" element={<ProtectedRoute><JobSimulation /></ProtectedRoute>} />
            <Route path="/job-prep/portfolio" element={<ProtectedRoute><PortfolioBuilder /></ProtectedRoute>} />
            <Route path="/job-prep/projects" element={<ProtectedRoute><SystemDeconstructionLab /></ProtectedRoute>} />
            <Route path="/job-prep/projects/create" element={<ProtectedRoute><SDLProjectCreate /></ProtectedRoute>} />
            <Route path="/job-prep/projects/:projectId" element={<ProtectedRoute><SDLProjectDetail /></ProtectedRoute>} />
            <Route path="/job-prep/mock-interview" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
            <Route path="/job-prep/group-discussion" element={<ProtectedRoute><GroupDiscussion /></ProtectedRoute>} />
            <Route path="/job-prep/play-learn-earn" element={<ProtectedRoute><PlayLearnEarn /></ProtectedRoute>} />
            <Route path="/job-prep/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />

            <Route path="/goal-selector" element={<ProtectedRoute><GoalSelector /></ProtectedRoute>} />


            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/feature-preview/:id" element={<PublicRoute><FeaturePreview /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><UnifiedAuth /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><UnifiedAuth /></PublicRoute>} />
            <Route path="/judge-invitation" element={<JudgeInvitation />} />
            <Route path="/ai-tools" element={<AITools />} />
            <Route path="/verify/:id" element={<CertificateVerification />} />
            <Route path="/fix-role" element={<RoleFixer />} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                {role === 'institution' ? <Navigate to="/institution-dashboard" replace /> : <Navigate to="/opportunities" replace />}
              </ProtectedRoute>
            } />
            <Route path="/dashboard/learner" element={<ProtectedRoute><LearnerDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/partner" element={<ProtectedRoute><PartnerDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
            <Route path="/institution-dashboard/*" element={<ProtectedRoute><InstitutionDashboard /></ProtectedRoute>} />
            <Route path="/judge-portal/*" element={<ProtectedRoute><JudgePortalLayout /></ProtectedRoute>} />
            <Route path="/evaluate/:token" element={<EvaluationPage />} />
            <Route path="/opportunities" element={<ProtectedRoute><OpportunitiesList /></ProtectedRoute>} />
            <Route path="/opportunities/my-applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
            <Route path="/opportunities/:id" element={<ProtectedRoute><OpportunityDetails /></ProtectedRoute>} />
            <Route path="/events/:eventId" element={<ProtectedRoute><EventHub /></ProtectedRoute>} />
            <Route path="/events/:eventId/quiz/:quizId" element={<ProtectedRoute><EventQuizPage /></ProtectedRoute>} />
            <Route path="/learn/career-onboarding" element={<ProtectedRoute><CareerOnboarding /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardOverview />} />
              <Route path="students" element={<AdminStudentManagement />} />
              <Route path="courses" element={<AdminCourseManagement />} />
              <Route path="assessments" element={<AdminAssessmentManagement />} />
              <Route path="sdl-projects" element={<AdminSDLManagement />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="mentors" element={<AdminMentorManagement />} />
              <Route path="companies" element={<AdminCompanyManagement />} />
              <Route path="payments" element={<AdminPaymentManagement />} />
              <Route path="resumes" element={<AdminResumeManagement />} />
              <Route path="ads" element={<AdsManagement />} />
              <Route path="settings" element={<div className="p-8"><h1>System Settings Coming Soon</h1></div>} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
            </Route>

          </Routes>
        </Suspense>
      </main>

      {isHome && (
        <>
          <Impact />
          <Testimonials />
          <ResourceCenter />
          <EnquiryForm />
          <Footer />
        </>
      )}
    </div>
  );
};

const AppWrapper = () => (
  <HeroUIProvider>
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ScrollToTop />
        <App />
      </AuthProvider>
    </Router>
  </HeroUIProvider>
);

export default AppWrapper;