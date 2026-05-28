import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { API_BASE_URL } from "../apiConfig";
import Navigation from "../components/Navigation";

const PURPLE = "#7C3AED";
const BG = "#F4F4F6";

const roles = ["Backend Developer", "Frontend Developer", "Data Analyst", "GenAI Intern", "ML Engineer", "DevOps Engineer"];
const institutions = ["Google", "Amazon", "Microsoft", "Stripe", "Deloitte", "Goldman Sachs"];

const questionBank: any = {
    "GenAI Intern": [
        {
            gate: 1, topic: "RETRIEVAL AUGMENTED GENERATION (RAG) // VECTOR STORES & INDEXING", difficulty: "MEDIUM", impact: "High Risk", impactLevel: 0.35,
            question: "A {institution} client requires a RAG system to query vast, continuously updated internal regulatory documents. The primary requirement is high throughput and sub-second latency for embedding similarity search. What specific type of indexing strategy would you recommend for the vector database, and why?"
        },
        {
            gate: 2, topic: "SECURITY & PROMPT ENGINEERING // INJECTION MITIGATION", difficulty: "HARD", impact: "High Risk", impactLevel: 0.6,
            question: "A client's internal GenAI chatbot uses RAG and accepts user queries appended directly to a system prompt. An attacker attempts a Prompt Injection attack to leak confidential data retrieved via RAG. Propose two specific technical strategies to mitigate this vulnerability without completely disabling user input."
        },
        {
            gate: 3, topic: "AGENTIC AI // MULTI-STEP ORCHESTRATION", difficulty: "HARD", impact: "Critical", impactLevel: 0.8,
            question: "Design a multi-agent system for {institution} that autonomously monitors competitor pricing and generates strategic response recommendations. Define the agent roles, communication protocol, and how you'd prevent runaway costs or hallucinated actions."
        },
    ],
    "Backend Developer": [
        {
            gate: 1, topic: "SYSTEM DESIGN // DATABASE ARCHITECTURE", difficulty: "MEDIUM", impact: "High Risk", impactLevel: 0.4,
            question: "A {institution} e-commerce platform experiences 10x traffic spikes during sales events. Design a database sharding strategy that ensures sub-100ms query times while maintaining ACID properties for order transactions."
        },
        {
            gate: 2, topic: "API DESIGN // RATE LIMITING & THROTTLING", difficulty: "HARD", impact: "High Risk", impactLevel: 0.55,
            question: "Implement a distributed rate limiter for a {institution} public API handling 1M requests/second across 50 server instances. Design the algorithm and explain how you handle edge cases like clock drift and network partitions."
        },
    ],
    "Frontend Developer": [
        {
            gate: 1, topic: "PERFORMANCE // CORE WEB VITALS", difficulty: "MEDIUM", impact: "Medium Risk", impactLevel: 0.3,
            question: "A {institution} dashboard has an LCP of 8 seconds and CLS of 0.35. Walk through your diagnostic process and the specific optimizations you'd implement to reach 'Good' thresholds."
        },
        {
            gate: 2, topic: "ARCHITECTURE // MICRO-FRONTENDS", difficulty: "HARD", impact: "High Risk", impactLevel: 0.6,
            question: "Design a micro-frontend architecture for {institution}'s large-scale web app with 5 independent teams. Address module federation, shared state management, and deployment strategies."
        },
    ],
    "Data Analyst": [
        {
            gate: 1, topic: "DATA PIPELINE // ETL DESIGN", difficulty: "MEDIUM", impact: "Medium Risk", impactLevel: 0.35,
            question: "A {institution} data warehouse ingests 2TB of raw event data daily from 200 sources. Design an ETL pipeline ensuring data quality, handling late-arriving data, and supporting ad-hoc analytical queries with sub-5s response times."
        },
        {
            gate: 2, topic: "STATISTICS // A/B TESTING DESIGN", difficulty: "HARD", impact: "High Risk", impactLevel: 0.5,
            question: "{institution} wants to run an A/B test for a checkout flow change expected to increase conversion by 2%. Explain how you'd determine sample size, run duration, and how you'd handle novelty effects and multiple comparisons."
        },
    ],
};

const diffColor: any = { MEDIUM: "#8B5CF6", HARD: "#EF4444", EASY: "#10B981" };
const verdictColor = (v: string) => ({ "STRONG PASS": "#10B981", "PASS": "#10B981", "BORDERLINE": "#F59E0B", "FAIL": "#EF4444" }[v] || PURPLE);

const difficultyLabel = (difficulty: string) => {
    if (difficulty === 'EASY') return 'Beginner';
    if (difficulty === 'MEDIUM') return 'Intermediate';
    return 'Advanced';
};

const getAssessmentSummary = (feedback: any, questions: any[]) => {
    const scores = Object.values(feedback).filter((f: any) => f && f.score !== undefined);
    const avg = scores.length ? Math.round(scores.reduce((a: number, b: any) => a + (b.score || 0), 0) / scores.length) : 0;
    return {
        attemptsMade: scores.length,
        averageScore: avg,
        completionRate: questions.length ? Math.round((scores.length / questions.length) * 100) : 0,
        recentPerformance: scores.length ? (scores[scores.length - 1] as any).score || 0 : 0,
    };
};


function ConfigScreen({ onGenerate }: any) {
    const [role, setRole] = useState("GenAI Intern");
    const [institution, setInstitution] = useState("Deloitte");
    const [customInst, setCustomInst] = useState("");
    const [experience, setExperience] = useState("FRESHER");
    const [generating, setGenerating] = useState(false);
    const trackQuestions = questionBank[role] || questionBank["GenAI Intern"];

    const handleGenerate = () => {
        setGenerating(true);
        setTimeout(() => onGenerate({ role, institution: customInst || institution, experience }), 1800);
    };
    const instDisplay = customInst || institution;

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-[#F4F4F6] p-6 sm:p-10 lg:p-16 gap-10 lg:gap-[60px] mt-20">
            <div className="flex-1 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.3)] rounded-2xl px-3.5 py-1.5 mb-7 w-fit">
                    <span className="text-[#7C3AED] font-bold text-[11px] tracking-[2px]">⚙️ INSTITUTIONAL ENGINE V2.1</span>
                </div>
                <div className="text-2xl sm:text-3xl font-[900] leading-[1.05] text-transparent bg-clip-text bg-gradient-to-r from-[#6C4DFF] via-[#EC4899] to-[#FF5B5B] inline-block uppercase">CLARIFIED</div>
                <div className="text-2xl sm:text-3xl font-[900] leading-[1.05] italic mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#6C4DFF] via-[#EC4899] to-[#FF5B5B] inline-block uppercase">READINESS.</div>
                <p className="text-[#666] text-xs sm:text-sm leading-relaxed max-w-[280px]">
                    Calibrate your assessment protocol by specifying your target role and <span className="text-[#7C3AED] font-semibold">institution</span>.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4 max-w-[320px]">
                    {[
                        { label: 'Questions', value: trackQuestions.length },
                        { label: 'Difficulty', value: `${trackQuestions.length} gates` },
                        { label: 'Adaptivity', value: 'On' },
                        { label: 'Scoring', value: 'AI Rated' },
                    ].map(card => (
                        <div key={card.label} className="rounded-2xl border border-white bg-white/80 p-4 shadow-[0_6px_24px_rgba(0,0,0,0.05)]">
                            <div className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">{card.label}</div>
                            <div className="mt-3 text-lg font-black text-[#111827]">{card.value}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="w-full max-w-[380px] mx-auto lg:mx-0 bg-white rounded-2xl p-5 sm:p-7 shadow-[0_8px_40px_rgba(0,0,0,0.08)] flex flex-col gap-5">
                <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#999", marginBottom: 10 }}>TARGET ROLE</div>
                    <div style={{ border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span>💼</span>
                        <select value={role} onChange={e => setRole(e.target.value)} style={{ border: "none", outline: "none", fontSize: 13, fontWeight: 600, color: "#1a1a2e", flex: 1, background: "transparent", cursor: "pointer" }}>
                            {roles.map(r => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {["Backend Developer", "Frontend Developer", "Data Analyst"].map(r => (
                            <button key={r} onClick={() => setRole(r)} style={{ background: role === r ? PURPLE : "transparent", color: role === r ? "white" : "#888", border: "1px solid " + (role === r ? PURPLE : "#ddd"), borderRadius: 6, padding: "4px 8px", fontSize: 10, fontWeight: 600, cursor: "pointer", letterSpacing: 0.5 }}>{r.toUpperCase()}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#999", marginBottom: 10 }}>TARGET INSTITUTION</div>
                    <div style={{ border: "1.5px solid #e0e0e0", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <span>🏢</span>
                        <input value={instDisplay} onChange={e => setCustomInst(e.target.value)} placeholder="e.g. Google" style={{ border: "none", outline: "none", fontSize: 15, fontWeight: 600, color: "#1a1a2e", flex: 1 }} />
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {["Google", "Amazon", "Microsoft", "Stripe"].map(inst => (
                            <button key={inst} onClick={() => { setInstitution(inst); setCustomInst(""); }} style={{ background: instDisplay === inst ? PURPLE : "transparent", color: instDisplay === inst ? "white" : "#888", border: "1px solid " + (instDisplay === inst ? PURPLE : "#ddd"), borderRadius: 6, padding: "4px 8px", fontSize: 10, fontWeight: 600, cursor: "pointer", letterSpacing: 0.5 }}>{inst.toUpperCase()}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#999", marginBottom: 10 }}>EXPERIENCE LEVEL</div>
                    <div style={{ display: "flex", gap: 10 }}>
                        {["FRESHER", "1-3 YRS", "3-5 YRS"].map(lvl => (
                            <button key={lvl} onClick={() => setExperience(lvl)} style={{ flex: 1, background: experience === lvl ? PURPLE : "white", color: experience === lvl ? "white" : "#555", border: "1.5px solid " + (experience === lvl ? PURPLE : "#ddd"), borderRadius: 8, padding: "8px 0", fontWeight: 700, fontSize: 11, cursor: "pointer", letterSpacing: 0.5 }}>{lvl}</button>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl bg-[#F5F3FF] border border-[#7C3AED]/10 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[2px] text-[#7C3AED]">Track Preview</span>
                        <span className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">{trackQuestions.length} gates</span>
                    </div>
                    <div className="mt-4 space-y-3">
                        {trackQuestions.map((q: any) => (
                            <div key={q.gate} className="rounded-xl bg-white border border-white px-4 py-3 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Gate {q.gate}</div>
                                    <div className="text-xs font-bold text-[#111827] truncate">{difficultyLabel(q.difficulty)}</div>
                                </div>
                                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                                    <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: q.difficulty === 'HARD' ? '100%' : q.difficulty === 'MEDIUM' ? '66%' : '33%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <button onClick={handleGenerate} disabled={generating} style={{ background: generating ? "#ccc" : PURPLE, color: "white", border: "none", borderRadius: 8, padding: "14px", fontWeight: 800, fontSize: 11, letterSpacing: 2, cursor: generating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    {generating ? "GENERATING PROTOCOL..." : "GENERATE PROTOCOL →"}
                </button>
                <div style={{ textAlign: "center", fontSize: 10, color: "#bbb", letterSpacing: 1, marginTop: -12 }}>ENCRYPTION LEVEL: AES-256 VALIDATED</div>
            </div>
        </div>
    );
}

function SyncScreen({ config, onStart }: any) {
    const [ready, setReady] = useState(false);
    useEffect(() => { const t = setTimeout(() => setReady(true), 2500); return () => clearTimeout(t); }, []);
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: BG, padding: 40, textAlign: "center" }}>
            <div style={{ width: 80, height: 80, background: PURPLE, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 28, boxShadow: "0 8px 30px rgba(124,58,237,0.4)" }}>🎯</div>
            <h1 style={{ fontSize: 44, fontWeight: 900, color: "#1a1a2e", margin: 0 }}>PROTOCOL <span style={{ color: PURPLE }}>SYNCHRONIZED.</span></h1>
            <p style={{ color: "#555", fontSize: 16, marginTop: 16, marginBottom: 40 }}>We have synthesized an adaptive assessment for <strong>{config.role}</strong> at <strong>{config.institution}</strong>. The difficulty will pivot based on your performance.</p>
            <div style={{ display: "flex", gap: 20, marginBottom: 48 }}>
                {[["🧠", "STYLE", "PROBLEM-SOLVING"], ["🕐", "ADAPTIVE", "ON"], ["🛡️", "VERIFICATION", "CLINICAL"]].map(([icon, label, value]) => (
                    <div key={label} style={{ background: "white", borderRadius: 14, padding: "16px 20px", border: "1px solid #eee", minWidth: 140, textAlign: "left", boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>
                        <div style={{ fontSize: 18, marginBottom: 8, color: PURPLE }}>{icon}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#999", marginBottom: 6 }}>{label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>{value}</div>
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", gap: 16 }}>
                <button style={{ background: "white", border: "1.5px solid #ddd", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 10, cursor: "pointer", color: "#555", letterSpacing: 1 }}>RE-CALIBRATE</button>
                <button onClick={() => ready && onStart()} style={{ background: ready ? PURPLE : "#aaa", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 10, cursor: ready ? "pointer" : "not-allowed", letterSpacing: 1 }}>
                    {ready ? "BEGIN ASSESSMENT →" : "SYNTHESIZING PROTOCOL..."}
                </button>
            </div>
        </div>
    );
}

function Timer({ start }: any) {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => { const t = setInterval(() => setElapsed(p => p + 1), 1000); return () => clearInterval(t); }, [start]);
    const remaining = Math.max(0, 180 - elapsed);
    const color = remaining < 30 ? "#EF4444" : remaining < 60 ? "#F59E0B" : PURPLE;
    return <span style={{ color, fontWeight: 700, fontSize: 12 }}>⏱ {remaining}s</span>;
}

function QuestionScreen({ config, questions, onComplete }: any) {
    const [gateIdx, setGateIdx] = useState(0);
    const [answers, setAnswers] = useState<any>({});
    const [submitted, setSubmitted] = useState<any>({});
    const [feedback, setFeedback] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const q = questions[gateIdx];
    const questionText = q.question.replace(/{institution}/g, config.institution);
    const currentAnswer = answers[gateIdx] || "";
    const fb = feedback[gateIdx];
    const isSubmitted = submitted[gateIdx];
    const isLast = gateIdx === questions.length - 1;

    const handleSubmit = async () => {
        if (!currentAnswer.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/ai/evaluate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "claude-3-5-sonnet-20240620",
                    max_tokens: 1000,
                    messages: [{ role: "user", content: `You are a senior technical interviewer at ${config.institution} for the role of ${config.role} (${config.experience}).\n\nQuestion: "${questionText}"\n\nCandidate answer: "${currentAnswer}"\n\nEvaluate and respond ONLY with a valid JSON object (no markdown, no backticks):\n{"score": <0-100>, "verdict": "<STRONG PASS|PASS|BORDERLINE|FAIL>", "strengths": ["str1", "str2"], "gaps": ["gap1", "gap2"], "ideal_approach": "<2-3 sentence model answer>"}` }]
                })
            });
            const parsed = await res.json();
            setFeedback((p: any) => ({ ...p, [gateIdx]: parsed }));
        } catch (e) {
            setFeedback((p: any) => ({ ...p, [gateIdx]: { error: true, score: 0, verdict: "ERROR", strengths: [], gaps: ["Evaluation failed. Please retry."], ideal_approach: "" } }));
        }
        setSubmitted((p: any) => ({ ...p, [gateIdx]: true }));
        setLoading(false);
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: BG, padding: "32px 40px", gap: 24, marginTop: "80px" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ background: PURPLE, color: "white", borderRadius: 6, padding: "3px 8px", fontSize: 9, fontWeight: 800, letterSpacing: 1 }}>GATE {q.gate}</div>
                        <span style={{ fontSize: 11, color: "#888", fontWeight: 600, letterSpacing: 1 }}>{q.topic}</span>
                    </div>
                    {!isSubmitted && <Timer start={gateIdx} />}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Assessment Progress</div>
                        <div className="text-[10px] font-black uppercase tracking-[2px] text-[#7C3AED]">{difficultyLabel(q.difficulty)}</div>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-[#7C3AED] transition-all" style={{ width: `${Math.round(((gateIdx + 1) / questions.length) * 100)}%` }} />
                    </div>
                </div>
                <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", flex: 1 }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "#1a1a2e", lineHeight: 1.5, margin: "0 0 16px" }}>{questionText}</p>
                    {!isSubmitted ? (
                        <>
                            <textarea value={currentAnswer} onChange={e => setAnswers((p: any) => ({ ...p, [gateIdx]: e.target.value }))} placeholder="Type your technical response..." style={{ width: "100%", minHeight: 120, border: "1.5px solid #e0e0e0", borderRadius: 8, padding: 12, fontSize: 12, fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box", color: "#333", lineHeight: 1.6 }} />
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                                <span style={{ fontSize: 9, color: "#bbb", letterSpacing: 1 }}>SUPPORTS MARKDOWN & LOGIC SCHEMAS</span>
                                <button onClick={handleSubmit} disabled={loading || !currentAnswer.trim()} style={{ background: loading || !currentAnswer.trim() ? "#ccc" : PURPLE, color: "white", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 800, fontSize: 10, cursor: loading || !currentAnswer.trim() ? "not-allowed" : "pointer", letterSpacing: 1 }}>
                                    {loading ? "EVALUATING..." : "SUBMIT INTELLIGENCE →"}
                                </button>
                            </div>
                        </>
                    ) : fb && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <div style={{ background: verdictColor(fb.verdict), color: "white", borderRadius: 8, padding: "8px 16px", fontWeight: 800, fontSize: 12 }}>{fb.verdict}</div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: verdictColor(fb.verdict) }}>{fb.score}/100</div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div style={{ background: "#F0FDF4", borderRadius: 10, padding: 16 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981", letterSpacing: 1, marginBottom: 8 }}>✅ STRENGTHS</div>
                                    {(fb.strengths || []).map((s: any, i: number) => <div key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>• {s}</div>)}
                                </div>
                                <div style={{ background: "#FEF2F2", borderRadius: 10, padding: 16 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", letterSpacing: 1, marginBottom: 8 }}>⚠️ GAPS</div>
                                    {(fb.gaps || []).map((g: any, i: number) => <div key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>• {g}</div>)}
                                </div>
                            </div>
                            {fb.ideal_approach && (
                                <div style={{ background: "#F5F3FF", borderRadius: 10, padding: 16 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: PURPLE, letterSpacing: 1, marginBottom: 8 }}>💡 IDEAL APPROACH</div>
                                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{fb.ideal_approach}</div>
                                </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button onClick={() => isLast ? onComplete(feedback) : setGateIdx(p => p + 1)} style={{ background: PURPLE, color: "white", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 800, fontSize: 10, cursor: "pointer", letterSpacing: 1 }}>
                                    {isLast ? "VIEW FINAL REPORT →" : `PROCEED TO GATE ${q.gate + 1} →`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    {questions.map((_: any, i: number) => <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i < gateIdx ? PURPLE : i === gateIdx ? "#8B5CF6" : "#ddd" }} />)}
                </div>
            </div>
            <div style={{ width: 240, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: "#0f0a1a", borderRadius: 16, padding: 24, boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#666", marginBottom: 16 }}>LIVE RESPONSE MESH</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{ color: "#888", fontSize: 12 }}>DIFFICULTY</span>
                        <span style={{ color: diffColor[q.difficulty] || PURPLE, fontWeight: 800, fontSize: 13 }}>{difficultyLabel(q.difficulty)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                        <span style={{ color: "#888", fontSize: 12 }}>SYSTEM IMPACT</span>
                        <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>{q.impact}</span>
                    </div>
                    <div style={{ background: "#1a1a2e", borderRadius: 4, height: 6, overflow: "hidden" }}>
                        <div style={{ width: `${q.impactLevel * 100}%`, height: "100%", background: PURPLE, borderRadius: 4 }} />
                    </div>
                </div>
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#999", marginBottom: 14 }}>INTERVIEW SIMULATION</div>
                    <div style={{ borderLeft: `3px solid ${PURPLE}`, paddingLeft: 14 }}>
                        <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6, fontStyle: "italic" }}>"{config.institution} typically looks for candidates who can explain the trade-offs of their decisions under pressure."</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReportScreen({ config, questions, feedback, onRestart }: any) {
    const summary = getAssessmentSummary(feedback, questions);
    const scores = Object.values(feedback).filter((f: any) => f && f.score !== undefined);
    const avg = summary.averageScore;
    const verdict = avg >= 80 ? "STRONG PASS" : avg >= 65 ? "PASS" : avg >= 50 ? "BORDERLINE" : "FAIL";
    return (
        <div className="min-h-screen bg-[#F4F4F6] p-6 sm:p-10 lg:p-20 mt-20">
            <div className="text-center mb-12">
                <div className="text-5xl mb-4">📊</div>
                <h1 className="text-3xl sm:text-4xl font-black text-[#1a1a2e] m-0 uppercase">ASSESSMENT <span className="text-[#7C3AED]">COMPLETE.</span></h1>
                <p className="text-[#666] mt-3">{config.role} @ {config.institution} • {config.experience}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-10">
                {[
                    { label: 'Attempts made', value: summary.attemptsMade, tone: 'text-[#7C3AED]' },
                    { label: 'Average score', value: `${summary.averageScore}%`, tone: 'text-gray-900' },
                    { label: 'Completion rate', value: `${summary.completionRate}%`, tone: 'text-emerald-600' },
                    { label: 'Recent performance', value: `${summary.recentPerformance}%`, tone: 'text-sky-600' },
                ].map(card => (
                    <div key={card.label} className="bg-white rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-gray-100">
                        <div className="text-[9px] text-[#999] tracking-widest uppercase font-bold">{card.label}</div>
                        <div className={`mt-2 text-3xl font-black ${card.tone}`}>{card.value}</div>
                    </div>
                ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-5 justify-center mb-10">
                <div className="bg-white rounded-2xl p-6 text-center min-w-[140px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] border-t-4" style={{ borderTopColor: verdictColor(verdict) }}>
                    <div className="text-3xl font-black" style={{ color: verdictColor(verdict) }}>{avg}</div>
                    <div className="text-[10px] text-[#999] tracking-widest mt-1 uppercase font-bold">OVERALL SCORE</div>
                </div>
                <div className="rounded-2xl p-6 text-center min-w-[140px] flex flex-col justify-center" style={{ backgroundColor: verdictColor(verdict) }}>
                    <div className="text-lg sm:text-xl font-black text-white uppercase">{verdict}</div>
                    <div className="text-[10px] text-white/70 tracking-widest mt-1.5 uppercase font-bold">FINAL VERDICT</div>
                </div>
                <div className="bg-white rounded-2xl p-6 text-center min-w-[140px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] border-t-4 border-t-[#7C3AED]">
                    <div className="text-3xl font-black text-[#7C3AED]">{scores.length}</div>
                    <div className="text-[10px] text-[#999] tracking-widest mt-1 uppercase font-bold">GATES COMPLETED</div>
                </div>
            </div>
            {Object.entries(feedback).map(([idx, fb]: any) => {
                if (!fb || !fb.verdict) return null;
                const q = questions[parseInt(idx)];
                return (
                    <div key={idx} style={{ background: "white", borderRadius: 16, padding: 28, marginBottom: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <div>
                                <span style={{ background: PURPLE, color: "white", borderRadius: 6, padding: "4px 10px", fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>GATE {q.gate}</span>
                                <span style={{ marginLeft: 12, fontSize: 11, color: "#888" }}>{q.topic}</span>
                            </div>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <span style={{ fontWeight: 800, fontSize: 20, color: verdictColor(fb.verdict) }}>{fb.score}/100</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: verdictColor(fb.verdict) }}>{fb.verdict}</span>
                            </div>
                        </div>
                        {fb.ideal_approach && <div style={{ fontSize: 13, color: "#555", fontStyle: "italic", lineHeight: 1.5 }}>{fb.ideal_approach}</div>}
                    </div>
                );
            })}
            <div style={{ textAlign: "center", marginTop: 40 }}>
                <button onClick={onRestart} style={{ background: PURPLE, color: "white", border: "none", borderRadius: 12, padding: "16px 40px", fontWeight: 800, fontSize: 14, cursor: "pointer", letterSpacing: 1, boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}>NEW PROTOCOL →</button>
            </div>
        </div>
    );
}

export default function SkillAssessment() {
    const { user } = useAuth();
    const [screen, setScreen] = useState("config");
    const [config, setConfig] = useState<any>(null);
    const [questions, setQuestions] = useState<any>([]);
    const [feedback, setFeedback] = useState<any>({});

    const handleGenerate = (cfg: any) => {
        setConfig(cfg);
        setQuestions(questionBank[cfg.role] || questionBank["GenAI Intern"]);
        setScreen("sync");
    };

    const handleComplete = async (fb: any) => {
        setFeedback(fb);
        setScreen("report");
        if (user) {
            try {
                await fetch(`${API_BASE_URL}/api/skill-assessment/save`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: user.uid, config, feedback: fb, questions })
                });
            } catch (e) {
                console.error("Save error:", e);
            }
        }
    };

    return (
        <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
            <Navigation />
            {screen === "config" && <ConfigScreen onGenerate={handleGenerate} />}
            {screen === "sync" && <SyncScreen config={config} onStart={() => setScreen("test")} />}
            {screen === "test" && <QuestionScreen config={config} questions={questions} onComplete={handleComplete} />}
            {screen === "report" && <ReportScreen config={config} questions={questions} feedback={feedback} onRestart={() => { setConfig(null); setQuestions([]); setFeedback({}); setScreen("config"); }} />}
        </div>
    );
}
