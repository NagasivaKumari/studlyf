import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Layout, Wand2, Loader2, Plus, Trash2, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';

const PortfolioBuilder: React.FC = () => {
    const [step, setStep] = useState(1);
    const [inputMethod, setInputMethod] = useState<'upload' | 'manual' | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        skills: '',
        summary: ''
    });
    const [experience, setExperience] = useState([{ company: '', role: '', year: '', details: '' }]);
    const [projects, setProjects] = useState([{ name: '', description: '', technologies: '', link: '' }]);
    const [certifications, setCertifications] = useState([{ name: '', issuer: '', date: '', link: '' }]);

    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleExpChange = (index: number, field: string, value: string) => {
        const newExp = [...experience];
        newExp[index] = { ...newExp[index], [field]: value };
        setExperience(newExp);
    };

    const handleProjChange = (index: number, field: string, value: string) => {
        const newProj = [...projects];
        newProj[index] = { ...newProj[index], [field]: value };
        setProjects(newProj);
    };

    const handleCertChange = (index: number, field: string, value: string) => {
        const newCert = [...certifications];
        newCert[index] = { ...newCert[index], [field]: value };
        setCertifications(newCert);
    };

    const addExperience = () => setExperience([...experience, { company: '', role: '', year: '', details: '' }]);
    const removeExperience = (index: number) => setExperience(experience.filter((_, i) => i !== index));

    const addProject = () => setProjects([...projects, { name: '', description: '', technologies: '', link: '' }]);
    const removeProject = (index: number) => setProjects(projects.filter((_, i) => i !== index));

    const addCertification = () => setCertifications([...certifications, { name: '', issuer: '', date: '', link: '' }]);
    const removeCertification = (index: number) => setCertifications(certifications.filter((_, i) => i !== index));

    const generatePortfolio = async () => {
        setIsGenerating(true);
        const data = new FormData();
        data.append('template_id', selectedTemplate || 'neon_glass');

        if (inputMethod === 'upload' && file) {
            data.append('resume', file);
        } else {
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('role', formData.role);
            data.append('skills', formData.skills);
            data.append('summary', formData.summary);
            data.append('experience', JSON.stringify(experience));
            data.append('projects', JSON.stringify(projects));
            data.append('certifications', JSON.stringify(certifications));
        }

        try {
            const response = await fetch(`${API_BASE_URL}/generate-portfolio/`, {
                method: 'POST',
                body: data,
            });
            const result = await response.json();
            if (result.portfolio_url) {
                setGeneratedUrl(result.portfolio_url);
                setStep(4);
            }
        } catch (error) {
            console.error('Error generating portfolio:', error);
            alert('Failed to generate portfolio. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-purple-100 selection:text-purple-900 overflow-x-hidden relative">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 pt-32 pb-12 relative z-10">
                <AnimatePresence mode="wait">

                    {/* Step 1: Input Method */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-2xl mx-auto text-center px-4"
                        >
                            <h2 className="text-3xl sm:text-4xl font-black mb-8">How should we start?</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button
                                    onClick={() => { setInputMethod('upload'); setStep(2); }}
                                    className="p-8 rounded-3xl border-2 border-dashed border-gray-200 hover:border-purple-600 hover:bg-purple-50 transition-all group"
                                >
                                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                                    <h3 className="text-xl font-bold mb-2">Upload Resume</h3>
                                    <p className="text-sm text-gray-500">Auto-extract data from PDF/DOCX</p>
                                </button>
                                <button
                                    onClick={() => { setInputMethod('manual'); setStep(2); }}
                                    className="p-8 rounded-3xl border-2 border-dashed border-gray-200 hover:border-purple-600 hover:bg-purple-50 transition-all group"
                                >
                                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                                    <h3 className="text-xl font-bold mb-2">Manual Entry</h3>
                                    <p className="text-sm text-gray-500">Fill in your details manually</p>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Data Entry */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-4xl mx-auto"
                        >
                            <button onClick={() => setStep(1)} className="mb-8 text-sm font-bold text-gray-400 hover:text-gray-900 flex items-center gap-2">
                                ← BACK
                            </button>

                            {inputMethod === 'upload' ? (
                                <div className="bg-gray-50 p-6 sm:p-12 rounded-[2rem] text-center border-2 border-dashed border-gray-200">
                                    <input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="resume-upload"
                                        accept=".pdf,.docx,.doc"
                                    />
                                    <label htmlFor="resume-upload" className="cursor-pointer block">
                                        <Upload className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-purple-600" />
                                        <span className="text-base sm:text-lg font-bold block mb-2">{file ? file.name : 'Click to Upload Resume'}</span>
                                        <span className="text-[10px] sm:text-sm text-gray-500">Supported: PDF, DOCX</span>
                                    </label>
                                    {file && (
                                        <button
                                            onClick={() => setStep(3)}
                                            className="mt-6 sm:mt-8 px-6 sm:px-8 py-2.5 sm:py-3 bg-purple-600 text-white rounded-full font-bold hover:bg-purple-700 transition"
                                        >
                                            Continue
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Full Name</label>
                                            <input name="name" value={formData.name} onChange={handleInputChange} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-600 transition" placeholder="John Doe" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Email</label>
                                            <input name="email" value={formData.email} onChange={handleInputChange} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-600 transition" placeholder="john@example.com" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Role / Title</label>
                                        <input name="role" value={formData.role} onChange={handleInputChange} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-600 transition" placeholder="Full Stack Developer" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Skills (Comma separated)</label>
                                        <input name="skills" value={formData.skills} onChange={handleInputChange} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-600 transition" placeholder="React, Node.js, Python..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Summary</label>
                                        <textarea name="summary" value={formData.summary} onChange={handleInputChange} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-600 transition h-32" placeholder="Brief professional summary..." />
                                    </div>

                                    {/* Dynamic Experience Section */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-gray-100 p-4 rounded-xl">
                                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0">Experience</label>
                                            <button onClick={addExperience} className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700 transition flex items-center gap-1"><Plus size={14} /> Add</button>
                                        </div>
                                        {experience.map((exp, idx) => (
                                            <div key={idx} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 relative group">
                                                {experience.length > 1 && (
                                                    <button onClick={() => removeExperience(idx)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                                )}
                                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                                    <input placeholder="Company" value={exp.company} onChange={(e) => handleExpChange(idx, 'company', e.target.value)} className="p-3 bg-white rounded-lg border border-gray-200 text-sm" />
                                                    <input placeholder="Role" value={exp.role} onChange={(e) => handleExpChange(idx, 'role', e.target.value)} className="p-3 bg-white rounded-lg border border-gray-200 text-sm" />
                                                </div>
                                                <input placeholder="Year (e.g. 2023-2024)" value={exp.year} onChange={(e) => handleExpChange(idx, 'year', e.target.value)} className="w-full p-3 bg-white rounded-lg border border-gray-200 text-sm mb-4" />
                                                <textarea placeholder="Key Achievements..." value={exp.details} onChange={(e) => handleExpChange(idx, 'details', e.target.value)} className="w-full p-3 bg-white rounded-lg border border-gray-200 text-sm h-20" />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Dynamic Projects Section */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-gray-100 p-4 rounded-xl">
                                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0">Projects</label>
                                            <button onClick={addProject} className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700 transition flex items-center gap-1"><Plus size={14} /> Add</button>
                                        </div>
                                        {projects.map((proj, idx) => (
                                            <div key={idx} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 relative group">
                                                {projects.length > 1 && (
                                                    <button onClick={() => removeProject(idx)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                                )}
                                                <div className="mb-4 space-y-4">
                                                    <input placeholder="Project Name" value={proj.name} onChange={(e) => handleProjChange(idx, 'name', e.target.value)} className="w-full p-3 bg-white rounded-lg border border-gray-200 text-sm font-bold" />
                                                    <input placeholder="Deployed Link (e.g. https://myapp.com)" value={proj.link} onChange={(e) => handleProjChange(idx, 'link', e.target.value)} className="w-full p-3 bg-white rounded-lg border border-gray-200 text-sm" />
                                                </div>
                                                <input placeholder="Technologies (e.g. React, Node)" value={proj.technologies} onChange={(e) => handleProjChange(idx, 'technologies', e.target.value)} className="w-full p-3 bg-white rounded-lg border border-gray-200 text-sm mb-4" />
                                                <textarea placeholder="Project Description..." value={proj.description} onChange={(e) => handleProjChange(idx, 'description', e.target.value)} className="w-full p-3 bg-white rounded-lg border border-gray-200 text-sm h-20" />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Dynamic Certifications Section */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-gray-100 p-4 rounded-xl">
                                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0">Certifications</label>
                                            <button onClick={addCertification} className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700 transition flex items-center gap-1"><Plus size={14} /> Add</button>
                                        </div>
                                        {certifications.map((cert, idx) => (
                                            <div key={idx} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 relative group">
                                                <button onClick={() => removeCertification(idx)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                                    <input placeholder="Certificate Name" value={cert.name} onChange={(e) => handleCertChange(idx, 'name', e.target.value)} className="p-3 bg-white rounded-lg border border-gray-200 text-sm font-bold" />
                                                    <input placeholder="Issuer (e.g. Coursera, AWS)" value={cert.issuer} onChange={(e) => handleCertChange(idx, 'issuer', e.target.value)} className="p-3 bg-white rounded-lg border border-gray-200 text-sm" />
                                                </div>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <input placeholder="Date (e.g. 2024)" value={cert.date} onChange={(e) => handleCertChange(idx, 'date', e.target.value)} className="p-3 bg-white rounded-lg border border-gray-200 text-sm" />
                                                    <input placeholder="Certificate Link (Optional)" value={cert.link} onChange={(e) => handleCertChange(idx, 'link', e.target.value)} className="p-3 bg-white rounded-lg border border-gray-200 text-sm" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-end pt-8">
                                        <button
                                            onClick={() => setStep(3)}
                                            className="px-8 py-3 bg-purple-600 text-white rounded-full font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200"
                                        >
                                            Choose Template →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Step 3: Template Selection */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <button onClick={() => setStep(2)} className="mb-6 sm:mb-8 text-sm font-bold text-gray-400 hover:text-gray-900 flex items-center gap-2">
                                ← BACK
                            </button>
                            <h2 className="text-3xl sm:text-4xl font-black mb-8 text-center">Choose your aesthetic.</h2>

                            <div className="grid md:grid-cols-3 gap-8">
                                {[
                                    { id: 'neon_glass', name: 'Neon Glass', desc: 'Dark mode, glowing accents, futuristic feel.', icon: Layout, color: 'bg-purple-900 text-purple-200' },
                                    { id: 'swiss_minimal', name: 'Swiss Minimal', desc: 'Clean, bold typography, high contrast white.', icon: Layout, color: 'bg-gray-100 text-gray-900' },
                                    { id: 'creative_clean', name: 'Creative Clean', desc: 'Vibrant, colourful accents, modern layout.', icon: Layout, color: 'bg-orange-100 text-orange-900' },
                                    { id: 'tech_noir', name: 'Tech Noir', desc: 'Cyberpunk aesthetic, glitch effects, neon terminal.', icon: Wand2, color: 'bg-black text-cyan-400 border-cyan-500' },
                                    { id: 'minimal_bold', name: 'Minimal Bold', desc: 'Oversized typography, marquee effects, brutalist.', icon: FileText, color: 'bg-white text-black border-4 border-black' }
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTemplate(t.id)}
                                        className={`p-8 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group h-full flex flex-col justify-between ${selectedTemplate === t.id ? 'ring-4 ring-purple-400 scale-105' : 'border-gray-200 hover:border-purple-300'} ${t.color}`}
                                    >
                                        <div className="relative z-10">
                                            <t.icon className={`w-8 h-8 mb-4`} />
                                            <h3 className="text-xl font-bold mb-2">{t.name}</h3>
                                            <p className="text-sm opacity-80">{t.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-12 text-center">
                                <button
                                    onClick={generatePortfolio}
                                    disabled={!selectedTemplate || isGenerating}
                                    className={`px-12 py-4 rounded-full font-black text-lg tracking-wide shadow-2xl transition-all ${!selectedTemplate ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#111827] text-white hover:scale-105 hover:shadow-black/20'}`}
                                >
                                    {isGenerating ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> GENERATING...</span> : <span className="flex items-center gap-2"><Wand2 size={20} /> GENERATE PORTFOLIO</span>}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 text-green-600">
                                <Wand2 size={32} />
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black mb-4 sm:mb-6">It's Ready.</h2>
                            <p className="text-lg sm:text-xl text-gray-500 mb-8 sm:mb-12">Your intelligent portfolio has been generated.</p>

                            <div className="flex justify-center gap-4">
                                <a
                                    href={generatedUrl || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-8 py-4 bg-[#111827] text-white rounded-full font-bold hover:scale-105 transition flex items-center gap-2 shadow-xl"
                                >
                                    View Live Site <ExternalLink size={18} />
                                </a>
                                <button
                                    onClick={() => { setStep(1); setGeneratedUrl(null); }}
                                    className="px-8 py-4 bg-white border border-gray-200 text-gray-900 rounded-full font-bold hover:bg-gray-50 transition"
                                >
                                    Create Another
                                </button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default PortfolioBuilder;
