import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';
import {
    Code2,
    Mic,
    User,
    Sparkles,
    ArrowRight,
    CheckCircle2,
    Loader2,
    Send,
    AlertCircle,
    MicOff,
    Briefcase,
    Clock,
    ChevronRight,
    TrendingUp,
    Brain,
    Award,
    Target,
    ShieldCheck,
    Timer,
    MessageSquare,
    Zap,
    Trophy,
    Building2
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
type Step = 'INTRO' | 'API_KEY' | 'SETUP' | 'INTERVIEW' | 'REPORT';
type RoundIndex = 0 | 1 | 2;

interface ChatMessage {
    role: 'interviewer' | 'user';
    content: string;
    timestamp: string;
}

interface UserResponse {
    round: number;
    question: string;
    answer: string;
    suggestion: string;
    wordCount: number;
    mistakes?: string;
}

interface InterviewReport {
    overall_score: number;
    sections: {
        label: string;
        score: number;
        feedback: string;
    }[];
    detailed_analysis: {
        round_name: string;
        total_words: number;
        responses: UserResponse[];
    }[];
    strengths: string[];
    weaknesses: string[];
    verdict: string;
}

// ── Dummy Data ─────────────────────────────────────────────────────────────
const DUMMY_QUESTIONS = [
    [
        "How does the Java JVM manage memory, and what is the role of the Garbage Collector?",
        "Explain the difference between a SQL JOIN and a subquery in terms of performance.",
        "What are decorators in Python, and how would you implement an authentication decorator?",
        "Describe the 'vanishing gradient problem' in Deep Learning and one way to fix it.",
        "How do you ensure data consistency in a distributed microservices architecture?"
    ],
    [
        "Tell me about a time you had a conflict with a teammate. How did you resolve it?",
        "Describe a project you are most proud of. What was your specific contribution?",
        "How do you handle tight deadlines when multiple tasks are high priority?",
        "Tell me about a time you failed. What did you learn from that experience?",
        "Where do you see yourself professionally in the next three to five years?"
    ],
    [
        "Tell me about yourself and your background.",
        "What are your greatest strengths and weaknesses?",
        "Where do you see yourself in five years?",
        "Why do you want to work at our company?",
        "Describe a challenging situation and how you handled it.",
        "What motivates you to perform your best at work?",
        "How do you handle stress and pressure on the job?",
        "Do you have any questions for me?"
    ]
];

const DUMMY_REPORT: InterviewReport = {
    overall_score: 84,
    sections: [
        { label: 'Technical Depth', score: 88, feedback: 'Strong grasp of core Java fundamentals and system design.' },
        { label: 'Problem Solving', score: 82, feedback: 'Logical approach to DSA. Explained time complexity clearly.' },
        { label: 'Communication', score: 85, feedback: 'Very articulate. Handled behavioral scenarios professionally.' },
        { label: 'HR Final Call', score: 80, feedback: 'Professional attitude. Clearly communicated career goals.' }
    ],
    detailed_analysis: [
        {
            round_name: "Technical Round",
            total_words: 450,
            responses: [
                {
                    round: 0,
                    question: "How does the Java JVM manage memory?",
                    answer: "It uses heap and stack memory with a garbage collector.",
                    suggestion: "You should mention specific regions like Young Generation, Old Generation and the Metaspace for a more senior-level answer.",
                    wordCount: 12,
                    mistakes: "Lacked depth on generational collection."
                }
            ]
        },
        {
            round_name: "Behavioral Round",
            total_words: 320,
            responses: [
                {
                    round: 1,
                    question: "Tell me about a time you had a conflict with a teammate.",
                    answer: "I talked to them and we sorted it out by listening to each other.",
                    suggestion: "Try using the STAR method (Situation, Task, Action, Result). Quantify the impact of the resolution.",
                    wordCount: 15,
                    mistakes: "Missing 'Result' phase of the STAR method."
                }
            ]
        },
        {
            round_name: "HR Round",
            total_words: 280,
            responses: [
                {
                    round: 2,
                    question: "Where do you see yourself in five years?",
                    answer: "Working at a big company like yours in a lead position.",
                    suggestion: "Focus more on specific skill growth and how that growth helps the company specifically.",
                    wordCount: 14
                }
            ]
        }
    ],
    strengths: ['Backend System Design', 'JVM Internals', 'Articulate Communication'],
    weaknesses: ['Deep Learning Edge Cases', 'SQL Query Tuning'],
    verdict: 'Recommended for Hire'
};

export default function MockInterview() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('INTRO');
    const [setup, setSetup] = useState({ company: '', role: '', experience: 'FRESHER' });
    const [roundIndex, setRoundIndex] = useState<RoundIndex>(0);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [allResponses, setAllResponses] = useState<UserResponse[]>([]);

    const [userInput, setUserInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const [isListening, setIsListening] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const voiceTimeoutRef = useRef<any>(null);
    const recognitionRef = useRef<any>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const [report, setReport] = useState<InterviewReport | null>(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [hrCallOver, setHrCallOver] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [isDummyMode, setIsDummyMode] = useState(false);
    const dummyQIdxRef = useRef(0);
    const [blink, setBlink] = useState(false);
    const [mouthOpen, setMouthOpen] = useState(false);
    const mouthIntervalRef = useRef<any>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [showHint, setShowHint] = useState(false);
    const hintTimerRef = useRef<any>(null);

    const [apiKey, setApiKey] = useState(localStorage.getItem('groq_api_key') || '');
    const [showingKey, setShowingKey] = useState(false);
    const [isThinking, setIsThinking] = useState(false);

    const checkSkip = (text: string) => {
        const t = text.toLowerCase().trim();
        return t === 'skip' || t === 'idont know' || t === 'next question';
    };

    useEffect(() => { window.scrollTo(0, 0); }, [step]);
    useEffect(() => {
        if (chatEndRef.current?.parentElement) {
            const container = chatEndRef.current.parentElement;
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    // Character Logic
    useEffect(() => {
        const interval = setInterval(() => {
            setBlink(true);
            setTimeout(() => setBlink(false), 150);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

     useEffect(() => {
        if (isSpeaking) {
            mouthIntervalRef.current = setInterval(() => {
                setMouthOpen(m => !m);
            }, 180);
        } else {
            clearInterval(mouthIntervalRef.current);
            setMouthOpen(false);
        }
        return () => clearInterval(mouthIntervalRef.current);
    }, [isSpeaking]);

    // Idle Hint Logic: Triggered if user hasn't typed for 2 seconds after being asked a question.
    useEffect(() => {
        if (step !== 'INTERVIEW' || isSending || isSpeaking || userInput.trim().length > 0 || hrCallOver) {
            setShowHint(false);
            if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
            return;
        }

        if (messages.length > 0 && messages[messages.length - 1].role === 'interviewer') {
            if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
            hintTimerRef.current = setTimeout(() => {
                setShowHint(true);
            }, 2000);
        }

        return () => {
            if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
        };
    }, [userInput, step, isSending, isSpeaking, messages, hrCallOver]);

    // Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                if (currentTranscript.trim()) {
                    setVoiceTranscript(currentTranscript);
                    if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
                    voiceTimeoutRef.current = setTimeout(() => {
                        handleVoiceAnswer(currentTranscript);
                        recognitionRef.current?.stop();
                    }, 2000);
                }
            };
            recognitionRef.current.onend = () => setIsListening(false);
            recognitionRef.current.onerror = () => setIsListening(false);
        }
    }, [sessionId]);

    const startInterview = async () => {
        if (!setup.company.trim() || !setup.role.trim()) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/api/interview/setup`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Groq-API-Key': apiKey
                },
                body: JSON.stringify(setup)
            });
            const data = await res.json();
            setSessionId(data._id);
            setStep('INTERVIEW');
            setRoundIndex(0);

            // Add introduction for technical round
            const intro = `Hello! I'm Alex Chen, Senior Technical Lead at ${setup.company}. I'll be conducting your technical interview today.`;
            const firstQ = data.first_question || "Could you please introduce yourself and tell me about your technical background?";
            const fullMsg = `${intro} ${firstQ}`;

            setMessages([{ role: 'interviewer', content: fullMsg, timestamp: new Date().toLocaleTimeString() }]);
            speak(fullMsg, 0);
        } catch (err) {
            setIsDummyMode(true);
            setStep('INTERVIEW');
            setRoundIndex(0);
            const intro = `Hello! I'm Alex Chen, Senior Technical Lead at ${setup.company}. I'll be conducting your technical interview today.`;
            const firstQ = DUMMY_QUESTIONS[0][0];
            const fullMsg = `${intro} ${firstQ}`;
            setMessages([{ role: 'interviewer', content: fullMsg, timestamp: new Date().toLocaleTimeString() }]);
            speak(fullMsg, 0);
        } finally { setLoading(false); }
    };

    const handleSendChat = async () => {
        if (!userInput.trim() || isSending || isSpeaking) return;
        const turn = userInput;
        const lastQ = messages.filter(m => m.role === 'interviewer').slice(-1)[0]?.content || "";
         setMessages(prev => [...prev, { role: 'user', content: turn, timestamp: new Date().toLocaleTimeString() }]);

        const isSkip = checkSkip(turn);
        const actualResponse = isSkip ? turn : turn;

        // Track response metadata
        const newResponse: UserResponse = {
            round: roundIndex,
            question: lastQ,
            answer: actualResponse,
            wordCount: turn.split(' ').length,
            suggestion: roundIndex === 0 ? "Be more specific with technical terminology." : "Use the STAR method for better context.",
            mistakes: isSkip ? "Skipped question." : (roundIndex === 1 ? "Incomplete STAR methodology." : undefined)
        };
        setAllResponses(prev => [...prev, newResponse]);

        setUserInput('');
        setIsSending(true);
        setIsThinking(true);
        try {
             if (isDummyMode) {
                setTimeout(() => {
                    dummyQIdxRef.current++;
                    if (dummyQIdxRef.current >= 5) advanceRound();
                    else {
                        const nextQ = DUMMY_QUESTIONS[roundIndex][dummyQIdxRef.current];
                        setMessages(prev => [...prev, { role: 'interviewer', content: nextQ, timestamp: new Date().toLocaleTimeString() }]);
                        speak(nextQ, roundIndex);
                    }
                    setIsThinking(false);
                    setIsSending(false);
                }, 400); 
                return;
            }
             const res = await fetch(`${API_BASE_URL}/api/interview/chat`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Groq-API-Key': apiKey
                },
                body: JSON.stringify({ session_id: sessionId, user_response: actualResponse, round_index: roundIndex })
            });
            const data = await res.json();
            setIsThinking(false);
            if (data.is_round_complete) {
                advanceRound();
            } else {
                setMessages(prev => [...prev, { role: 'interviewer', content: data.interviewer_text, timestamp: new Date().toLocaleTimeString() }]);
                speak(data.interviewer_text, roundIndex);
            }
        } catch (err) {
            setIsThinking(false);
            console.error("Chat Error:", err);
        } finally { setIsSending(false); }
    };

    const advanceRound = async () => {
        setIsSending(true);
        setIsThinking(true);
        const nextRound = (roundIndex + 1) as RoundIndex;

        if (nextRound > 2) {
            setHrCallOver(true);
            setTimeout(() => fetchReport(), 2000);
            setIsSending(false);
            return;
        }

        try {
            // Fetch first question of next round from AI
            const res = await fetch(`${API_BASE_URL}/api/interview/chat`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Groq-API-Key': apiKey
                },
                body: JSON.stringify({ session_id: sessionId, user_response: "", round_index: nextRound })
            });
            const data = await res.json();
            setIsThinking(false);

            setRoundIndex(nextRound);
            setMessages([]); // Clear chat for new round

            // Add introduction based on round
            let intro = "";
            if (nextRound === 1) {
                intro = `Hello! I'm Sarah Johnson, Senior Engineering Manager at ${setup.company}. I'll be conducting your behavioral interview now.`;
            } else if (nextRound === 2) {
                intro = `Hello! I'm Michael Rodriguez, HR Director at ${setup.company}. I'll be conducting your final HR interview.`;
            }
            const fullMsg = `${intro} ${data.interviewer_text}`;

            setMessages([{ role: 'interviewer', content: fullMsg, timestamp: new Date().toLocaleTimeString() }]);
            speak(fullMsg, nextRound);
        } catch (err) {
            console.error("Transition Error:", err);
            // Fallback
            setRoundIndex(nextRound);
            if (nextRound === 2) startHrVoiceRound();
        } finally {
            setIsSending(false);
        }
    };

    const startHrVoiceRound = () => {
        const intro = `Hello! I'm Michael Rodriguez, HR Director at ${setup.company}. I'll be conducting your final HR interview. Tell me about your long-term career goals.`;
        setMessages([{ role: 'interviewer', content: intro, timestamp: new Date().toLocaleTimeString() }]);
        speak(intro, 2);
    };

    const walkOut = () => {
        // Stop any ongoing speech
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setIsListening(false);
        
        // Reset all interview state
        setStep('INTRO');
        setRoundIndex(0);
        setMessages([]);
        setSessionId(null);
        setIsDummyMode(false);
        setHrCallOver(false);
        setAllResponses([]);
        setReport(null);
        setUserInput('');
        
        // Redirect to dashboard/learner page
        navigate('/dashboard/learner');
    };

    const toggleMic = () => {
        if (isListening) {
            setIsListening(false);
            recognitionRef.current?.stop();
            if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
            if (voiceTranscript.trim()) handleVoiceAnswer(voiceTranscript);
        } else {
            setVoiceTranscript('');
            setIsListening(true);
            try { recognitionRef.current?.start(); } catch (err) { setIsListening(false); }
        }
    };

    const handleVoiceAnswer = async (text: string) => {
        if (!text.trim()) return;
        const lastQ = messages.filter(m => m.role === 'interviewer').slice(-1)[0]?.content || "";
        setIsSending(true);
        setIsThinking(true);
        setVoiceTranscript('');
        setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date().toLocaleTimeString() }]);

         const isSkip = checkSkip(text);
        const actualText = isSkip ? "I don't know the answer to this, next question please." : text;

        const newResponse: UserResponse = {
            round: 2,
            question: lastQ,
            answer: actualText,
            wordCount: text.split(' ').length,
            suggestion: "Expand your answers more to show confidence. Aim for 30+ words.",
            mistakes: isSkip ? "Skipped question." : (text.split(' ').length < 10 ? "Answer is too short." : undefined)
        };
        setAllResponses(prev => [...prev, newResponse]);

        try {
            if (isDummyMode) {
                setTimeout(() => {
                    dummyQIdxRef.current++;
                    if (dummyQIdxRef.current >= 5) {
                        setHrCallOver(true);
                        speak("That was a great conversation. I'm finalizing your report now.", 2);
                        setTimeout(() => fetchReport(), 3000);
                    } else {
                        const nextQ = DUMMY_QUESTIONS[2][dummyQIdxRef.current];
                        setMessages(prev => [...prev, { role: 'interviewer', content: nextQ, timestamp: new Date().toLocaleTimeString() }]);
                        speak(nextQ, 2);
                    }
                    setIsThinking(false);
                    setIsSending(false);
                }, 1000);
                return;
            }
             const res = await fetch(`${API_BASE_URL}/api/interview/chat`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Groq-API-Key': apiKey
                },
                body: JSON.stringify({ session_id: sessionId, user_response: actualText, round_index: 2 })
            });
            const data = await res.json();
            setIsThinking(false);
            if (data.is_round_complete) {
                setHrCallOver(true);
                setMessages(prev => [...prev, { role: 'interviewer', content: data.interviewer_text, timestamp: new Date().toLocaleTimeString() }]);
                speak(data.interviewer_text, 2);
                setTimeout(() => fetchReport(), 2500);
            } else {
                setMessages(prev => [...prev, { role: 'interviewer', content: data.interviewer_text, timestamp: new Date().toLocaleTimeString() }]);
                speak(data.interviewer_text, 2);
            }
        } catch (err) { 
            setIsThinking(false);
            console.error(err); 
        } finally { setIsSending(false); }
    };

    const speak = (text: string, currentRound: number) => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utteranceRef.current = utterance; // Prevent garbage collection

            // Voice Selection based on round
            const voices = window.speechSynthesis.getVoices();
            if (currentRound === 2) {
                // Female Voice for HR
                const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English'));
                if (femaleVoice) utterance.voice = femaleVoice;
                utterance.pitch = 1.2;
                utterance.rate = 1.0;
            } else {
                // Male Voice for Technical/Behavioral
                const maleVoice = voices.find(v => v.name.includes('Male') || v.name.includes('Alex') || v.name.includes('Google UK English Male'));
                if (maleVoice) utterance.voice = maleVoice;
                utterance.pitch = 0.9;
                utterance.rate = 1.0;
            }

            utterance.onstart = () => {
                setIsSpeaking(true);
                if (isListening) recognitionRef.current?.stop();
            };
            utterance.onend = () => {
                setIsSpeaking(false);
                if (currentRound === 2 && !hrCallOver) {
                    setIsListening(true);
                    try { recognitionRef.current?.start(); } catch (e) { }

                    // Initial 2s silence timeout (if user doesn't speak at all)
                    if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
                    voiceTimeoutRef.current = setTimeout(() => {
                        handleVoiceAnswer("No response received.");
                        recognitionRef.current?.stop();
                    }, 2000);
                }
            };
            window.speechSynthesis.speak(utterance);
        }
    };

    const fetchReport = async () => {
        // Stop any ongoing speech when transitioning to report
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setIsListening(false);
        
        setStep('REPORT');
        setLoadingReport(true);
        if (!sessionId || isDummyMode) {
            // Build detailed dummy report based on actual responses
            const reportData = { ...DUMMY_REPORT };
            const rounds = ["Technical Round", "Behavioral Round", "HR Round"];
            reportData.detailed_analysis = rounds.map((r, i) => {
                const roundRes = allResponses.filter(res => res.round === i);
                return {
                    round_name: r,
                    total_words: roundRes.reduce((acc, curr) => acc + curr.wordCount, 0),
                    responses: roundRes
                };
            });
            setReport(reportData);
            setLoadingReport(false);
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/interview/report?session_id=${sessionId}`);
            const data = await res.json();
            setReport(data);
        } catch (err) { setReport(DUMMY_REPORT); } finally { setLoadingReport(false); }
    };

    // Auto-fetch voices when they are loaded (some browsers load them asynchronously)
    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.getVoices();
        }
    }, []);

    const ROUND_META = [
        { label: 'Technical Round', icon: <Code2 className="w-5 h-5" />, color: '#7C3AED', hint: 'DSA, Architecture, and Logic. Type your answers.' },
        { label: 'Behavioral Round', icon: <User className="w-5 h-5" />, color: '#1D74F2', hint: 'Situational scenarios and culture fit. Type your answers.' },
        { label: 'HR Voice Round', icon: <Mic className="w-5 h-5" />, color: '#EC4899', hint: 'Real-time voice conversation with Sophia.' },
    ];

    const SpeakingAvatar = ({ isHR }: { isHR: boolean }) => {
        const eyeScaleY = blink ? 0.05 : 1;
        const getMouthPath = () => isSpeaking && mouthOpen ? "M 95 168 Q 110 180 125 168 Q 110 190 95 168 Z" : "M 92 168 Q 110 185 128 168";
        return (
            <div className="flex flex-col items-center">
                <style>{`@keyframes glowPulse { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.05)} } @keyframes breathing { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.01)} }`}</style>
                <div className="relative">
                    <div className={`absolute inset-0 ${isHR ? 'bg-cyan-400' : 'bg-[#7C3AED]'} rounded-full blur-[80px] opacity-15 animate-[glowPulse_3s_infinite]`} />
                    {isThinking && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-40 h-40 border-4 ${isHR ? 'border-cyan-400/20' : 'border-[#7C3AED]/20'} rounded-full animate-ping`} />
                            <div className={`absolute w-44 h-44 border-2 ${isHR ? 'border-cyan-400/10' : 'border-[#7C3AED]/10'} rounded-full animate-pulse`} />
                        </div>
                    )}
                    <svg width="180" height="300" viewBox="0 0 220 380" className="relative z-10 drop-shadow-xl overflow-visible">
                        <defs>
                            <radialGradient id="faceGrad" cx="50%" cy="45%" r="55%"><stop offset="0%" stopColor="#FFE0BB" /><stop offset="60%" stopColor="#F5C28A" /><stop offset="100%" stopColor="#E8A96B" /></radialGradient>
                            <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1e3a5f" /><stop offset="100%" stopColor="#0f2340" /></linearGradient>
                            <linearGradient id="maleSuit" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#2c3e50" /><stop offset="100%" stopColor="#1c2833" /></linearGradient>
                        </defs>
                        <g style={{ transformOrigin: "110px 300px", animation: "breathing 3s ease-in-out infinite" }}>
                            <path d="M 20 260 Q 10 310 8 380 L 212 380 Q 210 310 200 260 Q 168 282 110 284 Q 52 282 20 260 Z" fill={isHR ? "url(#suitGrad)" : "url(#maleSuit)"} />
                            <path d="M 78 226 L 110 220 L 142 226 L 126 276 L 110 282 L 94 276 Z" fill="#f0f4ff" />
                            <rect x="95" y="204" width="30" height="28" rx="10" fill="url(#faceGrad)" />
                        </g>
                        <ellipse cx="110" cy="138" rx="63" ry="68" fill="url(#faceGrad)" />
                        <path d="M 48 125 Q 46 70 72 52 Q 92 38 110 37 Q 128 38 148 52 Q 174 70 172 125 Q 158 100 142 93 Q 126 87 110 88 Q 94 87 78 93 Q 62 100 48 125 Z" fill={isHR ? "#1b0a33" : "#2c2c2c"} />
                        <g style={{ transformOrigin: "89px 130px", transform: `scaleY(${eyeScaleY})` }}>
                            <ellipse cx="89" cy="130" rx="14" ry="11" fill="white" /><circle cx="89" cy="131" r="9" fill="#3a1870" /><circle cx="89" cy="131" r="4.5" fill="#0a0416" /><circle cx="93" cy="127" r="2.8" fill="white" />
                        </g>
                        <g style={{ transformOrigin: "131px 130px", transform: `scaleY(${eyeScaleY})` }}>
                            <ellipse cx="131" cy="130" rx="14" ry="11" fill="white" /><circle cx="131" cy="131" r="9" fill="#3a1870" /><circle cx="131" cy="131" r="4.5" fill="#0a0416" /><circle cx="135" cy="127" r="2.8" fill="white" />
                        </g>
                        <path d={getMouthPath()} fill={isSpeaking && mouthOpen ? "#8B2040" : "none"} stroke="#b03050" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white pt-24 pb-20">
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
                @keyframes sp-orb2 {
                    0%,100% { transform: translate(0px,0px) scale(1);     opacity:0.4; }
                    35%     { transform: translate(-10px,-8px) scale(1.4); opacity:0.85; }
                    65%     { transform: translate(6px,5px) scale(0.75);   opacity:0.35; }
                }
                @keyframes sp-orb3 {
                    0%,100% { transform: translate(0px,0px) scale(1);    opacity:0.5; }
                    50%     { transform: translate(6px,8px) scale(1.25);  opacity:0.9; }
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
                    font-size: 12px;
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
                .sp-btn:not(:disabled):active { transform: scale(0.97); }
                .sp-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .sp-orb {
                    position: absolute;
                    border-radius: 50%;
                    pointer-events: none;
                    filter: blur(7px);
                    z-index: 1;
                }
                .sp-orb1 { width:28px; height:28px; background:radial-gradient(circle,rgba(196,168,255,0.95),transparent 70%); top:-4px; left:18px; animation:sp-orb1 3.2s ease-in-out infinite; }
                .sp-orb2 { width:22px; height:22px; background:radial-gradient(circle,rgba(255,255,255,0.8),transparent 70%);  bottom:-2px; right:48px; animation:sp-orb2 4s ease-in-out infinite; }
                .sp-orb3 { width:18px; height:18px; background:radial-gradient(circle,rgba(167,139,250,0.9),transparent 70%); top:4px; right:18px;  animation:sp-orb3 2.6s ease-in-out infinite; }
                .sp-label { position:relative; z-index:5; display:flex; align-items:center; gap:8px; justify-content:center; }
            `}</style>
            <AnimatePresence mode="wait">
                {step === 'INTRO' && (
                    <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-7xl mx-auto px-6 pt-12">
                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <div>
                                <span className="text-[#7C3AED] font-bold uppercase tracking-[0.5em] text-[10px] mb-6 block">Interview Readiness</span>
                                <h1 className="text-5xl sm:text-7xl font-black text-[#111827] mb-8 leading-[0.9] tracking-tighter uppercase">
                                    Mock <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4DFF] via-[#EC4899] to-[#FF5B5B] inline-block">INTERVIEW.</span>
                                </h1>
                                <p className="text-xl text-[#475569] mb-12 leading-relaxed max-w-lg font-medium">
                                    Simulate high-stakes interviews with our AI protocol. Practice Technical, Behavioral, and HR rounds to build clinical authority.
                                </p>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10 max-w-2xl">
                                    {[
                                        { label: 'Rounds', value: '3' },
                                        { label: 'Mode', value: 'Live AI' },
                                        { label: 'Timing', value: 'Adaptive' },
                                        { label: 'Feedback', value: 'Instant' },
                                    ].map(item => (
                                        <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{item.label}</div>
                                            <div className="mt-2 text-base font-black text-gray-900">{item.value}</div>
                                        </div>
                                    ))}
                                </div>
                                
                                <button onClick={() => setStep('API_KEY')} className="sp-btn">
                                    <span className="sp-orb sp-orb1" />
                                    <span className="sp-orb sp-orb2" />
                                    <span className="sp-orb sp-orb3" />
                                    <span className="sp-label">Start Practice <ArrowRight className="w-5 h-5" /></span>
                                </button>
                            </div>
                            <div className="hidden lg:block relative h-[520px] w-full max-w-[520px] ml-auto">
                                <div className="absolute inset-0 bg-[#7C3AED]/5 rounded-[4rem] border-8 border-gray-50 overflow-hidden shadow-2xl">
                                    <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover grayscale opacity-40 mix-blend-multiply" alt="Mock Interview Visualization" />
                                    <div className="absolute bottom-12 left-12 right-12 bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-white/20">
                                        <div className="flex gap-2 mb-4">
                                            <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                                            <div className="w-2 h-2 rounded-full bg-[#7C3AED]/30" />
                                            <div className="w-2 h-2 rounded-full bg-[#7C3AED]/30" />
                                        </div>
                                        <p className="text-sm font-bold text-[#111827] leading-relaxed">"Practice is the hardest part of learning, and training is the essence of transformation."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 'API_KEY' && (
                    <motion.div key="api-key" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto px-6 pt-16 relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[250px] bg-gradient-to-b from-[#7C3AED]/10 to-transparent blur-[100px] pointer-events-none -z-10" />
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                            <div className="text-center">
                                <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter italic">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4DFF] via-[#EC4899] to-[#FF5B5B] inline-block pb-1">
                                        API AUTH.
                                    </span>
                                </h2>
                                <div className="h-1 w-16 bg-black mx-auto rounded-full" />
                            </div>
                            <div className="space-y-6 text-left">
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-2">
                                    <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                                        <ShieldCheck size={14} /> Protocol Requirement
                                    </div>
                                    <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
                                        Our AI engine requires a <strong>Groq API Key</strong> to process low-latency conversations. 
                                        Don't have one? Get a free key at <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-900">console.groq.com</a>
                                    </p>
                                </div>
                                
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest ml-4">Groq API Key</label>
                                    <div className="relative">
                                        <Zap className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                        <input 
                                            type={showingKey ? "text" : "password"} 
                                            placeholder="gsk_..." 
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-14 py-4 text-xs font-bold focus:ring-4 focus:ring-violet-500/10 placeholder:text-gray-300" 
                                            value={apiKey} 
                                            onChange={e => setApiKey(e.target.value)} 
                                        />
                                        <button 
                                            onClick={() => setShowingKey(!showingKey)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                                        >
                                            <Sparkles size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-3">
                                    <style>{`
                                        @keyframes auth-shimmer {
                                            0%   { transform: translateX(-180%) skewX(-20deg); }
                                            100% { transform: translateX(300%) skewX(-20deg); }
                                        }
                                        @keyframes auth-orb1 {
                                            0%,100% { transform: translate(0px,0px) scale(1);    opacity:0.55; }
                                            40%     { transform: translate(8px,-6px) scale(1.3);  opacity:0.9; }
                                            70%     { transform: translate(-4px,4px) scale(0.8);  opacity:0.4; }
                                        }
                                        @keyframes auth-orb2 {
                                            0%,100% { transform: translate(0px,0px) scale(1);     opacity:0.4; }
                                            35%     { transform: translate(-10px,-8px) scale(1.4); opacity:0.85; }
                                            65%     { transform: translate(6px,5px) scale(0.75);   opacity:0.35; }
                                        }
                                        @keyframes auth-orb3 {
                                            0%,100% { transform: translate(0px,0px) scale(1);    opacity:0.5; }
                                            50%     { transform: translate(6px,8px) scale(1.25);  opacity:0.9; }
                                        }
                                        .auth-btn {
                                            position: relative;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            gap: 16px;
                                            width: 100%;
                                            padding: 20px 0;
                                            background: #7C3AED;
                                            color: #fff;
                                            font-weight: 900;
                                            font-size: 11px;
                                            letter-spacing: 0.4em;
                                            text-transform: uppercase;
                                            border: none;
                                            border-radius: 16px;
                                            cursor: pointer;
                                            overflow: hidden;
                                            transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
                                            box-shadow: 0 4px 20px rgba(124,58,237,0.4), 0 1px 0 rgba(255,255,255,0.12) inset;
                                        }
                                        .auth-btn:disabled {
                                            opacity: 0.5;
                                            cursor: not-allowed;
                                        }
                                        .auth-btn::before {
                                            content: '';
                                            position: absolute;
                                            inset: 0;
                                            border-radius: 16px;
                                            background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 55%);
                                            pointer-events: none;
                                            z-index: 1;
                                        }
                                        .auth-btn::after {
                                            content: '';
                                            position: absolute;
                                            top: 0; left: 0;
                                            width: 40%; height: 100%;
                                            background: linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.24) 50%, transparent 80%);
                                            animation: auth-shimmer 2.8s ease-in-out infinite;
                                            pointer-events: none;
                                            z-index: 2;
                                        }
                                        .auth-btn:not(:disabled):hover {
                                            transform: translateY(-3px) scale(1.02);
                                            box-shadow: 0 0 0 5px rgba(139,92,246,0.18), 0 0 32px 12px rgba(139,92,246,0.45), 0 16px 40px rgba(109,40,217,0.5);
                                        }
                                        .auth-btn:not(:disabled):active { transform: scale(0.97); }
                                        .auth-orb {
                                            position: absolute;
                                            border-radius: 50%;
                                            pointer-events: none;
                                            filter: blur(7px);
                                            z-index: 1;
                                        }
                                        .auth-orb1 { width:28px; height:28px; background:radial-gradient(circle,rgba(196,168,255,0.95),transparent 70%); top:-4px; left:18px; animation:auth-orb1 3.2s ease-in-out infinite; }
                                        .auth-orb2 { width:22px; height:22px; background:radial-gradient(circle,rgba(255,255,255,0.8),transparent 70%);  bottom:-2px; right:48px; animation:auth-orb2 4s ease-in-out infinite; }
                                        .auth-orb3 { width:18px; height:18px; background:radial-gradient(circle,rgba(167,139,250,0.9),transparent 70%); top:4px; right:18px;  animation:auth-orb3 2.6s ease-in-out infinite; }
                                        .auth-label { position:relative; z-index:5; display:flex; align-items:center; gap:16px; }
                                    `}</style>
                                    <button 
                                        onClick={() => {
                                            if (apiKey.startsWith('gsk_')) {
                                                localStorage.setItem('groq_api_key', apiKey);
                                                setStep('SETUP');
                                            } else {
                                                alert("Invalid key format. Groq keys usually start with 'gsk_'.");
                                            }
                                        }} 
                                        disabled={!apiKey.trim()} 
                                        className="auth-btn"
                                    >
                                        <span className="auth-orb auth-orb1" />
                                        <span className="auth-orb auth-orb2" />
                                        <span className="auth-orb auth-orb3" />
                                        <span className="auth-label">Authorize & Continue <ArrowRight className="w-4 h-4" /></span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 'SETUP' && (
                    <motion.div key="setup" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto px-6 pt-16 relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[250px] bg-gradient-to-b from-[#7C3AED]/10 to-transparent blur-[100px] pointer-events-none -z-10" />
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                            <div className="text-center">
                                <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter italic">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4DFF] via-[#EC4899] to-[#FF5B5B] inline-block pb-1">
                                        Session Config.
                                    </span>
                                </h2>
                                <div className="h-1 w-16 bg-black mx-auto rounded-full" />
                            </div>
                            <div className="space-y-6 text-left">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest ml-4">Target Role</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                        <input type="text" placeholder="e.g. Backend Developer" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-14 py-4 text-sm font-bold focus:ring-4 focus:ring-violet-500/10 placeholder:text-gray-300" value={setup.role} onChange={e => setSetup({ ...setup, role: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest ml-4">Target Institution</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                        <input type="text" placeholder="e.g. Google" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-14 py-4 text-sm font-bold focus:ring-4 focus:ring-violet-500/10 placeholder:text-gray-300" value={setup.company} onChange={e => setSetup({ ...setup, company: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center ml-4">
                                        <label className="text-[10px] font-black text-black uppercase tracking-widest">Experience Range</label>
                                        <span className="text-[11px] font-black text-black uppercase tracking-widest px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100 italic transition-all">{setup.experience}</span>
                                    </div>
                                    <div className="px-5 py-6 bg-gray-50/50 rounded-3xl border border-gray-100 shadow-inner">
                                        <input
                                            type="range"
                                            min="0"
                                            max="3"
                                            step="1"
                                            value={['FRESHER', '1-2 YRS', '2-3 YRS', '3+ YRS'].indexOf(setup.experience)}
                                            onChange={(e) => {
                                                const lvls = ['FRESHER', '1-2 YRS', '2-3 YRS', '3+ YRS'];
                                                setSetup({ ...setup, experience: lvls[parseInt(e.target.value)] });
                                            }}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#7C3AED] hover:accent-[#6C4DFF] focus:outline-none transition-all"
                                        />
                                        <div className="flex justify-between mt-4 px-1">
                                            {['FRESHER', '1-2 YRS', '2-3 YRS', '3+ YRS'].map((lvl, i) => (
                                                <div key={lvl} className="flex flex-col items-center gap-2">
                                                    <div className={`w-1 h-1 rounded-full ${setup.experience === lvl ? 'bg-black' : 'bg-gray-300'}`} />
                                                    <span className={`text-[8px] font-black uppercase tracking-widest text-black`}>{lvl}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-3">
                                    <button onClick={startInterview} disabled={loading || !setup.company || !setup.role} className={`sp-btn w-full !py-5 !rounded-2xl ${loading || !setup.company || !setup.role ? '!bg-gray-300 !text-white cursor-not-allowed' : ''}`}>
                                        <span className="sp-orb sp-orb1" />
                                        <span className="sp-orb sp-orb2" />
                                        <span className="sp-orb sp-orb3" />
                                        <span className="sp-label text-[11px] font-black uppercase tracking-[0.4em]">
                                            {loading ? <Loader2 className="animate-spin" /> : <>Generate Protocol <ArrowRight className="w-4 h-4" /></>}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 'INTERVIEW' && (
                    <motion.div key="interview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto px-6 pt-12">
                        <div className="flex items-center gap-4 mb-12">
                            {ROUND_META.map((m, i) => (
                                <div key={i} className="flex-1 flex flex-col gap-2">
                                    <div className={`h-1.5 rounded-full transition-all duration-700 ${i <= roundIndex ? 'bg-[#7C3AED]' : 'bg-gray-100'}`} />
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${i === roundIndex ? 'text-[#7C3AED]' : 'text-gray-400'}`}>{m.label}</span>
                                </div>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {roundIndex < 2 ? (
                                <motion.div
                                    key={`round-${roundIndex}`}
                                    initial={{ opacity: 0, scale: 0.98, x: 20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 1.02, x: -20 }}
                                    transition={{ duration: 0.5, ease: "anticipate" }}
                                    className="bg-white rounded-[3rem] border border-gray-100 shadow-3xl overflow-hidden h-[550px] flex"
                                >
                                    <div className="w-1/4 bg-gray-50 border-r border-gray-100 flex flex-col items-center justify-center p-6 sticky top-0 self-start h-full">
                                        <div className="mb-4 scale-75 origin-center"><SpeakingAvatar isHR={false} /></div>
                                        <div className="bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">{roundIndex === 0 ? 'Alex Chen - Tech Lead' : 'Sarah Johnson - Eng Manager'}</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                                        <div className="p-8 border-b border-gray-50 flex items-center justify-between shrink-0">
                                            <div className="flex items-center gap-3"><MessageSquare className="w-5 h-5 text-[#7C3AED]" /><h4 className="font-bold text-[#111827] text-sm uppercase tracking-tight">{ROUND_META[roundIndex].label}</h4></div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={walkOut} className="text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full uppercase tracking-widest transition-colors">Walk Out</button>
                                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase italic">{ROUND_META[roundIndex].hint}</span>
                                            </div>
                                        </div>
                                        <div className="flex-grow p-8 space-y-6 overflow-y-auto">
                                            {messages.map((m, i) => (
                                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[75%] px-6 py-4 rounded-[1.5rem] text-[13px] font-medium leading-relaxed ${m.role === 'interviewer' ? 'bg-[#F9FAFB] text-[#111827] rounded-tl-none border border-gray-100' : 'bg-[#7C3AED] text-white rounded-tr-none shadow-lg shadow-violet-500/10'}`}>{m.content}</div>
                                                </div>
                                            ))}
                                            {(isSending || isSpeaking) && <div className="flex items-center gap-2 text-gray-400 italic text-[10px] ml-4"><div className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-bounce" /><span>Alex is thinking...</span></div>}
                                            <div ref={chatEndRef} />
                                        </div>
                                         <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex flex-col gap-4">
                                            <AnimatePresence>
                                                {showHint && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                                                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                                                        className="flex flex-wrap gap-2 mb-2 p-3 bg-[#7C3AED]/5 rounded-2xl border border-[#7C3AED]/10 animate-pulse"
                                                    >
                                                        <span className="text-[9px] font-black text-[#7C3AED] uppercase tracking-widest mr-2 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" /> Quick Actions:
                                                        </span>
                                                        {['skip', 'idont know', 'next question'].map(hint => (
                                                            <button 
                                                                key={hint} 
                                                                onClick={async () => { 
                                                                    if (isSending || isSpeaking) return;
                                                                    const val = hint.toUpperCase();
                                                                    setMessages(prev => [...prev, { role: 'user', content: val, timestamp: new Date().toLocaleTimeString() }]);
                                                                    setIsSending(true);
                                                                    setIsThinking(true);
                                                                    try {
                                                                        const res = await fetch(`${API_BASE_URL}/api/interview/chat`, {
                                                                            method: 'POST',
                                                                            headers: { 
                                                                                'Content-Type': 'application/json',
                                                                                'X-Groq-API-Key': apiKey
                                                                            },
                                                                            body: JSON.stringify({ session_id: sessionId, user_response: val, round_index: roundIndex })
                                                                        });
                                                                        const data = await res.json();
                                                                        setIsThinking(false);
                                                                        if (data.is_round_complete) advanceRound();
                                                                        else {
                                                                            setMessages(prev => [...prev, { role: 'interviewer', content: data.interviewer_text, timestamp: new Date().toLocaleTimeString() }]);
                                                                            speak(data.interviewer_text, roundIndex);
                                                                        }
                                                                    } catch (e) {
                                                                        setIsThinking(false);
                                                                    } finally { setIsSending(false); }
                                                                }} 
                                                                className="px-4 py-1.5 bg-white border border-violet-100 rounded-full text-[10px] font-black text-[#7C3AED] uppercase tracking-widest hover:bg-violet-50 transition-all shadow-sm"
                                                            >
                                                                {hint}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            <div className="flex gap-4 items-center">
                                                <textarea rows={1} className="flex-1 bg-white border border-gray-100 rounded-2xl px-8 py-4 text-sm font-medium focus:ring-0 resize-none shadow-sm" placeholder="Draft your response..." value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendChat())} />
                                                <button onClick={handleSendChat} disabled={!userInput.trim() || isSending || isSpeaking} className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center hover:bg-[#7C3AED] transition-all"><Send className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="hr-round"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-[#0f1b2a] rounded-[4rem] border border-white/5 shadow-3xl overflow-hidden relative min-h-[700px] flex"
                                >
                                    <div className="absolute top-6 right-6 z-10">
                                        <button onClick={walkOut} className="text-[10px] font-bold text-red-400 bg-red-500/20 hover:bg-red-500/30 px-4 py-2 rounded-full uppercase tracking-widest transition-colors border border-red-500/30">Walk Out</button>
                                    </div>
                                    <div className="w-full flex">
                                        <div className="w-1/2 flex flex-col items-center justify-center p-12 border-r border-white/5 sticky top-0 self-start h-full min-h-[700px]">
                                            <SpeakingAvatar isHR={true} />
                                            <div className="mt-8 px-6 py-2 bg-white/5 rounded-full border border-white/10">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-cyan-400 animate-pulse' : isListening ? 'bg-red-500' : 'bg-green-500'}`} />
                                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest italic">{isSpeaking ? 'Michael Speaking' : isListening ? 'Listening' : 'Protocol Active'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-1/2 flex flex-col p-16 justify-center">
                                            <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] mb-12 shadow-2xl backdrop-blur-3xl">
                                                <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-6 underline decoration-cyan-400/30">Michael Rodriguez (HR Director) says:</p>
                                                {messages.filter(m => m.role === 'interviewer').slice(-1).map((m, i) => (
                                                    <p key={i} className="text-xl text-white font-medium italic leading-relaxed">"{m.content}"</p>
                                                ))}
                                            </div>
                                             {voiceTranscript && (
                                                <div className="bg-black/20 p-8 rounded-3xl border border-white/5 mb-8">
                                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">Transcription Engine:</p>
                                                    <p className="text-sm text-cyan-200/60 font-medium italic">"{voiceTranscript}"</p>
                                                </div>
                                            )}
                                            <AnimatePresence>
                                                {showHint && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, scale: 0.9 }} 
                                                        animate={{ opacity: 1, scale: 1 }} 
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        className="mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl text-center backdrop-blur-md"
                                                    >
                                                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-4">Stuck? You can say:</p>
                                                        <div className="flex flex-wrap justify-center gap-3">
                                                            {['"Skip"', '"I don\'t know"', '"Next question"'].map(h => (
                                                                <span key={h} className="px-4 py-2 bg-white/10 rounded-full text-[11px] font-bold text-white uppercase tracking-widest border border-white/10">{h}</span>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            <div className="flex justify-center">
                                                {!hrCallOver ? (
                                                    <button onClick={toggleMic} disabled={isSpeaking} className={`w-24 h-24 rounded-full flex items-center justify-center shadow-3xl transition-all ${isListening ? 'bg-red-500 scale-110' : 'bg-white text-black hover:scale-105'}`}>{isListening ? <MicOff size={32} /> : <Mic size={32} />}</button>
                                                ) : (
                                                    <div className="bg-green-500/20 px-8 py-3 rounded-full border border-green-500/30 font-black text-green-400 text-[10px] uppercase tracking-widest">Protocol finalized</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {step === 'REPORT' && (
                    <motion.div key="report" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-6xl mx-auto px-6 py-12">
                        <div className="bg-white rounded-[4rem] border border-gray-100 p-12 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50 rounded-full blur-[100px] -mr-32 -mt-32 opacity-50" />

                            <div className="relative z-10 text-center mb-16">
                                <h2 className="text-6xl font-black text-[#111827] uppercase tracking-tighter italic leading-none mb-4">Outcome <span className="text-[#7C3AED]">Protocol.</span></h2>
                                <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">Session Analytics & Clinical Verdict</p>
                            </div>

                            <div className="grid lg:grid-cols-3 gap-12 mb-20">
                                <div className="lg:col-span-1 flex flex-col items-center justify-center bg-gray-50 rounded-[3rem] p-12 border border-gray-100 shadow-inner">
                                    <div className="relative">
                                        <svg className="w-48 h-48 transform -rotate-90">
                                            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-200" />
                                            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={552} strokeDashoffset={552 - (552 * (report?.overall_score || 0)) / 100} className="text-[#7C3AED] transition-all duration-1000" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-5xl font-black text-[#111827]">{report?.overall_score}%</span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Score</span>
                                        </div>
                                    </div>
                                    <div className="mt-8 text-center">
                                        <div className="px-6 py-2 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">{report?.verdict}</div>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-8">
                                    <h3 className="text-xl font-black text-[#111827] uppercase tracking-tighter italic mb-6 flex items-center gap-3"><TrendingUp className="text-[#7C3AED]" /> Section Performance</h3>
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        {report?.sections.map((s, i) => (
                                            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                                <div className="flex justify-between items-end mb-4">
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                                                        <h4 className="font-bold text-gray-900 leading-none">{s.score}%</h4>
                                                    </div>
                                                </div>
                                                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${s.score}%` }} className="h-full bg-black rounded-full" />
                                                </div>
                                                <p className="mt-4 text-[11px] text-gray-500 font-medium leading-relaxed italic">"{s.feedback}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-12 mb-20">
                                <h3 className="text-3xl font-black text-[#111827] uppercase tracking-tighter italic mb-10 flex items-center gap-4">
                                    <MessageSquare className="w-8 h-8 text-[#7C3AED]" />
                                    Step-by-Step Analysis
                                </h3>

                                {report?.detailed_analysis.map((round, ri) => (
                                    <div key={ri} className="bg-gray-50 rounded-[3.5rem] p-10 border border-gray-100">
                                        <div className="flex flex-wrap items-center justify-between mb-8 pb-6 border-b border-gray-200">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center font-black">{ri + 1}</div>
                                                <h4 className="text-2xl font-black text-[#111827] uppercase tracking-tighter italic">{round.round_name}</h4>
                                            </div>
                                            <div className="flex gap-6">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vocabulary Load</p>
                                                    <p className="text-lg font-bold text-[#7C3AED] leading-none">{round.total_words} Words</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {round.responses.map((res, idx) => (
                                                <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                                                    <div className="grid md:grid-cols-2 gap-10">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-3">
                                                                <MessageSquare className="w-4 h-4 text-violet-500" />
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question</span>
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-900 leading-relaxed italic">"{res.question}"</p>

                                                            <div className="pt-2 flex items-center gap-3">
                                                                <User className="w-4 h-4 text-cyan-500" />
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Answer</span>
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-600 leading-relaxed">"{res.answer}"</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <Clock className="w-3 h-3 text-gray-300" />
                                                                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{res.wordCount} words analyzed</span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-6 bg-violet-50/50 p-6 rounded-3xl border border-violet-100">
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-3">
                                                                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">How to Improve</span>
                                                                </div>
                                                                <p className="text-[12px] font-bold text-[#7C3AED] leading-relaxed line-clamp-3">"{res.suggestion}"</p>
                                                            </div>

                                                            {res.mistakes && (
                                                                <div className="pt-4 border-t border-violet-100 space-y-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Observed Mistake</span>
                                                                    </div>
                                                                    <p className="text-[11px] font-bold text-red-900/60 leading-relaxed italic">"{res.mistakes}"</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                <button onClick={() => navigate('/dashboard/learner')} className="px-12 py-5 bg-white border border-gray-200 text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center gap-4 hover:bg-gray-50 hover:scale-105 transition-all">
                                    Return to Dashboard <ChevronRight className="w-4 h-4" />
                                </button>
                                <button onClick={() => window.location.reload()} className="px-12 py-5 bg-[#7C3AED] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center gap-4 hover:scale-105 transition-all shadow-xl shadow-violet-900/20">
                                    Restart Protocol <Zap className="w-4 h-4" />
                                </button>
                                <button onClick={() => window.print()} className="px-12 py-5 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center gap-4 hover:scale-105 transition-all">
                                    Export Results <CheckCircle2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
