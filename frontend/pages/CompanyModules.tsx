import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';
import {
  ShieldCheck,
  ChevronRight,
  Search,
  LayoutGrid,
  Unlock,
  CheckCircle2,
  Clock,
  Medal,
  Cpu,
  Terminal,
  Briefcase,
  ArrowLeft,
  Play,
  Bot,
  MessageSquare,
  BarChart3,
  BookOpen,
  Zap,
  Info,
  ChevronDown,
  Globe,
  ChevronLeft
} from 'lucide-react';

// --- Types ---

interface DSAQuestion {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  frequency: number;
  tags: string[];
  input: string;
  output: string;
  approach: string;
  code: { [key: string]: string };
  time: string;
  space: string;
  visualizerType?: 'stack' | 'queue' | 'linked-list' | 'bst' | 'hash-table';
}

interface TechQuestion {
  category: string;
  question: string;
  answer: string;
  keyPoints: string[];
  followUps: string[];
}

interface HRQuestion {
  question: string;
  modelAnswer: string;
  aiTips: string;
}

interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  hiringRoles: string[];
  interviewRounds: string[];
  salaryRange: string;
  culture: string;
  difficulty: 'Moderate' | 'High' | 'Elite';
  completion: number;
  brandColor: string; // Added for attractive animations
  dsa: DSAQuestion[];
  technical: TechQuestion[];
  hr: HRQuestion[];
  stats: {
    placed: string;
    avgpackage: string;
  };
}

// --- Mock Data ---

const MOCK_COMPANIES: Company[] = [
  {
    id: 'google',
    name: 'Google',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    industry: 'Software & Technology',
    hiringRoles: ['SDE I', 'SDE II', 'Cloud Architect'],
    interviewRounds: ['OA', '3-4 Technical Rounds', 'Googliness (HR)'],
    salaryRange: '₹30L - ₹60L+',
    brandColor: '#4285F4',
    culture: 'Innovation, Ownership, Chaos Harmony',
    difficulty: 'Elite',
    completion: 0,
    stats: { placed: '120+', avgpackage: '32 LPA' },
    dsa: [
      {
        id: 'g1',
        title: 'Longest Palindromic Substring',
        difficulty: 'Medium',
        frequency: 92,
        tags: ['String', 'DP'],
        input: '"babad"',
        output: '"bab"',
        approach: 'Expand around center or use a 2D DP table to track palindromes.',
        time: 'O(n^2)',
        space: 'O(1)',
        visualizerType: 'hash-table',
        code: { python: 'def longest(s): ...', java: 'public String longest(String s) { ... }' }
      },
      {
        id: 'g2',
        title: 'Median of Two Sorted Arrays',
        difficulty: 'Hard',
        frequency: 88,
        tags: ['Binary Search', 'Array'],
        input: '[1,3], [2]',
        output: '2.0',
        approach: 'Use binary search on the smaller array to find the partition point.',
        time: 'O(log(min(m,n)))',
        space: 'O(1)',
        visualizerType: 'bst',
        code: { python: 'def findMedian(nums1, nums2): ...' }
      }
    ],
    technical: [
      {
        category: 'System Design',
        question: 'Design a Global Rate Limiter',
        answer: 'Use Token Bucket or Leaky Bucket algorithm with Redis for distributed state across clusters.',
        keyPoints: ['Latency', 'Consistency', 'Redis Cluster', 'Sliding Window'],
        followUps: ['How to handle race conditions in high-traffic spikes?']
      },
      {
        category: 'Core CS',
        question: 'How does the Linux kernel handle process scheduling?',
        answer: 'Google uses a modified CFS (Completely Fair Scheduler) with priorities for production services.',
        keyPoints: ['CFS', 'Context Switching', 'Interrupts'],
        followUps: ['What are the trade-offs of using real-time scheduling?']
      }
    ],
    hr: [
      {
        question: 'Tell me about a time you showed leadership without being in a formal position.',
        modelAnswer: 'Identify a gap in the project, propose a solution, and rally the team to implement it.',
        aiTips: 'Emphasize Googliness: Ownership, Humility, and bias for action.'
      }
    ]
  },
  {
    id: 'amazon',
    name: 'Amazon',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    industry: 'Ecommerce & AWS',
    hiringRoles: ['SDE I', 'Data Engineer', 'Solutions Architect'],
    interviewRounds: ['Online Assessment', 'Technical Phone Screen', 'Bar Raiser (Onsite)'],
    salaryRange: '₹25L - ₹50L',
    brandColor: '#FF9900',
    culture: 'Customer Obsession, Leadership Principles',
    difficulty: 'Elite',
    completion: 0,
    stats: { placed: '200+', avgpackage: '28 LPA' },
    dsa: [
      {
        id: 'a1',
        title: 'Merge k Sorted Lists',
        difficulty: 'Hard',
        frequency: 95,
        tags: ['Linked List', 'Heap'],
        input: '[[1,4,5],[1,3,4],[2,6]]',
        output: '[1,1,2,3,4,4,5,6]',
        approach: 'Use a Priority Queue to keep track of the smallest current element across k lists.',
        time: 'O(N log k)',
        space: 'O(k)',
        visualizerType: 'linked-list',
        code: { python: 'def mergeKLists(lists): ...' }
      },
      {
        id: 'a2',
        title: 'LRU Cache Design',
        difficulty: 'Medium',
        frequency: 98,
        tags: ['Hash Map', 'Linked List'],
        input: 'LRUCache(2), put(1,1), put(2,2), get(1)...',
        output: '1',
        approach: 'Combine a Doubly Linked List with a Hash Map for O(1) access and updates.',
        time: 'O(1)',
        space: 'O(capacity)',
        visualizerType: 'linked-list',
        code: { java: 'class LRUCache { ... }' }
      }
    ],
    technical: [
      {
        category: 'System Design',
        question: 'How does Amazon S3 achieve 99.999999999% durability?',
        answer: 'Data is replicated across at least three physical Availability Zones (AZs) within a region.',
        keyPoints: ['Erasure Coding', 'Replication', 'Checksums'],
        followUps: ['How do you handle eventual consistency in S3?']
      }
    ],
    hr: [
      {
        question: 'Tell me about a time you had to deliver a project on a tight deadline.',
        modelAnswer: 'Focus on prioritization, simplifying the MVP, and clear communication with stakeholders.',
        aiTips: 'Align this with the "Deliver Results" Leadership Principle.'
      }
    ]
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg',
    industry: 'Enterprise Software',
    hiringRoles: ['SDE I', 'Security Engineer'],
    interviewRounds: ['Codility OA', '3 Technical Rounds', 'AA Round'],
    salaryRange: '₹22L - ₹45L',
    brandColor: '#00A4EF',
    culture: 'Growth Mindset, Diversity',
    difficulty: 'High',
    completion: 0,
    stats: { placed: '150+', avgpackage: '24 LPA' },
    dsa: [
      {
        id: 'm1',
        title: 'Validate Binary Search Tree',
        difficulty: 'Medium',
        frequency: 82,
        tags: ['Tree', 'DFS'],
        input: '[2,1,3]',
        output: 'true',
        approach: 'Perform an in-order traversal and verify if it yields a strictly increasing sequence.',
        time: 'O(n)',
        space: 'O(h)',
        visualizerType: 'bst',
        code: { python: 'def isValidBST(root): ...' }
      }
    ],
    technical: [
      {
        category: 'System Design',
        question: 'Design a real-time collaborative document editor (like Office 365).',
        answer: 'Use Operational Transformation (OT) or Conflict-free Replicated Data Types (CRDTs).',
        keyPoints: ['WebSockets', 'Concurrency', 'Snapshotting'],
        followUps: ['How to handle offline synchronization?']
      }
    ],
    hr: [
      {
        question: 'Describe a situation where you had to adapt to a major change in a project.',
        modelAnswer: 'Emphasize flexibility, learning the new requirement quickly, and adjusting the plan.',
        aiTips: 'Emphasize Growth Mindset and learning from the change.'
      }
    ]
  },
  {
    id: 'meta',
    name: 'Meta',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
    industry: 'Social Media & VR',
    hiringRoles: ['Product Engineer', 'ML Engineer'],
    interviewRounds: ['Ninja Mix', 'Technical Rounds', 'Behavioral'],
    salaryRange: '₹35L - ₹70L',
    brandColor: '#0668E1',
    culture: 'Move Fast, Build Awesome Things',
    difficulty: 'Elite',
    completion: 0,
    stats: { placed: '90+', avgpackage: '35 LPA' },
    dsa: [
      {
        id: 'fb1',
        title: 'Product of Array Except Self',
        difficulty: 'Medium',
        frequency: 94,
        tags: ['Array', 'Prefix/Suffix'],
        input: '[1,2,3,4]',
        output: '[24,12,8,6]',
        approach: 'Calculate prefix products and suffix products in two passes to avoid division.',
        time: 'O(n)',
        space: 'O(1)',
        visualizerType: 'hash-table',
        code: { python: 'def productExceptSelf(nums): ...' }
      }
    ],
    technical: [
      {
        category: 'System Design',
        question: 'Design the Facebook News Feed.',
        answer: 'Use a pull-based or push-based approach depending on the celebrity status of the user.',
        keyPoints: ['Fan-out', 'Caching', 'Ranking Algorithm'],
        followUps: ['How to ensure eventual consistency in a global system?']
      }
    ],
    hr: [
      {
        question: 'What is the most difficult feedback you have ever received?',
        modelAnswer: 'Be honest about the feedback, explain the steps you took to improve, and show the result.',
        aiTips: 'Show openness and a desire for continuous improvement.'
      }
    ],
  },
  {
    id: 'apple',
    name: 'Apple',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
    industry: 'Consumer Electronics',
    hiringRoles: ['Hardware Engineer', 'iOS Developer'],
    interviewRounds: ['Initial Chat', 'Technical Deep Dive', 'Team Interaction'],
    salaryRange: '₹30L - ₹65L',
    brandColor: '#000000',
    culture: 'Secrecy, Perfection, Quality',
    difficulty: 'Elite',
    completion: 0,
    stats: { placed: '35+', avgpackage: '38 LPA' },
    dsa: [
      {
        id: 'apple1',
        title: 'Reverse Linked List',
        difficulty: 'Easy',
        frequency: 85,
        tags: ['Linked List'],
        input: '1->2->3->4->5',
        output: '5->4->3->2->1',
        approach: 'Use three pointers (prev, curr, next) to reverse the nodes in-place.',
        time: 'O(n)',
        space: 'O(1)',
        visualizerType: 'linked-list',
        code: { python: 'def reverseList(head): ...' }
      }
    ],
    technical: [
      {
        category: 'iOS / Systems',
        question: 'Explain the difference between ARC and manual memory management.',
        answer: 'Automatic Reference Counting (ARC) handles retain/release at compile-time based on object ownership.',
        keyPoints: ['Reference Counting', 'Retain Cycles', 'Weak/Strong Pointers'],
        followUps: ['How do you debug memory leaks in Xcode?']
      }
    ],
    hr: [
      {
        question: 'Why Apple?',
        modelAnswer: 'Focus on the intersection of technology and liberal arts, and the commitment to privacy and quality.',
        aiTips: 'Emphasize attention to detail and user-centric design.'
      }
    ]
  },
  {
    id: 'netflix',
    name: 'Netflix',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
    industry: 'Entertainment & Streaming',
    hiringRoles: ['UI Engineer', 'Content SRE'],
    interviewRounds: ['Tech Screen', 'Panel Interview', 'Culture Fit'],
    salaryRange: '₹40L - ₹80L',
    brandColor: '#E50914',
    culture: 'Freedom & Responsibility',
    difficulty: 'Elite',
    completion: 0,
    stats: { placed: '45+', avgpackage: '42 LPA' },
    dsa: [
      {
        id: 'nflx1',
        title: 'Valid Parentheses',
        difficulty: 'Easy',
        frequency: 91,
        tags: ['Stack', 'String'],
        input: '"()[]{}"',
        output: 'true',
        approach: 'Use a stack to push opening brackets and pop/check on closing brackets.',
        time: 'O(n)',
        space: 'O(n)',
        visualizerType: 'stack',
        code: { python: 'def isValid(s): ...' }
      }
    ],
    technical: [
      {
        category: 'Distributed Systems',
        question: 'How does Netflix optimize video encoding for low bandwidth?',
        answer: 'Per-shot encoding allows different bitrates for different scenes based on complexity.',
        keyPoints: ['VMAF', 'Encoding', 'CDN (Open Connect)'],
        followUps: ['How does the Open Connect appliance work?']
      }
    ],
    hr: [
      {
        question: 'How do you handle the Freedom & Responsibility culture at Netflix?',
        modelAnswer: 'Show that you are self-motivated, take ownership, and can make decisions without heavy supervision.',
        aiTips: 'Read the Netflix Culture Memo before the interview.'
      }
    ]
  },
  {
    id: 'nvidia',
    name: 'NVIDIA',
    logo: 'https://upload.wikimedia.org/wikipedia/sco/2/21/Nvidia_logo.svg',
    industry: 'AI & GPU Computing',
    hiringRoles: ['GPU Architect', 'AI Researcher'],
    interviewRounds: ['Skill Test', 'Domain Rounds', 'HR'],
    salaryRange: '₹35L - ₹75L',
    brandColor: '#76B900',
    culture: 'Accelerating Tomorrow',
    difficulty: 'Elite',
    completion: 0,
    stats: { placed: '200+', avgpackage: '28 LPA' },
    dsa: [
      {
        id: 'nv1',
        title: 'Top K Frequent Elements',
        difficulty: 'Medium',
        frequency: 88,
        tags: ['Heap', 'Hash Table'],
        input: 'nums = [1,1,1,2,2,3], k = 2',
        output: '[1,2]',
        approach: 'Use a hash map to count frequencies and a min-heap to keep track of the top k elements.',
        time: 'O(n log k)',
        space: 'O(n)',
        visualizerType: 'hash-table',
        code: { python: 'def topKFrequent(nums, k): ...' }
      }
    ],
    technical: [
      {
        category: 'Architecture',
        question: 'What is the difference between a CPU and a GPU architecture?',
        answer: 'CPUs are designed for low-latency serial processing; GPUs are designed for high-throughput parallel processing.',
        keyPoints: ['Parallelism', 'SIMD', 'Memory Bandwidth'],
        followUps: ['How does CUDA simplify GPU programming?']
      }
    ],
    hr: [
      {
        question: 'Tell me about a time you solved a complex technical problem.',
        modelAnswer: 'Explain the problem, the various solutions you considered, and why you chose the final one.',
        aiTips: 'Focus on your analytical process and final impact.'
      }
    ]
  },
  {
    id: 'uber',
    name: 'Uber',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png',
    industry: 'Mobility & Logistics',
    hiringRoles: ['Backend SDE', 'Mobile Developer'],
    interviewRounds: ['Code Pair', 'System Design', 'Bar Raiser'],
    salaryRange: '₹28L - ₹55L',
    brandColor: '#000000',
    culture: 'Go Get It',
    difficulty: 'High',
    completion: 0,
    stats: { placed: '70+', avgpackage: '29 LPA' },
    dsa: [
      {
        id: 'u1',
        title: 'Word Search',
        difficulty: 'Medium',
        frequency: 82,
        tags: ['Backtracking', 'Matrix'],
        input: 'board = [["A","B","C","E"],...], word = "SEE"',
        output: 'true',
        approach: 'Use DFS with backtracking to explore all possible paths in the grid.',
        time: 'O(N * 3^L)',
        space: 'O(L)',
        visualizerType: 'hash-table',
        code: { python: 'def exist(board, word): ...' }
      }
    ],
    technical: [
      {
        category: 'System Design',
        question: 'How would you design Ubers Surge Pricing system?',
        answer: 'Use a geospatial index (like H3) to calculate supply/demand in real-time hexagonal cells.',
        keyPoints: ['Geospatial Indexing', 'H3', 'Dynamic Pricing'],
        followUps: ['How to handle sudden demand spikes for events?']
      }
    ],
    hr: [
      {
        question: 'What does "Go Get It" mean to you?',
        modelAnswer: 'It means taking initiative, not waiting for instructions, and being obsessed with solving the user\'s problem.',
        aiTips: 'Uber values builders who take extreme ownership.'
      }
    ]
  },
  {
    id: 'tcs',
    name: 'TCS',
    logo: '/images/tcs.png',
    industry: 'IT Services',
    hiringRoles: ['Ninja', 'Digital', 'Prime'],
    interviewRounds: ['NQT', 'Technical Round', 'HR Round'],
    salaryRange: '₹3.5L - ₹9L',
    brandColor: '#004C99',
    culture: 'Stability, Teamwork, Scale',
    difficulty: 'Moderate',
    completion: 0,
    stats: { placed: '1000+', avgpackage: '4.5 LPA' },
    dsa: [],
    technical: [],
    hr: []
  },
  {
    id: 'infosys',
    name: 'Infosys',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg',
    industry: 'Business Consulting & IT',
    hiringRoles: ['System Engineer', 'SES', 'Power Programmer'],
    interviewRounds: ['InfyTQ', 'Technical Interview', 'HR'],
    salaryRange: '₹4L - ₹12L',
    brandColor: '#007CC3',
    culture: 'Learnability, Excellence',
    difficulty: 'Moderate',
    completion: 0,
    stats: { placed: '800+', avgpackage: '5.2 LPA' },
    dsa: [],
    technical: [],
    hr: []
  },
  {
    id: 'wipro',
    name: 'Wipro',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg',
    industry: 'IT Consulting',
    hiringRoles: ['Project Engineer', 'Turbo'],
    interviewRounds: ['NTH', 'Technical', 'HR'],
    salaryRange: '₹3.5L - ₹8.5L',
    brandColor: '#000000',
    culture: 'Spirit of Wipro, Integrity',
    difficulty: 'Moderate',
    completion: 0,
    stats: { placed: '600+', avgpackage: '4.2 LPA' },
    dsa: [],
    technical: [],
    hr: []
  },
  {
    id: 'accenture',
    name: 'Accenture',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg',
    industry: 'Professional Services',
    hiringRoles: ['ASE', 'SADA'],
    interviewRounds: ['Cognitive Assessment', 'Technical Interview', 'HR'],
    salaryRange: '₹4.5L - ₹11L',
    brandColor: '#A100FF',
    culture: 'High Performance, Delivered',
    difficulty: 'Moderate',
    completion: 0,
    stats: { placed: '900+', avgpackage: '5.5 LPA' },
    dsa: [],
    technical: [],
    hr: []
  }
];

// --- Theme Constants (Light Mode Refinement) ---
const THEME = {
  bg: '#FFFFFF',
  primary: '#6C3BFF',
  secondary: '#7C3AED',
  accent: '#9D7CFF',
  text: '#111827',
  muted: '#64748B',
  card: '#F8FAFC',
  border: '#E2E8F0'
};

const CompanyModules: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'dsa' | 'tech' | 'hr' | 'ai'>('overview');
  const [apiData, setApiData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/student/company-questions`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setApiData(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const state = location.state as { companyId?: string } | null;
    if (state?.companyId && !selectedCompany) {
      const company = MOCK_COMPANIES.find(c => c.id === state.companyId);
      if (company) {
        setSelectedCompany(company);
        setActiveTab('dsa');
      }
    }
  }, [location.state]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const filteredCompanies = MOCK_COMPANIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getVisualizerRoute = (companyId: string) => {
    const stackCompanies = new Set(['google', 'infosys']);
    const queueCompanies = new Set(['microsoft', 'accenture', 'tcs']);
    const linkedListCompanies = new Set(['netflix', 'wipro']);
    const bstCompanies = new Set(['nvidia', 'apple']);

    if (stackCompanies.has(companyId)) return '/learn/visualizer/stack';
    if (queueCompanies.has(companyId)) return '/learn/visualizer/queue';
    if (linkedListCompanies.has(companyId)) return '/learn/visualizer/linked-list';
    if (bstCompanies.has(companyId)) return '/learn/visualizer/bst';
    return '/learn/visualizer/hash-table';
  };

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 sm:px-8 font-['Poppins'] bg-white transition-colors duration-500">
      <AnimatePresence mode="wait">
        {!selectedCompany ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-7xl mx-auto"
          >


            <header className="mb-20 text-center flex flex-col items-center">
              <div className="max-w-4xl mx-auto mb-16">
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#7C3AED]/10 text-[#7C3AED] px-4 py-1.5 rounded-full font-black uppercase tracking-[0.3em] text-[10px] mb-8 inline-block"
                >
                  Partner Gates • Institutional Access
                </motion.span>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-8 leading-tight tracking-tighter uppercase text-[#111827]">
                  COMPANY <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4DFF] via-[#EC4899] to-[#FF5B5B] inline-block">MODULES.</span>
                </h1>
                <p className="text-lg sm:text-xl text-[#64748B] max-w-3xl mx-auto font-medium leading-relaxed">
                  Personalized preparation dashboards for global tech giants. Master the exact hiring patterns and ship like a pro.
                </p>
              </div>

              <div className="relative w-full max-w-xl mx-auto group mb-16">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#7C3AED] transition-colors" />
                <input
                  type="text"
                  placeholder="Search gates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2rem] py-5 pl-14 pr-8 text-sm shadow-sm focus:outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/5 transition-all text-black placeholder:text-black font-medium"
                />
              </div>
            </header>

            {/* Quick Stats - Enhanced Visuals */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-20">
              {[
                { label: 'Active Gates', val: '24', icon: ShieldCheck, color: '#7C3AED' },
                { label: 'DSA Logic', val: '1.2k+', icon: Cpu, color: '#9D7CFF' },
                { label: 'Avg Feedback', val: '4.9', icon: Medal, color: '#EC4899' },
                { label: 'Placements', val: '15k+', icon: Briefcase, color: '#06B6D4' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="relative group bg-white border border-[#E2E8F0] p-8 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-50 to-transparent rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:rotate-12 transition-transform" style={{ background: `${s.color}15`, color: s.color }}>
                      <s.icon className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-black text-[#111827] mb-1">{s.val}</div>
                    <div className="text-[10px] uppercase tracking-widest text-[#64748B] font-bold">{s.label}</div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: s.color }} />
                </motion.div>
              ))}
            </div>

            {/* List Section */}
            <style>{`
                @keyframes eg-shimmer {
                    0%   { transform: translateX(-180%) skewX(-20deg); }
                    100% { transform: translateX(300%) skewX(-20deg); }
                }
                @keyframes eg-orb1 {
                    0%,100% { transform: translate(0px,0px) scale(1);    opacity:0.55; }
                    40%     { transform: translate(8px,-6px) scale(1.3);  opacity:0.9; }
                    70%     { transform: translate(-4px,4px) scale(0.8);  opacity:0.4; }
                }
                @keyframes eg-orb2 {
                    0%,100% { transform: translate(0px,0px) scale(1);     opacity:0.4; }
                    35%     { transform: translate(-10px,-8px) scale(1.4); opacity:0.85; }
                    65%     { transform: translate(6px,5px) scale(0.75);   opacity:0.35; }
                }
                @keyframes eg-orb3 {
                    0%,100% { transform: translate(0px,0px) scale(1);    opacity:0.5; }
                    50%     { transform: translate(6px,8px) scale(1.25);  opacity:0.9; }
                }
                .eg-btn {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    width: 100%;
                    padding: 16px 0;
                    background: #7C3AED;
                    color: #fff;
                    font-weight: 800;
                    font-size: 12px;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    border: none;
                    border-radius: 16px;
                    cursor: pointer;
                    overflow: hidden;
                    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
                    box-shadow: 0 4px 20px rgba(124,58,237,0.4), 0 1px 0 rgba(255,255,255,0.12) inset;
                }
                .eg-btn::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 16px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 55%);
                    pointer-events: none;
                    z-index: 1;
                }
                .eg-btn::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0;
                    width: 40%; height: 100%;
                    background: linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.24) 50%, transparent 80%);
                    animation: eg-shimmer 2.8s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 2;
                }
                .eg-btn:hover {
                    transform: translateY(-2px) scale(1.02);
                    box-shadow: 0 0 0 5px rgba(139,92,246,0.18), 0 0 32px 12px rgba(139,92,246,0.45), 0 16px 40px rgba(109,40,217,0.5);
                }
                .eg-btn:active { transform: scale(0.97); }
                .eg-orb {
                    position: absolute;
                    border-radius: 50%;
                    pointer-events: none;
                    filter: blur(7px);
                    z-index: 1;
                }
                .eg-orb1 { width:28px; height:28px; background:radial-gradient(circle,rgba(196,168,255,0.95),transparent 70%); top:-4px; left:18px; animation:eg-orb1 3.2s ease-in-out infinite; }
                .eg-orb2 { width:22px; height:22px; background:radial-gradient(circle,rgba(255,255,255,0.8),transparent 70%);  bottom:-2px; right:48px; animation:eg-orb2 4s ease-in-out infinite; }
                .eg-orb3 { width:18px; height:18px; background:radial-gradient(circle,rgba(167,139,250,0.9),transparent 70%); top:4px; right:18px;  animation:eg-orb3 2.6s ease-in-out infinite; }
                .eg-label { position:relative; z-index:5; display:flex; align-items:center; gap:8px; }
            `}</style>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCompanies.map((company, i) => (
                <motion.div
                  key={company.id}
                  layoutId={company.id}
                  whileHover={{ y: -12, scale: 1.02 }}
                  className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 relative overflow-hidden group cursor-pointer shadow-xl hover:shadow-2xl transition-all"
                  onClick={() => setSelectedCompany(company)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#7C3AED]/10 to-transparent blur-3xl rounded-full" />
                  
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-16 h-16 bg-white p-2 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-gray-50">
                      <img src={company.logo} alt={company.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${company.difficulty === 'Elite' ? 'bg-red-50 text-red-500' : 
                      company.difficulty === 'High' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'}`}>
                      {company.difficulty}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-2 text-[#111827] group-hover:text-[#7C3AED] transition-colors">{company.name}</h3>
                  <p className="text-xs text-[#64748B] mb-6 font-medium">{company.industry}</p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-[#64748B]">
                      <span>Preparation Level</span>
                      <span>{company.completion}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${company.completion}%` }}
                        className="h-full bg-gradient-to-r from-[#7C3AED] to-[#9D7CFF]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-8">
                    <div className="flex -space-x-2">
                       {[1,2,3].map(j => <div key={j} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold">U</div>)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{company.stats.placed} Students Placed</span>
                  </div>

                  <button className="eg-btn">
                    <span className="eg-orb eg-orb1" />
                    <span className="eg-orb eg-orb2" />
                    <span className="eg-orb eg-orb3" />
                    <span className="eg-label">Open Learning Path <ChevronRight className="w-4 h-4" /></span>
                  </button>
                </motion.div>
              ))}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] border-dashed rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center opacity-60">
                <Unlock className="w-8 h-8 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold mb-1 text-[#111827]">More Gates</h3>
                <p className="text-xs text-[#64748B] uppercase tracking-widest font-black">Syncing Protocols...</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="max-w-7xl mx-auto"
          >
            {/* Dashboard Header - With Brand Thematic Background */}
            <div className="relative mb-12 rounded-[3.5rem] overflow-hidden group">
              <div
                className="absolute inset-0 opacity-10 blur-3xl"
                style={{ backgroundColor: selectedCompany.brandColor }}
              />
              <div className="relative flex flex-col lg:flex-row gap-12 items-start lg:items-center justify-between p-8 lg:p-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
                  <motion.button
                    whileHover={{ x: -5 }}
                    onClick={() => setSelectedCompany(null)}
                    className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#7C3AED]/50 transition-all text-[#111827] shadow-sm"
                  >
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </motion.button>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl border border-gray-50">
                      <img src={selectedCompany.logo} alt="" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-4xl font-black mb-1 text-[#111827]">{selectedCompany.name}</h2>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <span className="text-[10px] sm:text-xs font-bold text-[#64748B] flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> {selectedCompany.industry}
                        </span>
                        <div className="hidden sm:block h-1 w-1 bg-gray-200 rounded-full" />
                        <span className="text-[10px] sm:text-xs font-bold text-[#7C3AED] whitespace-nowrap">{selectedCompany.difficulty} Difficulty</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 w-full lg:w-auto">
                  <div className="flex-grow bg-[#F8FAFC] border border-[#E2E8F0] px-6 py-4 rounded-2xl shadow-sm">
                    <div className="text-[10px] uppercase font-black text-[#64748B] mb-1">Success Rate</div>
                    <div className="text-xl font-bold text-[#111827]">{selectedCompany.stats.placed} Students</div>
                  </div>
                  <div className="flex-grow bg-[#F8FAFC] border border-[#E2E8F0] px-6 py-4 rounded-2xl shadow-sm">
                    <div className="text-[10px] uppercase font-black text-[#64748B] mb-1">Avg Package</div>
                    <div className="text-xl font-bold text-[#111827]">{selectedCompany.stats.avgpackage}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-8">
              {/* Sidebar */}
              <div className={`flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-[72px]' : 'w-72'}`}>
                <div className="sticky top-32">
                <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
                <div className={`p-4 border-b border-[#E2E8F0] ${sidebarCollapsed ? 'px-3' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    {!sidebarCollapsed && (
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-[#7C3AED] rounded-xl flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="font-bold text-sm text-[#111827] truncate">{selectedCompany.name}</h2>
                          <p className="text-xs text-[#6B7280] truncate">{selectedCompany.hiringRoles?.[0] || selectedCompany.industry}</p>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className={`p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors flex-shrink-0 ${sidebarCollapsed ? 'mx-auto' : ''}`}
                      title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                      {sidebarCollapsed ? <ChevronRight className="w-4 h-4 text-[#6B7280]" /> : <ChevronLeft className="w-4 h-4 text-[#6B7280]" />}
                    </button>
                  </div>
                </div>

                <div className={`p-2 space-y-1 ${sidebarCollapsed ? 'px-1.5' : ''}`}>
                  {[
                    { id: 'overview', label: 'Overview', icon: LayoutGrid },
                    { id: 'roadmap', label: 'Roadmap', icon: Globe },
                    { id: 'dsa', label: 'DSA', icon: Terminal },
                    { id: 'tech', label: 'Tech', icon: Cpu },
                    { id: 'hr', label: 'HR', icon: Briefcase },
                    { id: 'ai', label: 'AI', icon: Bot, premium: true },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      title={t.label}
                      className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-xl border transition-all ${activeTab === t.id
                        ? 'bg-[#7C3AED]/10 border-[#7C3AED] text-[#7C3AED]'
                        : 'bg-transparent border-transparent text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#111827]'
                        }`}
                    >
                      <div className={`flex items-center ${sidebarCollapsed ? '' : 'gap-3'}`}>
                        <t.icon className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span className="text-sm font-bold">{t.label}</span>}
                      </div>
                      {!sidebarCollapsed && t.premium && <Bot className="w-4 h-4 text-amber-500" />}
                      {!sidebarCollapsed && activeTab === t.id && <ChevronRight className="w-4 h-4" />}
                    </button>
                  ))}

                  {!sidebarCollapsed && (
                    <div className="mt-4 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-[#7C3AED]/5 blur-2xl rounded-full" />
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-[#7C3AED]" />
                        <h4 className="font-bold text-xs text-[#111827]">Progress</h4>
                      </div>
                      <div className="text-2xl font-black mb-2 text-[#111827]">{selectedCompany.completion}%</div>
                      <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div className="h-full bg-[#7C3AED]" style={{ width: `${selectedCompany.completion}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                </div>
                </div>
              </div>

              <div className="flex-grow min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white border border-[#E2E8F0] rounded-[3rem] p-10 lg:p-16 min-h-[600px] shadow-sm"
                  >
                    {activeTab === 'roadmap' && (
                      <div className="space-y-12">
                        <header className="mb-12">
                          <h3 className="text-3xl font-black mb-2 text-[#111827]">Preparation Roadmap</h3>
                          <p className="text-[#64748B] text-sm font-medium">A sequential protocol to crack {selectedCompany.name}'s engineering gate.</p>
                        </header>

                        <div className="relative space-y-8">
                          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-[#7C3AED] via-[#9D7CFF] to-gray-100 rounded-full opacity-20" />
                          
                          {[
                            { step: 1, title: 'Foundational Logic', desc: 'Master core arrays, strings, and hash maps used in OA.', status: 'completed' },
                            { step: 2, title: 'Company Patterns', desc: 'Deep dive into the specific recursive and DP patterns preferred by this company.', status: 'active' },
                            { step: 3, title: 'System Deconstruction', desc: 'Understand the architectural choices of their core products.', status: 'locked' },
                            { step: 4, title: 'Cultural Calibration', desc: 'Align your behavioral responses with their core values.', status: 'locked' }
                          ].map((item, i) => (
                            <div key={i} className={`relative flex items-start gap-12 p-8 rounded-3xl border transition-all ${item.status === 'active' ? 'bg-white border-[#7C3AED] shadow-xl shadow-purple-100 scale-105 z-10' : 'bg-gray-50/50 border-gray-100'}`}>
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0 z-20 ${item.status === 'completed' ? 'bg-green-100 text-green-600' : item.status === 'active' ? 'bg-[#7C3AED] text-white shadow-lg' : 'bg-gray-200 text-gray-400'}`}>
                                {item.status === 'completed' ? <CheckCircle2 className="w-8 h-8" /> : item.step}
                              </div>
                              <div>
                                <h4 className={`text-xl font-bold mb-2 ${item.status === 'locked' ? 'text-gray-400' : 'text-[#111827]'}`}>{item.title}</h4>
                                <p className="text-sm text-[#64748B] leading-relaxed max-w-xl">{item.desc}</p>
                                {item.status === 'active' && (
                                  <button onClick={() => setActiveTab('dsa')} className="mt-6 px-6 py-2 bg-[#7C3AED] text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#6D28D9] transition-all">
                                    Start Training Now
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'ai' && (
                      <div className="space-y-12">
                         <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
                            <div className="w-24 h-24 bg-gradient-to-br from-[#7C3AED] to-[#EC4899] rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-purple-200">
                               <Bot className="w-12 h-12 text-white" />
                            </div>
                            <h3 className="text-4xl font-black mb-4 text-[#111827]">AI Career Intelligence</h3>
                            <p className="text-lg text-[#64748B] font-medium leading-relaxed">Our neural network has analyzed thousands of successful interviews at {selectedCompany.name}. Use these tools to calibrate your profile.</p>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-10 bg-white border border-[#E2E8F0] rounded-[3rem] shadow-sm hover:shadow-xl transition-all group">
                               <div className="w-16 h-16 bg-[#7C3AED]/10 rounded-2xl flex items-center justify-center mb-8 text-[#7C3AED]">
                                  <FileText className="w-8 h-8" />
                               </div>
                               <h4 className="text-2xl font-bold mb-4 text-[#111827]">Resume Calibration</h4>
                               <p className="text-sm text-[#64748B] mb-8 font-medium">Instantly analyze your resume against {selectedCompany.name}'s specific keywords and JD expectations.</p>
                               <button onClick={() => navigate('/job-prep/resume-builder')} className="w-full py-4 bg-[#111827] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all">Analyze My Resume</button>
                            </div>

                            <div className="p-10 bg-white border border-[#E2E8F0] rounded-[3rem] shadow-sm hover:shadow-xl transition-all group">
                               <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mb-8 text-pink-500">
                                  <Zap className="w-8 h-8" />
                               </div>
                               <h4 className="text-2xl font-bold mb-4 text-[#111827]">Interview Simulator</h4>
                               <p className="text-sm text-[#64748B] mb-8 font-medium">Practice with an AI agent trained on real interview transcripts from {selectedCompany.name}.</p>
                               <button onClick={() => navigate('/job-prep/mock-interview')} className="w-full py-4 border-2 border-[#111827] text-[#111827] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-50 transition-all">Launch Simulator</button>
                            </div>
                         </div>
                      </div>
                    )}

                    {activeTab === 'dsa' && (
                      <div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                          <div>
                            <h3 className="text-3xl font-black mb-2 text-[#111827]">DSA Matrix</h3>
                            <p className="text-[#64748B] text-sm">Targeted algorithmic protocols for {selectedCompany.name}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <button onClick={() => navigate(getVisualizerRoute(selectedCompany.id), { state: { companyId: selectedCompany.id } })} className="w-full py-5 mb-8 bg-[#7C3AED] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-lg shadow-[#7C3AED]/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                            <Play className="w-4 h-4 fill-white" /> Start 3D DSA Visualizer
                          </button>

                          {(selectedCompany.dsa && selectedCompany.dsa.length > 0) ? selectedCompany.dsa.map((q) => (
                            <div key={q.id} className="p-8 bg-[#F8FAFC] rounded-[2.5rem] border border-[#E2E8F0] hover:border-[#7C3AED]/20 transition-all group shadow-sm">
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                <div className="flex items-center gap-4">
                                  <div className={`w-3 h-3 rounded-full ${q.difficulty === 'Hard' ? 'bg-red-500' : q.difficulty === 'Medium' ? 'bg-orange-500' : 'bg-green-500'}`} />
                                  <h4 className="text-2xl font-bold text-[#111827]">{q.title}</h4>
                                </div>
                                {q.visualizerType && (
                                  <button 
                                    onClick={() => navigate(`/learn/visualizer/${q.visualizerType}`, { state: { companyId: selectedCompany.id, questionTitle: q.title } })}
                                    className="px-6 py-2 bg-white border border-[#7C3AED]/20 text-[#7C3AED] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#7C3AED] hover:text-white transition-all flex items-center gap-2"
                                  >
                                    <Play className="w-3 h-3" /> Visualize Protocol
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                  <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0]">
                                    <span className="text-[8px] font-black text-[#64748B] uppercase block mb-1">Complexity</span>
                                    <span className="font-bold text-[#111827]">{q.time} | {q.space}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {q.tags.map(t => <span key={t} className="px-3 py-1 bg-gray-100 rounded-lg text-[9px] font-bold text-gray-500 uppercase tracking-widest">{t}</span>)}
                                  </div>
                                </div>
                                <div className="p-6 bg-white rounded-2xl border border-[#E2E8F0] relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-2 opacity-5">
                                    <Bot className="w-12 h-12" />
                                  </div>
                                  <span className="text-[10px] font-black text-[#7C3AED] uppercase block mb-2">Solution Insight</span>
                                  <p className="text-sm text-[#64748B] leading-relaxed">{q.approach}</p>
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="py-12 text-center opacity-40">
                              <Terminal className="w-12 h-12 mx-auto mb-4 text-[#64748B]" />
                              <h4 className="text-xl font-bold text-[#111827]">DSA Questions Coming Soon</h4>
                              <p className="text-sm text-[#64748B] mt-2">Use the 3D Visualizer above to practice data structures</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'tech' && (
                      <div className="space-y-8">
                        <div className="mb-12">
                          <h3 className="text-3xl font-black mb-2 text-[#111827]">Technical Core</h3>
                          <p className="text-[#64748B] text-sm">Deep dive into company-specific system expectations.</p>
                        </div>
                        <div className="grid gap-6">
                          {selectedCompany.technical.map((t, idx) => (
                            <div key={idx} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl overflow-hidden group shadow-sm">
                              <div className="p-8 flex items-center justify-between cursor-pointer">
                                <h4 className="text-xl font-bold text-[#111827]">{t.question}</h4>
                                <ChevronDown className="w-6 h-6 text-gray-400 group-hover:text-[#7C3AED] transition-all" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'hr' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-8">
                          <div>
                            <h3 className="text-3xl font-black mb-2 text-[#111827]">Behavioral Sync</h3>
                            <p className="text-[#64748B] text-sm">Cracking the {selectedCompany.name} culture fit.</p>
                          </div>
                          {selectedCompany.hr.map((h, i) => (
                            <div key={i} className="bg-[#F8FAFC] p-8 rounded-[2.5rem] border border-[#E2E8F0] shadow-sm">
                              <h4 className="text-lg font-bold mb-6 italic text-[#111827]">"{h.question}"</h4>
                              <p className="text-sm text-[#64748B] leading-relaxed mb-6">{h.modelAnswer}</p>
                              <button className="flex items-center gap-2 text-[10px] font-black uppercase text-[#7C3AED] hover:text-[#9D7CFF] transition-colors">
                                <MessageSquare className="w-4 h-4" /> Get AI Review
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="bg-[#F8FAFC] p-10 rounded-[3rem] border border-[#E2E8F0] relative overflow-hidden h-fit lg:sticky lg:top-8 shadow-sm">
                          <h4 className="text-xl font-black mb-8 flex items-center gap-3 text-[#111827]">
                            <Bot className="w-6 h-6 text-[#7C3AED]" /> Cultural Pillars
                          </h4>
                          <div className="space-y-6">
                            {['Adaptability', 'Data Mindset', 'Team Sync'].map((p, i) => (
                              <div key={i} className="flex gap-4">
                                <CheckCircle2 className="w-5 h-5 text-[#7C3AED] flex-shrink-0" />
                                <div className="font-bold text-sm text-[#111827]">{p}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'ai' && (
                      <div className="h-full flex flex-col items-center justify-center text-center py-20">
                        <div className="w-32 h-32 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mb-12 relative shadow-inner">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 rounded-full bg-[#7C3AED]/5"
                          />
                          <Bot className="w-16 h-16 text-[#7C3AED]" />
                        </div>
                        <h3 className="text-4xl font-black mb-4 text-[#111827]">Neural Mock Agent</h3>
                        <p className="text-lg text-[#64748B] max-w-xl mb-12 font-medium">
                          Deploying a specialized AI interviewer calibrated for {selectedCompany.name}'s current hiring protocols.
                        </p>

                        <button
                          onClick={() => navigate('/job-prep/mock-interview')}
                          className="px-12 py-6 bg-gradient-to-r from-[#7C3AED] to-[#9D7CFF] text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl shadow-[#7C3AED]/30 hover:scale-105 transition-all flex items-center gap-4"
                        >
                          Initialize Mock Round <Zap className="w-5 h-5" />
                        </button>

                        <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-[10px] font-black uppercase text-[#64748B]">
                          <span className="flex items-center gap-2"><Medal className="w-4 h-4" /> Live Scoring</span>
                          <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Speech Analysis</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompanyModules;
