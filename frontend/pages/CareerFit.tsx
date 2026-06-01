import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../apiConfig';

const CareerFit: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/student/career-assessment/questions`);
        if (res.ok) {
          const data = await res.json();
          if (data) setQuestions(data);
        }
      } catch {}
      setLoading(false);
    };
    fetchQuestions();
  }, []);

  const handleSelect = async (value: string) => {
    const newAnswers = [...answers, { step: activeStep + 1, value }];
    setAnswers(newAnswers);

    if (activeStep < questions.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      try {
        const res = await fetch(`${API_BASE_URL}/api/student/career-assessment/result`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('auth_token') ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } : {}) },
          body: JSON.stringify({ answers: newAnswers }),
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data.results);
        }
      } catch {}
      setCompleted(true);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-24 px-6 bg-white min-h-screen">
        <div className="max-w-5xl mx-auto rounded-[2.5rem] border border-gray-100 bg-white shadow-sm p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-6 text-[#7C3AED] font-black text-[10px] uppercase tracking-[0.3em]">
            <div className="w-4 h-4 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
            Calculating career fit
          </div>
          <div className="h-12 w-2/3 rounded-full bg-gray-100 animate-pulse mb-4" />
          <div className="h-5 w-full rounded-full bg-gray-100 animate-pulse mb-2" />
          <div className="h-5 w-4/5 rounded-full bg-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  const steps = questions.length > 0 ? questions : [
    { step: 1, title: "Problem Space", question: "Which engineering context excites you most?", options: [{ label: "Distributed Systems", value: "distributed" }, { label: "Data Orchestration", value: "data" }, { label: "User Interaction", value: "frontend" }, { label: "ML Lifecycle", value: "ml" }] },
    { step: 2, title: "Mental Model", question: "How do you approach problem-solving?", options: [{ label: "First Principles", value: "first_principles" }, { label: "Pattern Recognition", value: "patterns" }, { label: "Iterative Experimentation", value: "iterative" }, { label: "Design Thinking", value: "design" }] },
    { step: 3, title: "Tool Preference", question: "What defines your ideal development loop?", options: [{ label: "Go / Rust / Kafka / k8s", value: "infra" }, { label: "Python / SQL / Spark", value: "data" }, { label: "TypeScript / React", value: "frontend" }, { label: "Python / PyTorch / LangChain", value: "ai" }] }
  ];

  return (
    <div className="pt-32 pb-24 px-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <span className="text-[#7C3AED] font-bold uppercase tracking-[0.5em] text-[10px] mb-6 block">Role Discovery</span>
            <h1 className="text-5xl sm:text-7xl font-black text-[#111827] mb-8 leading-[0.9] tracking-tighter uppercase">
              Identify Your <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4DFF] via-[#EC4899] to-[#FF5B5B] inline-block">ENGINEERING FIT.</span>
            </h1>
            <p className="text-xl text-[#475569] mb-12 leading-relaxed max-w-lg">We match your cognitive style to the roles where you can achieve immediate high authority.</p>

            <div className="flex items-center gap-2 mb-12">
              {steps.map((_, i) => (
                <div key={i} className={`h-1 flex-grow rounded-full transition-all duration-500 ${i <= activeStep ? 'bg-[#7C3AED]' : 'bg-gray-100'}`} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {!completed ? (
                <motion.div key={activeStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">{steps[activeStep].title}</span>
                    <h3 className="text-2xl font-bold text-[#111827]">{steps[activeStep].question || steps[activeStep].q}</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(steps[activeStep].options || []).map((opt: any, i: number) => (
                      <button key={i} onClick={() => handleSelect(opt.value || opt)}
                        className="p-6 border border-gray-100 rounded-2xl text-left hover:border-[#7C3AED] hover:bg-[#F5F3FF] transition-all font-bold text-sm text-[#374151]"
                      >{opt.label || opt}</button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#F5F3FF] p-10 rounded-[2.5rem] border border-[#7C3AED]/10">
                  <h3 className="text-2xl font-black text-[#111827] uppercase tracking-tight mb-6">Discovery Result</h3>
                  <div className="space-y-6">
                    {(results.length > 0 ? results : [
                      { role: "Backend Architect", score: 94 },
                      { role: "ML Engineer", score: 72 },
                      { role: "Data Scientist", score: 65 }
                    ]).map((res: any, i: number) => (
                      <div key={i}>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-[#111827]">{res.role}</span>
                          <span className="text-xs font-mono text-[#7C3AED] font-bold">{res.score}%</span>
                        </div>
                        <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-100">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${res.score}%` }} transition={{ delay: 0.5 + i * 0.2 }} className="h-full bg-[#7C3AED]" />
                        </div>
                      </div>
                    ))}
                    {results.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-[#7C3AED]/20 bg-white p-6 text-sm text-[#475569]">
                        No assessment results yet.
                      </div>
                    )}
                  </div>
                  <button onClick={() => { setCompleted(false); setActiveStep(0); setAnswers([]); setResults([]); }}
                    className="mt-10 text-[9px] font-black uppercase tracking-widest text-[#7C3AED] underline underline-offset-4">Retake Discovery</button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="hidden lg:block relative h-[600px] w-full">
            <div className="absolute inset-0 bg-[#7C3AED]/5 rounded-[4rem] border-8 border-gray-50 overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover grayscale opacity-40 mix-blend-multiply" alt="" />
              <div className="absolute inset-0 bg-grid-tech opacity-20" />
              <div className="absolute bottom-12 left-12 right-12 bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-white/20">
                <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest mb-2 block">Cognitive Profile</span>
                <p className="text-sm font-bold text-[#111827] leading-relaxed">Your profile suggests high suitability for system-level governance and resilience engineering.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerFit;