
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';


const PartnerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'talent' | 'analytics' | 'settings'>('dashboard');


  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '💼' },
    { id: 'talent', label: 'Talent Pool', icon: '👥' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const renderView = () => {
    switch (activeView) {
      case 'talent':
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-[#111827]">Talent Pool</h2>
            <div className="grid gap-6">
              {[
                { name: "Sarah Q.", role: "Senior Backend", score: 98.2, status: "Verified" },
                { name: "James L.", role: "Full Stack", score: 96.5, status: "Verified" },
                { name: "Alex P.", role: "Junior Architect", score: 75.4, status: "Active" }
              ].map((talent, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-3xl p-8 flex items-center justify-between shadow-sm hover:border-[#7C3AED]/30 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-[#7C3AED]">{talent.name[0]}</div>
                    <div>
                      <h3 className="text-xl font-bold uppercase tracking-tight group-hover:text-[#7C3AED] transition-colors">{talent.name}</h3>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{talent.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    <div className="text-center">
                      <span className="block font-black text-xl tracking-tighter">{talent.score}</span>
                      <span className="text-[7px] text-gray-400 uppercase tracking-widest font-bold">Standard Score</span>
                    </div>
                    <button className="px-6 py-3 bg-[#F5F3FF] text-[#7C3AED] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#7C3AED] hover:text-white transition-all">View Dossier</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-[#111827]">Hiring Analytics</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { label: "Candidates Screened", val: "1,248" },
                { label: "Verified Matches", val: "42" },
                { label: "Interviews Saved", val: "186 hrs" }
              ].map((stat, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-[2rem] p-10 shadow-sm text-center">
                  <span className="block text-4xl font-black tracking-tighter text-[#7C3AED] mb-2">{stat.val}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">{stat.label}</span>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-100 rounded-[3rem] h-80 flex items-center justify-center animate-pulse">
              <span className="text-[10px] text-gray-300 uppercase tracking-widest font-bold">Chart Protocol Loading...</span>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-[#111827]">Partner Settings</h2>
            <div className="bg-white border border-gray-100 rounded-[3rem] p-12 max-w-2xl shadow-sm">
              <div className="space-y-8">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] block mb-2">Institution Name</label>
                  <input type="text" defaultValue="Nirvaha" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] block mb-2">Contact Protocol</label>
                  <input type="email" defaultValue={user?.email || 'partner.auth@nirvaha.org'} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20" />
                </div>

                <button className="w-full py-5 bg-[#7C3AED] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-[#7C3AED]/20">Save Protocol Settings</button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <>
            {/* Company Profile Header Card */}
            <section className="bg-white border border-gray-100 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 mb-8 sm:mb-12 relative overflow-hidden shadow-sm group">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-10 relative z-10">
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-center sm:text-left">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#111827] border border-gray-200 rounded-2xl sm:rounded-[2rem] flex items-center justify-center overflow-hidden shadow-xl shrink-0">
                    <span className="text-2xl sm:text-3xl font-black text-[#7C3AED]">N</span>
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
                      <h1 className="text-3xl sm:text-4xl font-black text-[#111827] uppercase tracking-tighter">Nirvaha</h1>
                      <span className="text-[7px] sm:text-[8px] font-bold text-[#7C3AED] bg-[#F5F3FF] border border-[#7C3AED]/10 px-3 py-1 rounded-full uppercase tracking-widest">Verify Partner •</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-[#475569] font-mono text-[10px] sm:text-xs">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        {user?.email || 'partner.auth@nirvaha.org'}
                      </div>

                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                        nirvaha.org
                      </div>
                    </div>
                  </div>
                </div>

                <button className="w-full sm:w-auto bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-8 py-4 sm:px-10 sm:py-5 rounded-xl sm:rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-[#7C3AED]/20 transition-all flex items-center justify-center gap-3 active:scale-95 group/btn">
                  <span className="text-lg">+</span>
                  Post Job
                </button>
              </div>
            </section>

            {/* Job Postings Section */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl sm:text-2xl font-black text-[#111827] uppercase tracking-tighter">Job Postings</h2>
                <div className="h-px flex-grow mx-4 sm:mx-8 bg-gray-200" />
              </div>

              {/* Empty State Container */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full min-h-[350px] sm:min-h-[500px] bg-white border border-gray-100 rounded-[2rem] sm:rounded-[3rem] flex flex-col items-center justify-center p-8 sm:p-12 text-center relative overflow-hidden group shadow-sm"
              >
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 sm:w-32 sm:h-32 mb-8 text-gray-100 group-hover:text-[#7C3AED]/20 transition-colors duration-700">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"></path>
                    </svg>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-[#111827] uppercase tracking-tight mb-4">No jobs posted yet</h3>
                  <p className="text-gray-400 text-[10px] sm:text-sm max-w-sm uppercase tracking-widest leading-relaxed mb-8 sm:mb-12">
                    Start by posting your first job opening to discover top-tier verified talent from the STUDLYF Institution.
                  </p>

                  <button className="px-8 py-4 sm:px-12 sm:py-6 bg-white border border-gray-200 text-[#111827] hover:border-[#7C3AED] hover:text-[#7C3AED] rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-sm">
                    Post Your First Job
                  </button>
                </div>
              </motion.div>
            </section>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex font-sans text-[#111827] selection:bg-[#7C3AED] selection:text-white pt-20 sm:pt-28 lg:pt-32">
      {/* Sidebar - Desktop Only */}
      <aside className="w-72 bg-[#FFFFFF] border-r border-gray-100 flex flex-col p-8 shrink-0 hidden lg:flex">
        <Link to="/" className="flex items-center gap-3 mb-16 px-2 group">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
            <img
              src="/images/studlyf.png"
              alt="STUDLYF Logo"
              className="h-8 w-auto object-contain group-hover:scale-110 transition-transform"
            />
          </div>
        </Link>

        <nav className="space-y-3 flex-grow">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as any)}
              className={`w-full text-left px-5 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-4 group ${activeView === item.id ? 'bg-[#7C3AED] text-white shadow-xl shadow-[#7C3AED]/20' : 'text-gray-400 hover:text-[#7C3AED] hover:bg-[#F5F3FF]'
                }`}
            >
              <span className="text-base transition-all">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <button
            onClick={() => signOut(auth)}
            className="w-full py-4 bg-red-50 border border-red-100 text-red-500 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto bg-gray-50/30">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-[120] bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100">
              <img
                src="/images/studlyf.png"
                alt="STUDLYF Logo"
                className="h-6 w-auto object-contain"
              />
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-[130] bg-black/20 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              <motion.div
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                className="w-4/5 max-w-sm h-full bg-white p-8 flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-12">
                  <span className="font-syne font-black text-xs uppercase tracking-widest text-[#7C3AED]">STUDLYF MENU</span>
                  <button onClick={() => setMobileMenuOpen(false)}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <nav className="space-y-4">
                  {sidebarItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveView(item.id as any); setMobileMenuOpen(false); }}
                      className={`w-full text-left px-4 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest ${activeView === item.id ? 'text-[#7C3AED] bg-[#F5F3FF]' : 'text-gray-500'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
                <button
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                  className="mt-auto w-full py-4 bg-red-50 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                >
                  Sign Out
                </button>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 sm:p-6 lg:p-12">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default PartnerDashboard;
