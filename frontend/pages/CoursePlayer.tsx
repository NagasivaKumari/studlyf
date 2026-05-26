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
  ChevronDown, ChevronLeft, ChevronRight, FileText, HelpCircle,
  CheckCircle2, Menu, X, BookOpen, MessageCircle, StickyNote,
  AlignLeft, Code, Award, Trophy, ShieldAlert, Link, AlertTriangle
} from 'lucide-react';
import './CoursePlayerStyles.css';

/* ═══════ Types ═══════ */
interface Lesson {
  type: 'overview' | 'text' | 'theory' | 'practice_quiz' | 'quiz' | 'graded_quiz';
  title: string;
}

interface Module {
  _id: string;
  title: string;
  order_index: number;
  estimated_time: string;
  lessons: Lesson[];
  progress?: {
    status: string;
    completed_lessons?: string[];
    theory_completed: boolean;
    video_completed: boolean;
    quiz_score: number;
    quiz_answers: number[][];
    project_status: string;
    review_status?: string;
  };
}

type LessonType = 'overview' | 'text' | 'theory' | 'practice_quiz' | 'graded_quiz' | 'quiz' | 'capstone' | 'result';

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

const getLessonLabel = (type: LessonType): string => {
  if (type === 'overview') return 'Module Overview';
  if (type === 'text' || type === 'theory') return 'Reading Material';
  if (type === 'practice_quiz') return 'Practice Quiz';
  return 'Graded Assignment';
};

const DUMMY_TRANSCRIPT: { time: string; text: string }[] = [
  { time: "0:00", text: "Welcome to this reading module." },
  { time: "0:30", text: "In this lesson, we will focus on core written material." },
  { time: "1:00", text: "Please review the notes and complete the quizzes to unlock the next steps." }
];

/* ═══════ Coursera Content Database ═══════ */
const COURSE_CONTENT_DB: Record<string, any> = {
  "0": {
    overview: `### Module 1 Overview: What You'll Learn

Welcome to the foundational module of this course! Here, we lay the groundwork for your understanding of key concepts, mental models, and real-world architectures.

#### 🎯 Learning Objectives
* 🧠 **Establish Core Principles**: Define the fundamental terminology, structures, and history of the topic.
* ⚡ **Identify Key Paradigms**: Contrast classical theories with modern state-of-the-art frameworks.
* 🛠️ **Real-World Applications**: Walk through case studies of how these concepts are deployed in industry today.

#### ⏱️ Estimated Time Commitment
* **Readings**: 15 minutes
* **Practice Practice**: 10 minutes
* **Graded Assessment**: 15 minutes`,

    reading: `### Core Lesson: Understanding the Core Architecture

In this lesson, we dive deep into the technical specifications and underlying mechanisms of modern systems. We will explore how different components interact to form a cohesive, reliable architecture.

#### 1. The Architectural Hierarchy
Every robust system is divided into layers, each possessing a specific responsibility:
1. **User Interface / Presentation Layer**: Captures user input and renders visual feedback.
2. **Application / Orchestration Layer**: Processes logic, handles states, and routes data.
3. **Data / Storage Layer**: Ensures persistence, integrity, and quick retrieval of records.

> "A well-designed system minimizes tight coupling and maximizes cohesive separation of concerns."

#### 2. Key Challenges & Trade-offs
When building at scale, engineers constantly balance three competing forces:
* **Latency**: The time taken to process a request (aiming for sub-100ms).
* **Throughput**: The number of requests handled per second.
* **Consistency**: Ensuring all clients see the same data at the same time.

\`\`\`javascript
// Example of a simple decoupled API controller
class SystemController {
  async handleRequest(request) {
    const input = this.sanitize(request.body);
    const result = await this.orchestrator.process(input);
    return this.respond(200, result);
  }
}
\`\`\`

#### Summary
By isolating our business logic from direct data storage, we ensure our systems are resilient to infrastructure shifts and are easily testable.`,

    practice: [
      {
        question: "Which layer in the standard architectural hierarchy is responsible for processing logic and routing data?",
        options: [
          "Presentation Layer",
          "Application / Orchestration Layer",
          "Data Layer",
          "Network Infrastructure Layer"
        ],
        correct: 1,
        explanation: "The Application / Orchestration Layer handles business logic, state management, and coordinates data movement between the interface and database."
      },
      {
        question: "What is the primary trade-off of introducing high-consistency measures in a distributed network?",
        options: [
          "Reduced UI styling options",
          "Slightly increased latency during write operations",
          "Loss of encryption features",
          "Inability to run Javascript"
        ],
        correct: 1,
        explanation: "Ensuring high consistency across multiple nodes requires synchronization protocols, which slightly increases write latency but guarantees data accuracy."
      }
    ],

    graded: [
      {
        question: "What does the Turing Test primarily benchmark in an artificial system?",
        options: [
          "Mechanical processing speed",
          "Human conversational imitation capability",
          "Database query indexing efficiency",
          "Graphic rendering frames per second"
        ],
        correct: 1,
        explanation: "Proposed by Alan Turing in 1950, the Turing Test evaluates a machine's ability to exhibit natural language behavior indistinguishable from a human."
      },
      {
        question: "In standard software architecture, what is the major drawback of 'tight coupling' between components?",
        options: [
          "It makes code run too fast.",
          "It makes the system difficult to modify, test, and scale independently.",
          "It requires specialized hardware.",
          "It automatically deletes local storage."
        ],
        correct: 1,
        explanation: "Tight coupling means components are heavily dependent on each other, meaning a change in one component breaks others, making testing and scaling highly difficult."
      },
      {
        question: "Which of the following describes Narrow AI (Weak AI)?",
        options: [
          "An AI that possesses general consciousness and self-awareness.",
          "An AI designed and trained exclusively for a specific specialized task.",
          "An AI that can write novels and compose symphonies with human emotion.",
          "An AI that operates outside of hardware bounds."
        ],
        correct: 1,
        explanation: "Narrow AI is specialized to perform a single, specific task (such as speech translation, board games, or object detection) extremely well, but cannot generalize."
      }
    ]
  },

  "1": {
    overview: `### Module 2 Overview: Deep Dive into Algorithmic Operations

Now that you have established core architectural models, we will study modern algorithms, connectionist frameworks, and neural optimizations.

#### 🎯 Learning Objectives
* 📈 **Explore Neural Structures**: Analyze how artificial neurons accumulate weights and biases.
* 🎛️ **Optimization Strategies**: Study Backpropagation, Gradient Descent, and cost functions.
* 🛠️ **Practical Implementation**: Map how model adjustments are made to improve precision.

#### ⏱️ Estimated Time Commitment
* **Readings**: 18 minutes
* **Practice Practice**: 12 minutes
* **Graded Assessment**: 15 minutes`,

    reading: `### Core Lesson: Connectionist Systems & Neural Training

In connectionist systems, we do not program explicit logic rules. Instead, we define a mathematical architecture capable of learning representations from raw input.

#### 1. The Anatomy of an Artificial Neuron
An artificial neuron (perceptron) performs three primary mathematical operations:
1. **Weighted Summation**: Multiplies inputs ($x_i$) by their corresponding weights ($w_i$) and adds a bias ($b$).
   $$z = \\sum x_i w_i + b$$
2. **Activation Function**: Applies a non-linear transform (like ReLU or Sigmoid) to the sum, introducing non-linearity to allow the model to learn complex shapes.
   $$a = \\sigma(z)$$
3. **Output Routing**: Passes the activation value to subsequent layers.

#### 2. The Optimization Loop
Training a model is an iterative cycle composed of four steps:
* **Forward Pass**: Running input data through the layers to compute a prediction.
* **Loss Calculation**: Measuring how far the prediction is from the actual truth using a cost function (e.g. Mean Squared Error).
* **Backward Pass (Backpropagation)**: Calculating gradients of the loss function with respect to weights using the chain rule.
* **Weight Update (Gradient Descent)**: Shifting weights slightly in the direction that minimizes loss:
  $$w \\leftarrow w - \\alpha \\frac{\\partial L}{\\partial w}$$

\`\`\`python
# Simple Python implementation of gradient descent weight update
def update_weights(weights, gradients, learning_rate):
    for i in range(len(weights)):
        weights[i] -= learning_rate * gradients[i]
    return weights
\`\`\`

#### Summary
Neural networks are function approximators. Through backpropagation and gradient descent, they systematically tune millions of parameters until they can map inputs to outputs with incredible accuracy.`,

    practice: [
      {
        question: "What is the purpose of an Activation Function in a neural network?",
        options: [
          "To delete unused variables and save memory",
          "To introduce non-linearity, allowing the model to learn complex patterns",
          "To directly connect the database to the neural net",
          "To speed up database indexing"
        ],
        correct: 1,
        explanation: "Without non-linear activation functions (like ReLU), a neural network of any depth would behave exactly like a simple linear model, unable to learn complex non-linear patterns."
      },
      {
        question: "What does the learning rate (alpha) control in Gradient Descent?",
        options: [
          "The speed of network internet packets",
          "The size of the steps taken toward the minimum of the loss function",
          "The number of neurons in the hidden layer",
          "The CPU cooling fan speed"
        ],
        correct: 1,
        explanation: "The learning rate controls the step size taken during parameter updates. Too large can overshoot the minimum; too small will make training extremely slow."
      }
    ],

    graded: [
      {
        question: "In neural training, what does 'Backpropagation' accomplish?",
        options: [
          "It reverses the flow of input data to display it on screen.",
          "It computes the gradients of the loss function relative to each weight using the mathematical chain rule.",
          "It deletes corrupted training images.",
          "It checks if the computer is connected to the database."
        ],
        correct: 1,
        explanation: "Backpropagation propagates the prediction error backward through the network to calculate how much each weight contributed to that error, providing the gradients needed for updates."
      },
      {
        question: "Which of the following functions is a common non-linear activation function?",
        options: [
          "Linear Regression",
          "Rectified Linear Unit (ReLU)",
          "Binary Search",
          "Merge Sort"
        ],
        correct: 1,
        explanation: "ReLU is the most widely used activation function in modern deep neural networks due to its simplicity and computational efficiency: f(x) = max(0, x)."
      },
      {
        question: "What happens during the 'Forward Pass' of a neural network?",
        options: [
          "The network updates its weights using gradient descent.",
          "Input data is processed through layers to calculate a prediction output.",
          "The model undergoes strict cybersecurity auditing.",
          "The training data is shuffled randomly."
        ],
        correct: 1,
        explanation: "The Forward Pass is the process of feeding inputs through the network's layers, performing activations, and generating a prediction or classification."
      }
    ]
  },

  "2": {
    overview: `### Module 3 Overview: Deep Learning & Generative AI

In this final core module, we transition to advanced Deep Learning, Recurrent Architectures, and the Transformer models that power modern Generative AI.

#### 🎯 Learning Objectives
* 🤖 **Understanding Transformers**: Analyze the Self-Attention mechanism that revolutionized language models.
* 🌌 **Generative Models**: Differentiate between GANs, Diffusion, and Large Language Models (LLMs).
* 🔐 **Ethics & Alignment**: Study bias mitigation and alignment techniques (like RLHF).

#### ⏱️ Estimated Time Commitment
* **Readings**: 20 minutes
* **Practice Practice**: 12 minutes
* **Graded Assessment**: 15 minutes`,

    reading: `### Core Lesson: The Rise of Transformers & Generative AI

Deep Learning took a historic leap in 2017 with the publication of the seminal paper *"Attention Is All You Need"* by Google researchers. This introduced the **Transformer** architecture, which completely replaced recurrent networks (RNNs) in modern natural language processing.

#### 1. The Magic of Self-Attention
Traditional sequential models processed language word-by-word. Transformers process entire sentences simultaneously using **Self-Attention**:
* **Parallelization**: Massive training datasets can be processed concurrently across GPUs, accelerating training times.
* **Contextual Relationships**: The model calculates attention scores between all words in a sentence, immediately understanding relationships regardless of distance (e.g. pronoun references).

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$

#### 2. Paradigms of Generative AI
Generative AI refers to algorithms that can be used to create new content, including audio, code, images, and text. Key architectures include:
* **Large Language Models (LLMs)**: Autoregressive decoders trained to predict the next token in a sequence (e.g. GPT series, Llama).
* **Generative Adversarial Networks (GANs)**: A generator and discriminator in a zero-sum game to create realistic assets (like images or voices).
* **Diffusion Models**: Generate high-fidelity images by systematically removing noise from a canvas (e.g. Stable Diffusion, Midjourney).

\`\`\`python
# Conceptualizing autoregressive text generation
def generate_text(prompt, model, max_tokens=10):
    current_text = prompt
    for _ in range(max_tokens):
        next_token = model.predict_next_token(current_text)
        current_text += \" \" + next_token
    return current_text
\`\`\`

#### Summary
Generative AI is reshaping industries by automating complex cognitive tasks. Understanding the mathematical mechanics of attention and prompt optimization is key to leveraging this technology effectively.`,

    practice: [
      {
        question: "What core mechanism introduced in 2017 allowed Transformers to process sentences in parallel instead of sequentially?",
        options: [
          "Recurrent Connections",
          "Self-Attention Mechanism",
          "Convolutional Filtering",
          "Manual Logic Rule Injection"
        ],
        correct: 1,
        explanation: "The Self-Attention mechanism allows the model to analyze relationships between all words in a sentence simultaneously, eliminating sequential bottlenecks and enabling massive parallel processing."
      },
      {
        question: "What game-theoretic setup defines Generative Adversarial Networks (GANs)?",
        options: [
          "Cooperative multiplayer game",
          "A zero-sum competition between a Generator and a Discriminator",
          "A simple database index lookup",
          "Single-player random search"
        ],
        correct: 1,
        explanation: "GANs feature a Generator (creating fake data) competing against a Discriminator (identifying fake vs real data) in a competitive, zero-sum adversarial game until the generator creates perfect fakes."
      }
    ],

    graded: [
      {
        question: "What does 'Autoregressive' text generation mean in Large Language Models?",
        options: [
          "The model generates the entire response in a single parallel step.",
          "The model predicts the next token sequentially, feeding its own previous outputs back as input.",
          "The model automatically restarts the computer after running.",
          "The system searches Google for the answers."
        ],
        correct: 1,
        explanation: "Autoregressive generation means the model outputs one token/word at a time, and then appends that token to the input prompt to predict the next token in the sequence."
      },
      {
        question: "Which paper introduced the revolutionary Transformer architecture?",
        options: [
          "Deep Learning in Neural Networks",
          "Attention Is All You Need",
          "Computing Machinery and Intelligence",
          "ImageNet Classification with Deep CNNs"
        ],
        correct: 1,
        explanation: "Google researchers published 'Attention Is All You Need' in 2017, introducing the attention mechanism and laying the foundation for modern LLMs."
      },
      {
        question: "What is the primary benefit of parallelization in Transformer training?",
        options: [
          "It makes the computer run cooler.",
          "It allows massive datasets to be processed rapidly across clustered GPUs.",
          "It completely eliminates the need for any programming code.",
          "It restricts the model to only outputting integers."
        ],
        correct: 1,
        explanation: "Because self-attention doesn't process text word-by-word sequentially, training can be distributed across thousands of processor cores concurrently, dramatically shortening training cycles."
      }
    ]
  }
};

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
  const [activeStage, setActiveStage] = useState<LessonType>('overview');
  const [courseData, setCourseData] = useState<any>(null);

  // Sidebar
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop sidebar collapse

  // Right tools
  const [activeToolTab, setActiveToolTab] = useState<'notes' | 'transcript' | 'resources'>('notes');
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Persistent localStorage Progress State
  const resolvedCourseId = extractCourseId(courseId);
  const progressKey = `studlyf_progress_${user?.uid || 'guest'}_${resolvedCourseId}`;
  
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(progressKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Whenever completedSteps changes, save to localStorage
  useEffect(() => {
    localStorage.setItem(progressKey, JSON.stringify(completedSteps));
  }, [completedSteps, progressKey]);

  // Quizzes State
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, number>>({});
  const [quizAnswers, setQuizAnswers] = useState<number[][]>([]);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [currentQuizQ, setCurrentQuizQ] = useState(0);

  // Project state
  const [githubLink, setGithubLink] = useState(() => localStorage.getItem(`${progressKey}_github`) || '');
  const [deployedLink, setDeployedLink] = useState(() => localStorage.getItem(`${progressKey}_deployed`) || '');

  // Completion modal
  const [completionPrompt, setCompletionPrompt] = useState<{
    open: boolean; nextIndex: number | null; moduleName: string; earnedBadge?: any;
  }>({ open: false, nextIndex: null, moduleName: '' });

  const contentRef = useRef<HTMLDivElement>(null);

  /* ── Build flat lesson list ── */
  const buildLessons = (mods: Module[]): FlatLesson[] => {
    const list: FlatLesson[] = [];
    mods.forEach((mod, i) => {
      list.push({ moduleIndex: i, lessonIndex: 0, type: 'overview', title: 'Module Overview' });
      list.push({ moduleIndex: i, lessonIndex: 1, type: 'text', title: 'Reading Material' });
      list.push({ moduleIndex: i, lessonIndex: 2, type: 'practice_quiz', title: 'Practice Quiz' });
      list.push({ moduleIndex: i, lessonIndex: 3, type: 'graded_quiz', title: 'Graded Quiz' });
    });
    
    // Add Mini Project (Capstone)
    list.push({ moduleIndex: -1, lessonIndex: -1, type: 'capstone', title: 'Mini Project Submission' });

    // Add Result Page
    list.push({ moduleIndex: -3, lessonIndex: -3, type: 'result', title: 'Course Completion' });

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
      let cData: any = null;
      if (courseRes.ok) {
        cData = await courseRes.json();
        setCourseData(cData);
      }

      let fetched = Array.isArray(data) ? data : [];
      
      // Enforce virtual 4-step Coursera schema inside CoursePlayer state
      const formatted = fetched.map((mod: any) => ({
        ...mod,
        lessons: [
          { type: 'overview', title: 'Module Overview — What You\'ll Learn' },
          { type: 'text', title: 'Core Reading — Core Content' },
          { type: 'practice_quiz', title: 'Practice Quiz — Check Understanding' },
          { type: 'graded_quiz', title: 'Graded Assignment — Pass to Unlock' }
        ]
      }));

      // Initialize completedSteps from backend progress (Backwards Compatibility)
      const initialCompleted: Record<string, boolean> = {};
      fetched.forEach((mod: any, modIdx: number) => {
        const p = mod.progress;
        if (p) {
          if (p.status === 'completed') {
            initialCompleted[`${modIdx}_0`] = true;
            initialCompleted[`${modIdx}_1`] = true;
            initialCompleted[`${modIdx}_2`] = true;
            initialCompleted[`${modIdx}_3`] = true;
          } else {
            p.completed_lessons?.forEach((idxStr: string) => {
              initialCompleted[`${modIdx}_${idxStr}`] = true;
            });
            if (p.theory_completed) {
              initialCompleted[`${modIdx}_0`] = true;
              initialCompleted[`${modIdx}_1`] = true;
            }
            if (p.quiz_score >= 70) {
              initialCompleted[`${modIdx}_2`] = true;
              initialCompleted[`${modIdx}_3`] = true;
            }
          }
        }
      });
      
      if (cData?.progress?.project_status === 'submitted') {
        initialCompleted['capstone'] = true;
      }
      
      setCompletedSteps(prev => ({ ...initialCompleted, ...prev }));
      setModules(formatted);
      setLoading(false);
      return formatted;
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
      if (les) {
        setActiveStage(les.type as LessonType);
      }
    } else if (activeModuleIndex === -1) {
      setActiveStage('capstone');
    } else if (activeModuleIndex === -3) {
      setActiveStage('result');
    }
  }, [activeModuleIndex, activeLessonIndex, modules]);

  const fetchModuleDetails = async (moduleId: string) => {
    let data: any = {};
    if (!moduleId.startsWith('dummy-mod')) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/modules/${moduleId}`);
        if (res.ok) data = await res.json();
      } catch {}
    }
    setModuleDetails(data);
    
    // Fetch DB Content questions counts
    const contentDb = COURSE_CONTENT_DB[activeModuleIndex.toString()] || COURSE_CONTENT_DB[(activeModuleIndex % 3).toString()];
    const gradedQs = contentDb?.graded || [];
    setQuizAnswers(gradedQs.map(() => []));
    setCurrentQuizQ(0);
    
    // Check if previously passed
    if (completedSteps[`${activeModuleIndex}_3`]) {
      setQuizResult({ score: 100, passed: true });
    } else {
      setQuizResult(null);
    }
  };

  /* ── Progress Updates ── */
  const updateProgress = async (updates: any) => {
    if (modules[activeModuleIndex]?._id?.startsWith('dummy-mod')) {
      const updated = [...modules];
      const cur = updated[activeModuleIndex];
      if (!cur.progress) cur.progress = { status: 'unlocked', theory_completed: false, video_completed: false, quiz_score: 0, quiz_answers: [], project_status: 'pending', review_status: 'pending' };
      Object.assign(cur.progress, updates);
      if (updates.status === 'completed' || updates.quiz_score >= 70) {
        cur.progress.status = 'completed';
      }
      setModules(updated);
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/progress/update`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user?.uid, 
          course_id: resolvedCourseId, 
          module_id: modules[activeModuleIndex]?._id, 
          updates 
        })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn("Failed to sync progress with database, persisting locally.", err);
    }
  };

  /* ── Graded Quiz Submission ── */
  const handleQuizSubmit = async () => {
    const contentDb = COURSE_CONTENT_DB[activeModuleIndex.toString()] || COURSE_CONTENT_DB[(activeModuleIndex % 3).toString()];
    const questions = contentDb?.graded || [];
    
    let correct = 0;
    questions.forEach((q: any, i: number) => {
      const sel = quizAnswers[i] || [];
      if (sel.includes(q.correct)) {
        correct++;
      }
    });

    const score = Math.round((correct / Math.max(questions.length, 1)) * 100);
    const passed = score >= 70; // 70% threshold typical of Coursera

    setQuizResult({ score, passed });

    if (passed) {
      // Mark as complete in completedSteps
      const stepKey = `${activeModuleIndex}_3`;
      const newCompleted = { ...completedSteps, [stepKey]: true };
      setCompletedSteps(newCompleted);

      // Save to database progress
      const completedIndices: string[] = [];
      for (let i = 0; i < 4; i++) {
        if (newCompleted[`${activeModuleIndex}_${i}`]) {
          completedIndices.push(i.toString());
        }
      }

      await updateProgress({
        quiz_score: score,
        quiz_answers: quizAnswers,
        completed_lessons: completedIndices,
        status: completedIndices.length === 4 ? 'completed' : 'unlocked'
      });

      // Show module completion prompt if all 4 lessons are complete
      if (completedIndices.length === 4) {
        setTimeout(() => {
          setCompletionPrompt({
            open: true,
            nextIndex: activeModuleIndex + 1 < modules.length ? activeModuleIndex + 1 : -1,
            moduleName: modules[activeModuleIndex].title
          });
        }, 1200);
      }
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
    
    // Check if the next step is in a locked module
    if (next.moduleIndex >= 0) {
      const isNextModuleLocked = next.moduleIndex > 0 && !isModuleComplete(next.moduleIndex - 1);
      if (isNextModuleLocked) {
        alert("The next module is locked. You must complete all stages and pass the Graded Assignment of the current module to unlock it.");
        return;
      }
    } else if (next.moduleIndex === -1) {
      // Capstone (Mini Project) Lock Check
      const allModulesDone = modules.every((_, idx) => isModuleComplete(idx));
      if (!allModulesDone) {
        alert("The Mini Project is locked. You must complete and pass all modules of the course first!");
        return;
      }
    } else if (next.moduleIndex === -3) {
      // Result Page Lock Check
      if (!completedSteps['capstone']) {
        alert("The Completion page is locked. You must submit your Mini Project GitHub repository to graduate!");
        return;
      }
    }

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

  const handleMarkComplete = async () => {
    const stepKey = `${activeModuleIndex}_${activeLessonIndex}`;
    const newCompleted = { ...completedSteps, [stepKey]: true };
    setCompletedSteps(newCompleted);

    const curMod = modules[activeModuleIndex];
    if (curMod) {
      const completedIndices: string[] = [];
      for (let i = 0; i < 4; i++) {
        if (newCompleted[`${activeModuleIndex}_${i}`]) {
          completedIndices.push(i.toString());
        }
      }
      
      const isFinishingModule = completedIndices.length === 4;
      const updates: any = {
        completed_lessons: completedIndices,
        status: isFinishingModule ? 'completed' : 'unlocked'
      };

      if (activeStage === 'overview') updates.video_completed = true;
      if (activeStage === 'text' || activeStage === 'theory') updates.theory_completed = true;

      await updateProgress(updates);

      if (isFinishingModule) {
        setCompletionPrompt({
          open: true,
          nextIndex: activeModuleIndex + 1 < modules.length ? activeModuleIndex + 1 : -1,
          moduleName: curMod.title
        });
        return;
      }
    }

    if (currentFlatIndex < flatLessons.length - 1) {
      goToNextLesson();
    }
  };

  const isLessonComplete = (modIdx: number, type: LessonType, lessonIdx: number): boolean => {
    if (modIdx === -1) return !!completedSteps['capstone'];
    if (modIdx === -3) return false;
    return !!completedSteps[`${modIdx}_${lessonIdx}`];
  };

  const isModuleComplete = (modIdx: number): boolean => {
    if (modIdx < 0) return false;
    return (
      !!completedSteps[`${modIdx}_0`] &&
      !!completedSteps[`${modIdx}_1`] &&
      !!completedSteps[`${modIdx}_2`] &&
      !!completedSteps[`${modIdx}_3`]
    );
  };

  const getModuleProgressPercent = (modIdx: number): number => {
    let completed = 0;
    for (let i = 0; i < 4; i++) {
      if (completedSteps[`${modIdx}_${i}`]) completed++;
    }
    return Math.round((completed / 4) * 100);
  };

  const isCurrentLessonComplete = isLessonComplete(activeModuleIndex, activeStage, activeLessonIndex);
  
  // Dynamic Coursera Course Completion Progress Bar
  const overallProgress = (() => {
    if (!flatLessons.length) return 0;
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

  const currentModule = modules[activeModuleIndex];
  
  const currentLessonTitle = currentModule
    ? currentModule.lessons?.[activeLessonIndex]?.title || `${currentModule.title} — ${getLessonLabel(activeStage)}`
    : activeStage === 'capstone'
      ? 'Mini Project Submission'
      : activeStage === 'result'
        ? 'Course Certification'
        : 'Loading...';

  const activeContentDb = modules.length > 0 && activeModuleIndex >= 0
    ? (COURSE_CONTENT_DB[activeModuleIndex.toString()] || COURSE_CONTENT_DB[(activeModuleIndex % 3).toString()])
    : null;

  if (loading) return (
    <div className="cp-loading">
      <div className="cp-spinner" />
      <span className="cp-loading-text">Loading course modules...</span>
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
          <button className="cp-sidebar-back" onClick={() => navigate('/dashboard/my-courses')}>
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
            
            // Enforce Coursera sequential module locking
            let isLocked = false;
            if (modIdx > 0) {
              isLocked = !isModuleComplete(modIdx - 1);
            }
            
            const isCompleted = isModuleComplete(modIdx);
            const modProgress = getModuleProgressPercent(modIdx);

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
                        {`${mod.estimated_time || '1 hour'} · 4 steps`}
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
                      const done = !!completedSteps[`${modIdx}_${lessonIdx}`];
                      const Icon = (type === 'overview' || type === 'text' || type === 'theory') ? FileText : HelpCircle;
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

          {/* Final Milestone Section */}
          <div className="cp-module-group" style={{ borderBottom: 'none', paddingBottom: 40 }}>
            <div className="cp-sidebar-divider">Final Milestone</div>
            
            {(() => {
                const allModulesDone = modules.every((_, idx) => isModuleComplete(idx));
                const capstoneLocked = !allModulesDone;
                const resultLocked = !completedSteps['capstone'];
                
                return (
                    <>
                        <button 
                          className={`cp-lesson-item ${activeStage === 'capstone' ? 'active' : ''} ${capstoneLocked ? 'locked' : ''} ${completedSteps['capstone'] ? 'completed' : ''}`} 
                          onClick={() => { 
                            if (!capstoneLocked) { 
                              setActiveModuleIndex(-1); 
                              setActiveStage('capstone'); 
                              setSidebarOpen(false); 
                              scrollContentTop(); 
                            } else {
                              alert("Please complete and pass all course modules first!");
                            }
                          }}
                          style={{ paddingLeft: 20, opacity: capstoneLocked ? 0.4 : 1 }}
                        >
                            <Code size={16} className="cp-lesson-icon" />
                            <span className="cp-lesson-name">Mini Project</span>
                            {completedSteps['capstone'] ? (
                                <div className="cp-lesson-check done" style={{ marginLeft: 'auto' }}><CheckCircle2 size={10} /></div>
                            ) : capstoneLocked ? (
                                <span className="text-[9px] uppercase font-semibold text-white/30 ml-auto">Locked</span>
                            ) : (
                                <div className="cp-lesson-check" style={{ marginLeft: 'auto' }} />
                            )}
                        </button>

                        <button 
                          className={`cp-lesson-item ${activeStage === 'result' ? 'active' : ''} ${resultLocked ? 'locked' : ''}`} 
                          onClick={() => { 
                            if (!resultLocked) { 
                              setActiveModuleIndex(-3); 
                              setActiveStage('result'); 
                              setSidebarOpen(false); 
                              scrollContentTop(); 
                            } else {
                              alert("Submit your Mini Project first to graduate!");
                            }
                          }}
                          style={{ paddingLeft: 20, opacity: resultLocked ? 0.4 : 1 }}
                        >
                            <Award size={16} className="cp-lesson-icon" />
                            <span className="cp-lesson-name">Completion</span>
                            {resultLocked && <span className="text-[9px] uppercase font-semibold text-white/30 ml-auto">Locked</span>}
                        </button>
                    </>
                );
            })()}
          </div>
        </div>
      </aside>

      {/* ══════ MAIN CONTENT ══════ */}
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
            {(activeStage === 'overview' || activeStage === 'text' || activeStage === 'theory') && (
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

        {/* Content + Right Tools Drawer */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Main Stage */}
          <div className="cp-content-area" ref={contentRef} style={{ flex: 1 }}>
            <AnimatePresence mode="wait">
              
              {/* ── 1. MODULE OVERVIEW ── */}
              {activeStage === 'overview' && activeContentDb && (
                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cp-text-lesson">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}
                    components={{
                      h1: ({ children }) => <h1 className="text-3xl font-extrabold text-gray-900 mb-6">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4 mt-8">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xl font-bold text-[#7C3AED] mb-4 mt-6">{children}</h3>,
                      p: ({ children }) => <p className="text-base text-gray-600 leading-relaxed mb-4">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-6 mb-6 space-y-2">{children}</ul>,
                      li: ({ children }) => <li className="text-base text-gray-700 font-medium">{children}</li>
                    }}
                  >
                    {activeContentDb.overview}
                  </ReactMarkdown>
                  
                  {!isCurrentLessonComplete && (
                    <div style={{ marginTop: 40, paddingTop: 30, borderTop: '1px solid #e5e7eb' }}>
                      <button className="cp-bottom-nav-btn next" style={{ width: '100%', justifyContent: 'center', padding: '16px', borderRadius: '12px' }} onClick={handleMarkComplete}>
                        <CheckCircle2 size={18} />
                        I'm Ready! Mark Complete & Start Reading
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── 2. READING MATERIAL ── */}
              {(activeStage === 'text' || activeStage === 'theory') && activeContentDb && (
                <motion.div key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cp-text-lesson">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}
                    components={{
                      h1: ({ children }) => <h1 className="text-3xl font-extrabold text-gray-900 mb-6">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4 mt-8">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xl font-bold text-[#7C3AED] mb-4 mt-6">{children}</h3>,
                      p: ({ children }) => <p className="text-base text-gray-600 leading-relaxed mb-4">{children}</p>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-[#7C3AED] bg-purple-50 p-4 my-6 italic text-gray-700 rounded-r-xl">
                          {children}
                        </blockquote>
                      ),
                      pre: ({ children }) => <div className="my-6 rounded-xl overflow-hidden shadow-lg border border-gray-200">{children}</div>,
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={atomDark}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                            customStyle={{ margin: 0, padding: '20px', fontSize: '14px', borderRadius: '0' }}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-gray-100 text-[#7C3AED] px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                            {children}
                          </code>
                        );
                      },
                      ul: ({ children }) => <ul className="list-disc pl-6 mb-6 space-y-2">{children}</ul>,
                      li: ({ children }) => <li className="text-base text-gray-700">{children}</li>
                    }}
                  >
                    {activeContentDb.reading}
                  </ReactMarkdown>

                  {!isCurrentLessonComplete && (
                    <div style={{ marginTop: 40, paddingTop: 30, borderTop: '1px solid #e5e7eb' }}>
                      <button className="cp-bottom-nav-btn next" style={{ width: '100%', justifyContent: 'center', padding: '16px', borderRadius: '12px' }} onClick={handleMarkComplete}>
                        <CheckCircle2 size={18} />
                        Finished Reading. Mark Complete & Move to Practice
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── 3. PRACTICE QUIZ ── */}
              {activeStage === 'practice_quiz' && activeContentDb && (
                <motion.div key="practice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="cp-quiz-container">
                    <div className="cp-quiz-header">
                      <h2>Practice Quiz: Instant Feedback</h2>
                      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                        Test your conceptual knowledge. Answers provide real-time explanations to help you learn.
                      </p>
                    </div>

                    {activeContentDb.practice.map((q: any, qIdx: number) => {
                      const selectedIdx = practiceAnswers[`${activeModuleIndex}_${qIdx}`];
                      const hasSelected = selectedIdx !== undefined;

                      return (
                        <div key={qIdx} className="cp-quiz-question" style={{ marginBottom: 40, borderBottom: '1px solid #f3f4f6', paddingBottom: 24 }}>
                          <div className="cp-quiz-question-text" style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>
                            {qIdx + 1}. {q.question}
                          </div>
                          
                          <div className="cp-quiz-options" style={{ marginTop: 16 }}>
                            {q.options.map((opt: string, optIdx: number) => {
                              const isSelected = selectedIdx === optIdx;
                              const isCorrect = optIdx === q.correct;

                              let btnClass = "cp-quiz-option";
                              if (hasSelected) {
                                if (isSelected) {
                                  btnClass += isCorrect ? " correct" : " incorrect";
                                } else if (isCorrect) {
                                  btnClass += " show-correct";
                                }
                              } else {
                                btnClass += " hover:bg-slate-50";
                              }

                              return (
                                <button
                                  key={optIdx}
                                  className={btnClass}
                                  disabled={hasSelected}
                                  onClick={() => {
                                    setPracticeAnswers(prev => ({
                                      ...prev,
                                      [`${activeModuleIndex}_${qIdx}`]: optIdx
                                    }));
                                  }}
                                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', marginBottom: '8px' }}
                                >
                                  <div className="cp-quiz-radio">
                                    {isSelected && <div className="cp-quiz-radio-dot" />}
                                  </div>
                                  <span style={{ fontSize: 14, fontWeight: 500 }}>{opt}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Instant Feedback Explanation Box */}
                          {hasSelected && (
                            <div 
                              style={{ 
                                marginTop: 16, 
                                padding: 16, 
                                borderRadius: 12, 
                                background: selectedIdx === q.correct ? '#ecfdf5' : '#fef2f2',
                                border: selectedIdx === q.correct ? '1px solid #a7f3d0' : '1px solid #fecaca',
                                color: selectedIdx === q.correct ? '#065f46' : '#991b1b',
                                fontSize: 14,
                                lineHeight: 1.5
                              }}
                            >
                              <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                                {selectedIdx === q.correct ? '✓ Correct Answer' : '✗ Incorrect'}
                              </div>
                              <p>{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Completion Action */}
                    {(() => {
                      const allAnswered = activeContentDb.practice.every(
                        (_: any, qIdx: number) => practiceAnswers[`${activeModuleIndex}_${qIdx}`] !== undefined
                      );
                      const done = !!completedSteps[`${activeModuleIndex}_2`];

                      return allAnswered ? (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                          <button
                            className="cp-bottom-nav-btn next"
                            style={{ padding: '16px 40px', fontSize: 15, borderRadius: 12 }}
                            onClick={() => {
                              if (!done) {
                                setCompletedSteps(prev => ({ ...prev, [`${activeModuleIndex}_2`]: true }));
                              }
                              goToNextLesson();
                            }}
                          >
                            Practice Complete! Go to Graded Assignment
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </motion.div>
              )}

              {/* ── 4. GRADED QUIZ / ASSIGNMENT ── */}
              {activeStage === 'graded_quiz' && activeContentDb && (
                <motion.div key="graded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="cp-quiz-container">
                    <div className="cp-quiz-header">
                      <div style={{ display: 'inline-flex', padding: 8, background: '#f5f3ff', borderRadius: 12, color: '#7C3AED', marginBottom: 12 }}>
                        <ShieldAlert size={24} />
                      </div>
                      <h2>Graded Assignment: Module Test</h2>
                      <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
                        This assessment counts towards your final certificate. **You must score at least 70% to pass and unlock the next module.**
                      </p>
                    </div>

                    {!quizResult ? (
                      <>
                        <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, color: '#475569', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'center' }}>
                          <HelpCircle size={16} />
                          <span>Question {currentQuizQ + 1} of {activeContentDb.graded.length}</span>
                        </div>

                        {activeContentDb.graded.map((q: any, qIdx: number) => {
                          const isCurrent = qIdx === currentQuizQ;
                          const selected = quizAnswers[qIdx] || [];

                          return isCurrent && (
                            <div key={qIdx} className="cp-quiz-question">
                              <div className="cp-quiz-question-text" style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
                                {qIdx + 1}. {q.question}
                              </div>

                              <div className="cp-quiz-options" style={{ marginTop: 20 }}>
                                {q.options.map((opt: string, optIdx: number) => {
                                  const isSelected = selected.includes(optIdx);

                                  return (
                                    <button
                                      key={optIdx}
                                      className={`cp-quiz-option ${isSelected ? 'selected' : ''}`}
                                      onClick={() => {
                                        const newAnswers = [...quizAnswers];
                                        newAnswers[qIdx] = [optIdx];
                                        setQuizAnswers(newAnswers);
                                      }}
                                      style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', marginBottom: '8px' }}
                                    >
                                      <div className="cp-quiz-radio">
                                        {isSelected && <div className="cp-quiz-radio-dot" />}
                                      </div>
                                      <span style={{ fontSize: 14, fontWeight: 500 }}>{opt}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {/* Navigation controls */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                          <button
                            className="cp-bottom-nav-btn"
                            disabled={currentQuizQ === 0}
                            onClick={() => setCurrentQuizQ(currentQuizQ - 1)}
                          >
                            <ChevronLeft size={16} /> Previous
                          </button>
                          
                          {currentQuizQ < activeContentDb.graded.length - 1 ? (
                            <button
                              className="cp-bottom-nav-btn next"
                              onClick={() => setCurrentQuizQ(currentQuizQ + 1)}
                              disabled={!quizAnswers[currentQuizQ]?.length}
                            >
                              Next <ChevronRight size={16} />
                            </button>
                          ) : (
                            <button
                              className="cp-bottom-nav-btn next"
                              onClick={handleQuizSubmit}
                              disabled={quizAnswers.some(a => !a?.length)}
                              style={{ background: '#7C3AED', borderColor: '#7C3AED', color: '#fff', padding: '12px 30px' }}
                            >
                              Submit Graded Quiz 🚀
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      // Quiz results
                      <div>
                        <div className={`cp-quiz-result ${quizResult.passed ? 'passed' : 'failed'}`} style={{ padding: '36px 20px', textAlign: 'center', borderRadius: 16 }}>
                          <div className="cp-quiz-result-score" style={{ fontSize: 48, fontWeight: 900, marginBottom: 8 }}>
                            {quizResult.score}%
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: quizResult.passed ? '#065f46' : '#991b1b' }}>
                            {quizResult.passed ? '✓ Module Assessment Passed!' : '✗ Requirements Not Met'}
                          </div>
                          <p style={{ fontSize: 14, color: '#4b5563', maxWidth: 480, margin: '0 auto' }}>
                            {quizResult.passed
                              ? 'Excellent! You successfully unlocked progress. You can now advance to the next step.'
                              : 'You need at least 70% to pass. Take some time to review the reading text and try again!'}
                          </p>
                        </div>

                        {/* Show corrections */}
                        <div style={{ marginTop: 36 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Question Breakdown:</h3>
                          {activeContentDb.graded.map((q: any, qIdx: number) => {
                            const selected = quizAnswers[qIdx] || [];
                            const correctIdx = q.correct;
                            const isCorrect = selected.includes(correctIdx);

                            return (
                              <div key={qIdx} style={{ marginBottom: 24, borderBottom: '1px solid #f3f4f6', paddingBottom: 16 }}>
                                <div style={{ fontSize: 15, fontWeight: 600, color: '#1f2937', marginBottom: 12 }}>
                                  {qIdx + 1}. {q.question}
                                </div>

                                {q.options.map((opt: string, optIdx: number) => {
                                  const wasSelected = selected.includes(optIdx);
                                  const isRight = optIdx === correctIdx;

                                  let optionClass = "cp-quiz-option";
                                  if (wasSelected) {
                                    optionClass += isRight ? " correct" : " incorrect";
                                  } else if (isRight) {
                                    optionClass += " show-correct";
                                  }

                                  return (
                                    <div key={optIdx} className={optionClass} style={{ cursor: 'default', padding: '12px 18px', marginBottom: '6px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <div className="cp-quiz-radio">
                                        {(wasSelected || isRight) && <div className="cp-quiz-radio-dot" />}
                                      </div>
                                      <span>{opt}</span>
                                    </div>
                                  );
                                })}

                                {quizResult.passed && <div className="cp-quiz-explanation" style={{ marginTop: 10, fontSize: 13, background: '#faf5ff', border: 'none', color: '#6b21a8' }}>{q.explanation}</div>}
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 30 }}>
                          {quizResult.passed ? (
                            <button
                              className="cp-bottom-nav-btn next"
                              style={{ padding: '16px 40px', fontSize: 15, background: '#10b981', borderColor: '#10b981' }}
                              onClick={goToNextLesson}
                            >
                              Proceed to Next Lesson
                              <ChevronRight size={18} />
                            </button>
                          ) : (
                            <button
                              className="cp-bottom-nav-btn next"
                              onClick={() => {
                                setQuizResult(null);
                                setQuizAnswers(activeContentDb.graded.map(() => []));
                                setCurrentQuizQ(0);
                              }}
                              style={{ background: '#7C3AED', borderColor: '#7C3AED', color: '#fff', padding: '14px 32px' }}
                            >
                              Retry Graded Quiz
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── 5. FINAL CAPSTONE PROJECT (MINI PROJECT) ── */}
              {activeStage === 'capstone' && (
                <motion.div key="capstone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="cp-text-lesson">
                    <div style={{ textAlign: 'center', marginBottom: 40 }}>
                      <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Code size={40} style={{ color: '#7C3AED' }} />
                      </div>
                      <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800 }}>Final Mini Project Challenge</h1>
                      <p style={{ fontSize: 16, color: '#6b7280', marginTop: 8 }}>Apply your accumulated knowledge to a practical codebase challenge</p>
                    </div>

                    <div className="cp-note-block" style={{ background: '#f5f3ff', borderColor: '#7C3AED', padding: '24px', borderRadius: '16px' }}>
                      <h3 style={{ margin: '0 0 12px 0', color: '#7C3AED', fontWeight: 800 }}>The Project Challenge Statement</h3>
                      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#374151' }}>
                        {courseData?.capstone_problem || 
                          "Build and deploy a full-stack AI model pipeline orchestrator. Integrate classical symbolic logic validators to ensure the generated model parameters conform to strict security guidelines. Store output weights and configuration logs inside a secure databases tier, and build a beautiful, premium visual user interface showing validation scores."
                        }
                      </p>
                    </div>

                    <h2 style={{ marginTop: 36, fontSize: '20px', fontWeight: 700 }}>Evaluation Rubric</h2>
                    <ul style={{ background: '#fafafa', padding: '20px 32px', borderRadius: 14, listStyleType: 'decimal', margin: '16px 0' }}>
                      <li style={{ marginBottom: 8, fontWeight: 500, color: '#4b5563' }}>Separation of UI and Application logical layers.</li>
                      <li style={{ marginBottom: 8, fontWeight: 500, color: '#4b5563' }}>Implementation of a connectionist neuron model or self-attention pipeline simulation.</li>
                      <li style={{ marginBottom: 8, fontWeight: 500, color: '#4b5563' }}>Clean repository documentation, including installation and setup commands.</li>
                    </ul>

                    {/* GitHub submission block */}
                    <div style={{ marginTop: 40, padding: 32, background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                      <h3 style={{ marginTop: 0, fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Mini Project Submission Form</h3>
                      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Submit a working GitHub repository link below. Once you submit, our administrators will evaluate your repository and award your Professional Course Certificate!</p>

                      <div className="cp-form-group" style={{ marginBottom: 18 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>GitHub Repository Link</label>
                        <input 
                          type="url"
                          className="cp-input" 
                          style={{ width: '100%', padding: '14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }} 
                          placeholder="https://github.com/your-username/ai-project" 
                          value={githubLink} 
                          onChange={e => {
                            setGithubLink(e.target.value);
                            localStorage.setItem(`${progressKey}_github`, e.target.value);
                          }} 
                        />
                      </div>

                      <div className="cp-form-group" style={{ marginBottom: 28 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Live Deployed URL (Optional)</label>
                        <input 
                          type="url"
                          className="cp-input" 
                          style={{ width: '100%', padding: '14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }} 
                          placeholder="https://your-project.vercel.app" 
                          value={deployedLink} 
                          onChange={e => {
                            setDeployedLink(e.target.value);
                            localStorage.setItem(`${progressKey}_deployed`, e.target.value);
                          }} 
                        />
                      </div>

                      <button 
                        className="cp-topbar-btn primary" 
                        style={{ width: '100%', padding: '16px', borderRadius: 12, fontSize: 15, fontWeight: 700, height: 'auto', justifyContent: 'center' }} 
                        onClick={async () => {
                          if (!githubLink) return alert("Please provide your GitHub repository link.");
                          
                          // Set capstone complete in completedSteps
                          const newCompleted = { ...completedSteps, capstone: true };
                          setCompletedSteps(newCompleted);

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
                              alert("Mini Project submitted successfully! Your graduation certificate has been unlocked!");
                            } else {
                              alert("Project submitted locally! Your certificate has been unlocked!");
                            }
                            
                            // Graduate instantly to result screen
                            setActiveModuleIndex(-3);
                            setActiveStage('result');
                            scrollContentTop();
                          } catch (err) {
                            console.warn("Failed to sync project with server, graduated locally.", err);
                            alert("Project submitted locally! Your certificate has been unlocked!");
                            setActiveModuleIndex(-3);
                            setActiveStage('result');
                            scrollContentTop();
                          }
                        }}
                      >
                        Submit Final Mini Project
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── 6. RESULT / GRADUATION ── */}
              {activeStage === 'result' && (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <div className="cp-text-lesson" style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
                    <div style={{ marginBottom: 48 }}>
                      <motion.div
                        initial={{ rotate: -15, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', damping: 10 }}
                        style={{ display: 'inline-block', marginBottom: 24 }}
                      >
                        <Trophy size={110} style={{ color: '#fbbf24' }} />
                      </motion.div>
                      <h1 style={{ fontSize: '40px', fontWeight: 900, color: '#111827', marginBottom: 12 }}>You Have Graduated! 🎓</h1>
                      <p style={{ fontSize: 18, color: '#4b5563', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
                        Phenomenal accomplishment! You have successfully completed all written lessons, cleared all practice checkpoints, passed the module exams, and submitted your Final Mini Project repository.
                      </p>
                      
                      <div style={{ marginTop: 28, padding: '18px 24px', background: '#f5f3ff', borderRadius: 14, border: '1.5px solid #7C3AED', color: '#7C3AED', fontWeight: 700, display: 'inline-block' }}>
                        🛡️ Your GitHub Repository is under admin review. Once validated, your Official Certificate will be emailed to you!
                      </div>
                    </div>

                    <div style={{ background: '#fafafa', padding: 24, borderRadius: 16, border: '1px solid #f3f4f6', marginBottom: 36, textAlign: 'left' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: 15, fontWeight: 800, color: '#111827' }}>Graduation Summary:</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#4b5563' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Course Progress:</span>
                          <span style={{ color: '#10b981', fontWeight: 700 }}>100% Completed</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Submitted Project:</span>
                          <span style={{ color: '#7C3AED', fontWeight: 700, textDecoration: 'underline' }}>{githubLink || 'github.com/repository'}</span>
                        </div>
                      </div>
                    </div>

                    <button className="cp-topbar-btn primary" style={{ padding: '16px 48px', height: 'auto', fontSize: 16 }} onClick={() => navigate('/dashboard/my-courses')}>
                      Return to My Courses
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* ══════ RIGHT TOOLS DRAWER ══════ */}
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
                  {DUMMY_TRANSCRIPT.map((seg, i) => (
                    <div key={i} style={{ marginBottom: 16, fontSize: '13px', lineHeight: '1.4' }}>
                      <span className="cp-transcript-timestamp" style={{ background: '#f5f3ff', color: '#7C3AED', padding: '2px 6px', borderRadius: '4px', marginRight: '8px', fontWeight: 600 }}>{seg.time}</span>
                      {seg.text}
                    </div>
                  ))}
                </div>
              )}

              {activeToolTab === 'resources' && (
                <div className="cp-transcript-block">
                  {activeContentDb?.resources && activeContentDb.resources.length > 0 ? (
                    activeContentDb.resources.map((res: string, i: number) => (
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
            <ChevronLeft size={16} /> Previous Step
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
            Next Step <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ══════ COMPLETION PROMPT MODAL ══════ */}
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
              <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justify_content: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, background: '#F5F3FF', borderRadius: '50%', transform: 'scale(1.2)' }} />
                <Award size={64} style={{ color: '#7C3AED', position: 'relative', zIndex: 2, margin: '18px auto' }} />
                <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#10b981', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800 }}>MODULE COMPLETED</div>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>
                Module Accomplished! 🎉
              </h3>
              <p style={{ fontSize: 15, color: '#6b7280', margin: '0 0 32px' }}>
                Outstanding work! You've successfully finished all reading texts, cleared practice checkpoints, and passed the module assessment for **{completionPrompt.moduleName}**.
              </p>
              {completionPrompt.nextIndex !== null ? (
                <button
                  className="cp-modal-primary"
                  style={{ width: '100%', padding: '16px', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all .2s' }}
                  onClick={() => {
                    const targetIdx = completionPrompt.nextIndex as number;
                    setCompletionPrompt({ open: false, nextIndex: null, moduleName: '' });
                    
                    if (targetIdx >= 0) {
                      setActiveModuleIndex(targetIdx);
                      setActiveLessonIndex(0);
                      setActiveStage('overview');
                      setQuizResult(null);
                      const s = new Set(expandedModules);
                      s.add(targetIdx);
                      setExpandedModules(s);
                    } else if (targetIdx === -1) {
                      // Redirect to Capstone Project
                      setActiveModuleIndex(-1);
                      setActiveStage('capstone');
                    }
                    scrollContentTop();
                  }}
                >
                  Continue to Next Step →
                </button>
              ) : (
                <button
                  className="cp-modal-secondary"
                  style={{ width: '100%', padding: '16px', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all .2s' }}
                  onClick={() => setCompletionPrompt({ open: false, nextIndex: null, moduleName: '' })}
                >
                  Close & Keep Reviewing
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
