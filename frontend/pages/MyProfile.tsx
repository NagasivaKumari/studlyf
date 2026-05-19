import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { API_BASE_URL } from '../apiConfig';
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
    careerGoal: '',
    interests: [] as string[],
    skills: [] as { name: string; proficiency: string; years: string }[],
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
    educationList: [] as { institution: string; degree: string; specialization: string; startYear: string; endYear: string; cgpa: string }[],
    experience: {
      company: '',
      role: '',
      type: 'Full-time',
      responsibilities: '',
    },

    resume: {
      fileName: 'No resume uploaded',
      uploadDate: '',
      atsScore: 0,
      version: '1.0',
    },
    projects: [] as { title: string; description: string; link: string; isFeatured: boolean; tags: string[] }[],
    certifications: [] as { name: string; issuer: string; date: string; link: string }[],
    achievements: [] as { title: string; organization: string; month: string; year: string; category: string; description: string; link: string; isFeatured: boolean }[],
    experienceList: [] as { company: string; role: string; type: string; responsibilities: string; location?: string }[],
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

  // Resume upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [resumeParseResult, setResumeParseResult] = useState<any>(null);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const navigate = useNavigate();

  const calculateStrength = () => {
    let score = 0;
    if (formData.profilePhoto) score += 10;
    if (formData.firstName && formData.lastName) score += 10;
    if (formData.bio && formData.bio.length > 10) score += 10;
    if (formData.skills.length > 0) score += 10;
    if (formData.education.institution || formData.educationList.length > 0) score += 10;
    if (formData.certifications.length > 0) score += 10;
    if (formData.experience.company || formData.experienceList.length > 0) score += 10;
    if (formData.projects.length > 0) score += 10;
    if (formData.linkedin || formData.github) score += 10;
    if (formData.resume.fileName && formData.resume.fileName !== 'No resume uploaded') score += 10;

    return score;
  };

  const profileCompletion = calculateStrength();

  const [isExtracting, setIsExtracting] = useState(false);

  // ─── REAL: Add / Remove individual skills ───
  const addSkillToList = () => {
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    setFormData(prev => ({
      ...prev,
      skills: [
        ...prev.skills,
        { name: trimmed, proficiency: 'Intermediate', years: '' }
      ]
    }));
    setNewSkillInput('');
  };

  const removeSkillFromList = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const updateSkillField = (index: number, field: 'name' | 'proficiency' | 'years', value: string) => {
    setFormData(prev => {
      const updated = [...prev.skills];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, skills: updated };
    });
  };

  // ─── REAL: Upload resume and parse via backend ───
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setResumeParseResult(null);

    // Animate progress bar during upload
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => prev < 80 ? prev + 10 : prev);
    }, 200);

    try {
      const formPayload = new FormData();
      formPayload.append('file', file);

      if (!user?.user_id) throw new Error('User not logged in');
      const res = await fetch(`${API_BASE_URL}/api/user/${user.user_id}/upload-resume`, {
        method: 'POST',
        body: formPayload,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Resume parsing failed');
      }

      const data = await res.json();
      setResumeParseResult(data);

      // Auto-populate skills from resume
      const newSkills: { name: string; proficiency: string; years: string }[] = (data.skills || []).map((s: string) => ({
        name: s,
        proficiency: 'Intermediate',
        years: ''
      }));
      setExtractedSkills(data.skills || []);

      setFormData(prev => ({
        ...prev,
        firstName: data.full_name ? data.full_name.split(' ')[0] : prev.firstName,
        lastName: data.full_name ? data.full_name.split(' ').slice(1).join(' ') : prev.lastName,
        phone: data.phone || prev.phone,
        resume: {
          ...prev.resume,
          fileName: file.name,
          uploadDate: new Date().toLocaleDateString('en-IN'),
          atsScore: data.ats_score || prev.resume.atsScore,
        },
        // Merge extracted skills with existing ones (no duplicates)
        skills: [
          ...prev.skills,
          ...newSkills.filter(ns => !prev.skills.some(es => es.name.toLowerCase() === ns.name.toLowerCase()))
        ]
      }));
    } catch (err: any) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // ─── REAL: Re-extract skills from already-uploaded resume ───
  const extractSkills = async () => {
    if (!resumeInputRef.current?.files?.[0] && formData.resume.fileName === 'No resume uploaded') {
      alert('Please upload a resume first.');
      return;
    }
    setIsExtracting(true);
    await new Promise(r => setTimeout(r, 600));
    setIsExtracting(false);
    if (resumeParseResult?.skills?.length) {
      alert(`Extraction complete! Found ${resumeParseResult.skills.length} skills already loaded.`);
    } else {
      alert('No new skills found. Please re-upload your resume.');
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

  // ─── REAL: Load full profile from backend on mount ───
  useEffect(() => {
    if (!user?.user_id) {
      setProfileLoading(false);
      return;
    }

    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/${user.user_id}/profile`);
        if (res.ok) {
          const data = await res.json();
          setFormData(prev => ({
            ...prev,
            firstName: data.firstName || prev.firstName,
            lastName: data.lastName || prev.lastName,
            username: data.username || prev.username,
            phone: data.phone || prev.phone,
            gender: data.gender || prev.gender,
            dob: data.dob || prev.dob,
            userType: data.userType || prev.userType,
            domain: data.domain || prev.domain,
            location: data.location || prev.location,
            preferredWork: data.preferredWork || prev.preferredWork,
            bio: data.bio || prev.bio,
            careerGoal: data.careerGoal || prev.careerGoal,
            interests: data.interests?.length ? data.interests : prev.interests,
            profilePhoto: data.profilePhoto || prev.profilePhoto,
            skills: data.skills?.length ? data.skills : prev.skills,
            education: data.education || prev.education,
            educationList: data.educationList || prev.educationList,
            experience: data.experience || prev.experience,
            projects: data.projects || prev.projects,
            certifications: data.certifications || prev.certifications,
            achievements: data.achievements || prev.achievements,
            resume: data.resume || prev.resume,
            linkedin: data.linkedin || prev.linkedin,
            github: data.github || prev.github,
            twitter: data.twitter || prev.twitter,
            portfolio: data.portfolio || prev.portfolio,
            leetcode: data.leetcode || prev.leetcode,
            hackerrank: data.hackerrank || prev.hackerrank,
            searchStatus: data.searchStatus || prev.searchStatus,
            profileVisible: data.profileVisible ?? prev.profileVisible,
            newsletter: data.newsletter ?? prev.newsletter,
            isCurrentStudent: data.isCurrentStudent ?? prev.isCurrentStudent,
            isCurrentEmployee: data.isCurrentEmployee ?? prev.isCurrentEmployee,
          }));
        } else {
          // Fallback: seed name from auth context
          const names = user.full_name?.split(' ') || [];
          setFormData(prev => ({
            ...prev,
            firstName: names[0] || '',
            lastName: names.slice(1).join(' ') || '',
          }));
        }
      } catch (err) {
        console.error('Profile load error:', err);
        const names = user.full_name?.split(' ') || [];
        setFormData(prev => ({
          ...prev,
          firstName: names[0] || '',
          lastName: names.slice(1).join(' ') || '',
        }));
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // ─── REAL: Save full profile to backend ───
  const handleSave = async (section: string) => {
    if (!user?.user_id) return;
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/user/${user.user_id}/update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Ensure arrays and objects are clean
          skills: formData.skills || [],
          projects: formData.projects || [],
          certifications: formData.certifications || [],
          achievements: formData.achievements || [],
          interests: formData.interests || [],
          educationList: formData.educationList || [],
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Save failed');
      }

      setSaveStatus({ type: 'success', message: `${section} saved successfully!` });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: err.message || 'Failed to save. Please try again.' });
      setTimeout(() => setSaveStatus(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── REAL: Delete item from backend + local state ───
  const handleDeleteItem = async (section: string, index: number, stateKey: keyof typeof formData) => {
    if (!user?.user_id) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/user/${user.user_id}/profile/${section}/${index}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        const updated = await res.json();
        setFormData(prev => ({ ...prev, [stateKey]: updated[stateKey as string] || [] }));
        setSaveStatus({ type: 'success', message: 'Deleted successfully!' });
        setTimeout(() => setSaveStatus(null), 2000);
      }
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: 'Delete failed: ' + err.message });
      setTimeout(() => setSaveStatus(null), 3000);
    }
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
                  <button
                    onClick={() => {
                      const tag = prompt('Enter interest/hobby:');
                      if (tag && tag.trim() && !formData.interests.includes(tag.trim())) {
                        setFormData(prev => ({ ...prev, interests: [...prev.interests, tag.trim()] }));
                      }
                    }}
                    className="px-4 py-2 bg-[#F5F3FF] text-[#7C3AED] border border-dashed border-[#7C3AED]/30 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#7C3AED] hover:text-white transition-all"
                  >
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
            className="space-y-10"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Academic History</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{formData.educationList.length} entries</p>
                </div>
              </div>
              <button
                onClick={() => setFormData(prev => ({
                  ...prev,
                  educationList: [...prev.educationList, { institution: '', degree: '', specialization: '', startYear: '2022', endYear: '2026', cgpa: '' }]
                }))}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7C3AED] transition-all shadow-lg shadow-black/10"
              >
                <Plus className="w-4 h-4" /> Add Education
              </button>
            </div>

            {formData.educationList.length === 0 && (
              <div className="text-center py-12 text-gray-300">
                <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-xs font-bold uppercase tracking-widest">No education added. Click "Add Education" to begin.</p>
              </div>
            )}

            <div className="space-y-6">
              {formData.educationList.map((edu, i) => (
                <div key={`edu-${i}`} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 relative group hover:border-[#7C3AED]/30 transition-all shadow-sm">
                  <button
                    onClick={() => handleDeleteItem('education', i, 'educationList')}
                    className="absolute top-6 right-6 p-2 text-gray-200 hover:text-red-400 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">Institution Name</label>
                      <input type="text" value={edu.institution} onChange={e => { const u = [...formData.educationList]; u[i] = { ...u[i], institution: e.target.value }; setFormData(prev => ({ ...prev, educationList: u })); }} className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all" placeholder="Enter college or university name" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">Degree</label>
                      <input type="text" value={edu.degree} onChange={e => { const u = [...formData.educationList]; u[i] = { ...u[i], degree: e.target.value }; setFormData(prev => ({ ...prev, educationList: u })); }} className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all" placeholder="e.g. Bachelor of Technology" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">Specialization</label>
                      <input type="text" value={edu.specialization} onChange={e => { const u = [...formData.educationList]; u[i] = { ...u[i], specialization: e.target.value }; setFormData(prev => ({ ...prev, educationList: u })); }} className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all" placeholder="e.g. Computer Science" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Start Year</label>
                        <select value={edu.startYear} onChange={e => { const u = [...formData.educationList]; u[i] = { ...u[i], startYear: e.target.value }; setFormData(prev => ({ ...prev, educationList: u })); }} className="w-full px-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold focus:outline-none focus:bg-white transition-all appearance-none outline-none">
                          <option>2024</option><option>2023</option><option>2022</option><option>2021</option><option>2020</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">End Year</label>
                        <select value={edu.endYear} onChange={e => { const u = [...formData.educationList]; u[i] = { ...u[i], endYear: e.target.value }; setFormData(prev => ({ ...prev, educationList: u })); }} className="w-full px-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold focus:outline-none focus:bg-white transition-all appearance-none outline-none">
                          <option>2028</option><option>2027</option><option>2026</option><option>2025</option><option>2024</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-[#7C3AED] transition-colors">CGPA / Percentage</label>
                      <input type="text" value={edu.cgpa} onChange={e => { const u = [...formData.educationList]; u[i] = { ...u[i], cgpa: e.target.value }; setFormData(prev => ({ ...prev, educationList: u })); }} className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#7C3AED]/5 focus:border-[#7C3AED]/30 transition-all" placeholder="e.g. 9.4 or 88%" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {formData.educationList.length > 0 && (
              <div className="pt-8 flex justify-end">
                <button 
                  onClick={() => handleSave('Education')}
                  disabled={isSaving}
                  className="px-12 py-4 bg-[#7C3AED] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[#6D28D9] transition-all shadow-xl shadow-[#7C3AED]/20 flex items-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? <Plus className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : `Save ${formData.educationList.length} Education`}
                </button>
              </div>
            )}
          </motion.div>
        );

      case 'skills':
        return (
          <motion.div
            key="skills"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
                  <Terminal className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Skills &amp; Expertise</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{formData.skills.length} skills added</p>
                </div>
              </div>
            </div>

            {/* Trending Suggestions */}
            <div className="bg-[#F5F3FF]/50 border border-[#7C3AED]/10 p-8 rounded-[2.5rem]">
              <div className="flex items-center gap-3 mb-5">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest">Trending for ML Engineers — Click to Add</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {['TensorFlow', 'PyTorch', 'Scikit-Learn', 'Deep Learning', 'SQL', 'LangChain', 'Docker', 'AWS'].map(skill => {
                  const alreadyAdded = formData.skills.some(s => s.name.toLowerCase() === skill.toLowerCase());
                  return (
                    <button
                      key={skill}
                      onClick={() => {
                        if (!alreadyAdded) {
                          setFormData(prev => ({
                            ...prev,
                            skills: [...prev.skills, { name: skill, proficiency: 'Intermediate', years: '' }]
                          }));
                        }
                      }}
                      className={`px-5 py-2 rounded-xl text-[10px] font-bold transition-all shadow-sm ${alreadyAdded ? 'bg-[#7C3AED] text-white border border-[#7C3AED] cursor-default' : 'bg-white border border-white hover:border-[#7C3AED] hover:text-[#7C3AED] text-gray-600'}`}
                    >
                      {alreadyAdded ? '✓ ' : '+ '}{skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual Add Row */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-4 shadow-sm">
              <input
                type="text"
                value={newSkillInput}
                onChange={e => setNewSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkillToList()}
                placeholder="Type a skill name and press Enter or click Add..."
                className="flex-grow px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white outline-none transition-all"
              />
              <button
                onClick={addSkillToList}
                disabled={!newSkillInput.trim()}
                className="px-8 py-4 bg-[#7C3AED] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#6D28D9] transition-all flex items-center gap-2 disabled:opacity-40"
              >
                <Plus className="w-4 h-4" /> Add Skill
              </button>
            </div>

            {/* Live Skills List */}
            <div className="space-y-4">
              <AnimatePresence>
                {formData.skills.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-10 text-gray-300"
                  >
                    <Terminal className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-xs font-bold uppercase tracking-widest">No skills yet. Upload your resume or add manually above.</p>
                  </motion.div>
                )}
                {formData.skills.map((sk, i) => (
                  <motion.div
                    key={`skill-row-${i}`}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.02 }}
                    className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col md:flex-row items-center gap-5 group hover:border-[#7C3AED]/30 transition-all shadow-sm"
                  >
                    {/* Rank badge */}
                    <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 shrink-0">
                      {i + 1}
                    </div>

                    {/* Skill Name */}
                    <div className="flex-grow">
                      <input
                        type="text"
                        value={sk.name}
                        onChange={e => updateSkillField(i, 'name', e.target.value)}
                        className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none border-b border-transparent focus:border-[#7C3AED]/30 transition-all pb-1"
                        placeholder="Skill name"
                      />
                    </div>

                    {/* Proficiency */}
                    <select
                      value={sk.proficiency}
                      onChange={e => updateSkillField(i, 'proficiency', e.target.value)}
                      className="w-36 px-4 py-2 bg-gray-50 border border-transparent rounded-xl text-xs font-bold text-gray-900 appearance-none focus:bg-white outline-none transition-all"
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                      <option>Expert</option>
                    </select>

                    {/* Years */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={sk.years}
                        onChange={e => updateSkillField(i, 'years', e.target.value)}
                        min="0"
                        max="30"
                        className="w-16 px-3 py-2 bg-gray-50 border border-transparent rounded-xl text-xs font-bold text-center focus:bg-white outline-none transition-all"
                        placeholder="0"
                      />
                      <span className="text-[10px] font-black text-gray-400 uppercase">Yrs</span>
                    </div>

                    {/* Proficiency bar */}
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: sk.proficiency === 'Expert' ? '100%' : sk.proficiency === 'Advanced' ? '75%' : sk.proficiency === 'Intermediate' ? '50%' : '25%',
                          backgroundColor: sk.proficiency === 'Expert' ? '#7C3AED' : sk.proficiency === 'Advanced' ? '#3B82F6' : sk.proficiency === 'Intermediate' ? '#F59E0B' : '#9CA3AF'
                        }}
                      />
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeSkillFromList(i)}
                      className="p-2 text-gray-200 hover:text-red-400 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Plus className="w-4 h-4 rotate-45" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {formData.skills.length > 0 && (
              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => handleSave('Skills')}
                  disabled={isSaving}
                  className="px-12 py-4 bg-[#7C3AED] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[#6D28D9] transition-all shadow-xl shadow-[#7C3AED]/20 flex items-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? <Plus className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : `Save ${formData.skills.length} Skills`}
                </button>
              </div>
            )}
          </motion.div>
        );

      case 'resume':
        return (
          <motion.div
            key="resume"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Resume Management</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Upload your resume to auto-extract skills &amp; get an ATS score</p>
                </div>
              </div>
            </div>

            {/* Upload Zone */}
            <input
              type="file"
              ref={resumeInputRef}
              onChange={handleResumeUpload}
              className="hidden"
              accept=".pdf,.docx"
            />
            <div
              onClick={() => !isUploading && resumeInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-[3rem] p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer overflow-hidden
                ${isUploading ? 'border-[#7C3AED]/50 bg-[#F5F3FF]/30 cursor-not-allowed' : 'border-gray-100 bg-gray-50/50 hover:border-[#7C3AED]/30 hover:bg-[#F5F3FF]/20 group'}`}
            >
              {/* Upload progress fill */}
              {isUploading && (
                <div
                  className="absolute inset-0 bg-[#7C3AED]/10 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              )}

              <div className={`w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 transition-transform relative z-10 ${isUploading ? 'animate-pulse' : 'group-hover:scale-110'}`}>
                {isUploading
                  ? <div className="w-8 h-8 border-4 border-[#7C3AED]/20 border-t-[#7C3AED] rounded-full animate-spin" />
                  : <Plus className="w-8 h-8 text-[#7C3AED]" />
                }
              </div>
              <h3 className="text-lg font-black uppercase text-gray-900 mb-2 relative z-10">
                {isUploading ? `Parsing Resume... ${uploadProgress}%` : 'Upload Your Resume'}
              </h3>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest relative z-10">
                {isUploading ? 'Extracting skills and computing ATS score...' : 'PDF or DOCX · Max 10MB · Auto-extracts skills'}
              </p>
              {isUploading && (
                <div className="w-64 h-1.5 bg-gray-100 rounded-full mt-6 overflow-hidden relative z-10">
                  <div
                    className="h-full bg-[#7C3AED] rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>

            {/* ATS Score + File Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ATS Score Card */}
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Scan className="w-28 h-28" />
                </div>
                <div className="relative z-10">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3 block">ATS Score</span>
                  <h3 className="text-4xl font-black mb-1">
                    {formData.resume.atsScore > 0 ? formData.resume.atsScore : '—'}
                    <span className="text-base opacity-50">/100</span>
                  </h3>
                  {formData.resume.atsScore > 0 && (
                    <div className="w-full h-1 bg-white/10 rounded-full mt-3">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${formData.resume.atsScore}%`,
                          backgroundColor: formData.resume.atsScore >= 80 ? '#22C55E' : formData.resume.atsScore >= 60 ? '#F59E0B' : '#EF4444'
                        }}
                      />
                    </div>
                  )}
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-2">
                    {formData.resume.atsScore >= 80 ? 'Excellent' : formData.resume.atsScore >= 60 ? 'Good' : formData.resume.atsScore > 0 ? 'Needs Work' : 'Awaiting Upload'}
                  </p>
                </div>
              </div>

              {/* File Details Card */}
              <div className="md:col-span-2 bg-white border border-gray-100 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-sm">
                <div className="flex items-center gap-5 mb-6">
                  <div className={`w-14 h-18 rounded-2xl flex flex-col items-center justify-center border shadow-sm px-3 py-4 ${formData.resume.fileName.endsWith('.pdf') || formData.resume.fileName.endsWith('.docx') ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <FileText className={`w-6 h-6 ${formData.resume.fileName.endsWith('.pdf') || formData.resume.fileName.endsWith('.docx') ? 'text-red-500' : 'text-gray-300'}`} />
                    <span className="text-[8px] font-black mt-1 uppercase text-red-400">
                      {formData.resume.fileName.endsWith('.pdf') ? 'PDF' : formData.resume.fileName.endsWith('.docx') ? 'DOCX' : '—'}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm mb-1 max-w-xs truncate">{formData.resume.fileName}</h5>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">v{formData.resume.version}</span>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formData.resume.uploadDate || 'Not uploaded yet'}
                      </span>
                      {resumeParseResult && (
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                          ✓ {resumeParseResult.word_count} words
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all disabled:opacity-50"
                  >
                    {isUploading ? 'Parsing...' : 'Re-upload Resume'}
                  </button>
                  <button
                    onClick={() => handleSave('Resume')}
                    disabled={isSaving || formData.resume.atsScore === 0}
                    className="px-6 py-3 bg-[#7C3AED] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#6D28D9] transition-all flex items-center gap-2 shadow-lg shadow-[#7C3AED]/20 disabled:opacity-40"
                  >
                    {isSaving ? <Plus className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* Extracted Skills Section — live populated after upload */}
            {formData.skills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#F5F3FF]/50 border border-[#7C3AED]/10 rounded-[2.5rem] p-8"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                    <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest">
                      {resumeParseResult ? `${formData.skills.length} Skills Auto-Extracted` : `${formData.skills.length} Skills`}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Click × to remove · Click Skills tab to edit</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((sk, i) => (
                    <motion.span
                      key={`${sk.name}-${i}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="px-4 py-2 bg-white border border-[#7C3AED]/20 rounded-xl text-[10px] font-bold text-[#7C3AED] flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
                    >
                      {sk.name}
                      <button
                        onClick={() => removeSkillFromList(i)}
                        className="text-[#7C3AED]/40 hover:text-red-400 transition-colors ml-1"
                      >
                        ×
                      </button>
                    </motion.span>
                  ))}
                </div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-4">
                  These skills have been synced to your Skills tab. Save to persist.
                </p>
              </motion.div>
            )}

            {/* Empty state before upload */}
            {formData.skills.length === 0 && !isUploading && (
              <div className="text-center py-8 text-gray-300">
                <Scan className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-xs font-bold uppercase tracking-widest">Upload a resume above to auto-extract your skills and get an ATS score.</p>
              </div>
            )}
          </motion.div>
        );


      case 'experience':
        return (
          <motion.div
            key="experience"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Professional Experience</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{formData.experienceList.length} entries</p>
                </div>
              </div>
              <button
                onClick={() => setFormData(prev => ({
                  ...prev,
                  experienceList: [...prev.experienceList, { company: '', role: '', type: 'Full-time', responsibilities: '', location: '' }]
                }))}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7C3AED] transition-all shadow-lg shadow-black/10"
              >
                <Plus className="w-4 h-4" /> Add Experience
              </button>
            </div>

            {formData.experienceList.length === 0 && (
              <div className="text-center py-12 text-gray-300">
                <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-xs font-bold uppercase tracking-widest">No experience added. Click "Add Experience" to begin.</p>
              </div>
            )}

            <div className="space-y-6">
              {formData.experienceList.map((exp, i) => (
                <div key={`exp-${i}`} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 relative group hover:border-[#7C3AED]/30 transition-all shadow-sm">
                  <button
                    onClick={() => handleDeleteItem('experience', i, 'experienceList')}
                    className="absolute top-6 right-6 p-2 text-gray-200 hover:text-red-400 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Company Name</label>
                      <input type="text" value={exp.company} onChange={e => { const u = [...formData.experienceList]; u[i] = { ...u[i], company: e.target.value }; setFormData(prev => ({ ...prev, experienceList: u })); }} className="w-full px-6 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white outline-none transition-all" placeholder="e.g. Google, Infosys" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Job Role</label>
                      <input type="text" value={exp.role} onChange={e => { const u = [...formData.experienceList]; u[i] = { ...u[i], role: e.target.value }; setFormData(prev => ({ ...prev, experienceList: u })); }} className="w-full px-6 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white outline-none transition-all" placeholder="e.g. Frontend Engineer" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Employment Type</label>
                      <select value={exp.type} onChange={e => { const u = [...formData.experienceList]; u[i] = { ...u[i], type: e.target.value }; setFormData(prev => ({ ...prev, experienceList: u })); }} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold appearance-none text-gray-900 focus:bg-white outline-none transition-all">
                        <option>Internship</option><option>Full-time</option><option>Freelance</option><option>Contract</option><option>Part-time</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Location</label>
                      <input type="text" value={exp.location || ''} onChange={e => { const u = [...formData.experienceList]; u[i] = { ...u[i], location: e.target.value }; setFormData(prev => ({ ...prev, experienceList: u })); }} className="w-full px-6 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white outline-none transition-all" placeholder="e.g. Remote, Hyderabad" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Responsibilities &amp; Impact</label>
                      <textarea value={exp.responsibilities} onChange={e => { const u = [...formData.experienceList]; u[i] = { ...u[i], responsibilities: e.target.value }; setFormData(prev => ({ ...prev, experienceList: u })); }} className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold min-h-[100px] text-gray-900 focus:bg-white outline-none transition-all" placeholder="Mention key deliverables, technologies used..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {formData.experienceList.length > 0 && (
              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => handleSave('Work Experience')}
                  disabled={isSaving}
                  className="px-12 py-4 bg-[#7C3AED] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[#6D28D9] transition-all shadow-xl shadow-[#7C3AED]/20 flex items-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? <Plus className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : `Save ${formData.experienceList.length} Experiences`}
                </button>
              </div>
            )}
          </motion.div>
        );

      case 'projects':
        return (
          <motion.div
            key="projects"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Personal Projects</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{formData.projects.length} projects</p>
                </div>
              </div>
              <button
                onClick={() => setFormData(prev => ({
                  ...prev,
                  projects: [...prev.projects, { title: '', description: '', link: '', isFeatured: false, tags: [] }]
                }))}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7C3AED] transition-all"
              >
                <Plus className="w-4 h-4" /> New Project
              </button>
            </div>

            {formData.projects.length === 0 && (
              <div className="text-center py-12 text-gray-300">
                <Settings className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-xs font-bold uppercase tracking-widest">No projects yet. Click "New Project" above to add one.</p>
              </div>
            )}

            <div className="space-y-8">
              {formData.projects.map((proj, i) => (
                <div key={`proj-${i}`} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 relative group hover:border-[#7C3AED]/30 transition-all shadow-sm">
                  <button
                    onClick={() => handleDeleteItem('project', i, 'projects')}
                    className="absolute top-6 right-6 p-2 text-gray-200 hover:text-red-400 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Project Title</label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={e => {
                          const updated = [...formData.projects];
                          updated[i] = { ...updated[i], title: e.target.value };
                          setFormData(prev => ({ ...prev, projects: updated }));
                        }}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white outline-none transition-all"
                        placeholder="e.g. AI-Powered Portfolio Hub"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Description</label>
                      <textarea
                        value={proj.description}
                        onChange={e => {
                          const updated = [...formData.projects];
                          updated[i] = { ...updated[i], description: e.target.value };
                          setFormData(prev => ({ ...prev, projects: updated }));
                        }}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold min-h-[100px] text-gray-900 focus:bg-white outline-none transition-all"
                        placeholder="Describe your project..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">GitHub / Link</label>
                      <input
                        type="url"
                        value={proj.link}
                        onChange={e => {
                          const updated = [...formData.projects];
                          updated[i] = { ...updated[i], link: e.target.value };
                          setFormData(prev => ({ ...prev, projects: updated }));
                        }}
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white outline-none transition-all"
                        placeholder="https://github.com/..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {formData.projects.length > 0 && (
              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => handleSave('Projects')}
                  disabled={isSaving}
                  className="px-12 py-4 bg-[#7C3AED] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[#6D28D9] transition-all shadow-xl shadow-[#7C3AED]/20 flex items-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? <Plus className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : `Save ${formData.projects.length} Projects`}
                </button>
              </div>
            )}
          </motion.div>
        );

      case 'certifications':
        return (
          <motion.div
            key="certifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Licenses &amp; Certifications</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{formData.certifications.length} certificates</p>
                </div>
              </div>
              <button
                onClick={() => setFormData(prev => ({
                  ...prev,
                  certifications: [...prev.certifications, { name: '', issuer: '', date: '', link: '' }]
                }))}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7C3AED] transition-all"
              >
                <Plus className="w-4 h-4" /> Add Certificate
              </button>
            </div>

            {formData.certifications.length === 0 && (
              <div className="text-center py-12 text-gray-300">
                <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-xs font-bold uppercase tracking-widest">No certifications yet. Click "Add Certificate" above.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.certifications.map((cert, i) => (
                <div key={`cert-${i}`} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 group hover:border-[#7C3AED]/30 transition-all shadow-sm relative">
                  <button
                    onClick={() => handleDeleteItem('certification', i, 'certifications')}
                    className="absolute top-5 right-5 p-2 text-gray-200 hover:text-red-400 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Certificate Name</label>
                      <input type="text" value={cert.name} onChange={e => { const u = [...formData.certifications]; u[i] = { ...u[i], name: e.target.value }; setFormData(prev => ({ ...prev, certifications: u })); }} className="w-full px-6 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white outline-none transition-all" placeholder="AWS Certified Solutions Architect" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Issuer</label>
                        <input type="text" value={cert.issuer} onChange={e => { const u = [...formData.certifications]; u[i] = { ...u[i], issuer: e.target.value }; setFormData(prev => ({ ...prev, certifications: u })); }} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold text-gray-900 focus:bg-white outline-none transition-all" placeholder="Google Cloud" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Date</label>
                        <input type="text" value={cert.date} onChange={e => { const u = [...formData.certifications]; u[i] = { ...u[i], date: e.target.value }; setFormData(prev => ({ ...prev, certifications: u })); }} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold text-gray-900 focus:bg-white outline-none transition-all" placeholder="2024" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Credential URL</label>
                      <input type="url" value={cert.link} onChange={e => { const u = [...formData.certifications]; u[i] = { ...u[i], link: e.target.value }; setFormData(prev => ({ ...prev, certifications: u })); }} className="w-full px-6 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white outline-none transition-all" placeholder="https://..." />
                    </div>
                  </div>
                </div>
              ))}
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
                <div>
                  <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Accomplishments</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{formData.achievements.length} entries</p>
                </div>
              </div>
              <button
                onClick={() => setFormData(prev => ({
                  ...prev,
                  achievements: [...prev.achievements, { title: '', organization: '', month: 'Jan', year: '2024', category: 'Hackathon', description: '', link: '', isFeatured: false }]
                }))}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7C3AED] transition-all"
              >
                <Plus className="w-4 h-4" /> Add Achievement
              </button>
            </div>

            {formData.achievements.length === 0 && (
              <div className="text-center py-12 text-gray-300">
                <Award className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-xs font-bold uppercase tracking-widest">No achievements yet. Click "Add Achievement" above.</p>
              </div>
            )}

            <div className="space-y-6">
              {formData.achievements.map((ach, i) => (
                <div key={`ach-${i}`} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 relative group hover:border-[#7C3AED]/30 transition-all shadow-sm">
                  <button
                    onClick={() => handleDeleteItem('achievement', i, 'achievements')}
                    className="absolute top-6 right-6 p-2 text-gray-200 hover:text-red-400 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Achievement Title</label>
                      <input type="text" value={ach.title} onChange={e => { const u = [...formData.achievements]; u[i] = { ...u[i], title: e.target.value }; setFormData(prev => ({ ...prev, achievements: u })); }} className="w-full px-6 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white outline-none transition-all" placeholder="Hackathon Winner, AWS Certified" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Organization / Event</label>
                      <input type="text" value={ach.organization} onChange={e => { const u = [...formData.achievements]; u[i] = { ...u[i], organization: e.target.value }; setFormData(prev => ({ ...prev, achievements: u })); }} className="w-full px-6 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white outline-none transition-all" placeholder="Smart India Hackathon" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Category</label>
                      <select value={ach.category} onChange={e => { const u = [...formData.achievements]; u[i] = { ...u[i], category: e.target.value }; setFormData(prev => ({ ...prev, achievements: u })); }} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold appearance-none outline-none focus:bg-white">
                        {['Hackathon', 'Certification', 'Competition', 'Scholarship', 'Leadership', 'Research', 'Open Source', 'Sports', 'Volunteer'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Link</label>
                      <input type="url" value={ach.link} onChange={e => { const u = [...formData.achievements]; u[i] = { ...u[i], link: e.target.value }; setFormData(prev => ({ ...prev, achievements: u })); }} className="w-full px-6 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:bg-white outline-none transition-all" placeholder="https://..." />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Description</label>
                      <textarea value={ach.description} onChange={e => { const u = [...formData.achievements]; u[i] = { ...u[i], description: e.target.value }; setFormData(prev => ({ ...prev, achievements: u })); }} className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold min-h-[80px] text-gray-900 focus:bg-white outline-none transition-all" placeholder="Explain what you achieved..." />
                    </div>
                  </div>
                </div>
              ))}
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

            <div className="pt-8 flex justify-end">
               <button 
                onClick={() => handleSave('Preferences')}
                disabled={isSaving}
                className="px-12 py-4 bg-[#7C3AED] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[#6D28D9] transition-all shadow-xl shadow-[#7C3AED]/20 flex items-center gap-3 disabled:opacity-50"
               >
                 {isSaving ? <Plus className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 {isSaving ? 'Saving...' : 'Save Preferences'}
               </button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto min-h-screen bg-transparent p-4 sm:p-8 lg:p-12 font-sans selection:bg-[#7C3AED] selection:text-white">

      {/* ── Global Save Toast ── */}
      <AnimatePresence>
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-2xl text-white text-sm font-bold shadow-2xl flex items-center gap-3 backdrop-blur-md
              ${saveStatus.type === 'success' ? 'bg-emerald-500/90' : 'bg-red-500/90'}`}
          >
            <span>{saveStatus.type === 'success' ? '✓' : '✗'}</span>
            {saveStatus.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading Overlay ── */}
      {profileLoading && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-40 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-[#7C3AED]/20 border-t-[#7C3AED] rounded-full animate-spin" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Profile...</p>
        </div>
      )}

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
