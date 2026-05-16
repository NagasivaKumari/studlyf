import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  User, FileText, Book, Award, Briefcase, 
  Terminal, Share2, Settings, ShieldCheck, 
  ChevronLeft, Plus, Save, Sparkles, Scan,
  Globe, MapPin, Calendar, Heart, GraduationCap
} from 'lucide-react';

const MyProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('basic');
  const [isSaving, setIsSaving] = useState(false);

  // State for all form fields
  const [formData, setFormData] = useState({
    profilePhoto: null as string | null,
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    gender: '',
    dob: '',
    userType: '',
    domain: '',
    location: '',
    preferredWork: '',
    bio: '',
    careerGoal: 'Aspiring AI Research Engineer at a top tech firm',
    interests: ['Open Source', 'Machine Learning', 'UX Design', 'System Architecture'],
    isCurrentStudent: true,
    isCurrentEmployee: false,
    education: {
      institution: '',
      degree: '',
      specialization: '',
      startYear: '2022',
      endYear: '2026',
      cgpa: '',
    },
    experience: {
      company: '',
      role: '',
      type: 'Full-time',
      responsibilities: '',
    },
    skill: {
      name: '',
      proficiency: 'Intermediate',
      years: '',
    },
    project: {
      title: '',
      description: '',
      link: '',
      isFeatured: false,
    },
    achievement: {
      title: '',
      organization: '',
      month: 'Aug',
      year: '2024',
      category: 'Hackathon',
      description: '',
      link: '',
      isFeatured: false,
      proof: null as string | null,
    },
    certification: {
      name: '',
      issuer: '',
      date: '',
      link: '',
    },
    resume: {
      fileName: 'No resume uploaded',
      uploadDate: '',
      atsScore: 0,
      version: '1.0',
    },
    jobDescription: '',
    linkedin: '',
    github: '',
    twitter: '',
    portfolio: '',
    leetcode: '',
    hackerrank: '',
    searchStatus: 'active',
    profileVisible: true,
    newsletter: false,
  });

  const navigate = useNavigate();

  // Dynamic Profile Strength Calculation
  const calculateStrength = () => {
    let score = 0;
    const totalPossible = 10; // Major milestones

    if (formData.photo) score += 1;
    if (formData.firstName && formData.lastName) score += 1;
    if (formData.bio && formData.bio.length > 10) score += 1;
    if (formData.interests.length > 0) score += 1;
    if (formData.education.institution) score += 1;
    if (formData.certification.name) score += 1;
    if (formData.experience.company) score += 1;
    if (formData.project.title) score += 1;
    if (formData.linkedin || formData.github) score += 1;
    if (formData.resume.atsScore > 0) score += 1;

    return Math.round((score / totalPossible) * 100);
  };

  const profileCompletion = calculateStrength();

  const [isExtracting, setIsExtracting] = useState(false);

  const extractSkills = () => {
    setIsExtracting(true);
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        interests: [...new Set([...prev.interests, 'TensorFlow', 'Docker', 'AWS'])]
      }));
      setIsExtracting(false);
      alert('AI Extraction Complete: 3 new skills identified and added to your profile!');
    }, 2000);
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        resume: {
          ...prev.resume,
          fileName: file.name,
          uploadDate: new Date().toLocaleDateString(),
          atsScore: Math.floor(Math.random() * (98 - 85 + 1)) + 85, // Simulate scan
        }
      }));
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const resumeInputRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const toggleStatus = (field: 'isCurrentStudent' | 'isCurrentEmployee') => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async (section: string) => {
    setIsSaving(true);
    console.log(`Saving ${section}:`, formData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsSaving(false);
    alert(`${section} saved successfully!`);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Details', icon: User, required: true },
    { id: 'resume', label: 'Resume', icon: FileText, required: false },
    { id: 'about', label: 'About', icon: User, required: true },
    { id: 'skills', label: 'Skills', icon: Terminal, required: true },
    { id: 'education', label: 'Education', icon: GraduationCap, required: true },
    { id: 'experience', label: 'Work Experience', icon: Briefcase, required: false },
    { id: 'projects', label: 'Projects', icon: Settings, required: false },
    { id: 'certifications', label: 'ShieldCheck', icon: ShieldCheck, required: false },
    { id: 'achievements', label: 'Accomplishments', icon: Award, required: false },
    { id: 'social', label: 'Social Links', icon: Share2, required: false },
    { id: 'preferences', label: 'Preferences', icon: Settings, required: false },
    { id: 'scanner', label: 'Resume Scanner', icon: Scan, required: false },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <motion.div
            key="basic"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Basic Details</h2>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Profile Photo */}
               <div className="md:col-span-2 flex items-center gap-8 bg-gray-50/50 p-8 rounded-3xl border border-gray-100 border-dashed">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 bg-white rounded-[2rem] shadow-xl flex items-center justify-center relative group cursor-pointer overflow-hidden border-2 border-white ring-4 ring-[#7C3AED]/10"
                  >
                    {formData.profilePhoto ? (
                      <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-gray-200" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest text-center px-4">
                      Update Photo
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                  />
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900 uppercase text-xs tracking-widest">Profile Photo</h4>
                    <p className="text-[10px] font-medium text-gray-400 max-w-[200px]">PNG or JPG up to 5MB. Face should be clearly visible.</p>
                  </div>
               </div>

               <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">First Name *</label>
                  <input 
                    type="text" 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all" 
                    placeholder="Enter first name" 
                  />
               </div>

               <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">Last Name *</label>
                  <input 
                    type="text" 
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all" 
                    placeholder="Enter last name" 
                  />
               </div>

               <div className="md:col-span-2 space-y-2 group">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">Username *</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                    <input 
                      type="text" 
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full pl-10 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all" 
                      placeholder="handle_name" 
                    />
                  </div>
               </div>

               <div className="md:col-span-2 space-y-2 group relative">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">Email Address *</label>
                  <input type="email" value={user?.email || ''} disabled className="w-full px-6 py-4 bg-gray-100 border border-transparent rounded-2xl text-sm font-bold text-gray-400 cursor-not-allowed" />
               </div>

               <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">Mobile *</label>
                  <div className="flex gap-2">
                    <div className="w-24 px-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold flex items-center gap-2">
                      <img src="https://flagcdn.com/w20/in.png" className="w-4 h-3" alt="IN" />
                      +91
                    </div>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="flex-grow px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all" 
                      placeholder="Enter number" 
                    />
                  </div>
               </div>

               <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">Gender</label>
                  <select 
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all appearance-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
               </div>

               <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">Date of Birth</label>
                  <input 
                    type="date" 
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all" 
                  />
               </div>

               <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">User Type</label>
                  <select 
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all appearance-none"
                  >
                    <option value="">Select Type</option>
                    <option value="student">Student</option>
                    <option value="fresher">Fresher</option>
                    <option value="professional">Professional</option>
                  </select>
               </div>
            </div>

            <div className="pt-12 flex justify-end">
               <button 
                onClick={() => handleSave('Basic Details')}
                disabled={isSaving}
                className="px-12 py-4 bg-[#7C3AED] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[#6D28D9] transition-all shadow-xl shadow-[#7C3AED]/20 flex items-center gap-3 disabled:opacity-50"
               >
                 {isSaving ? <Plus className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 {isSaving ? 'Saving...' : 'Save Changes'}
               </button>
            </div>
          </motion.div>
        );
      case 'about':
        return (
          <motion.div
            key="about"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-[#7C3AED]">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">About Me</h2>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-3 group">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-focus-within:text-[#7C3AED] transition-colors">Professional Summary</label>
                  <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{formData.bio.length} / 500</span>
                </div>
                <textarea 
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full px-8 py-6 bg-gray-50 border border-transparent rounded-[2rem] text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all min-h-[200px] leading-relaxed"
                  placeholder="Describe your professional journey, key achievements, and what makes you unique..."
                />
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">Career Goal</label>
                <input 
                  type="text" 
                  name="careerGoal"
                  value={formData.careerGoal}
                  onChange={handleChange}
                  className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all" 
                  placeholder="e.g. Aspiring AI Research Engineer at a top tech firm" 
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Interests & Hobbies</label>
                <div className="flex flex-wrap gap-2 p-6 bg-gray-50/50 border border-gray-100 border-dashed rounded-[2rem]">
                  {formData.interests.map(tag => (
                    <span key={tag} className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-bold text-gray-600 flex items-center gap-2 hover:border-[#7C3AED]/30 transition-all cursor-default">
                      {tag}
                      <button 
                        onClick={() => removeInterest(tag)}
                        className="text-gray-300 hover:text-red-400"
                      >×</button>
                    </span>
                  ))}
                  <button className="px-4 py-2 bg-[#F5F3FF] text-[#7C3AED] border border-dashed border-[#7C3AED]/30 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#7C3AED] hover:text-white transition-all">
                    <Plus className="w-3 h-3" />
                    Add Tag
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-end">
               <button 
                onClick={() => handleSave('About')}
                disabled={isSaving}
                className="px-12 py-4 bg-[#7C3AED] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[#6D28D9] transition-all shadow-xl shadow-[#7C3AED]/20 flex items-center gap-3 disabled:opacity-50"
               >
                 {isSaving ? <Plus className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 {isSaving ? 'Saving...' : 'Save About'}
               </button>
            </div>
          </motion.div>
        );

      case 'education':
        return (
          <motion.div
            key="education"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Academic History</h2>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7C3AED] transition-all shadow-lg shadow-black/10">
                <Plus className="w-4 h-4" />
                Add Education
              </button>
            </div>

            <div className="space-y-8">
               {/* Education Card */}
               <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden group hover:border-[#7C3AED]/30 transition-all shadow-sm">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-24 h-24" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div className="md:col-span-2 space-y-2 group">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">Institution Name</label>
                      <input 
                        type="text" 
                        name="education.institution"
                        value={formData.education.institution}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all" 
                        placeholder="Enter college or university name" 
                      />
                    </div>

                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">Degree</label>
                      <input 
                        type="text" 
                        name="education.degree"
                        value={formData.education.degree}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all" 
                        placeholder="e.g. Bachelor of Technology" 
                      />
                    </div>

                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">Specialization</label>
                      <input 
                        type="text" 
                        name="education.specialization"
                        value={formData.education.specialization}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all" 
                        placeholder="e.g. Computer Science" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Start Year</label>
                        <select 
                          name="education.startYear"
                          value={formData.education.startYear}
                          onChange={handleChange}
                          className="w-full px-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold focus:outline-none focus:bg-white transition-all appearance-none outline-none"
                        >
                          <option>2022</option>
                          <option>2021</option>
                          <option>2020</option>
                        </select>
                      </div>
                      <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">End Year</label>
                        <select 
                          name="education.endYear"
                          value={formData.education.endYear}
                          onChange={handleChange}
                          className="w-full px-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold focus:outline-none focus:bg-white transition-all appearance-none outline-none"
                        >
                          <option>2026</option>
                          <option>2025</option>
                          <option>2024</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 group">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">CGPA / Percentage</label>
                      <input 
                        type="text" 
                        name="education.cgpa"
                        value={formData.education.cgpa}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all" 
                        placeholder="e.g. 9.4 or 88%" 
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-4">
                         <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#7C3AED] shadow-sm">
                            <Calendar className="w-4 h-4" />
                         </div>
                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">I am currently studying here</span>
                      </div>
                      <div 
                        onClick={() => toggleStatus('isCurrentStudent')}
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${formData.isCurrentStudent ? 'bg-[#7C3AED]' : 'bg-gray-200'}`}
                      >
                         <motion.div 
                          animate={{ x: formData.isCurrentStudent ? 24 : 4 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                         />
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>
        );
      case 'skills':
        return (
          <motion.div
            key="skills"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
                  <Terminal className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Skills & Expertise</h2>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7C3AED] transition-all">
                <Plus className="w-4 h-4" />
                Add Skill
              </button>
            </div>

            <div className="space-y-10">
              {/* Trending Suggestions */}
              <div className="bg-[#F5F3FF]/50 border border-[#7C3AED]/10 p-8 rounded-[2.5rem]">
                 <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                    <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest">Trending for ML Engineers</span>
                 </div>
                 <div className="flex flex-wrap gap-3">
                    {['TensorFlow', 'PyTorch', 'Scikit-Learn', 'Deep Learning', 'SQL'].map(skill => (
                      <button key={skill} className="px-5 py-2 bg-white border border-white rounded-xl text-[10px] font-bold text-gray-600 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all shadow-sm">
                        + {skill}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-6">
                 {/* Skill Row */}
                 <div className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-[#7C3AED]/30 transition-all shadow-sm">
                    <div className="flex-grow space-y-2 w-full">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Skill Name</label>
                       <input 
                        type="text" 
                        name="skill.name"
                        value={formData.skill.name}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white outline-none transition-all" 
                        placeholder="Enter skill..." 
                       />
                    </div>
                    
                    <div className="w-full md:w-64 space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Proficiency</label>
                       <select 
                        name="skill.proficiency"
                        value={formData.skill.proficiency}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 appearance-none focus:bg-white outline-none transition-all"
                       >
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                       </select>
                    </div>

                    <div className="w-full md:w-48 space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Experience</label>
                       <div className="flex items-center gap-3">
                          <input 
                            type="number" 
                            name="skill.years"
                            value={formData.skill.years}
                            onChange={handleChange}
                            className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:bg-white outline-none transition-all" 
                            placeholder="0" 
                          />
                          <span className="text-[10px] font-black text-gray-400 uppercase">Yrs</span>
                       </div>
                    </div>

                    <button className="p-4 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-2xl transition-all self-end md:self-center">
                       <Plus className="w-5 h-5 rotate-45" />
                    </button>
                 </div>
              </div>
            </div>
          </motion.div>
        );

      case 'resume':
        return (
          <motion.div
            key="resume"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                  <FileText className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Resume Management</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* Upload Card */}
               <input 
                type="file" 
                ref={resumeInputRef} 
                onChange={handleResumeUpload} 
                className="hidden" 
                accept=".pdf,.docx" 
               />
               <div 
                onClick={() => resumeInputRef.current?.click()}
                className="md:col-span-2 bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[3rem] p-12 flex flex-col items-center justify-center text-center group hover:border-[#7C3AED]/30 transition-all cursor-pointer"
               >
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8 text-[#7C3AED]" />
                  </div>
                  <h3 className="text-lg font-black uppercase text-gray-900 mb-2">Upload New Resume</h3>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">PDF, DOCX (Max 10MB)</p>
               </div>

               {/* AI Score Card */}
               <div className="bg-gradient-to-br from-gray-900 to-black rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-10">
                     <Scan className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 block">AI Optimizer</span>
                    <h3 className="text-3xl font-black mb-2">{formData.resume.atsScore}<span className="text-sm opacity-60">/100</span></h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ATS Score</p>
                  </div>
                  <button className="w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10">
                    {formData.resume.atsScore > 0 ? 'Detailed Report' : 'Awaiting Scan'}
                  </button>
               </div>
            </div>

            {/* Resume Version List */}
            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Current Versions</h4>
               <div className="bg-white border border-gray-100 rounded-3xl p-6 flex items-center justify-between group hover:border-blue-500/30 transition-all shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-16 bg-red-50 rounded-xl flex flex-col items-center justify-center border border-red-100 group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6 text-red-500" />
                      <span className="text-[8px] font-black text-red-400 mt-1 uppercase">PDF</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900 text-sm mb-1">{formData.resume.fileName}</h5>
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">v{formData.resume.version}</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                           <Calendar className="w-3 h-3" /> {formData.resume.uploadDate || 'Not uploaded yet'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={extractSkills}
                      disabled={isExtracting || formData.resume.atsScore === 0}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                       {isExtracting ? <Plus className="w-3 h-3 animate-spin" /> : <Scan className="w-3 h-3" />}
                       {isExtracting ? 'Extracting...' : 'Extract Skills'}
                    </button>
                    <button 
                      onClick={() => handleSave('Resume Version')}
                      className="p-3 text-gray-400 hover:text-gray-900 transition-colors"
                    >
                       <Save className="w-5 h-5" />
                    </button>
                  </div>
               </div>
            </div>
          </motion.div>
        );

      case 'experience':
        return (
          <motion.div
            key="experience"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Professional Experience</h2>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7C3AED] transition-all shadow-lg shadow-black/10">
                <Plus className="w-4 h-4" />
                Add Experience
              </button>
            </div>

            <div className="space-y-8">
               {/* Experience Card */}
               <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 relative group hover:border-[#7C3AED]/30 transition-all shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="md:col-span-2 flex items-center gap-6 mb-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden text-gray-400">
                           <Globe className="w-8 h-8 opacity-20" />
                        </div>
                        <div className="space-y-2 flex-grow">
                           <input 
                            type="text" 
                            name="experience.company"
                            value={formData.experience.company}
                            onChange={handleChange}
                            className="w-full text-lg font-black uppercase tracking-tight text-gray-900 bg-transparent border-none outline-none focus:ring-0 placeholder:text-gray-200" 
                            placeholder="COMPANY NAME" 
                           />
                           <div className="flex gap-2">
                             <input 
                              type="text" 
                              name="experience.type"
                              value={formData.experience.type}
                              onChange={handleChange}
                              className="w-24 text-[10px] font-black text-[#7C3AED] uppercase tracking-widest bg-transparent border-none outline-none focus:ring-0 placeholder:text-gray-200" 
                              placeholder="FULL-TIME" 
                             />
                             <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">•</span>
                             <input 
                              type="text" 
                              name="experience.location"
                              value={(formData.experience as any).location || ''}
                              onChange={handleChange}
                              className="flex-grow text-[10px] font-black text-[#7C3AED] uppercase tracking-widest bg-transparent border-none outline-none focus:ring-0 placeholder:text-gray-200" 
                              placeholder="REMOTE" 
                             />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Job Role</label>
                        <input 
                          type="text" 
                          name="experience.role"
                          value={formData.experience.role}
                          onChange={handleChange}
                          className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white outline-none transition-all" 
                          placeholder="e.g. Senior Frontend Engineer" 
                        />
                     </div>

                     <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Employment Type</label>
                        <select 
                          name="experience.type"
                          value={formData.experience.type}
                          onChange={handleChange}
                          className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold appearance-none text-gray-900 focus:bg-white outline-none transition-all"
                        >
                           <option>Internship</option>
                           <option>Full-time</option>
                           <option>Freelance</option>
                           <option>Contract</option>
                        </select>
                     </div>

                     <div className="md:col-span-2 space-y-2 group">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Responsibilities & Impact</label>
                        <textarea 
                          name="experience.responsibilities"
                          value={formData.experience.responsibilities}
                          onChange={handleChange}
                          className="w-full px-8 py-6 bg-gray-50 border border-transparent rounded-[2rem] text-sm font-bold min-h-[150px] leading-relaxed text-gray-900 focus:bg-white outline-none transition-all" 
                          placeholder="Mention your key deliverables, technologies used, and business impact..." 
                        />
                     </div>

                     <div className="md:col-span-2 flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-4">
                           <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#7C3AED] shadow-sm">
                              <Calendar className="w-4 h-4" />
                           </div>
                           <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Currently Working Here</span>
                        </div>
                        <div 
                          onClick={() => toggleStatus('isCurrentEmployee')}
                          className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${formData.isCurrentEmployee ? 'bg-[#7C3AED]' : 'bg-gray-200'}`}
                        >
                           <motion.div 
                             animate={{ x: formData.isCurrentEmployee ? 24 : 4 }}
                             className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                           />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="pt-8 flex justify-end">
               <button 
                onClick={() => handleSave('Work Experience')}
                disabled={isSaving}
                className="px-12 py-4 bg-[#7C3AED] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[#6D28D9] transition-all shadow-xl shadow-[#7C3AED]/20 flex items-center gap-3 disabled:opacity-50"
               >
                 {isSaving ? <Plus className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 {isSaving ? 'Saving...' : 'Save Experience'}
               </button>
            </div>
          </motion.div>
        );

      case 'projects':
        return (
          <motion.div
            key="projects"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                  <Settings className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Personal Projects</h2>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7C3AED] transition-all">
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>

            <div className="space-y-10">
               {/* Project Card */}
               <div className="bg-white border border-gray-100 rounded-[3rem] p-10 relative overflow-hidden group hover:border-[#7C3AED]/30 transition-all shadow-sm">
                  <div className="flex flex-col lg:flex-row gap-12">
                     <div className="flex-1 space-y-8 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="md:col-span-2 space-y-2 group">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">Project Title</label>
                              <input 
                                type="text" 
                                name="project.title"
                                value={formData.project.title}
                                onChange={handleChange}
                                className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white outline-none transition-all" 
                                placeholder="e.g. AI-Powered Portfolio Hub" 
                              />
                           </div>

                           <div className="md:col-span-2 space-y-2 group">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">Project Description</label>
                              <textarea 
                                name="project.description"
                                value={formData.project.description}
                                onChange={handleChange}
                                className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold min-h-[120px] text-gray-900 focus:bg-white outline-none transition-all" 
                                placeholder="Detailed breakdown of your project, architecture, and impact..." 
                              />
                           </div>

                           <div className="space-y-2 group">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Tech Stack</label>
                              <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-2xl border border-transparent">
                                 {formData.project.title ? (
                                   ['React', 'Node.js', 'MongoDB'].map(t => (
                                     <span key={t} className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[9px] font-bold text-gray-600">{t}</span>
                                   ))
                                 ) : (
                                   <span className="text-[9px] font-bold text-gray-300 italic px-2">No tags added yet</span>
                                 )}
                                 <button className="text-[#7C3AED] font-black text-[9px] uppercase tracking-widest ml-1">+ Add</button>
                              </div>
                           </div>

                           <div className="space-y-2 group">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">GitHub Link</label>
                              <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"><Share2 className="w-4 h-4" /></span>
                                <input 
                                  type="url" 
                                  name="project.link"
                                  value={formData.project.link}
                                  onChange={handleChange}
                                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white outline-none transition-all" 
                                  placeholder="https://github.com/..." 
                                />
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center justify-between p-6 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                           <div className="flex items-center gap-4">
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-500 shadow-sm">
                                 <Award className="w-4 h-4" />
                              </div>
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Featured Project</span>
                           </div>
                           <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer shadow-lg shadow-emerald-500/20">
                              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                           </div>
                        </div>
                     </div>

                     {/* Screenshot Placeholder Area */}
                     <div className="w-full lg:w-72 space-y-4 relative z-10">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 block">Screenshots</label>
                        <div className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-center group/img cursor-pointer hover:border-[#7C3AED]/30 transition-all">
                           <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3 group-hover/img:scale-110 transition-transform">
                              <Plus className="w-6 h-6 text-gray-400" />
                           </div>
                           <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Add Preview</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="aspect-square bg-gray-50 rounded-2xl border border-gray-100" />
                           <div className="aspect-square bg-gray-50 rounded-2xl border border-gray-100" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="pt-8 flex justify-end">
               <button 
                onClick={() => handleSave('Projects')}
                disabled={isSaving}
                className="px-12 py-4 bg-[#7C3AED] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[#6D28D9] transition-all shadow-xl shadow-[#7C3AED]/20 flex items-center gap-3 disabled:opacity-50"
               >
                 {isSaving ? <Plus className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 {isSaving ? 'Saving...' : 'Save Projects'}
               </button>
            </div>
          </motion.div>
        );

      case 'certifications':
        return (
          <motion.div
            key="certifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Licenses & Certifications</h2>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7C3AED] transition-all">
                <Plus className="w-4 h-4" />
                Add Certificate
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Certificate Card */}
               <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 group hover:border-[#7C3AED]/30 transition-all shadow-sm">
                  <div className="flex items-center gap-6 mb-8">
                     <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 text-gray-200">
                        <Award className="w-8 h-8" />
                     </div>
                     <div className="space-y-2 flex-grow">
                        <input 
                          type="text" 
                          name="certification.name"
                          value={formData.certification.name}
                          onChange={handleChange}
                          className="w-full font-black text-gray-900 uppercase text-xs tracking-widest bg-transparent border-none outline-none focus:ring-0 placeholder:text-gray-200" 
                          placeholder="CERTIFICATE NAME" 
                        />
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            name="certification.issuer"
                            value={formData.certification.issuer}
                            onChange={handleChange}
                            className="w-32 text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest bg-transparent border-none outline-none focus:ring-0 placeholder:text-gray-200" 
                            placeholder="GOOGLE CLOUD" 
                          />
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">•</span>
                          <input 
                            type="text" 
                            name="certification.date"
                            value={formData.certification.date}
                            onChange={handleChange}
                            className="flex-grow text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest bg-transparent border-none outline-none focus:ring-0 placeholder:text-gray-200" 
                            placeholder="2023" 
                          />
                        </div>
                     </div>
                  </div>
                  
                  <div className="space-y-6">
                     <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Credential URL</label>
                        <input 
                          type="url" 
                          name="certification.link"
                          value={formData.certification.link}
                          onChange={handleChange}
                          className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white transition-all outline-none" 
                          placeholder="https://..." 
                        />
                     </div>
                     <button className="w-full py-4 bg-[#F5F3FF] text-[#7C3AED] rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#7C3AED] hover:text-white transition-all">
                        <Plus className="w-4 h-4" /> Upload Certificate Proof
                     </button>
                  </div>
               </div>
            </div>

            <div className="pt-8 flex justify-end">
               <button 
                onClick={() => handleSave('Certifications')}
                disabled={isSaving}
                className="px-12 py-4 bg-[#7C3AED] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[#6D28D9] transition-all shadow-xl shadow-[#7C3AED]/20 flex items-center gap-3 disabled:opacity-50"
               >
                 {isSaving ? <Plus className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 {isSaving ? 'Saving...' : 'Save Certificates'}
               </button>
            </div>
          </motion.div>
        );

      case 'achievements':
        return (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                  <Award className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Accomplishments</h2>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7C3AED] transition-all">
                <Plus className="w-4 h-4" />
                Add Achievement
              </button>
            </div>

            <div className="space-y-8">
               <div className="bg-white border border-gray-100 rounded-[3rem] p-10 relative group hover:border-[#7C3AED]/30 transition-all shadow-sm">
                  {/* Top Header with Highlight Toggle */}
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${formData.achievement.isFeatured ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'}`}>
                           <Award className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Accomplishment</span>
                           <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-900">Featured on Profile?</span>
                              <button 
                                onClick={() => setFormData(prev => ({ ...prev, achievement: { ...prev.achievement, isFeatured: !prev.achievement.isFeatured }}))}
                                className={`p-1 rounded-lg transition-colors ${formData.achievement.isFeatured ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-gray-400'}`}
                              >
                                <Sparkles className="w-4 h-4 fill-current" />
                              </button>
                           </div>
                        </div>
                     </div>
                     <button className="p-3 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-2xl transition-all">
                        <Plus className="w-6 h-6 rotate-45" />
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Title & Organization */}
                     <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Achievement Title</label>
                           <input 
                            type="text" 
                            name="achievement.title"
                            value={formData.achievement.title}
                            onChange={handleChange}
                            className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white outline-none transition-all" 
                            placeholder="Hackathon Winner, AWS Certified, Research Publication" 
                           />
                        </div>
                        <div className="space-y-2 group">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Organization / Event</label>
                           <input 
                            type="text" 
                            name="achievement.organization"
                            value={formData.achievement.organization}
                            onChange={handleChange}
                            className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white outline-none transition-all" 
                            placeholder="Smart India Hackathon, Google, IIT Hyderabad" 
                           />
                        </div>
                     </div>

                     {/* Date & Category */}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Month + Year</label>
                           <div className="flex gap-2">
                              <select 
                                name="achievement.month"
                                value={formData.achievement.month}
                                onChange={handleChange}
                                className="w-full px-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold appearance-none outline-none focus:bg-white"
                              >
                                 {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <option key={m}>{m}</option>)}
                              </select>
                              <select 
                                name="achievement.year"
                                value={formData.achievement.year}
                                onChange={handleChange}
                                className="w-full px-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold appearance-none outline-none focus:bg-white"
                              >
                                 {['2024', '2023', '2022', '2021', '2020'].map(y => <option key={y}>{y}</option>)}
                              </select>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Category</label>
                           <select 
                            name="achievement.category"
                            value={formData.achievement.category}
                            onChange={handleChange}
                            className="w-full px-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold appearance-none outline-none focus:bg-white"
                           >
                              {['Hackathon', 'Certification', 'Competition', 'Scholarship', 'Leadership', 'Research', 'Open Source', 'Sports', 'Volunteer'].map(c => <option key={c}>{c}</option>)}
                           </select>
                        </div>
                     </div>

                     {/* Link & Proof */}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Achievement Link</label>
                           <div className="relative">
                              <Share2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="url" 
                                name="achievement.link"
                                value={formData.achievement.link}
                                onChange={handleChange}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white transition-all" 
                                placeholder="Devfolio, GitHub, etc." 
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Proof Upload</label>
                           <button className="w-full py-4 bg-[#F5F3FF] text-[#7C3AED] border border-dashed border-[#7C3AED]/30 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#7C3AED] hover:text-white transition-all">
                              <FileText className="w-3 h-3" />
                              Upload Proof
                           </button>
                        </div>
                     </div>

                     {/* Description */}
                     <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Impact Description</label>
                        <textarea 
                          name="achievement.description"
                          value={formData.achievement.description}
                          onChange={handleChange}
                          className="w-full px-8 py-6 bg-gray-50 border border-transparent rounded-[2rem] text-sm font-bold min-h-[120px] leading-relaxed text-gray-900 focus:bg-white outline-none transition-all" 
                          placeholder="Explain what you achieved, your contribution, and the outcome." 
                        />
                     </div>
                  </div>
               </div>
            </div>

            <div className="pt-8 flex justify-end">
               <button 
                onClick={() => handleSave('Achievements')}
                disabled={isSaving}
                className="px-12 py-4 bg-[#7C3AED] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[#6D28D9] transition-all shadow-xl shadow-[#7C3AED]/20 flex items-center gap-3 disabled:opacity-50"
               >
                 {isSaving ? <Plus className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 {isSaving ? 'Saving...' : 'Save Achievements'}
               </button>
            </div>
          </motion.div>
        );

      case 'social':
        return (
          <motion.div
            key="social"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                  <Share2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Social Profiles</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {[
                 { id: 'linkedin', label: 'LinkedIn', icon: Share2, color: '#0077B5', placeholder: 'linkedin.com/in/...' },
                 { id: 'github', label: 'GitHub', icon: Terminal, color: '#181717', placeholder: 'github.com/...' },
                 { id: 'twitter', label: 'Twitter / X', icon: Globe, color: '#000000', placeholder: 'twitter.com/...' },
                 { id: 'portfolio', label: 'Portfolio', icon: Globe, color: '#7C3AED', placeholder: 'yourwebsite.com' },
                 { id: 'leetcode', label: 'LeetCode', icon: Book, color: '#FFA116', placeholder: 'leetcode.com/u/...' },
                 { id: 'hackerrank', label: 'HackerRank', icon: Book, color: '#2EC866', placeholder: 'hackerrank.com/profile/...' },
               ].map(social => (
                 <div key={social.label} className="space-y-3 group">
                   <div className="flex items-center gap-3 ml-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg`} style={{ backgroundColor: social.color }}>
                         <social.icon className="w-4 h-4" />
                      </div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-focus-within:text-[#7C3AED] transition-colors">{social.label}</label>
                   </div>
                   <input 
                    type="text" 
                    name={social.id}
                    value={(formData as any)[social.id] || ''}
                    onChange={handleChange}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all outline-none" 
                    placeholder={social.placeholder} 
                   />
                 </div>
               ))}
            </div>

            <div className="pt-8 flex justify-end">
               <button 
                onClick={() => handleSave('Social Links')}
                disabled={isSaving}
                className="px-12 py-4 bg-[#7C3AED] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[#6D28D9] transition-all shadow-xl shadow-[#7C3AED]/20 flex items-center gap-3 disabled:opacity-50"
               >
                 {isSaving ? <Plus className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 {isSaving ? 'Saving...' : 'Save All Profiles'}
               </button>
            </div>
          </motion.div>
        );

      case 'scanner':
        return (
          <motion.div
            key="scanner"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                  <Scan className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">AI Resume Scanner</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               <div className="lg:col-span-2 space-y-10">
                  {/* Step 1 */}
                  <div className="space-y-4">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Step 1: Select Resume</span>
                     <div className="bg-white border border-gray-100 rounded-3xl p-6 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                           <FileText className="w-5 h-5 text-red-500" />
                           <span className="text-sm font-bold text-gray-900">{formData.resume.fileName}</span>
                        </div>
                        <button 
                          onClick={() => resumeInputRef.current?.click()}
                          className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest hover:underline"
                        >
                          Change
                        </button>
                     </div>
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-4">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Step 2: Job Description</span>
                     <textarea 
                        name="jobDescription"
                        value={formData.jobDescription}
                        onChange={handleChange}
                        className="w-full px-8 py-6 bg-gray-50 border border-transparent rounded-[2rem] text-sm font-bold min-h-[200px] leading-relaxed text-gray-900 focus:bg-white transition-all outline-none" 
                        placeholder="Paste the job description here to analyze matching score..." 
                     />
                  </div>
               </div>

               {/* Analysis Result Card */}
               <div className="bg-[#7C3AED] rounded-[3.5rem] p-10 text-white flex flex-col justify-between shadow-2xl shadow-[#7C3AED]/30 relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                  
                  <div className="relative z-10 space-y-6">
                     <h3 className="text-3xl font-black uppercase tracking-tight leading-none">Ready to Analyze</h3>
                     <p className="text-xs font-medium text-white/70 leading-relaxed">Our AI will compare your resume against the job requirements to calculate your ATS compatibility score.</p>
                  </div>

                  <button className="w-full py-6 bg-white text-[#7C3AED] rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-50 transition-all shadow-xl relative z-10">
                     Run Analysis
                  </button>
               </div>
            </div>
          </motion.div>
        );

      case 'preferences':
        return (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-900">
                  <Settings className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Account Preferences</h2>
              </div>
            </div>

            <div className="space-y-10">
               <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-8">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Search Status</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     {[
                       { id: 'active', label: 'Actively Looking', desc: 'Prioritize my profile in searches' },
                       { id: 'open', label: 'Open to Offers', desc: 'Visibility for casual browsing' },
                       { id: 'closed', label: 'Not Looking', desc: 'Hide my profile from recruiters' }
                     ].map(status => (
                       <button 
                        key={status.id} 
                        onClick={() => setFormData(prev => ({ ...prev, searchStatus: status.id }))}
                        className={`p-6 rounded-3xl border text-left transition-all ${formData.searchStatus === status.id ? 'bg-white border-[#7C3AED] shadow-lg shadow-[#7C3AED]/5' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
                       >
                          <div className="flex items-center justify-between mb-3">
                             <div className={`w-3 h-3 rounded-full ${formData.searchStatus === status.id ? 'bg-[#7C3AED]' : 'bg-gray-300'}`} />
                             {formData.searchStatus === status.id && <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />}
                          </div>
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-900 mb-1">{status.label}</h5>
                          <p className="text-[9px] font-bold text-gray-400 leading-tight">{status.desc}</p>
                       </button>
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div 
                   onClick={() => setFormData(prev => ({ ...prev, profileVisible: !prev.profileVisible }))}
                   className="p-8 bg-white border border-gray-100 rounded-[2.5rem] flex items-center justify-between group cursor-pointer hover:border-[#7C3AED]/30 transition-all shadow-sm"
                  >
                     <div className="space-y-1">
                        <h5 className="text-[11px] font-black uppercase tracking-widest text-gray-900">Profile Visibility</h5>
                        <p className="text-[10px] font-bold text-gray-400">Control who can see your profile details</p>
                     </div>
                     <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.profileVisible ? 'bg-[#7C3AED]' : 'bg-gray-200'}`}>
                        <motion.div 
                         animate={{ x: formData.profileVisible ? 24 : 4 }}
                         className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                        />
                     </div>
                  </div>

                  <div 
                   onClick={() => setFormData(prev => ({ ...prev, newsletter: !prev.newsletter }))}
                   className="p-8 bg-white border border-gray-100 rounded-[2.5rem] flex items-center justify-between group cursor-pointer hover:border-[#7C3AED]/30 transition-all shadow-sm"
                  >
                     <div className="space-y-1">
                        <h5 className="text-[11px] font-black uppercase tracking-widest text-gray-900">Newsletter Alerts</h5>
                        <p className="text-[10px] font-bold text-gray-400">Get weekly job and skill insights</p>
                     </div>
                     <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.newsletter ? 'bg-[#7C3AED]' : 'bg-gray-200'}`}>
                        <motion.div 
                         animate={{ x: formData.newsletter ? 24 : 4 }}
                         className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                        />
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto min-h-screen bg-transparent p-4 sm:p-8 lg:p-12 font-sans selection:bg-[#7C3AED] selection:text-white">
      {/* Header with Back Button */}
      <div className="flex items-center gap-6 mb-12">
        <button 
          onClick={() => navigate('/dashboard/learner')}
          className="w-12 h-12 bg-white flex items-center justify-center rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600 group-hover:text-[#7C3AED] group-hover:-translate-x-1 transition-all" />
        </button>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 leading-tight">Edit Profile</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Configure your professional identity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-10 items-start">
        {/* Left Sidebar */}
        <div className="space-y-8 sticky top-32">
          {/* Create Resume Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => navigate('/job-prep/resume-builder')}
            className="bg-gradient-to-br from-[#0052CC] to-[#0747A6] rounded-[2.5rem] p-8 text-white flex flex-col gap-6 shadow-2xl shadow-blue-900/20 relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
               <FileText className="w-24 h-24" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <FileText className="w-6 h-6" />
              </div>
              <Plus className="w-6 h-6 opacity-60" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Create your Resume</h3>
              <p className="text-xs text-blue-100/70 font-medium leading-relaxed">Generate a professional PDF resume in seconds using your profile data.</p>
            </div>
          </motion.div>

          {/* Completion Card */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
            <h3 className="font-black uppercase text-xs tracking-widest text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7C3AED]" />
              Profile Strength
            </h3>
            <div className="space-y-4">
              <div className="relative h-4 bg-gray-50 rounded-full overflow-hidden p-1">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${profileCompletion}%` }}
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                />
              </div>
              <div className="flex justify-between items-center px-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Complete your profile</p>
                <span className="text-xl font-black text-[#111827]">{profileCompletion}%</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden py-6">
            <div className="px-10 pb-4 mb-4 border-b border-gray-50">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Modules</span>
            </div>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-10 py-5 transition-all relative group ${activeTab === tab.id ? 'text-[#7C3AED] bg-[#F5F3FF]/50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-5">
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[#7C3AED]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
                </div>
                {tab.required && (
                  <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-lg ${activeTab === tab.id ? 'bg-[#7C3AED]/10 text-[#7C3AED]' : 'bg-red-50 text-red-400'}`}>
                    Required
                  </span>
                )}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="tabHighlightSide"
                    className="absolute right-0 top-0 bottom-0 w-1 bg-[#7C3AED]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] p-10 sm:p-16 min-h-[800px] relative">
          <AnimatePresence mode="wait">
             {renderContent()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
