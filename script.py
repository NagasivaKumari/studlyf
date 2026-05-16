import re
import os

file_path = r"d:\studlyf\frontend\pages\LearnerDashboard.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace sidebarItems
old_sidebar = """  const sidebarItems = [
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'knowledge', label: 'Tech Stack', icon: '🕸️' },
    { id: 'leaderboard', label: 'Rankings', icon: '🏆' },
    { id: 'certificates', label: 'Certificates', icon: '📜' },
    { id: 'resume', label: 'My Resume', icon: '📄' }
  ];"""

new_sidebar = """  const sidebarItems = [
    { id: 'profile', label: 'My Profile', icon: <User size={18} /> },
    { id: 'knowledge', label: 'Tech Stack', icon: <Code2 size={18} /> },
    { id: 'leaderboard', label: 'Rankings', icon: <Trophy size={18} /> },
    { id: 'certificates', label: 'Certificates', icon: <Award size={18} /> },
    { id: 'resume', label: 'My Resume', icon: <FileText size={18} /> }
  ];"""

content = content.replace(old_sidebar, new_sidebar)

# 2. Replace case 'profile': ... up to {/* Edit Profile Modal */}
profile_start_idx = content.find("case 'profile':")
edit_modal_idx = content.find("{/* Edit Profile Modal */}")

if profile_start_idx != -1 and edit_modal_idx != -1:
    old_profile_section = content[profile_start_idx:edit_modal_idx]
    
    new_profile_section = """case 'profile':
        return (
          <>
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                  <p className="text-sm text-gray-500">Track your progress and readiness metrics.</p>
                </div>
                <Link to="/job-prep/resume-builder" className="px-5 py-2.5 bg-[#7C3AED] text-white rounded-xl text-sm font-semibold hover:bg-[#6D28D9] transition-all flex items-center gap-2 shadow-sm">
                  <FileText size={16} /> Update Resume
                </Link>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Profile Card */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-24 h-24 bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                      {githubData?.avatar_url ? <img src={githubData.avatar_url} className="w-full h-full rounded-full object-cover" alt="Avatar" /> : user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                      <CheckCircle2 size={14} className="text-white" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{user?.full_name || 'Student'}</h2>
                  <p className="text-sm text-gray-500 mb-4">{user?.college_name || 'Studlyf Academy'} • {user?.graduation_year ? `Class of ${user.graduation_year}` : 'Student'}</p>
                  <button 
                    onClick={() => {
                      setEditFormData({ full_name: user?.full_name || '', email: user?.email || '', college_name: user?.college_name || '', graduation_year: user?.graduation_year || '' });
                      setIsEditModalOpen(true);
                    }}
                    className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>

                {/* Readiness Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Readiness Score</h3>
                    <div className="flex gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
                      {['overall', 'dev', 'ai'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${activeTab === tab ? 'bg-white text-[#7C3AED] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{tab}</button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-8 justify-around flex-grow">
                    <div className="flex flex-col items-center">
                      <CircularProgress value={dashboardStats?.readiness_score || (githubData ? Math.round(githubData.readiness_score) : 25)} size={120} strokeWidth={8} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 w-full sm:w-auto flex-grow">
                      {[
                        { label: 'Backend', val: dashboardStats?.skills?.Backend || githubData?.skills?.Backend || 40, icon: <Database size={16} className="text-blue-500" /> },
                        { label: 'Frontend', val: dashboardStats?.skills?.Frontend || githubData?.skills?.Frontend || 35, icon: <Layout size={16} className="text-pink-500" /> },
                        { label: 'GenAI', val: dashboardStats?.skills?.GenAI || githubData?.skills?.GenAI || 20, icon: <Cpu size={16} className="text-purple-500" /> },
                        { label: 'DevOps', val: dashboardStats?.skills?.DevOps || githubData?.skills?.DevOps || 15, icon: <Activity size={16} className="text-orange-500" /> }
                      ].map(s => (
                        <div key={s.label} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">{s.icon}</div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500">{s.label}</p>
                              <p className="text-sm font-bold text-gray-900">{s.val}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><Trophy size={18} className="text-[#7C3AED]" /> Achievements</h3>
                  </div>
                  {badges.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {badges.slice(0, 4).map((badge, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-2xl">{badge.icon || '🏅'}</div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">{badge.name}</p>
                            <p className="text-[10px] text-[#7C3AED] font-semibold">{badge.level || 'Elite'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
                      <p className="text-sm text-gray-500">No achievements unlocked yet. Keep learning!</p>
                    </div>
                  )}
                </div>
                
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><Activity size={18} className="text-[#7C3AED]" /> Next Actions</h3>
                  </div>
                  <div className="space-y-3">
                    <Link to="/opportunities" className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"><Code2 size={18} className="text-[#7C3AED]" /></div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Explore Internships</p>
                          <p className="text-xs text-gray-600">Apply your skills</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-purple-400 group-hover:text-purple-600" />
                    </Link>
                    <button onClick={() => setActiveView('knowledge')} className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"><Database size={18} className="text-gray-500" /></div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-gray-900">Analyze Tech Stack</p>
                          <p className="text-xs text-gray-500">Sync with GitHub</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            """
    content = content.replace(old_profile_section, new_profile_section)


# 3. Replace the layout wrappers
old_layout_start = content.find("  return (\n    <div className=\"min-h-screen bg-[#FFFFFF] flex")
old_layout_end = content.find("    </div>\n  );\n};")

if old_layout_start != -1 and old_layout_end != -1:
    old_layout = content[old_layout_start:old_layout_end]
    
    new_layout = """  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-[#111827] pt-16">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col py-6 px-4 shrink-0 hidden lg:flex fixed h-[calc(100vh-64px)] overflow-y-auto">
        <nav className="space-y-1.5 flex-grow mt-4">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as any)}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-3 ${activeView === item.id ? 'bg-purple-50 text-[#7C3AED]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <div className="h-px bg-gray-100 my-4"></div>
          <Link
            to="/"
            className="w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            <Home size={20} />
            Hub Home
          </Link>
          {(role === 'admin' || role === 'super_admin') && (
            <Link
              to="/admin"
              className="w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-3 text-red-600 hover:bg-red-50"
            >
              <Settings size={20} />
              Admin Portal
            </Link>
          )}

          <button
            key="logout"
            onClick={() => logout()}
            className="w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-3 text-gray-600 hover:text-red-600 hover:bg-red-50 mt-auto"
          >
            <LogOut size={20} />
            Logout
          </button>
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex lg:hidden items-center justify-around p-2 z-[100] pb-safe">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as any)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeView === item.id ? 'text-[#7C3AED]' : 'text-gray-500'}`}
          >
            {item.icon}
            <span className="text-[10px] font-semibold">{item.label.split(' ')[1] || item.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-grow overflow-y-auto bg-[#F8FAFC] lg:ml-64 p-6 sm:p-8 lg:p-10 pb-24 lg:pb-10 min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>"""
    
    content = content.replace(old_layout, new_layout)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Dashboard rewrite successful")
