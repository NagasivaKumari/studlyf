import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    Upload, 
    FileText, 
    Layout, 
    Wand2, 
    Loader2, 
    Plus, 
    Trash2, 
    ExternalLink, 
    ArrowRight, 
    Sparkles, 
    CheckCircle2, 
    Zap,
    ChevronRight,
    Briefcase,
    Mail,
    User,
    Award,
    Code2
} from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';

const PortfolioBuilder: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [inputMethod, setInputMethod] = useState<'upload' | 'manual'>('manual');
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

    const [selectedTemplate, setSelectedTemplate] = useState<string | null>('neon_glass');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

    useEffect(() => { window.scrollTo(0, 0); }, [step]);

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
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-purple-100 selection:text-purple-900 overflow-x-hidden relative pt-24 pb-20">
            <style>{`
                @keyframes sp-shimmer {
                    0%   { transform: translateX(-180%) skewX(-20deg); }
                    100% { transform: translateX(300%) skewX(-20deg); }
                }
                @keyframes sp-orb1 {
                    0%,100% { transform: translate(0px,0px) scale(1);    opacity:0.55; }
                    40%     { transform: translate(8px,-6px) scale(1.3);  opacity:0.9; }
                    70%     { transform: translate(-4px,4px) scale(0.8);  opacity:0.4; }
                }
                .sp-btn {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 20px 48px;
                    background: #7C3AED;
                    color: #fff;
                    font-weight: 900;
                    font-size: 11px;
                    letter-spacing: 0.3em;
                    text-transform: uppercase;
                    border: none;
                    border-radius: 16px;
                    cursor: pointer;
                    overflow: hidden;
                    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
                    box-shadow: 0 4px 20px rgba(124,58,237,0.4), 0 1px 0 rgba(255,255,255,0.12) inset;
                }
                .sp-btn::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 55%);
                    pointer-events: none;
                    z-index: 1;
                }
                .sp-btn::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0;
                    width: 40%; height: 100%;
                    background: linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.24) 50%, transparent 80%);
                    animation: sp-shimmer 2.8s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 2;
                }
                .sp-btn:not(:disabled):hover {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 0 0 5px rgba(139,92,246,0.18), 0 0 32px 12px rgba(139,92,246,0.45), 0 16px 40px rgba(109,40,217,0.5);
                }
                .sp-label { position:relative; z-index:5; display:flex; align-items:center; gap:8px; justify-content:center; }
                
                .clean-input {
                    width: 100%;
                    background: #F9FAFB;
                    border: 1px solid #F1F5F9;
                    border-radius: 1.25rem;
                    padding: 1.25rem 1.5rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                .clean-input:focus {
                    outline: none;
                    background: #FFFFFF;
                    border-color: #7C3AED;
                    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.05);
                }
                .section-card {
                    background: #FFFFFF;
                    border: 1px solid #F1F5F9;
                    border-radius: 2rem;
                    padding: 2.5rem;
                    transition: all 0.3s ease;
                }
                .section-card:hover {
                    border-color: #E2E8F0;
                    box-shadow: 0 20px 40px -15px rgba(0,0,0,0.03);
                }
            `}</style>

            <AnimatePresence mode="wait">
                {/* Step 1: Landing / Intro */}
                {step === 1 && (
                    <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-7xl mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <div>
                                <span className="text-[#7C3AED] font-bold uppercase tracking-[0.5em] text-[10px] mb-6 block">Proof of Skill</span>
                                <h1 className="text-5xl sm:text-7xl font-black text-[#111827] mb-8 leading-[0.9] tracking-tighter uppercase">
                                    Portfolio <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4DFF] via-[#EC4899] to-[#FF5B5B] inline-block">BUILDER.</span>
                                </h1>
                                <p className="text-xl text-[#475569] mb-12 leading-relaxed max-w-lg font-medium">
                                    Convert your experience into a clinical engineering portfolio. Showcase evidence of your prowess with data-backed aesthetic templates.
                                </p>
                                
                                <div className="flex flex-col sm:flex-row gap-6 items-start">
                                    <button onClick={() => setStep(2)} className="sp-btn">
                                        <span className="sp-label">Initialize Builder <ArrowRight className="w-5 h-5" /></span>
                                    </button>
                                    <button onClick={() => { setInputMethod('upload'); setStep(2); }} className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center gap-2">
                                        <Upload size={16} /> Import from Resume
                                    </button>
                                </div>
                            </div>
                            <div className="hidden lg:block relative h-[520px] w-full max-w-[520px] ml-auto">
                                <div className="absolute inset-0 bg-[#7C3AED]/5 rounded-[4rem] border-8 border-gray-50 overflow-hidden shadow-2xl">
                                    <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover grayscale opacity-40 mix-blend-multiply" alt="Portfolio Visualization" />
                                    <div className="absolute bottom-12 left-12 right-12 bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-white/20">
                                        <div className="flex gap-2 mb-4">
                                            <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                                            <div className="w-2 h-2 rounded-full bg-[#7C3AED]/30" />
                                            <div className="w-2 h-2 rounded-full bg-[#7C3AED]/30" />
                                        </div>
                                        <p className="text-sm font-bold text-[#111827] leading-relaxed">"Your portfolio is the evidence of your capability. Make it undeniable."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Data Entry (The "Clean" Builder) */}
                {step === 2 && (
                    <motion.div key="build" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-4xl mx-auto px-6">
                        <div className="flex items-center justify-between mb-16">
                            <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-2 transition-colors">
                                <ArrowRight className="w-4 h-4 rotate-180" /> Back to Intro
                            </button>
                            <div className="flex gap-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${i <= 1 ? 'bg-[#7C3AED]' : 'bg-gray-100'}`} />
                                ))}
                            </div>
                        </div>

                        {inputMethod === 'upload' && !file ? (
                            <div className="section-card text-center py-20 border-dashed border-2 border-gray-200">
                                <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="resume-upload" accept=".pdf,.docx,.doc" />
                                <label htmlFor="resume-upload" className="cursor-pointer block">
                                    <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Upload className="w-8 h-8 text-[#7C3AED]" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">Upload Evidence.</h3>
                                    <p className="text-sm text-gray-400 mb-8">Drop your resume to auto-populate the fields.</p>
                                </label>
                                {file && (
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm font-bold text-[#111827] mb-4 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">{file.name}</span>
                                        <button onClick={() => setInputMethod('manual')} className="sp-btn">
                                            <span className="sp-label">Analyze & Continue</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-12">
                                <div className="section-card">
                                    <h3 className="text-[10px] font-black text-[#7C3AED] uppercase tracking-[0.3em] mb-8">Personal Protocol</h3>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                <input name="name" value={formData.name} onChange={handleInputChange} className="clean-input !pl-14" placeholder="e.g. Alex Chen" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                <input name="email" value={formData.email} onChange={handleInputChange} className="clean-input !pl-14" placeholder="alex@engineering.com" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="section-card">
                                    <h3 className="text-[10px] font-black text-[#7C3AED] uppercase tracking-[0.3em] mb-8">Professional Core</h3>
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Target Role</label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                <input name="role" value={formData.role} onChange={handleInputChange} className="clean-input !pl-14" placeholder="e.g. Senior Backend Engineer" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Clinical Summary</label>
                                            <textarea name="summary" value={formData.summary} onChange={handleInputChange} className="clean-input h-32" placeholder="Briefly describe your engineering philosophy..." />
                                        </div>
                                    </div>
                                </div>

                                {/* Experience Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-6">
                                        <h3 className="text-[10px] font-black text-[#7C3AED] uppercase tracking-[0.3em]">Work History</h3>
                                        <button onClick={addExperience} className="text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-widest flex items-center gap-2 transition-colors">
                                            <Plus size={14} /> Add Stage
                                        </button>
                                    </div>
                                    {experience.map((exp, idx) => (
                                        <div key={idx} className="section-card group relative">
                                            {experience.length > 1 && (
                                                <button onClick={() => removeExperience(idx)} className="absolute top-8 right-8 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                                <input placeholder="Organization" value={exp.company} onChange={(e) => handleExpChange(idx, 'company', e.target.value)} className="clean-input" />
                                                <input placeholder="Role" value={exp.role} onChange={(e) => handleExpChange(idx, 'role', e.target.value)} className="clean-input" />
                                            </div>
                                            <input placeholder="Timeline (e.g. 2022 - Present)" value={exp.year} onChange={(e) => handleExpChange(idx, 'year', e.target.value)} className="clean-input mb-6" />
                                            <textarea placeholder="Key Contributions & Evidence..." value={exp.details} onChange={(e) => handleExpChange(idx, 'details', e.target.value)} className="clean-input h-24" />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-center pt-12">
                                    <button onClick={() => setStep(3)} className="sp-btn">
                                        <span className="sp-label">Continue to Aesthetics <ArrowRight className="w-5 h-5" /></span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Step 3: Template Selection */}
                {step === 3 && (
                    <motion.div key="aesthetic" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="max-w-6xl mx-auto px-6">
                        <div className="flex items-center justify-between mb-16">
                            <button onClick={() => setStep(2)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-2 transition-colors">
                                <ArrowRight className="w-4 h-4 rotate-180" /> Back to Builder
                            </button>
                            <div className="flex gap-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${i <= 2 ? 'bg-[#7C3AED]' : 'bg-gray-100'}`} />
                                ))}
                            </div>
                        </div>

                        <div className="text-center mb-16">
                            <h2 className="text-5xl font-black text-[#111827] uppercase tracking-tighter italic leading-none mb-4">Aesthetic <span className="text-[#7C3AED]">Protocol.</span></h2>
                            <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">Select a visual framework for your portfolio</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 mb-20">
                            {[
                                { id: 'neon_glass', name: 'Neon Glass', desc: 'Futuristic dark mode with glowing accents.', icon: Zap, color: 'bg-[#0f172a] text-cyan-400' },
                                { id: 'swiss_minimal', name: 'Swiss Minimal', desc: 'Bold typography and high contrast layout.', icon: Layout, color: 'bg-white text-black border-2 border-black' },
                                { id: 'tech_noir', name: 'Tech Noir', desc: 'Cyberpunk aesthetic for high-end engineers.', icon: Code2, color: 'bg-black text-[#7C3AED] border border-[#7C3AED]/20' }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTemplate(t.id)}
                                    className={`section-card !p-10 text-left relative overflow-hidden group transition-all duration-500 ${selectedTemplate === t.id ? 'ring-4 ring-[#7C3AED]/20 scale-[1.02] border-[#7C3AED]' : 'hover:border-[#7C3AED]/30'} ${t.color}`}
                                >
                                    <div className="relative z-10">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${selectedTemplate === t.id ? 'bg-[#7C3AED] text-white' : 'bg-gray-50 text-gray-400'}`}>
                                            <t.icon size={24} />
                                        </div>
                                        <h3 className="text-xl font-black mb-3 uppercase tracking-tighter">{t.name}</h3>
                                        <p className="text-sm opacity-60 font-medium leading-relaxed">{t.desc}</p>
                                    </div>
                                    {selectedTemplate === t.id && (
                                        <div className="absolute top-6 right-6">
                                            <CheckCircle2 className="text-[#7C3AED]" size={20} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-center">
                            <button onClick={generatePortfolio} disabled={isGenerating} className="sp-btn">
                                <span className="sp-label">
                                    {isGenerating ? <Loader2 className="animate-spin" /> : <><Sparkles className="w-5 h-5" /> Generate Portfolio</>}
                                </span>
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 4: Success */}
                {step === 4 && (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto px-6 text-center">
                        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-10 text-green-500">
                            <Wand2 size={40} />
                        </div>
                        <h2 className="text-6xl font-black text-[#111827] uppercase tracking-tighter italic leading-none mb-6">Protocol <span className="text-[#7C3AED]">Ready.</span></h2>
                        <p className="text-xl text-gray-500 mb-16 font-medium">Your clinical engineering portfolio has been synthesized.</p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <a href={generatedUrl || '#'} target="_blank" rel="noopener noreferrer" className="sp-btn !bg-black">
                                <span className="sp-label">View Live Site <ExternalLink size={18} /></span>
                            </a>
                            <button onClick={() => setStep(1)} className="px-12 py-5 bg-white border border-gray-200 text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center gap-4 hover:bg-gray-50 transition-all">
                                Create Another <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PortfolioBuilder;
