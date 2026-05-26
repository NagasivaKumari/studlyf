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
import CourseDetail from './pages/CourseDetail';
import CareerFit from './pages/CareerFit';
import Assessment from './pages/Assessment';
import AssessmentIntro from './pages/AssessmentIntro';
import JobSimulation from './pages/JobSimulation';
import PortfolioBuilder from './pages/PortfolioBuilder';
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
import CareerOnboarding from './pages/CareerOnboarding';
import CoursesOverview from './pages/CoursesOverview';
import PublicProfile from './pages/PublicProfile';
import TrackDetail from './pages/TrackDetail';
import EnrollmentFlow from './pages/EnrollmentFlow';
import StackPage from './pages/StackPage';
import QueuePage from './pages/QueuePage';
import LinkedListPage from './pages/LinkedListPage';
import BSTPage from './pages/BSTPage';
import HashTablePage from './pages/HashTablePage';
import AITools from './pages/AITools';
import StudOTT from './pages/StudOTT';
import StudHub from './pages/StudHub';
import StudentDiscounts from './pages/StudentDiscounts';
import StudentSchemes from './pages/StudentSchemes';
import FeaturePreview from './pages/FeaturePreview';
import InstitutionDashboard from './pages/institution-dashboard/InstitutionDashboard';
import RoleFixer from './RoleFixer';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import RoadmapClone from './pages/RoadmapClone';

import OpportunitiesList from './pages/opportunities/OpportunitiesList';
import OpportunityDetails from './pages/opportunities/OpportunityDetails';
import MyApplications from './pages/opportunities/MyApplications';

import EventHub from './pages/events/EventHub';
import EventPackagePage from './pages/events/EventPackagePage';
import EventQuizPage from './pages/events/EventQuizPage';
import ParticipantCardPage from './pages/events/ParticipantCardPage';
import ParticipantPortal from './pages/events/ParticipantPortal';

import JudgePortalLayout from './pages/judge/JudgePortalLayout';
import EvaluationPage from './pages/EvaluationPage';


// Unique Components
import EnquiryForm from './components/EnquiryForm';
import ResourceCenter from './components/ResourceCenter';
import Testimonials from './components/Testimonials';
import Impact from './components/Impact';
import Achievements from './components/Achievements';
import RightHoverPanel from './components/RightHoverPanel';
import SplashScreen from './components/SplashScreen';

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

const CertificateVerification = lazy(
  () => import('./pages/CertificateVerification')
);

const App: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { user, role, loading } = useAuth();



  const isLoginPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/verify-email';

  const isDashboard = pathname.startsWith('/dashboard');
  const isAdmin = pathname.startsWith('/admin');
  const isPlayer = pathname.startsWith('/learn/course-player');
  const isCheckout = pathname === '/learn/checkout';
  const isHome = pathname === '/';
  const isResume = pathname === '/job-prep/resume-builder';

  const isVisualizer =
    pathname.startsWith('/learn/visualizer') ||
    ['/stack', '/queue', '/linked-list', '/bst', '/hash-table'].includes(
      pathname
    );

  const isCareerOnboarding =
    pathname === '/learn/career-onboarding';

  const isCompanyModules =
    pathname === '/learn/company-modules';

  // Global Redirect Logic
  useEffect(() => {
    if (loading) return;

    console.log('[AuthDebug] Role:', role, 'Path:', pathname);

    // Allow evaluation pages
    if (pathname.startsWith('/evaluate/')) {
      console.log(
        '[EvaluationAccess] Public evaluation route:',
        pathname
      );
      return;
    }

    // Admin Redirect
    if (
      user?.email?.toLowerCase() ===
      (import.meta.env.VITE_ADMIN_EMAIL || 'admin@studlyf.com')
    ) {
      if (!pathname.startsWith('/admin')) {
        navigate('/admin', { replace: true });
      }
      return;
    }

    if (user && role) {
      // Institution Redirect
      if (role === 'institution') {
        if (
          !pathname.startsWith('/institution-dashboard') &&
          (pathname.startsWith('/dashboard') || pathname === '/')
        ) {
          navigate('/institution-dashboard', { replace: true });
        }
      }

      // Judge Redirect
      else if (role === 'judge') {
        const isAllowedPath =
          pathname.startsWith('/judge-portal') ||
          pathname.startsWith('/institution-dashboard') ||
          pathname.startsWith('/evaluate/');

        if (!isAllowedPath || pathname.startsWith('/dashboard')) {
          navigate('/judge-portal', { replace: true });
          return;
        }
      }

      // Student Redirects
      if (role === 'student') {
        if (pathname === '/') {
          navigate('/dashboard/learner', {
            replace: true,
          });
          return;
        }

        if (
          pathname.startsWith('/institution-dashboard') ||
          pathname.startsWith('/judge-portal')
        ) {
          navigate('/dashboard/learner', {
            replace: true,
          });
          return;
        }

        if (pathname === '/dashboard') {
          navigate('/dashboard/learner', {
            replace: true,
          });
          return;
        }
      }

      // Judge Access
      if (
        user?.email &&
        (
          localStorage.getItem('wasJudgeInvited') === 'true' ||
          localStorage.getItem('pendingJudgeRole') === 'true' ||
          pathname.startsWith('/judge-portal')
        )
      ) {
        return;
      }
    }
  }, [user, role, pathname, loading, navigate]);

  return (
    <div
      className={`relative min-h-screen flex flex-col selection:bg-[#7C3AED] selection:text-white ${
        isDashboard || isAdmin || isCompanyModules
          ? 'bg-transparent'
          : 'bg-white'
      }`}
    >

      {(() => {
        const isOpportunityDetail =
          pathname.startsWith('/opportunities/') &&
          pathname !== '/opportunities' &&
          pathname !== '/opportunities/my-applications';

        const showNav =
          !isLoginPage &&
          !isPlayer &&
          !isCheckout &&
          !isAdmin &&
          !isHome &&
          !isResume &&
          !isVisualizer &&
          !isCareerOnboarding &&
          !isOpportunityDetail &&
          !pathname.startsWith('/evaluate/') &&
          !pathname.startsWith('/institution-dashboard') &&
          !pathname.startsWith('/judge-portal');

        return showNav && <Navigation />;
      })()}

      <main className="flex-grow">
        <Suspense
          fallback={
            <div className="h-screen flex items-center justify-center font-mono text-xs tracking-widest uppercase text-[#7C3AED]">
              Synchronizing Protocol...
            </div>
          }
        >
          <Routes>
            <Route
              path="/"
              element={
                <PublicRoute>
                  <Home />
                </PublicRoute>
              }
            />

            {/* Learning */}
            <Route
              path="/learn/courses-overview"
              element={
                <ProtectedRoute>
                  <CoursesOverview />
                </ProtectedRoute>
              }
            />

            <Route
              path="/learn/track/:trackId"
              element={
                <ProtectedRoute>
                  <TrackDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/learn/enroll/:trackId"
              element={
                <ProtectedRoute>
                  <EnrollmentFlow />
                </ProtectedRoute>
              }
            />

            <Route
              path="/learn/courses"
              element={
                <Navigate
                  to="/learn/courses-overview"
                  replace
                />
              }
            />

            <Route
              path="/learn/courses/:courseId"
              element={
                <ProtectedRoute>
                  <CourseDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/learn/course-player/:courseId"
              element={
                <ProtectedRoute>
                  <CoursePlayer />
                </ProtectedRoute>
              }
            />

            <Route
              path="/learn/career-fit"
              element={
                <ProtectedRoute>
                  <CareerFit />
                </ProtectedRoute>
              }
            />

            <Route
              path="/learn/assessment-intro"
              element={
                <ProtectedRoute>
                  <AssessmentIntro />
                </ProtectedRoute>
              }
            />

            <Route
              path="/learn/assessment"
              element={
                <ProtectedRoute>
                  <Assessment />
                </ProtectedRoute>
              }
            />

            <Route
              path="/learn/company-modules"
              element={
                <ProtectedRoute>
                  <CompanyModules />
                </ProtectedRoute>
              }
            />

            {/* Visualizers */}
            <Route path="/stack" element={<ProtectedRoute><StackPage /></ProtectedRoute>} />
            <Route path="/queue" element={<ProtectedRoute><QueuePage /></ProtectedRoute>} />
            <Route path="/linked-list" element={<ProtectedRoute><LinkedListPage /></ProtectedRoute>} />
            <Route path="/bst" element={<ProtectedRoute><BSTPage /></ProtectedRoute>} />
            <Route path="/hash-table" element={<ProtectedRoute><HashTablePage /></ProtectedRoute>} />

            {/* Resume + Job Prep */}
            <Route path="/job-prep/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
            <Route path="/job-prep/job-simulation" element={<ProtectedRoute><JobSimulation /></ProtectedRoute>} />
            <Route path="/job-prep/portfolio" element={<ProtectedRoute><PortfolioBuilder /></ProtectedRoute>} />
            <Route path="/job-prep/projects" element={<ProtectedRoute><SystemDeconstructionLab /></ProtectedRoute>} />
            <Route path="/job-prep/projects/create" element={<ProtectedRoute><SDLProjectCreate /></ProtectedRoute>} />
            <Route path="/job-prep/projects/:projectId" element={<ProtectedRoute><SDLProjectDetail /></ProtectedRoute>} />
            <Route path="/job-prep/mock-interview" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
            <Route path="/job-prep/group-discussion" element={<ProtectedRoute><GroupDiscussion /></ProtectedRoute>} />
            <Route path="/job-prep/play-learn-earn" element={<ProtectedRoute><PlayLearnEarn /></ProtectedRoute>} />

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  {role === 'institution' ? (
                    <Navigate
                      to="/institution-dashboard"
                      replace
                    />
                  ) : (
                    <Navigate
                      to="/dashboard/learner"
                      replace
                    />
                  )}
                </ProtectedRoute>
              }
            />


            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/feature-preview/:id" element={<PublicRoute><FeaturePreview /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><UnifiedAuth /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><UnifiedAuth /></PublicRoute>} />
            <Route path="/judge-invitation" element={<JudgeInvitation />} />
            <Route path="/ai-tools" element={<AITools />} />
            <Route path="/studott" element={<StudOTT />} />
            <Route path="/studhub" element={<StudHub />} />
            <Route path="/student-discounts" element={<StudentDiscounts />} />
            <Route path="/student-schemes" element={<StudentSchemes />} />
            <Route path="/verify/:id" element={<CertificateVerification />} />
            <Route path="/fix-role" element={<RoleFixer />} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
            <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                {role === 'institution' ? <Navigate to="/institution-dashboard" replace /> : <Navigate to="/dashboard/learner" replace />}
              </ProtectedRoute>
            } />
            <Route path="/dashboard/learner" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><LearnerDashboard /></ProtectedRoute>} />
            <Route path="/profile/:userId" element={<PublicProfile />} />
            <Route path="/dashboard/partner" element={<ProtectedRoute><PartnerDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />

            {/* Opportunities */}
            <Route path="/opportunities" element={<ProtectedRoute><OpportunitiesList /></ProtectedRoute>} />
            <Route path="/opportunities/my-applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
            <Route path="/opportunities/:id" element={<ProtectedRoute><OpportunityDetails /></ProtectedRoute>} />

            {/* Events */}
            <Route path="/events/:eventId" element={<ProtectedRoute><EventHub /></ProtectedRoute>} />
            <Route path="/events/:eventId/package" element={<ProtectedRoute><EventPackagePage /></ProtectedRoute>} />
            <Route path="/events/:eventId/package/card" element={<ProtectedRoute><ParticipantCardPage /></ProtectedRoute>} />
            <Route path="/events/:eventId/portal" element={<ProtectedRoute><ParticipantPortal /></ProtectedRoute>} />
            <Route path="/events/:eventId/card" element={<ProtectedRoute><ParticipantCardPage /></ProtectedRoute>} />
            <Route path="/events/:eventId/quiz/:quizId" element={<ProtectedRoute><EventQuizPage /></ProtectedRoute>} />

            {/* Institution */}
            <Route path="/institution-dashboard/*" element={<ProtectedRoute><InstitutionDashboard /></ProtectedRoute>} />

            {/* Judge */}
            <Route path="/judge-portal/*" element={<ProtectedRoute><JudgePortalLayout /></ProtectedRoute>} />

            {/* Evaluation */}
            <Route path="/evaluate/:token" element={<EvaluationPage />} />

            {/* Auth */}
            <Route path="/login" element={<PublicRoute><UnifiedAuth /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><UnifiedAuth /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
            <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />

            {/* Misc */}
            <Route path="/roadmaps" element={<RoadmapClone />} />
            <Route path="/roadmaps/:roleId" element={<RoadmapClone />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/judge-invitation" element={<JudgeInvitation />} />
            <Route path="/goal-selector" element={<ProtectedRoute><GoalSelector /></ProtectedRoute>} />
            <Route path="/ai-tools" element={<AITools />} />
            <Route path="/fix-role" element={<RoleFixer />} />
            <Route path="/learn/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/learn/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/learn/career-onboarding" element={<ProtectedRoute><CareerOnboarding /></ProtectedRoute>} />

            {/* Lazy */}
            <Route path="/verify/:id" element={<CertificateVerification />} />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route
                index
                element={
                  <Navigate
                    to="/admin/dashboard"
                    replace
                  />
                }
              />

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
              <Route path="audit-logs" element={<AdminAuditLogs />} />

              <Route
                path="settings"
                element={
                  <div className="p-8">
                    <h1>System Settings Coming Soon</h1>
                  </div>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </main>

      {isHome && <RightHoverPanel />}

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

const AppWrapper: React.FC = () => {
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('studlyf_splash_shown') !== '1';
    } catch (e) {
      return true;
    }
  });

  const handleSplashFinish = () => {
    try { sessionStorage.setItem('studlyf_splash_shown', '1'); } catch (e) {}
    setShowSplash(false);
  };
  const appRef = React.useRef<HTMLDivElement | null>(null);
  const [appMounted, setAppMounted] = useState(false);

  useEffect(() => {
    if (!showSplash) {
      // mount the app and trigger fade-in
      setAppMounted(true);
      requestAnimationFrame(() => {
        if (appRef.current) appRef.current.style.opacity = '1';
      });
    }
  }, [showSplash]);

  return (
    <HeroUIProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ScrollToTop />
          {showSplash ? (
            <SplashScreen duration={7500} onFinish={handleSplashFinish} />
          ) : (
            appMounted && (
              <div ref={appRef} style={{ opacity: 0, transition: 'opacity 600ms ease' }}>
                <App />
              </div>
            )
          )}
        </AuthProvider>
      </Router>
    </HeroUIProvider>
  );
};

export default AppWrapper;