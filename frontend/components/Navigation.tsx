
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ShoppingCart, User, LogOut, Menu, X, ChevronDown, UserCircle, BookOpen } from 'lucide-react';

const StudlyfLogo = ({ className = "h-8 sm:h-10" }: { className?: string }) => (
  <div className={`flex items-center bg-white px-3 py-1.5 rounded-xl shadow-sm ${className}`}>
    <img
      src="/images/studlyf.png"
      alt="STUDLYF Logo"
      className="h-full w-auto object-contain"
    />
  </div>
);

interface BentoCardProps {
  title: string;
  desc: string;
  children?: React.ReactNode;
  className?: string;
  to?: string;
  onClick?: () => void;
}

const BentoCard = ({ title, desc, children, className = "", to = "#", onClick }: BentoCardProps) => (
  <Link
    to={to}
    onClick={onClick}
    className={`bg-white/80 backdrop-blur-sm rounded-[1.5rem] p-5 relative overflow-hidden group border border-transparent hover:border-[#7C3AED]/20 hover:shadow-xl transition-all ${className}`}
  >
    <div className="relative z-10">
      <h3 className="text-base font-bold text-[#111827] mb-1.5 tracking-tight group-hover:text-[#7C3AED] transition-colors">{title}</h3>
      <p className="text-[11px] text-[#6B7280] leading-relaxed max-w-[180px] mb-3">{desc}</p>
    </div>
    {children}
  </Link>
);

const LearnDropdown = ({ onItemClick }: { onItemClick: () => void }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
    <BentoCard onClick={onItemClick} to="/learn/courses-overview" title="Courses" desc="Role-focused tracks for elite engineering readiness." className="md:col-span-2 md:row-span-2 min-h-[160px] md:min-h-[180px]">
      <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600" className="absolute bottom-0 right-0 w-1/2 h-full object-cover opacity-100 transition-all duration-700" alt="Courses" />
    </BentoCard>
    <BentoCard onClick={onItemClick} to="/learn/company-modules" title="Company Learning Modules" desc="Institutional training for corporate internal teams." className="md:col-span-2 h-[88px]">
      <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400" className="absolute bottom-0 right-0 w-1/3 h-full object-cover opacity-100 transition-all" alt="Corporate" />
    </BentoCard>
    <BentoCard onClick={onItemClick} to="/blog" title="Blogs" desc="Technical insights on system ownership." className="md:col-span-2 h-[88px]">
      <img src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=400" className="absolute bottom-0 right-0 w-1/3 h-full object-cover opacity-100 transition-all" alt="Blog" />
    </BentoCard>
  </div>
);

const JobPrepDropdown = ({ onItemClick }: { onItemClick: () => void }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
    <BentoCard onClick={onItemClick} to="/job-prep/portfolio" title="Build Portfolio" desc="Showcase evidence." className="md:col-span-1 md:row-span-2 min-h-[160px] md:min-h-[180px]">
      <div className="mt-1 bg-[#0F172A] rounded-lg p-3 shadow-xl border border-white/10 group-hover:scale-[1.02] transition-transform h-full">
        <div className="flex items-center gap-1 mb-1.5">
          <div className="w-1 h-1 rounded-full bg-red-400"></div>
          <div className="w-1 h-1 rounded-full bg-yellow-400"></div>
          <div className="w-1 h-1 rounded-full bg-green-400"></div>
        </div>
        <div className="space-y-1.5"><div className="h-2 w-2/3 bg-white/10 rounded"></div><div className="h-8 w-full bg-gradient-to-tr from-[#7C3AED]/30 to-transparent rounded border border-white/5"></div></div>
      </div>
    </BentoCard>
    <BentoCard onClick={onItemClick} to="/job-prep/resume-builder" title="Resume Builder" desc="Create instant resumes." className="md:col-span-1 md:row-span-2 min-h-[160px] md:min-h-[180px]">
      <div className="mt-2 mx-auto w-3/4 h-full bg-white border border-gray-200 rounded-t-lg shadow-sm group-hover:shadow-md transition-all group-hover:scale-[1.02] group-hover:-translate-y-1 relative overflow-hidden p-2">
        <div className="flex gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex-shrink-0"></div>
          <div className="space-y-1 w-full">
            <div className="h-1.5 w-2/3 bg-gray-800 rounded-full"></div>
            <div className="h-1 w-1/2 bg-gray-400 rounded-full"></div>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-0.5 w-full bg-gray-200"></div>
          <div className="flex gap-1">
            <div className="h-1 w-1/3 bg-gray-200 rounded"></div>
            <div className="h-1 w-2/3 bg-gray-100 rounded"></div>
          </div>
          <div className="flex gap-1">
            <div className="h-1 w-1/4 bg-gray-200 rounded"></div>
            <div className="h-1 w-3/4 bg-gray-100 rounded"></div>
          </div>
          <div className="h-0.5 w-full bg-gray-200 mt-1"></div>
          <div className="space-y-1 mt-1">
            <div className="h-1 w-full bg-gray-100 rounded"></div>
            <div className="h-1 w-5/6 bg-gray-100 rounded"></div>
            <div className="h-1 w-4/6 bg-gray-100 rounded"></div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500/10 rounded-tl-xl flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        </div>
      </div>
    </BentoCard>
    <BentoCard onClick={onItemClick} to="/learn/assessment-intro" title="Skill Assessment" desc="Find your strengths with clinical scoring." className="md:col-span-2 h-[88px]">
      <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400" className="absolute bottom-0 right-0 w-1/4 h-full object-cover opacity-80 group-hover:opacity-100 transition-all" alt="Assessment" />
    </BentoCard>
    <BentoCard onClick={onItemClick} to="/job-prep/mock-interview" title="Mock tests & interviews" desc="Practice clinical logic defense." className="h-[88px]" />
    <BentoCard onClick={onItemClick} to="/job-prep/projects" title="Build A Project" desc="Build and scale industry-standard projects with elite engineering teams." className="h-[88px]" />
  </div>
);



const Navigation: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobileOverlay, setActiveMobileOverlay] = useState<string | null>(null);

  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = (menu: string) => {
    if (window.innerWidth < 1024) return;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setActiveMenu(menu);
  };

  const handleMouseLeave = () => {
    if (window.innerWidth < 1024) return;
    timeoutRef.current = window.setTimeout(() => setActiveMenu(null), 200);
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <>
      <nav className="fixed top-0 z-[100] w-full px-2 py-4 sm:px-6 sm:py-6 lg:px-12">
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative z-[110] h-14 sm:h-20 bg-white/90 backdrop-blur-md rounded-[1.25rem] sm:rounded-[2.5rem] px-4 sm:px-8 lg:px-12 flex items-center justify-between shadow-xl shadow-gray-200/40 border border-gray-100"
          >
            <div className="flex items-center lg:w-[250px] gap-4">
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden text-[#111827] p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>

              <Link to={user ? "/dashboard/learner?view=overview" : "/"} className="flex items-center group transition-transform hover:scale-105 active:scale-95">
                <StudlyfLogo />
              </Link>
            </div>

            <div className="flex-grow flex justify-center items-center">
              <div className="hidden lg:flex items-center gap-12 h-full">
                {['learn', 'jobprep'].map((id) => (
                  <button
                    key={id}
                    onMouseEnter={() => handleMouseEnter(id)}
                    className={`flex items-center gap-2 transition-all h-full uppercase tracking-[0.25em] font-bold text-[11px] ${activeMenu === id ? 'text-[#7C3AED]' : 'text-[#4B5563]'} hover:text-[#7C3AED]`}
                  >
                    <span>{id === 'jobprep' ? 'Job Prep' : id.charAt(0).toUpperCase() + id.slice(1)}</span>
                    <motion.svg animate={{ rotate: activeMenu === id ? 180 : 0 }} className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></motion.svg>
                  </button>
                ))}

                <Link
                  to="/ai-tools"
                  className="flex items-center transition-all h-full uppercase tracking-[0.25em] font-bold text-[11px] text-[#4B5563] hover:text-[#7C3AED]"
                >
                  AI TOOLS
                </Link>
                <Link
                  to="/opportunities"
                  className="flex items-center transition-all h-full uppercase tracking-[0.25em] font-bold text-[11px] text-[#4B5563] hover:text-[#7C3AED]"
                >
                  OPPORTUNITIES
                </Link>
                {user && (
                  <Link
                    to="/dashboard/my-courses"
                    className="flex items-center transition-all h-full uppercase tracking-[0.25em] font-bold text-[11px] text-[#4B5563] hover:text-[#7C3AED]"
                  >
                    MY COURSES
                  </Link>
                )}
                {user && role !== 'institution' && (
                  <Link
                    to="/opportunities/my-applications"
                    className="hidden xl:flex items-center transition-all h-full uppercase tracking-[0.25em] font-bold text-[11px] text-[#4B5563] hover:text-[#7C3AED]"
                  >
                    MY APPLICATIONS
                  </Link>
                )}
                
                {user ? (
                  <>
                    <Link
                      to="/learn/cart"
                      className="relative transition-all group py-1 mr-4"
                      title="View Cart"
                    >
                      <ShoppingCart className="w-5 h-5 text-[#4B5563] group-hover:text-[#7C3AED] transition-colors" />
                    </Link>

                    {(role === 'admin' || role === 'super_admin') && (
                      <Link
                        to="/admin"
                        className="hidden sm:flex items-center gap-2 group/admin transition-all"
                      >
                        <span className="text-[11px] font-bold text-[#4B5563] group-hover:text-[#7C3AED] uppercase tracking-[0.25em]">Admin</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      </Link>
                    )}

                    <div className="relative group/profile">
                      <button
                        className="flex items-center justify-center transition-all relative py-1"
                      >
                        <User className="w-5 h-5 text-[#4B5563] group-hover/profile:text-[#7C3AED] group-hover/profile:scale-110 transition-all" />
                      </button>

                      {/* Dropdown Menu */}
                      <div className="absolute right-0 mt-5 w-64 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-300 z-[110] overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                          <p className="text-[10px] font-black text-[#7C3AED] uppercase tracking-[0.2em] mb-1">Authenticated Member</p>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED]">
                              <User size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{user.full_name || 'Studlyf Member'}</p>
                              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-2">
                          <Link
                            to="/dashboard/profile"
                            className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-gray-600 hover:text-[#7C3AED] hover:bg-purple-50 rounded-xl transition-all uppercase tracking-widest"
                          >
                            <UserCircle size={14} />
                            My Profile
                          </Link>
                          <Link
                            to="/dashboard/my-courses"
                            className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-gray-600 hover:text-[#7C3AED] hover:bg-purple-50 rounded-xl transition-all uppercase tracking-widest"
                          >
                            <BookOpen size={14} />
                            My Courses
                          </Link>
                          <Link
                            to="/opportunities/my-applications"
                            className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-gray-600 hover:text-[#7C3AED] hover:bg-purple-50 rounded-xl transition-all uppercase tracking-widest"
                          >
                            <ShoppingCart size={14} />
                            Applications
                          </Link>
                          <button
                            onClick={() => logout()}
                            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all uppercase tracking-widest border-t border-gray-50 mt-1"
                          >
                            <LogOut size={14} />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-10 ml-4">
                    <button
                      onClick={() => navigate('/login')}
                      className="text-[#4B5563] text-[11px] font-bold uppercase tracking-[0.25em] hover:text-[#7C3AED]"
                    >
                      Login
                    </button>
                    <motion.button
                      onClick={() => navigate('/signup')}
                      whileHover={{ scale: 0.96, backgroundColor: '#6D28D9' }}
                      className="bg-[#7C3AED] text-white px-8 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-[0.25em] shadow-xl shadow-[#7C3AED]/20 whitespace-nowrap"
                    >
                      Get Started
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:hidden flex items-center gap-4">
              {user && (
                <Link to="/learn/cart" className="p-2">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </Link>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#4B5563] hover:text-[#7C3AED] transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </motion.div>
        </div>

          <AnimatePresence>
            {activeMobileOverlay && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setActiveMobileOverlay(null)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] lg:hidden"
                />
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="absolute top-[calc(100%+8px)] left-0 right-0 z-[90] lg:hidden px-2 sm:px-0"
                >
                  <div className="bg-white border border-gray-100 rounded-[2rem] shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[80vh] no-scrollbar shadow-gray-200/50">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-black text-[#111827] uppercase tracking-[0.2em]">
                        {activeMobileOverlay === 'learn' ? 'Learn' : 'Job Prep'}
                      </h2>
                      <button
                        onClick={() => setActiveMobileOverlay(null)}
                        className="p-2 text-[#111827]/60 hover:text-[#7C3AED] rounded-full bg-gray-100"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeMobileOverlay === 'learn' ? (
                        <>
                          <BentoCard onClick={() => setActiveMobileOverlay(null)} to="/learn/courses-overview" title="Courses" desc="Role-focused tracks for elite engineering readiness." className="min-h-[140px] bg-gray-50 border-gray-100">
                            <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400" className="absolute bottom-0 right-0 w-1/3 h-full object-cover opacity-40" alt="Courses" />
                          </BentoCard>
                          <BentoCard onClick={() => setActiveMobileOverlay(null)} to="/learn/company-modules" title="Company Learning Modules" desc="Institutional training for corporate internal teams." className="min-h-[140px] bg-gray-50 border-gray-100">
                            <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400" className="absolute bottom-0 right-0 w-1/3 h-full object-cover opacity-40" alt="Corporate" />
                          </BentoCard>
                          <BentoCard onClick={() => setActiveMobileOverlay(null)} to="/blog" title="Blogs" desc="Technical insights on system ownership." className="min-h-[140px] bg-gray-50 border-gray-100">
                            <img src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=400" className="absolute bottom-0 right-0 w-1/3 h-full object-cover opacity-40" alt="Blog" />
                          </BentoCard>
                        </>
                      ) : (
                        <>
                          <BentoCard onClick={() => setActiveMobileOverlay(null)} to="/job-prep/portfolio" title="Build Portfolio" desc="Showcase evidence." className="min-h-[140px] bg-gray-50 border-gray-100" />
                          <BentoCard onClick={() => setActiveMobileOverlay(null)} to="/job-prep/resume-builder" title="Resume Builder" desc="Create instant resumes." className="min-h-[140px] bg-gray-50 border-gray-100" />
                          <BentoCard onClick={() => setActiveMobileOverlay(null)} to="/learn/assessment-intro" title="Skill Assessment" desc="Find your strengths with clinical scoring." className="min-h-[140px] bg-gray-50 border-gray-100">
                            <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400" className="absolute bottom-0 right-0 w-1/4 h-full object-cover opacity-40" alt="Assessment" />
                          </BentoCard>
                          <BentoCard onClick={() => setActiveMobileOverlay(null)} to="/job-prep/mock-interview" title="Mock tests & interviews" desc="Practice clinical logic defense." className="min-h-[140px] bg-gray-50 border-gray-100" />
                          <BentoCard onClick={() => setActiveMobileOverlay(null)} to="/job-prep/projects" title="Build A Project" desc="Build and scale industry-standard projects." className="min-h-[140px] bg-gray-50 border-gray-100" />
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {activeMenu && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/10 backdrop-blur-md z-[80] pointer-events-none" />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  className="hidden lg:block absolute top-[calc(100%+12px)] left-0 right-0 bg-[#F5F3FF] border border-[#7C3AED]/10 py-10 px-10 z-[90] shadow-[0_40px_80px_rgba(124,58,237,0.15)] rounded-[3rem]"
                  onMouseEnter={() => handleMouseEnter(activeMenu)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="w-full">
                    {activeMenu === 'learn' && <LearnDropdown onItemClick={() => setActiveMenu(null)} />}
                    {activeMenu === 'jobprep' && <JobPrepDropdown onItemClick={() => setActiveMenu(null)} />}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {mobileMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[115] lg:hidden"
                />
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="lg:hidden fixed top-0 left-0 bottom-0 w-[280px] sm:w-[320px] bg-white z-[120] shadow-2xl flex flex-col border-r border-gray-100"
                >
                  <div className="p-6 flex items-center justify-between border-b border-gray-100">
                    <StudlyfLogo />
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[#111827]/60 hover:text-[#7C3AED] p-2"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <div className="flex-grow overflow-y-auto p-6 space-y-8">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-[#7C3AED] uppercase tracking-[0.4em]">Curated Tracks</p>
                      <div className="grid gap-3">
                        <button
                          onClick={() => { setActiveMobileOverlay('learn'); setMobileMenuOpen(false); }}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#7C3AED]/30 transition-all hover:bg-[#F5F3FF] group text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#111827] uppercase tracking-wider">Learn</p>
                            <p className="text-[10px] text-gray-500">Courses, Modules, Blogs</p>
                          </div>
                        </button>

                        <button
                          onClick={() => { setActiveMobileOverlay('jobprep'); setMobileMenuOpen(false); }}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#7C3AED]/30 transition-all hover:bg-[#F5F3FF] group text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#111827] uppercase tracking-wider">Job Prep</p>
                            <p className="text-[10px] text-gray-500">Portfolio & Career Tools</p>
                          </div>
                        </button>

                        <Link
                          to="/ai-tools"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#7C3AED]/30 transition-all hover:bg-[#F5F3FF] group text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#111827] uppercase tracking-wider">AI Tools</p>
                            <p className="text-[10px] text-gray-500">Latest AI protocols</p>
                          </div>
                        </Link>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Member Center</p>
                      <div className="space-y-2">
                        {user ? (
                          <>
                            <Link
                              to="/dashboard/learner"
                              onClick={() => setMobileMenuOpen(false)}
                              className="block w-full text-left px-5 py-4 bg-gray-50 rounded-xl text-xs font-bold text-[#111827] uppercase tracking-widest hover:bg-gray-100"
                            >
                              Hub Home
                            </Link>
                            <Link
                              to="/dashboard/profile"
                              onClick={() => setMobileMenuOpen(false)}
                              className="block w-full text-left px-5 py-4 bg-gray-50 rounded-xl text-xs font-bold text-[#111827] uppercase tracking-widest hover:bg-gray-100 mt-2"
                            >
                              My Profile
                            </Link>
                            <Link
                              to="/dashboard/my-courses"
                              onClick={() => setMobileMenuOpen(false)}
                              className="block w-full text-left px-5 py-4 bg-gray-50 rounded-xl text-xs font-bold text-[#111827] uppercase tracking-widest hover:bg-gray-100 mt-2"
                            >
                              My Courses
                            </Link>
                            <Link
                              to="/opportunities/my-applications"
                              onClick={() => setMobileMenuOpen(false)}
                              className="block w-full text-left px-5 py-4 bg-gray-50 rounded-xl text-xs font-bold text-[#111827] uppercase tracking-widest hover:bg-gray-100 mt-2"
                            >
                              Applications
                            </Link>
                            <button
                              onClick={() => { logout(); setMobileMenuOpen(false); }}
                              className="w-full py-4 bg-red-50 text-red-500 border border-red-100 rounded-xl text-xs font-bold uppercase tracking-[0.25em] hover:bg-red-500 hover:text-white transition-colors mt-2 cursor-pointer outline-none"
                            >
                              Sign Out
                            </button>
                          </>
                        ) : (
                          <div className="grid gap-2">
                            <button
                              onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                              className="w-full py-4 bg-[#7C3AED] text-white rounded-xl text-xs font-bold uppercase tracking-[0.25em] shadow-lg shadow-[#7C3AED]/20"
                            >
                              Login
                            </button>
                            <button
                              onClick={() => { navigate('/signup'); setMobileMenuOpen(false); }}
                              className="w-full py-4 bg-gray-50 text-[#111827] border border-gray-100 rounded-xl text-xs font-bold uppercase tracking-[0.25em]"
                            >
                              Get Started
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-gray-100">
                    <p className="text-[9px] text-center text-gray-400 uppercase tracking-[0.3em]">Studlyf Engineering &copy; 2026</p>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </nav>
      </>
    );
  };

export default Navigation;
