import re

file_path = r"d:\studlyf\frontend\pages\LearnerDashboard.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add state variable
state_var = "  const [activeView, setActiveView] = useState<'profile' | 'knowledge' | 'leaderboard' | 'certificates' | 'resume'>('profile');"
if "const [activeEditTab" not in content:
    content = content.replace(state_var, state_var + "\n  const [activeEditTab, setActiveEditTab] = useState('basic');")

# 2. Replace the old profile block
profile_start_str = "{/* Unstop-style Profile Card Section */}"
profile_end_str = "</section>"

start_idx = content.find(profile_start_str)
end_idx = content.find(profile_end_str, start_idx) + len(profile_end_str)

if start_idx != -1 and end_idx != -1:
    old_profile_block = content[start_idx:end_idx]
    new_profile_block = """{/* Unstop-style Main Profile View */}
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="h-48 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 relative">
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                  <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors">
                    <span className="text-sm">✏️</span>
                  </button>
                </div>
                
                <div className="px-8 pb-8 relative flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
                  <div className="relative -mt-16 flex-shrink-0">
                    <div className="relative w-36 h-36 bg-white rounded-full p-2">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="60" stroke="#f3f4f6" strokeWidth="4" fill="none" />
                        <circle cx="64" cy="64" r="60" stroke="#3b82f6" strokeWidth="4" fill="none" strokeDasharray="377" strokeDashoffset="60" className="text-blue-500 transition-all duration-1000" strokeLinecap="round" />
                      </svg>
                      <div className="absolute top-3 left-3 w-[104px] h-[104px] bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] rounded-full flex items-center justify-center text-white font-bold text-4xl overflow-hidden">
                        {githubData?.avatar_url ? <img src={githubData.avatar_url} className="w-full h-full object-cover" alt="Avatar" /> : user?.full_name?.charAt(0) || 'U'}
                      </div>
                    </div>
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded-md border border-gray-100 text-xs font-bold text-blue-600 shadow-sm">84%</span>
                  </div>

                  <div className="flex-1 mt-2 md:mt-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">{user?.full_name || 'Kota Naga Siva Kumari'}</h1>
                      <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold">✓ Verified</div>
                    </div>
                    <div className="space-y-1.5 text-sm text-gray-600 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏛️</span> {user?.college_name || 'Organization / College Name'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📄</span> <button onClick={() => setActiveView('resume')} className="text-blue-600 hover:underline">Resume</button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 mt-4 md:mt-0">
                    <div className="flex items-center gap-2">
                      <button className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">🔗</button>
                      <button className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">👁️</button>
                    </div>
                    <button 
                      onClick={() => {
                        setEditFormData({ 
                          full_name: user?.full_name || '', 
                          email: user?.email || '',
                          college_name: user?.college_name || '',
                          graduation_year: user?.graduation_year || ''
                        });
                        setIsEditModalOpen(true);
                      }}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold shadow-md shadow-blue-500/20 transition-all"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Profile Strength */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-gray-700">Profile strength: <span className="text-gray-900 font-bold">Intermediate</span></h3>
                      <span className="text-xs text-gray-500 font-medium">1/3 Steps completed ⓘ</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0 text-xl">📚</div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 mb-1">Add Education</h4>
                        <p className="text-xs text-gray-600 leading-relaxed mb-4">Spill the deets on your education and give recruiters a detailed understanding of your background!</p>
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-white text-gray-500 hover:bg-gray-50">‹</button>
                            <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-white text-gray-500 hover:bg-gray-50">›</button>
                          </div>
                          <button onClick={() => { setIsEditModalOpen(true); setActiveEditTab('education'); }} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">Add Education</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <button onClick={() => setActiveView('resume')} className="w-full bg-blue-600 rounded-2xl p-4 flex items-center gap-4 text-white shadow-md hover:bg-blue-700 transition-colors group">
                    <div className="w-12 h-16 bg-white/20 rounded-md overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform"><img src="/images/Eshwar.jpg" alt="Resume" className="w-full h-full object-cover opacity-80 mix-blend-overlay" /></div>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <span className="text-lg">📄</span> Create your Resume
                    </div>
                  </button>

                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900">Rankings</h3>
                      <button className="text-xs text-blue-600 font-semibold hover:underline">How it works?</button>
                    </div>
                    <div className="p-6 relative overflow-hidden bg-gradient-to-br from-blue-50 to-white">
                      <div className="absolute right-0 top-0 opacity-10">🌍</div>
                      <p className="text-xs text-gray-500 font-semibold mb-1">Global Rank</p>
                      <p className="text-[10px] text-gray-400 mb-4">Based on activity</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        <span className="text-2xl font-black text-gray-900">108,358</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>"""
    content = content.replace(old_profile_block, new_profile_block)

# 3. Update Edit Profile Modal to wire up tabs
tabs_start_str = "tab.id === 'basic' ? 'bg-blue-50 border-r-4 border-blue-600 text-blue-700'"
if tabs_start_str in content:
    content = content.replace(tabs_start_str, "activeEditTab === tab.id ? 'bg-blue-50 border-r-4 border-blue-600 text-blue-700'")

tab_onClick_str = "button key={tab.id} className="
if tab_onClick_str in content:
    content = content.replace(tab_onClick_str, "button key={tab.id} onClick={() => setActiveEditTab(tab.id)} className=")

# Wrap Basic details in conditional
basic_details_start = '<h2 className="text-xl font-bold text-gray-900 mb-6">Basic Details</h2>'
basic_details_end = '</div>\n                    </div>\n\n                    {/* Modal Footer */}'

bd_start_idx = content.find(basic_details_start)
bd_end_idx = content.find(basic_details_end, bd_start_idx)

if bd_start_idx != -1 and bd_end_idx != -1:
    old_bd_block = content[bd_start_idx:bd_end_idx]
    new_bd_block = """{activeEditTab === 'basic' && (
                          <>
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">First Name <span className="text-red-500">*</span></label>
                                <input type="text" value={editFormData.full_name.split(' ')[0] || ''} readOnly className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">Last Name</label>
                                <input type="text" value={editFormData.full_name.split(' ')[1] || ''} readOnly className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">Username <span className="text-red-500">*</span></label>
                                <input type="text" value={user?.email?.split('@')[0] || ''} readOnly className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 outline-none cursor-not-allowed" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">Email <span className="text-red-500">*</span></label>
                                <div className="relative">
                                  <input type="email" value={editFormData.email} readOnly className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 outline-none cursor-not-allowed pr-24" />
                                  <div className="absolute inset-y-0 right-3 flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-green-600 uppercase">Verified</span>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">Mobile <span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                  <select className="w-20 px-2 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none"><option>+91</option></select>
                                  <div className="relative flex-1">
                                    <input type="tel" placeholder="9876543210" className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none pr-24" />
                                    <button className="absolute inset-y-1.5 right-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md text-[10px] font-bold transition-colors">Verify</button>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">Gender <span className="text-red-500">*</span></label>
                                <select className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                                  <option>Male</option><option>Female</option><option>Other</option>
                                </select>
                              </div>
                            </div>

                            <div className="h-px bg-gray-100 w-full mb-8" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">User Type <span className="text-red-500">*</span></label>
                                <select className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none">
                                  <option>College Student</option><option>Professional</option>
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">Course <span className="text-red-500">*</span></label>
                                <select className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none">
                                  <option>B.Tech/BE</option><option>BCA</option><option>MCA</option>
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">Course Specialization <span className="text-red-500">*</span></label>
                                <input type="text" defaultValue="Computer Science and Engineering" className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700">Organisation/College <span className="text-red-500">*</span></label>
                                <input type="text" value={editFormData.college_name} onChange={(e) => setEditFormData({...editFormData, college_name: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                              </div>
                              <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-gray-700">Career Goal</label>
                                <input type="text" placeholder="e.g. Machine Learning Engineer" className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                              </div>
                            </div>
                          </>
                        )}
                        {activeEditTab === 'education' && (
                          <div className="h-full flex flex-col items-center justify-center text-center py-20">
                             <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-3xl mb-4">🎓</div>
                             <h3 className="text-xl font-bold text-gray-900 mb-2">Education History</h3>
                             <p className="text-sm text-gray-500 mb-6 max-w-sm">Add your educational background to show recruiters your academic journey and expertise.</p>
                             <button className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors">Add Education</button>
                          </div>
                        )}
                        {activeEditTab === 'skills' && (
                          <div className="h-full flex flex-col items-center justify-center text-center py-20">
                             <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-3xl mb-4">⚡</div>
                             <h3 className="text-xl font-bold text-gray-900 mb-2">Technical Skills</h3>
                             <p className="text-sm text-gray-500 mb-6 max-w-sm">Highlight the technologies, languages, and tools you have mastered.</p>
                             <button className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors">Add Skill</button>
                          </div>
                        )}
                        {activeEditTab !== 'basic' && activeEditTab !== 'education' && activeEditTab !== 'skills' && (
                          <div className="h-full flex flex-col items-center justify-center text-center py-20">
                             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 text-3xl mb-4">🚧</div>
                             <h3 className="text-xl font-bold text-gray-900 mb-2">Under Construction</h3>
                             <p className="text-sm text-gray-500 max-w-sm">This section is being built to match the Unstop layout.</p>
                          </div>
                        )}
                        """
    content = content.replace(old_bd_block, new_bd_block)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Dashboard rewrite successful")
