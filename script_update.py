import re

file_path = r"d:\studlyf\frontend\pages\LearnerDashboard.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

profile_card_old = """              {/* Profile Card */}
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
              </div>"""

profile_card_new = """              {/* Unstop-style Profile Card */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-shrink-0">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="4" fill="none" />
                      <circle cx="40" cy="40" r="36" stroke="#3b82f6" strokeWidth="4" fill="none" strokeDasharray="226" strokeDashoffset="36" className="text-blue-500 transition-all duration-1000" />
                    </svg>
                    <div className="absolute top-2 left-2 w-16 h-16 bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] rounded-full flex items-center justify-center text-white font-bold text-2xl overflow-hidden border-2 border-white">
                      {githubData?.avatar_url ? <img src={githubData.avatar_url} className="w-full h-full object-cover" alt="Avatar" /> : user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white px-1">
                      <span className="text-[10px] font-bold text-blue-600 bg-white">84%</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2 mb-1">
                      <button 
                        onClick={() => {
                          setEditFormData({ full_name: user?.full_name || '', email: user?.email || '', college_name: user?.college_name || '', graduation_year: user?.graduation_year || '' });
                          setIsEditModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-[#2D2D2D] hover:bg-black text-white px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
                      >
                        <Settings size={12} /> Edit Profile
                      </button>
                      <button className="w-7 h-7 bg-[#2D2D2D] hover:bg-black text-white rounded-full flex items-center justify-center transition-colors">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">{user?.full_name || 'Kota Naga Siva Kumari'}</h2>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-2xl overflow-hidden mb-4">
                  <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Trophy size={20} className="text-gray-500" />
                      <span className="text-sm font-semibold text-[#111827]">Your Global Rank</span>
                    </div>
                    <span className="text-sm font-semibold text-[#111827]">108,358</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white">
                    <div className="flex items-center gap-3">
                      <Award size={20} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-semibold text-[#111827]">Your Points</span>
                    </div>
                    <span className="text-sm font-semibold text-[#111827]">8,142</span>
                  </div>
                </div>

                <button onClick={logout} className="flex items-center gap-2 text-[#E04B38] hover:text-red-700 font-semibold text-sm px-2 py-2 transition-colors">
                  <LogOut size={16} /> Logout
                </button>
              </div>"""

if profile_card_old in content:
    content = content.replace(profile_card_old, profile_card_new)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Replaced Profile Card successfully")
else:
    print("Could not find the target profile card content")
