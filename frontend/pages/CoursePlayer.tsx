import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { API_BASE_URL } from '../apiConfig';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  ChevronDown, ChevronLeft, ChevronRight, Play, FileText, HelpCircle,
  CheckCircle2, Menu, X, BookOpen, MessageCircle, Download, StickyNote,
  AlignLeft, Code, Award, Trophy, ShieldAlert, Link
} from 'lucide-react';
import './CoursePlayerStyles.css';

/* ═══════ Types ═══════ */
interface Lesson {
  type: 'video' | 'text' | 'quiz' | 'code' | 'image';
  title: string;
  image_url?: string;
  video_url?: string;
  content?: string;
  questions?: any[]; // For quiz lessons
  resources?: string[];
}

interface Module {
  _id: string;
  title: string;
  order_index: number;
  estimated_time: string;
  lessons: Lesson[];
  progress?: {
    status: string;
    completed_lessons?: string[]; // IDs or titles of completed lessons
    theory_completed: boolean;
    video_completed: boolean;
    quiz_score: number;
    quiz_answers: number[][];
    project_status: string;
    review_status?: string;
  };
}

type LessonType = 'video' | 'text' | 'theory' | 'quiz' | 'code' | 'capstone' | 'final_assessment' | 'result';

interface FlatLesson {
  moduleIndex: number;
  lessonIndex: number;
  type: LessonType;
  title: string;
}

/* ═══════ Helpers ═══════ */
const extractCourseId = (slug?: string) => {
  if (!slug) return '';
  const parts = slug.split('--');
  return parts.length > 1 ? parts[parts.length - 1] : slug;
};

const getModuleProgress = (mod: Module): number => {
  const p = mod.progress;
  if (!p) return 0;
  
  // Dynamic progress based on internal lessons
  if (mod.lessons && mod.lessons.length > 0) {
    const total = mod.lessons.length;
    const completedCount = p.completed_lessons?.length || 0;
    
    // Simple percentage calculation
    return Math.round((completedCount / total) * 100);
  }

  // Fallback for legacy data
  let done = 0;
  if (p.video_completed) done++;
  if (p.theory_completed) done++;
  if (p.quiz_score >= 60 || p.status === 'completed') done++;
  return Math.min(Math.round((done / 3) * 100), 100);
};

const getLessonLabel = (type: LessonType): string => {
  if (type === 'video') return 'Video Lesson';
  if (type === 'text' || type === 'theory') return 'Reading Material';
  if (type === 'code') return 'Coding Lab';
  return 'Assessment Quiz';
};

const DUMMY_TRANSCRIPT: { time: string; text: string }[] = [];

/* ═══════ Component ═══════ */
const CoursePlayer: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [modules, setModules] = useState<Module[]>([]);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [moduleDetails, setModuleDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<LessonType>('video');
  const [courseData, setCourseData] = useState<any>(null);

  // Sidebar
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop sidebar collapse

  // Right tools
  const [activeToolTab, setActiveToolTab] = useState<'notes' | 'transcript' | 'resources'>('notes');
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Quiz
  const [quizAnswers, setQuizAnswers] = useState<number[][]>([]);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [currentQuizQ, setCurrentQuizQ] = useState(0);

  // Project
  const [deployedLink, setDeployedLink] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [projectFile, setProjectFile] = useState<File | null>(null);

  // Completion modal
  const [completionPrompt, setCompletionPrompt] = useState<{
    open: boolean; nextIndex: number | null; moduleName: string; earnedBadge?: any;
  }>({ open: false, nextIndex: null, moduleName: '' });

  const resolvedCourseId = extractCourseId(courseId);
  const contentRef = useRef<HTMLDivElement>(null);

  /* ── Build flat lesson list ── */
  const buildLessons = (mods: Module[]): FlatLesson[] => {
    const list: FlatLesson[] = [];
    mods.forEach((mod, i) => {
      if (mod.lessons && mod.lessons.length > 0) {
        mod.lessons.forEach((les, li) => {
          list.push({ 
            moduleIndex: i, 
            lessonIndex: li, 
            type: les.type as LessonType, 
            title: les.title 
          });
        });
      } else {
        // Fallback for legacy data
        list.push({ moduleIndex: i, lessonIndex: 0, type: 'video', title: 'Video Lesson' });
        list.push({ moduleIndex: i, lessonIndex: 1, type: 'theory', title: 'Reading Material' });
        list.push({ moduleIndex: i, lessonIndex: 2, type: 'quiz', title: 'Assessment Quiz' });
      }
    });
    
    // Add Final Assessment if questions exist
    if (courseData?.questions && courseData.questions.length > 0) {
      list.push({ moduleIndex: -2, lessonIndex: -2, type: 'final_assessment', title: 'Final Comprehensive Assessment' });
    }

    // Add Final Capstone if problem statement exists
    if (courseData?.capstone_problem) {
      list.push({ moduleIndex: -1, lessonIndex: -1, type: 'capstone', title: 'Final Capstone Project' });
    }

    // Add Result Page
    list.push({ moduleIndex: -3, lessonIndex: -3, type: 'result', title: 'Course Certification' });

    return list;
  };

  const flatLessons = buildLessons(modules);
  const currentFlatIndex = flatLessons.findIndex(
    l => l.moduleIndex === activeModuleIndex && l.lessonIndex === activeLessonIndex
  );

  /* ── Data Fetching ── */
  useEffect(() => {
    if (resolvedCourseId) fetchModules();
  }, [resolvedCourseId, user]);

  const fetchModules = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/${resolvedCourseId}/modules?user_id=${user?.uid || ''}`);
      const data = await res.json();
      
      const courseRes = await fetch(`${API_BASE_URL}/api/course/${resolvedCourseId}/details?user_id=${user?.uid || ''}`);
      if (courseRes.ok) {
        const cData = await courseRes.json();
        setCourseData(cData);
      }

      let fetched = Array.isArray(data) ? data : [];
      setModules(fetched);
      setLoading(false);
      return fetched;
    } catch {
      setModules([]);
      setLoading(false);
      return [];
    }
  };

  useEffect(() => {
    if (activeModuleIndex >= 0 && modules.length > 0) {
      fetchModuleDetails(modules[activeModuleIndex]._id);
      
      const les = modules[activeModuleIndex]?.lessons?.[activeLessonIndex];
      if (les?.type === 'quiz' && les.questions) {
        setQuizAnswers(les.questions.map(() => []));
        setCurrentQuizQ(0);
        setQuizResult(null);
      }
    } else if (activeModuleIndex === -1) {
      setActiveStage('capstone');
    } else if (activeModuleIndex === -2) {
      setActiveStage('final_assessment');
      if (courseData?.questions) {
        setQuizAnswers(courseData.questions.map(() => []));
        setCurrentQuizQ(0);
        setQuizResult(null);
      }
    } else if (activeModuleIndex === -3) {
      setActiveStage('result');
    }
  }, [activeModuleIndex, activeLessonIndex, modules, activeStage]);

  const fetchModuleDetails = async (moduleId: string) => {
    let data: any = {};
    if (moduleId.startsWith('dummy-mod')) {
      data = {};
    } else {
      try {
        const res = await fetch(`${API_BASE_URL}/api/modules/${moduleId}`);
        if (res.ok) data = await res.json();
      } catch {}
    }
    setModuleDetails(data);
    
    // Get progress from the current module
    const prog = modules[activeModuleIndex]?.progress;

    // Prefer the type of the current lesson from the lessons array if it exists
    const currentLesson = modules[activeModuleIndex]?.lessons?.[activeLessonIndex];
    if (currentLesson) {
      setActiveStage(currentLesson.type as LessonType);
    } else {
      // Fallback to legacy/dummy logic
      if (!prog?.video_completed) setActiveStage('video');
      else if (!prog?.theory_completed) setActiveStage('theory');
      else setActiveStage('quiz');
    }

    if (prog?.quiz_answers?.length) setQuizAnswers(prog.quiz_answers);
    else {
      // Support quiz content both in the lesson and module details
      const quizQs = currentLesson?.type === 'quiz' ? (currentLesson as any).questions : data.quiz?.questions;
      setQuizAnswers(quizQs?.map(() => []) || []);
    }

    if (prog?.quiz_score && prog.quiz_score > 0) {
      setQuizResult({ score: prog.quiz_score, passed: prog.quiz_score >= 60 });
    } else {
      setQuizResult(null);
    }
    setCurrentQuizQ(0);
  };

  /* ── Progress Updates ── */
  const updateProgress = async (updates: any) => {
    if (modules[activeModuleIndex]._id.startsWith('dummy-mod')) {
      const updated = [...modules];
      const cur = updated[activeModuleIndex];
      if (!cur.progress) cur.progress = { status: 'unlocked', theory_completed: false, video_completed: false, quiz_score: 0, quiz_answers: [], project_status: 'pending', review_status: 'pending' };
      Object.assign(cur.progress, updates);
      if (updates.status === 'completed' || updates.project_status === 'submitted' || updates.quiz_score >= 60) {
        cur.progress.status = 'completed';
        if (activeModuleIndex + 1 < updated.length) {
          if (!updated[activeModuleIndex + 1].progress) updated[activeModuleIndex + 1].progress = {} as any;
          updated[activeModuleIndex + 1].progress!.status = 'unlocked';
        }
      }
      setModules(updated);
      return;
    }
    const res = await fetch(`${API_BASE_URL}/api/progress/update`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user?.uid, course_id: resolvedCourseId, module_id: modules[activeModuleIndex]._id, updates })
    });
    const data = await res.json();
    fetchModules();
    return data;
  };

  /* ── Quiz ── */
  const handleQuizSubmit = async () => {
    let score = 0;
    let data: any = {};
    
    const currentLesson = modules[activeModuleIndex]?.lessons?.[activeLessonIndex];
    const embeddedQuestions = currentLesson?.type === 'quiz' ? currentLesson.questions : null;

    if (embeddedQuestions) {
      let correct = 0;
      const qs = embeddedQuestions || moduleDetails?.quiz?.questions || [];
      qs.forEach((q: any, i: number) => {
        const sel = quizAnswers[i] || [];
        const ans = q.correct_answers || [];
        if (sel.length === ans.length && sel.every((v: number) => ans.includes(v))) correct++;
      });
      score = Math.round((correct / Math.max(qs.length, 1)) * 100);
      data = { score, passed: score >= 60 };
      
      await updateProgress({ quiz_score: score, quiz_answers: quizAnswers });
    } else {
      const res = await fetch(`${API_BASE_URL}/api/quiz/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.uid, module_id: modules[activeModuleIndex]._id, answers: quizAnswers })
      });
      data = await res.json();
      score = data.score;
    }
    setQuizResult(data);
    
    // Automatically mark as complete if passed
    if (data.passed) {
      setTimeout(() => {
        handleMarkComplete();
      }, 800);
    }

    if (modules[activeModuleIndex]._id.startsWith('dummy-mod')) {
       setTimeout(() => updateProgress({ quiz_score: score, quiz_answers: quizAnswers }), 500);
    }
  };

  /* ── Navigation ── */
  const goToPrevLesson = () => {
    if (currentFlatIndex <= 0) return;
    const prev = flatLessons[currentFlatIndex - 1];
    setActiveModuleIndex(prev.moduleIndex);
    setActiveLessonIndex(prev.lessonIndex);
    setActiveStage(prev.type);
    scrollContentTop();
  };

  const goToNextLesson = () => {
    if (currentFlatIndex >= flatLessons.length - 1) return;
    const next = flatLessons[currentFlatIndex + 1];
    setActiveModuleIndex(next.moduleIndex);
    setActiveLessonIndex(next.lessonIndex);
    setActiveStage(next.type);
    scrollContentTop();
  };

  const scrollContentTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleModule = (idx: number) => {
    const s = new Set(expandedModules);
    s.has(idx) ? s.delete(idx) : s.add(idx);
    setExpandedModules(s);
  };

  const selectLesson = (modIdx: number, type: LessonType) => {
    const mod = modules[modIdx];
    setActiveModuleIndex(modIdx);
    setActiveStage(type);
    setSidebarOpen(false);
    scrollContentTop();
    const s = new Set(expandedModules);
    s.add(modIdx);
    setExpandedModules(s);
  };

  const handleMarkComplete = async () => {
    // 1. Regular Module Lessons
    if (activeModuleIndex >= 0) {
      const curMod = modules[activeModuleIndex];
      if (!curMod) return;

      const updatedLessons = Array.from(new Set([...(curMod.progress?.completed_lessons || []), activeLessonIndex.toString()]));
      const updates: any = {
        completed_lessons: updatedLessons,
        status: (updatedLessons.length >= (curMod.lessons?.length || 0)) ? 'completed' : 'unlocked'
      };

      if (activeStage === 'video') updates.video_completed = true;
      if (activeStage === 'theory' || activeStage === 'text') updates.theory_completed = true;
      
      const resData = await updateProgress(updates);
      const newBadges = resData?.new_badges || [];
      const latestBadge = newBadges.length > 0 ? newBadges[0] : null;

      const isFinishingModule = updatedLessons.length >= (curMod.lessons?.length || 0);
      if (isFinishingModule) {
        setCompletionPrompt({
          open: true,
          nextIndex: activeModuleIndex + 1 < modules.length ? activeModuleIndex + 1 : -2,
          moduleName: curMod.title,
          earnedBadge: latestBadge
        });
        return;
      }
    } 
    // 2. Capstone Project
    else if (activeModuleIndex === -1) {
      if (!githubLink) {
        alert("Please provide your GitHub repository link before marking as complete.");
        return;
      }
      const resData = await updateProgress({ project_status: 'submitted', github_link: githubLink, deployed_link: deployedLink });
      const newBadges = resData?.new_badges || [];
      if (newBadges.length > 0) {
        setCompletionPrompt({ open: true, nextIndex: -2, moduleName: 'Capstone Project', earnedBadge: newBadges[0] });
        return;
      }
    }
    // 3. Final Assessment
    else if (activeModuleIndex === -2) {
      if (!quizResult?.passed) {
        alert("You must pass the Final Assessment before marking it as complete.");
        return;
      }
      const resData = await updateProgress({ final_assessment_passed: true });
      const newBadges = resData?.new_badges || [];
      if (newBadges.length > 0) {
        setCompletionPrompt({ open: true, nextIndex: -3, moduleName: 'Final Assessment', earnedBadge: newBadges[0] });
        return;
      }
    }

    // Auto transition
    if (currentFlatIndex < flatLessons.length - 1) {
      goToNextLesson();
    }
  };

  const isLessonComplete = (modIdx: number, type: LessonType, lessonIdx: number): boolean => {
    if (modIdx === -1) return courseData?.progress?.project_status === 'submitted';
    if (modIdx === -2) return courseData?.progress?.final_assessment_passed || quizResult?.passed;
    if (modIdx === -3) return false;

    const p = modules[modIdx]?.progress;
    if (!p) return false;
    
    // Check per-lesson completion if available
    if (p.completed_lessons?.includes(lessonIdx.toString())) return true;
    
    // Legacy fallback
    if (type === 'video') return !!p.video_completed;
    if (type === 'theory' || type === 'text') return !!p.theory_completed;
    return (p.quiz_score || 0) > 0;
  };

  const isModuleComplete = (modIdx: number): boolean => {
    if (modIdx < 0) return false;
    const mod = modules[modIdx];
    if (!mod) return false;
    if (mod.lessons && mod.lessons.length > 0) {
      return mod.lessons.every((les, idx) => isLessonComplete(modIdx, les.type as LessonType, idx));
    }
    return mod.progress?.status === 'completed' || getModuleProgress(mod) >= 100;
  };

  const isCurrentLessonComplete = isLessonComplete(activeModuleIndex, activeStage, activeLessonIndex);
  const currentModule = modules[activeModuleIndex];
  
  // Calculate more granular overall progress by checking total completed units across all steps
  const overallProgress = (() => {
    if (!flatLessons.length) return 0;
    // Don't count the 'result' page in the total or completed count
    const trackableLessons = flatLessons.filter(l => l.type !== 'result');
    if (!trackableLessons.length) return 0;
    
    let completedCount = 0;
    trackableLessons.forEach(l => {
      if (isLessonComplete(l.moduleIndex, l.type, l.lessonIndex)) {
        completedCount++;
      }
    });
    
    return Math.round((completedCount / trackableLessons.length) * 100);
  })();

  const currentLessonTitle = currentModule
    ? currentModule.lessons?.[activeLessonIndex]?.title || `${currentModule.title} — ${getLessonLabel(activeStage)}`
    : 'Loading...';

  /* ═══════ Render ═══════ */
  // Remove the hardcoded blocker to allow custom courses to load content from MongoDB
  /* 
  if (courseId && !courseId.toLowerCase().includes('generative-ai')) {
    ...
  }
  */

  if (loading) return (
    <div className="cp-loading">
      <div className="cp-spinner" />
      <span className="cp-loading-text">Loading course...</span>
    </div>
  );

  if (!modules.length) return (
    <div className="cp-empty">
      <h2>No Modules Found</h2>
      <p>This course doesn't have any content yet. Please check back later.</p>
      <button onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
    </div>
  );

  return (
    <div className="cp-shell">
      {/* Mobile Toggle */}
      <button className="cp-mobile-toggle" onClick={() => setSidebarOpen(true)}>
        <Menu size={20} />
      </button>
      <div className={`cp-mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ══════ LEFT SIDEBAR ══════ */}
      <aside className={`cp-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="cp-sidebar-header">
          <button className="cp-sidebar-back" onClick={() => navigate('/learn/courses')}>
            <ChevronLeft size={16} /> Back to courses
          </button>
          <div className="cp-sidebar-title-row">
            <div className="cp-sidebar-title">Course Curriculum</div>
          </div>
          <div className="cp-sidebar-progress-wrap">
            <div className="cp-sidebar-progress-bar">
              <div className="cp-sidebar-progress-fill" style={{ width: `${overallProgress}%` }} />
            </div>
            <span className="cp-sidebar-progress-text">{overallProgress}%</span>
          </div>
        </div>

        <div className="cp-sidebar-modules">
          {modules.map((mod, modIdx) => {
            const isExpanded = expandedModules.has(modIdx);
            
            // Enforce sequential locking: First module is unlocked, others require previous to be completed
            let isLocked = false;
            if (modIdx > 0) {
              const prevMod = modules[modIdx - 1];
              if (prevMod.progress?.status !== 'completed' && getModuleProgress(prevMod) < 100) {
                isLocked = true;
              }
            }
            
            const isCompleted = isModuleComplete(modIdx);
            const modProgress = getModuleProgress(mod);
            const lessons: LessonType[] = ['video', 'theory', 'quiz'];

            return (
              <div key={mod._id} className="cp-module-group" style={{ opacity: isLocked ? 0.45 : 1 }}>
                <button className="cp-module-header" onClick={() => !isLocked && toggleModule(modIdx)}>
                  <div className="cp-module-header-left">
                    <div className={`cp-module-number ${isCompleted ? 'completed' : modIdx === activeModuleIndex ? 'active' : ''}`}>
                      {isCompleted ? <CheckCircle2 size={14} /> : mod.order_index}
                    </div>
                    <div className="cp-module-info">
                      <div className="cp-module-name">{mod.title}</div>
                      <div className="cp-module-meta">
                        {`${mod.estimated_time} · 3 lessons`}
                      </div>
                    </div>
                  </div>
                  {!isLocked && <ChevronDown size={16} className={`cp-module-chevron ${isExpanded ? 'open' : ''}`} />}
                </button>

                {!isLocked && modProgress > 0 && modProgress < 100 && (
                  <div className="cp-module-progress-mini">
                    <div className="cp-module-progress-mini-fill" style={{ width: `${modProgress}%` }} />
                  </div>
                )}

                {isExpanded && !isLocked && mod.lessons && mod.lessons.length > 0 && (
                  <div className="cp-lesson-list">
                    {mod.lessons.map((les, lessonIdx) => {
                      const isActive = modIdx === activeModuleIndex && activeLessonIndex === lessonIdx;
                      const type = les.type as LessonType;
                      const done = mod.progress?.completed_lessons?.includes(lessonIdx.toString());
                      const Icon = type === 'video' ? Play : (type === 'text' || type === 'theory') ? FileText : type === 'quiz' ? HelpCircle : AlignLeft;
                      return (
                        <button
                          key={lessonIdx}
                          className={`cp-lesson-item ${isActive ? 'active' : ''} ${done ? 'completed' : ''}`}
                          onClick={() => {
                            setActiveModuleIndex(modIdx);
                            setActiveLessonIndex(lessonIdx);
                            setActiveStage(type);
                            setSidebarOpen(false);
                            scrollContentTop();
                          }}
                        >
                          <Icon size={16} className="cp-lesson-icon" />
                          <span className="cp-lesson-name">{les.title}</span>
                          {done ? (
                            <div className="cp-lesson-check done"><CheckCircle2 size={10} /></div>
                          ) : (
                            <div className="cp-lesson-check" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Course Conclusion Section */}
          {(courseData?.capstone_problem || (courseData?.questions && courseData.questions.length > 0)) && (
            <div className="cp-module-group" style={{ borderBottom: 'none', paddingBottom: 40 }}>
                <div className="cp-sidebar-divider">Final Milestone</div>
                
                {/* Final Assessment Lock Logic */}
                {(() => {
                    const allModulesDone = modules.every(m => m.progress?.status === 'completed' || getModuleProgress(m) === 100);
                    const megaQuizLocked = !allModulesDone;
                    
                    // Capstone is only available AFTER Mega Quiz is passed
                    const capstoneLocked = megaQuizLocked || (courseData?.questions?.length > 0 && !(courseData.progress?.final_assessment_passed || quizResult?.passed));
                    
                    return (
                        <>
                            {courseData?.questions && courseData.questions.length > 0 && (
                                <button 
                                  className={`cp-lesson-item ${activeStage === 'final_assessment' ? 'active' : ''} ${megaQuizLocked ? 'locked' : ''} ${isLessonComplete(-2, 'final_assessment', -2) ? 'completed' : ''}`} 
                                  onClick={() => { if(!megaQuizLocked) { setActiveModuleIndex(-2); setActiveStage('final_assessment'); setSidebarOpen(false); scrollContentTop(); } }}
                                  style={{ paddingLeft: 20, opacity: megaQuizLocked ? 0.4 : 1 }}
                                >
                                    {megaQuizLocked ? <ShieldAlert size={14} className="cp-lesson-icon" /> : <Trophy size={16} className="cp-lesson-icon text-yellow-500" />}
                                    <span className="cp-lesson-name">Final Assessment</span>
                                    {isLessonComplete(-2, 'final_assessment', -2) ? (
                                        <div className="cp-lesson-check done" style={{ marginLeft: 'auto' }}><CheckCircle2 size={10} /></div>
                                    ) : megaQuizLocked ? (
                                        <span className="text-[9px] uppercase font-semibold text-white/30 ml-auto">Locked</span>
                                    ) : (
                                        <div className="cp-lesson-check" style={{ marginLeft: 'auto' }} />
                                    )}
                                </button>
                            )}

                            {courseData?.capstone_problem && (
                                <button 
                                  className={`cp-lesson-item ${activeStage === 'capstone' ? 'active' : ''} ${capstoneLocked ? 'locked' : ''} ${isLessonComplete(-1, 'capstone', -1) ? 'completed' : ''}`} 
                                  onClick={() => { if(!capstoneLocked) { setActiveModuleIndex(-1); setActiveStage('capstone'); setSidebarOpen(false); scrollContentTop(); } }}
                                  style={{ paddingLeft: 20, opacity: capstoneLocked ? 0.4 : 1 }}
                                >
                                    <Code size={16} className="cp-lesson-icon" />
                                    <span className="cp-lesson-name">Capstone Project</span>
                                    {isLessonComplete(-1, 'capstone', -1) ? (
                                        <div className="cp-lesson-check done" style={{ marginLeft: 'auto' }}><CheckCircle2 size={10} /></div>
                                    ) : capstoneLocked ? (
                                        <span className="text-[9px] uppercase font-semibold text-white/30 ml-auto">Finish Quiz First</span>
                                    ) : (
                                        <div className="cp-lesson-check" style={{ marginLeft: 'auto' }} />
                                    )}
                                </button>
                            )}
                        </>
                    );
                })()}
                
                <button 
                  className={`cp-lesson-item ${activeStage === 'result' ? 'active' : ''}`} 
                  onClick={() => { setActiveModuleIndex(-3); setActiveStage('result'); setSidebarOpen(false); scrollContentTop(); }}
                  style={{ paddingLeft: 20 }}
                >
                    <CheckCircle2 size={16} className="cp-lesson-icon" />
                    <span className="cp-lesson-name">Completion</span>
                </button>
            </div>
          )}
        </div>
      </aside>

      {/* ══════ MAIN + RIGHT ══════ */}
      <div className="cp-main">
        {/* Top Bar */}
        <div className="cp-topbar">
          <div className="cp-topbar-left">
            <button className="cp-collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
              <Menu size={18} />
            </button>
            <span className="cp-topbar-lesson-title">{currentLessonTitle}</span>
          </div>
          <div className="cp-topbar-right">
            {activeStage !== 'quiz' && (
              <button
                className={`cp-topbar-btn ${isCurrentLessonComplete ? 'completed-btn' : 'primary'}`}
                onClick={handleMarkComplete}
                disabled={isCurrentLessonComplete}
              >
                <CheckCircle2 size={15} />
                {isCurrentLessonComplete ? 'Completed' : 'Mark Complete'}
              </button>
            )}
          </div>
        </div>

        {/* Content + Right Sidebar Wrapper */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Main Content Area */}
          <div className="cp-content-area" ref={contentRef} style={{ flex: 1 }}>
            <AnimatePresence mode="wait">
              {/* ── VIDEO ── */}
              {activeStage === 'video' && (
                <motion.div key="video" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="cp-video-container">
                    {(() => {
                      const vurl = currentModule?.lessons?.[activeLessonIndex]?.video_url || moduleDetails?.video?.video_url;
                      if (!vurl) return (
                        <div className="cp-video-unavailable"><span>Video content unavailable</span></div>
                      );

                      const getEmbedUrl = (url: string) => {
                        if (!url) return '';
                        
                        // Local/Direct File or Data URL
                        if (url.startsWith('data:video') || url.match(/\.(mp4|webm|ogg|mov)$/i)) {
                          return url;
                        }

                        // YouTube
                        const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/);
                        if (ytMatch && ytMatch[1]) {
                          const id = ytMatch[1].split('&')[0];
                          return `https://www.youtube.com/embed/${id}`;
                        }

                        // Vimeo
                        const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(.+)/);
                        if (vimeoMatch && vimeoMatch[1]) {
                          return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
                        }

                        // Loom
                        const loomMatch = url.match(/(?:https?:\/\/)?(?:www\.)?loom\.com\/share\/(.+)/);
                        if (loomMatch && loomMatch[1]) {
                          return `https://www.loom.com/embed/${loomMatch[1]}`;
                        }

                        // Fallback
                        return url;
                      };

                      const embedUrl = getEmbedUrl(vurl);
                      const isVideoTag = vurl.startsWith('data:video') || vurl.match(/\.(mp4|webm|ogg|mov)$/i);
                      
                      if (isVideoTag) {
                        return (
                          <video 
                            src={embedUrl} 
                            controls 
                            className="w-full h-full rounded-xl"
                            style={{ maxWidth: '100%', height: 'auto', maxHeight: '100%', borderRadius: '12px' }}
                          />
                        );
                      }
                      
                      return (
                        <iframe
                          src={embedUrl}
                          title="Course Video"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      );
                    })()}
                  </div>
                  <div className="cp-lesson-info">
                    <h1>{currentModule?.title || 'Course Lesson'} — Video Lesson</h1>
                    <p>Watch this video lecture to understand the core concepts covered in this module. Take notes using the panel on the right for better retention.</p>
                    
                    {!isCurrentLessonComplete && (
                        <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid #e5e7eb' }}>
                            <button 
                                className="cp-bottom-nav-btn next" 
                                style={{ width: '100%', justifyContent: 'center', padding: '16px', borderRadius: '14px' }}
                                onClick={handleMarkComplete}
                            >
                                <CheckCircle2 size={18} />
                                I've finished watching. Mark Complete & Continue
                            </button>
                        </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── TEXT / THEORY ── */}
              {(activeStage === 'theory' || activeStage === 'text' || activeStage === 'code') && (
                <motion.div key="theory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="cp-text-lesson">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        h1: ({ children, ...props }) => <h1 {...props} className="text-3xl font-bold my-6">{children}</h1>,
                        h2: ({ children, ...props }) => <h2 {...props} className="text-2xl font-bold my-5 border-b pb-2">{children}</h2>,
                        h3: ({ children, ...props }) => <h3 {...props} className="text-xl font-bold my-4 text-[#7C3AED]">{children}</h3>,
                        p: ({ children, ...props }) => <p {...props} className="mb-4 text-base leading-relaxed">{children}</p>,
                        blockquote: ({ children, ...props }) => (
                          <blockquote {...props} className="border-l-4 border-[#7C3AED] bg-purple-50 p-4 my-6 italic text-gray-700 rounded-r-xl">
                            {children}
                          </blockquote>
                        ),
                        pre: ({ children }) => <div className="my-6 rounded-xl overflow-hidden shadow-lg border border-white/10">{children}</div>,
                        img: ({ src, alt, ...props }) => {
                          const fullSrc = src?.startsWith('/') ? `${API_BASE_URL}${src}` : src;
                          return (
                            <span style={{ display: 'block' }} className="my-8 rounded-2xl overflow-hidden shadow-2xl border border-gray-100 group">
                              <img 
                                src={fullSrc} 
                                alt={alt || "Course illustration"} 
                                {...props} 
                                className="w-full h-auto transform transition-transform group-hover:scale-[1.02] duration-500" 
                              />
                            </span>
                          );
                        },
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={atomDark}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                              customStyle={{ margin: 0, padding: '24px', fontSize: '14px', borderRadius: '0' }}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="bg-gray-100 text-[#7C3AED] px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        },
                        table: ({ children, ...props }) => <div className="overflow-x-auto my-8 border border-gray-100 rounded-xl"><table {...props} className="w-full border-collapse">{children}</table></div>,
                        thead: ({ children, ...props }) => <thead {...props} className="bg-gray-50 border-b-2 border-gray-100">{children}</thead>,
                        th: ({ children, ...props }) => <th {...props} className="px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-500">{children}</th>,
                        td: ({ children, ...props }) => <td {...props} className="px-5 py-4 text-sm text-gray-600 border-b border-gray-50">{children}</td>,
                        a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-[#7C3AED] font-bold hover:underline decoration-2 underline-offset-4">{children}</a>,
                        ul: ({ children, ...props }) => <ul {...props} className="list-disc pl-6 mb-6 space-y-2">{children}</ul>,
                        ol: ({ children, ...props }) => <ol {...props} className="list-decimal pl-6 mb-6 space-y-2">{children}</ol>,
                      }}
                    >
                      {currentModule?.lessons?.[activeLessonIndex]?.content || moduleDetails?.theory?.markdown_content || ''}
                    </ReactMarkdown>

                    {currentModule?.lessons?.[activeLessonIndex]?.image_url && (
                        <div className="mt-8 rounded-2xl overflow-hidden border border-gray-100 shadow-lg">
                            <img src={currentModule.lessons[activeLessonIndex].image_url} alt="Lesson illustration" className="w-full h-auto" />
                        </div>
                    )}

                    {moduleDetails?.theory?.key_takeaways?.length > 0 && (
                      <div style={{ marginTop: 40, paddingTop: 28, borderTop: '1px solid #e8e8ed' }}>
                        <h3 style={{ color: '#111827', fontWeight: 700, marginBottom: 16 }}>Key Takeaways</h3>
                        {moduleDetails.theory.key_takeaways.map((t: string, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                            <CheckCircle2 size={16} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} />
                            <span style={{ fontSize: 15, color: '#374151' }}>{t}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {!isCurrentLessonComplete && (
                        <div style={{ marginTop: 48, paddingTop: 40, borderTop: '2px solid #f3f4f6' }}>
                            <button 
                                className="cp-bottom-nav-btn next" 
                                style={{ width: '100%', justifyContent: 'center', padding: '18px', borderRadius: '16px', fontSize: 16 }}
                                onClick={handleMarkComplete}
                            >
                                <CheckCircle2 size={20} />
                                All read. Mark as Finished & Next Step
                            </button>
                        </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── QUIZ ── */}
              {activeStage === 'quiz' && (
                <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="cp-quiz-container">
                    {!quizResult ? (
                      <>
                        <div className="cp-quiz-header">
                          <h2>Module Assessment</h2>
                          <div className="cp-quiz-progress-text">
                            Question {currentQuizQ + 1} of {(currentModule?.lessons?.[activeLessonIndex]?.questions || moduleDetails?.quiz?.questions || []).length}
                          </div>
                          <div className="cp-quiz-progress-bar">
                            <div className="cp-quiz-progress-fill" style={{
                              width: `${((currentQuizQ + 1) / ((currentModule?.lessons?.[activeLessonIndex]?.questions || moduleDetails?.quiz?.questions || []).length || 1)) * 100}%`
                            }} />
                          </div>
                        </div>

                        {(currentModule?.lessons?.[activeLessonIndex]?.questions || moduleDetails?.quiz?.questions || []).map((q: any, qIdx: number) => (
                          <div key={qIdx} style={{ display: qIdx === currentQuizQ ? 'block' : 'none' }}>
                            <div className="cp-quiz-question">
                              <div className="cp-quiz-question-text">{q.question}</div>
                              <div className="cp-quiz-options">
                                {q.options.map((opt: string, optIdx: number) => {
                                  const isSelected = quizAnswers[qIdx]?.includes(optIdx);
                                  return (
                                    <button
                                      key={optIdx}
                                      className={`cp-quiz-option ${isSelected ? 'selected' : ''}`}
                                      onClick={() => {
                                        const newAns = [...quizAnswers];
                                        newAns[qIdx] = [optIdx];
                                        setQuizAnswers(newAns);
                                      }}
                                    >
                                      <div className="cp-quiz-radio">
                                        {isSelected && <div className="cp-quiz-radio-dot" />}
                                      </div>
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                               {(() => {
                                  const qsCount = (currentModule?.lessons?.[activeLessonIndex]?.questions || moduleDetails?.quiz?.questions || []).length;
                                  return (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                                      <button
                                        className="cp-bottom-nav-btn"
                                        disabled={currentQuizQ === 0}
                                        onClick={() => setCurrentQuizQ(Math.max(0, currentQuizQ - 1))}
                                      >
                                        <ChevronLeft size={16} /> Previous
                                      </button>
                                      
                                      {currentQuizQ < qsCount - 1 ? (
                                        <button
                                          className="cp-bottom-nav-btn next"
                                          onClick={() => setCurrentQuizQ(currentQuizQ + 1)}
                                          disabled={!quizAnswers[currentQuizQ]?.length}
                                        >
                                          Next <ChevronRight size={16} />
                                        </button>
                                      ) : (
                                        <div className="cp-quiz-submit">
                                          <button
                                            onClick={handleQuizSubmit}
                                            disabled={quizAnswers.some(a => !a?.length)}
                                          >
                                            Submit Answers 🚀
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                               })()}
                          </div>
                        ))}
                      </>
                    ) : (
                      <div>
                        <div className={`cp-quiz-result ${quizResult.passed ? 'passed' : 'failed'}`}>
                          <div className="cp-quiz-result-score">{Math.round(quizResult.score)}%</div>
                          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                            {quizResult.passed ? 'Assessment Passed!' : 'Did not pass'}
                          </div>
                          <p style={{ fontSize: 14, color: '#6b7280' }}>
                            {quizResult.passed
                              ? 'Congratulations! Great work! You can proceed to the next module.'
                              : 'You need 60% to pass. Review the material and try again.'}
                          </p>
                        </div>

                        {/* Show answers with feedback */}
                        <div style={{ marginTop: 32 }}>
                          {(currentModule?.lessons?.[activeLessonIndex]?.questions || moduleDetails?.quiz?.questions || []).map((q: any, qIdx: number) => {
                            const selected = quizAnswers[qIdx] || [];
                            return (
                              <div key={qIdx} style={{ marginBottom: 28 }}>
                                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                                  {qIdx + 1}. {q.question}
                                </div>
                                {q.options.map((opt: string, optIdx: number) => {
                                  const isSel = selected.includes(optIdx);
                                  const isCorrect = q.correct_answers.includes(optIdx);
                                  let cls = 'cp-quiz-option';
                                  if (isSel && isCorrect) cls += ' correct';
                                  else if (isSel && !isCorrect) cls += ' incorrect';
                                  else if (isCorrect) cls += ' show-correct';
                                  return (
                                    <div key={optIdx} className={cls} style={{ cursor: 'default', marginBottom: 6 }}>
                                      <div className="cp-quiz-radio">
                                        {(isSel || isCorrect) && <div className="cp-quiz-radio-dot" />}
                                      </div>
                                      {opt}
                                    </div>
                                  );
                                })}
                                <div className="cp-quiz-explanation">{q.explanation}</div>
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
                          {quizResult.passed ? (
                            <button
                              className="cp-bottom-nav-btn next"
                              style={{ padding: '16px 40px', fontSize: 16, background: '#10b981', borderColor: '#10b981' }}
                              onClick={() => {
                                if (currentFlatIndex < flatLessons.length - 1) {
                                  goToNextLesson();
                                } else {
                                  setCompletionPrompt({ open: true, nextIndex: null, moduleName: currentModule.title });
                                }
                              }}
                            >
                              Great Job! Proceed to Next Step
                              <ChevronRight size={18} />
                            </button>
                          ) : (
                            <button
                              className="cp-bottom-nav-btn"
                              onClick={() => {
                                setQuizResult(null);
                                setQuizAnswers(moduleDetails?.quiz?.questions.map(() => []) || []);
                                setCurrentQuizQ(0);
                                setActiveStage('video');
                                updateProgress({ theory_completed: false, video_completed: false, quiz_score: 0, quiz_answers: [] });
                              }}
                            >
                              Retry Module
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── FINAL CAPSTONE PROJECT ── */}
              {activeStage === 'capstone' && (
                <motion.div key="capstone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="cp-text-lesson">
                    <div style={{ textAlign: 'center', marginBottom: 40 }}>
                      <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Code size={40} style={{ color: '#7C3AED' }} />
                      </div>
                      <h1 style={{ margin: 0 }}>Final Capstone Project</h1>
                      <p style={{ fontSize: 16, color: '#6b7280', marginTop: 8 }}>Test your skills with a real-world challenge</p>
                    </div>
                    
                    <div className="cp-note-block" style={{ background: '#f5f3ff', borderColor: '#7C3AED', padding: '24px' }}>
                      <h3 style={{ margin: '0 0 12px 0', color: '#7C3AED', fontWeight: 700 }}>The Challenge</h3>
                      <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: '#111827' }}>
                        {courseData?.capstone_problem || "Build a production-grade application following the architectural principles learned in this course."}
                      </p>
                    </div>

                    <h2 style={{ marginTop: 40 }}>Evaluation Criteria</h2>
                    <ul style={{ background: '#fafafa', padding: '24px 40px', borderRadius: 12, listStyleType: 'decimal' }}>
                      {(courseData?.capstone_criteria?.split('\n') || ["Core pattern implementation", "Correctness of functional requirements", "Security & Reliability best practices"]).map((c: string, idx: number) => (
                        <li key={idx} style={{ marginBottom: 12, fontWeight: 500 }}>{c}</li>
                      ))}
                    </ul>

                    <div style={{ marginTop: 48, padding: 32, background: '#fff', borderRadius: 20, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                      <h3 style={{ marginTop: 0, fontSize: 18, marginBottom: 20 }}>Project Submission</h3>
                      <div className="cp-form-group" style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Github Repository Link</label>
                        <input 
                          className="cp-input" 
                          style={{ width: '100%', padding: '14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none' }} 
                          placeholder="https://github.com/yourusername/project" 
                          value={githubLink || ''} 
                          onChange={e => setGithubLink(e.target.value)} 
                        />
                      </div>
                      <div className="cp-form-group" style={{ marginBottom: 28 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Live Deployed Link (Optional)</label>
                        <input 
                          className="cp-input" 
                          style={{ width: '100%', padding: '14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none' }} 
                          placeholder="https://your-project.vercel.app" 
                          value={deployedLink || ''}
                          onChange={e => setDeployedLink(e.target.value)} 
                        />
                      </div>
                      <button 
                        className="cp-topbar-btn primary" 
                        style={{ width: '100%', padding: '16px', borderRadius: 12, fontSize: 15, fontWeight: 700, height: 'auto', justifyContent: 'center' }} 
                        onClick={async () => {
                          if (!githubLink) return alert("Please provide your GitHub repository link.");
                          try {
                            const res = await fetch(`${API_BASE_URL}/api/progress/update`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                user_id: user?.uid,
                                course_id: resolvedCourseId,
                                updates: { 
                                  github_link: githubLink, 
                                  deployed_link: deployedLink,
                                  project_status: 'submitted',
                                  submitted_at: new Date().toISOString()
                                }
                              })
                            });
                            if (res.ok) {
                              alert("Capstone Project submitted successfully!");
                              goToNextLesson();
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Failed to submit project. Please try again.");
                          }
                        }}
                      >
                        Submit Final Capstone Project
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── FINAL ASSESSMENT quiz ── */}
              {activeStage === 'final_assessment' && (
                <motion.div key="final_quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="cp-quiz-container">
                    <div className="cp-quiz-header">
                      <div style={{ display: 'inline-flex', padding: '12px', background: '#ecfdf5', borderRadius: '16px', marginBottom: 16 }}>
                        <Award size={32} style={{ color: '#10b981' }} />
                      </div>
                      <h2>Final Comprehensive Assessment</h2>
                      <div className="cp-quiz-progress-text">
                        Question {currentQuizQ + 1} of {courseData?.questions?.length || 0}
                      </div>
                    </div>

                    {!quizResult ? (
                      <>
                        {courseData?.questions?.map((q: any, qIdx: number) => (
                          qIdx === currentQuizQ && (
                            <div key={qIdx} className="cp-quiz-question">
                              <div className="cp-quiz-question-text">{q.question}</div>
                              <div className="cp-quiz-options">
                                {q.options.map((opt: string, optIdx: number) => {
                                  const isSelected = (quizAnswers[qIdx] || []).includes(optIdx);
                                  return (
                                    <button
                                      key={optIdx}
                                      className={`cp-quiz-option ${isSelected ? 'selected' : ''}`}
                                      onClick={() => {
                                        const updated = [...quizAnswers];
                                        updated[qIdx] = [optIdx]; // Single choice for simplicity
                                        setQuizAnswers(updated);
                                      }}
                                    >
                                      <div className="cp-quiz-radio">
                                        {isSelected && <div className="cp-quiz-radio-dot" />}
                                      </div>
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                          <button
                            className="cp-bottom-nav-btn"
                            disabled={currentQuizQ === 0}
                            onClick={() => setCurrentQuizQ(currentQuizQ - 1)}
                          >
                            <ChevronLeft size={16} /> Previous
                          </button>
                          {currentQuizQ < (courseData?.questions?.length || 0) - 1 ? (
                            <button
                              className="cp-bottom-nav-btn next"
                              onClick={() => setCurrentQuizQ(currentQuizQ + 1)}
                              disabled={!quizAnswers[currentQuizQ]?.length}
                            >
                              Next Question <ChevronRight size={16} />
                            </button>
                          ) : (
                            <div className="cp-quiz-submit">
                              <button
                                onClick={async () => {
                                  let correct = 0;
                                  courseData.questions.forEach((q: any, i: number) => {
                                    const sel = quizAnswers[i] || [];
                                    const ans = q.correct_answers || [];
                                    if (sel.length === ans.length && sel.every((v: number) => ans.includes(v))) correct++;
                                  });
                                  const score = Math.round((correct / courseData.questions.length) * 100);
                                  const passed = score >= 70;
                                  setQuizResult({ score, passed });
                                  
                                  if (passed) {
                                    // Notify backend about track completion
                                    fetch(`${API_BASE_URL}/api/progress/update`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        user_id: user?.uid,
                                        course_id: courseId,
                                        updates: { 
                                          final_assessment_passed: true, 
                                          final_assessment_score: score,
                                          track_completed_at: new Date().toISOString()
                                        }
                                      })
                                    }).catch(console.error);
                                  }
                                }}
                                disabled={quizAnswers.some(a => !a?.length)}
                                style={{ padding: '14px 40px' }}
                              >
                                Finalize Assessment
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className={`cp-quiz-result ${quizResult.passed ? 'passed' : 'failed'}`} style={{ padding: '48px 32px' }}>
                        <div className="cp-quiz-result-score">{quizResult.score}%</div>
                        <h2 style={{ margin: '16px 0 8px', color: quizResult.passed ? '#065f46' : '#991b1b' }}>
                          {quizResult.passed ? 'CONGRATULATIONS!' : 'NEEDS IMPROVEMENT'}
                        </h2>
                        <p style={{ fontSize: 16, color: '#4b5563', marginBottom: 32 }}>
                          {quizResult.passed 
                            ? 'You have successfully cleared the final assessment for this professional track.' 
                            : 'You need at least 70% to pass this track. Please review the course materials and try again.'}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                          {quizResult.passed ? (
                             <button className="cp-topbar-btn primary" style={{ padding: '14px 40px', fontSize: 14, height: 'auto' }} onClick={goToNextLesson}>
                               Proceed to Capstone <ChevronRight size={18} />
                             </button>
                          ) : (
                            <button className="cp-topbar-btn" style={{ padding: '14px 32px', height: 'auto' }} onClick={() => setQuizResult(null)}>
                              Try Again
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── RESULT / GRADUATION ── */}
              {activeStage === 'result' && (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <div className="cp-text-lesson" style={{ textAlign: 'center', maxWidth: 800 }}>
                    <div style={{ marginBottom: 60 }}>
                      <motion.div
                        initial={{ rotate: -15, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', damping: 10 }}
                        style={{ display: 'inline-block', marginBottom: 24 }}
                      >
                        <Trophy size={100} style={{ color: '#fbbf24' }} />
                      </motion.div>
                      <h1 style={{ fontSize: 42, color: '#111827', marginBottom: 16 }}>Track Accomplished!</h1>
                      <p style={{ fontSize: 18, color: '#6b7280', maxWidth: 640, margin: '0 auto' }}>
                        Outstanding dedication. You've successfully completed all modules and submitted your final project.
                      </p>
                      <div style={{ marginTop: 24, padding: '16px 24px', background: '#f5f3ff', borderRadius: 12, border: '1px solid #7C3AED', color: '#7C3AED', fontWeight: 600, display: 'inline-block' }}>
                         Your assessment is being evaluated. Once evaluated, you can collect the certificate.
                      </div>
                    </div>

                    <div style={{ marginBottom: 48 }}>
                       <p style={{ fontSize: 18, color: '#6b7280', fontWeight: 500 }}>
                         Your track completion has been recorded. You can now return to the dashboard and explore more tracks.
                       </p>
                    </div>

                    <button className="cp-topbar-btn primary" style={{ padding: '16px 48px', height: 'auto', fontSize: 16 }} onClick={() => navigate('/dashboard')}>
                      Return to Dashboard
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ══════ RIGHT SIDEBAR ══════ */}
          <div className="cp-tools-sidebar">
            <div className="cp-tools-tabs">
              <button
                className={`cp-tools-tab ${activeToolTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveToolTab('notes')}
              >
                <StickyNote size={13} style={{ display: 'inline', marginRight: 4 }} /> Notes
              </button>
              <button
                className={`cp-tools-tab ${activeToolTab === 'transcript' ? 'active' : ''}`}
                onClick={() => setActiveToolTab('transcript')}
              >
                <AlignLeft size={13} style={{ display: 'inline', marginRight: 4 }} /> Transcript
              </button>
              <button
                className={`cp-tools-tab ${activeToolTab === 'resources' ? 'active' : ''}`}
                onClick={() => setActiveToolTab('resources')}
              >
                <BookOpen size={13} style={{ display: 'inline', marginRight: 4 }} /> Resources
              </button>
            </div>

            <div className="cp-tools-content">
              {activeToolTab === 'notes' && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>
                    Your notes for this lesson
                  </div>
                  <textarea
                    className="cp-notes-area"
                    placeholder="Type your notes here..."
                    value={notes}
                    onChange={e => { setNotes(e.target.value); setNotesSaved(false); }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button className="cp-notes-save-btn" onClick={() => setNotesSaved(true)}>
                      Save Notes
                    </button>
                    {notesSaved && (
                      <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>✓ Saved</span>
                    )}
                  </div>
                </div>
              )}

              {activeToolTab === 'transcript' && (
                <div className="cp-transcript-block">
                  {activeStage === 'video' ? (
                    DUMMY_TRANSCRIPT.map((seg, i) => (
                      <div key={i} style={{ marginBottom: 16 }}>
                        <span className="cp-transcript-timestamp">{seg.time}</span>
                        {seg.text}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: 40 }}>
                      Transcript is only available for video lessons.
                    </div>
                  )}
                </div>
              )}

              {activeToolTab === 'resources' && (
                <div className="cp-transcript-block">
                  {currentModule?.lessons?.[activeLessonIndex]?.resources && currentModule.lessons[activeLessonIndex].resources.length > 0 ? (
                    currentModule.lessons[activeLessonIndex].resources.map((res: string, i: number) => (
                      <a key={i} href={res} target="_blank" rel="noreferrer" className="cp-resource-item" style={{ textDecoration: 'none' }}>
                        <Link size={16} style={{ color: '#7C3AED' }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Resource Link {i + 1}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{res}</div>
                        </div>
                      </a>
                    ))
                  ) : (
                    <div style={{ padding: '20px 0', textAlign: 'center', opacity: 0.5 }}>
                        <BookOpen size={24} style={{ margin: '0 auto 10px', color: '#6b7280' }} />
                        <p style={{ fontSize: 13, color: '#6b7280' }}>No external resources for this lesson.</p>
                    </div>
                  )}
                  
                  <button className="cp-ask-btn">
                    <MessageCircle size={18} />
                    Ask a question about this lesson
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Nav */}
        <div className="cp-bottom-nav">
          <button className="cp-bottom-nav-btn" onClick={goToPrevLesson} disabled={currentFlatIndex <= 0}>
            <ChevronLeft size={16} /> Previous Lesson
          </button>

          <div className="cp-bottom-progress">
            <div className="cp-bottom-progress-bar">
              <div className="cp-bottom-progress-fill" style={{ width: `${overallProgress}%` }} />
            </div>
            <span className="cp-bottom-progress-text">{overallProgress}% complete</span>
          </div>

          <button
            className="cp-bottom-nav-btn next"
            onClick={goToNextLesson}
            disabled={currentFlatIndex >= flatLessons.length - 1}
          >
            Next Lesson <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ══════ COMPLETION MODAL ══════ */}
      <AnimatePresence>
        {completionPrompt.open && (
          <motion.div
            className="cp-modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="cp-modal"
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ padding: '48px 32px', textAlign: 'center', borderRadius: 24, boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }}
            >
              <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, background: '#F5F3FF', borderRadius: '50%', transform: 'scale(1.2)' }} />
                {completionPrompt.earnedBadge ? (
                  <div style={{ fontSize: 64, position: 'relative', zIndex: 2 }}>{completionPrompt.earnedBadge.icon}</div>
                ) : (
                  <Award size={64} style={{ color: '#7C3AED', position: 'relative', zIndex: 2 }} />
                )}
                <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#10b981', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, boxSizing: 'border-box' }}>BADGE EARNED</div>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>
                {completionPrompt.earnedBadge ? completionPrompt.earnedBadge.name : 'Module Achievement!'}
              </h3>
              <p style={{ fontSize: 15, color: '#6b7280', margin: '0 0 32px' }}>
                {completionPrompt.earnedBadge 
                  ? completionPrompt.earnedBadge.description 
                  : `Outstanding! You've successfully completed ${completionPrompt.moduleName} and earned this competency badge.`
                }
              </p>
              {completionPrompt.nextIndex !== null ? (
                <button
                  className="cp-modal-primary"
                  style={{ width: '100%', padding: '16px', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all .2s' }}
                  onClick={() => {
                    setCompletionPrompt({ open: false, nextIndex: null, moduleName: '' });
                    setActiveModuleIndex(completionPrompt.nextIndex as number);
                    setActiveStage('video');
                    setQuizResult(null);
                    const s = new Set(expandedModules);
                    const targetIdx = completionPrompt.nextIndex as number;
                    if (targetIdx >= 0) s.add(targetIdx);
                    setExpandedModules(s);
                    scrollContentTop();
                  }}
                >
                  Continue to Next Module →
                </button>
              ) : (
                <button
                  className="cp-modal-secondary"
                  style={{ width: '100%', padding: '16px', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all .2s' }}
                  onClick={() => setCompletionPrompt({ open: false, nextIndex: null, moduleName: '' })}
                >
                  Return to Course Home ✓
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoursePlayer;
