import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';
import WebImage from '../components/WebImage';
import { useAuth } from '../AuthContext';
import {
  Search, Star, Clock, User, ChevronRight,
  Monitor, BrainCircuit, Rocket, Layout, Database, TrendingUp, Plus,
  FileText, BookOpen, Target, Play, CheckCircle, Briefcase
} from 'lucide-react';

interface Course {
  _id: string;
  title: string;
  description: string;
  role_tag: string;
  difficulty: string;
  skills?: string[];
  duration?: string;
  image?: string;
  standard?: string;
  category?: string;
  price?: number;
  rating?: number;
  total_reviews?: number;
  total_hours?: number | string;
  level?: string;
  key_topics?: string[];
  last_updated?: string;
  instructor?: string;
  is_bestseller?: boolean;
  is_premium?: boolean;
  user_state?: 'NOT_PURCHASED' | 'IN_CART' | 'ENROLLED';
  provider?: string;
  organization?: string;
}

const CategoryIcon = ({ category, className }: { category: string, className?: string }) => {
  const normalized = category.toLowerCase();
  if (normalized.includes('ai') || normalized.includes('intelligence') || normalized.includes('machine')) return <BrainCircuit className={className} />;
  if (normalized.includes('front') || normalized.includes('ui') || normalized.includes('design')) return <Layout className={className} />;
  if (normalized.includes('back') || normalized.includes('data')) return <Database className={className} />;
  if (normalized.includes('product') || normalized.includes('startup')) return <Rocket className={className} />;
  if (normalized.includes('career') || normalized.includes('soft')) return <TrendingUp className={className} />;
  return <Monitor className={className} />;
};

const getCategoryDesc = (category: string) => {
  const normalized = category.toLowerCase();
  if (normalized.includes('ai')) return 'Recommended for builders';
  if (normalized.includes('full') || normalized.includes('web') || normalized.includes('back') || normalized.includes('front')) return 'Web / App Careers';
  if (normalized.includes('product')) return 'Build products that scale';
  if (normalized.includes('ui') || normalized.includes('design')) return 'Design beautiful experiences';
  if (normalized.includes('data')) return 'Turn data into insights';
  if (normalized.includes('career')) return 'Communication, Resume, Placement';
  return 'Explore courses in this track';
}

const DarkCourseCard = ({
  _id,
  title,
  description,
  role_tag,
  difficulty,
  skills,
  duration,
  image,
  standard,
  rating = 4.8,
  total_reviews = 1200,
  total_hours = 12,
  price = 0,
  is_bestseller = false,
  is_premium = false,
  user_state = 'NOT_PURCHASED',
  onCardClick,
}: Course & { onCardClick: (course: Course) => void }) => {
  const displayImage = image || "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="bg-[#1A1135] border border-white/5 rounded-2xl overflow-hidden hover:shadow-[0_0_30px_rgba(108,43,255,0.2)] transition-all flex flex-col cursor-pointer group h-full"
      onClick={() => onCardClick({ _id, title, description, role_tag, difficulty, skills, duration, image, standard, rating, price, is_bestseller, is_premium, user_state } as Course)}
    >
      <div className="h-40 relative overflow-hidden flex-shrink-0">
        <WebImage src={displayImage} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1135] via-transparent to-transparent opacity-90" />

        <div className="absolute top-3 left-3">
          <span className="bg-gradient-to-r from-[#6C2BFF] to-[#8B5CF6] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
            {is_bestseller ? 'Popular' : is_premium ? 'Premium' : 'Trending'}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <span className="text-[#A78BFA] text-[10px] font-black uppercase tracking-widest mb-2">{role_tag || 'DEVELOPMENT'}</span>
        <h3 className="text-white font-bold text-lg leading-tight mb-3 line-clamp-2">{title}</h3>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-4 mt-auto">
          {rating && (
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="w-3 h-3 fill-current" />
              <span className="font-bold text-white">{rating.toFixed(1)}</span>
              <span className="text-gray-500">({total_reviews >= 1000 ? (total_reviews / 1000).toFixed(1) + 'k' : total_reviews})</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{total_hours || 10} Hours</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{difficulty || 'Beginner'}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <button className="w-full py-2.5 rounded-lg bg-[#2D1B69] text-white text-sm font-bold group-hover:bg-[#6C2BFF] transition-colors shadow-lg">
            {user_state === 'ENROLLED' ? 'Continue Learning' : 'Start Learning'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const carouselCards = [
  { id: 1, title: 'AI & Machine Learning', subtext: 'Build intelligent systems', gradient: 'from-[#6C2BFF] to-[#8B5CF6]', icon: BrainCircuit },
  { id: 2, title: 'Full Stack Development', subtext: 'Build modern web apps', gradient: 'from-[#4338CA] to-[#6C2BFF]', icon: Layout },
  { id: 3, title: 'Product & Startups', subtext: 'Build products that scale', gradient: 'from-[#EC4899] to-[#8B5CF6]', icon: Rocket },
  { id: 4, title: 'UI / UX Design', subtext: 'Design experiences people love', gradient: 'from-[#C084FC] to-[#EC4899]', icon: Monitor },
  { id: 5, title: 'Data Science & Analytics', subtext: 'Turn data into insights', gradient: 'from-[#3730A3] to-[#8B5CF6]', icon: Database },
  { id: 6, title: 'Career Growth & Soft Skills', subtext: 'Prepare for placements', gradient: 'from-[#6C2BFF] to-[#EC4899]', icon: TrendingUp },
  { id: 7, title: 'Cybersecurity', subtext: 'Secure digital systems', gradient: 'from-[#312E81] to-[#8B5CF6]', icon: Briefcase },
  { id: 8, title: 'Cloud & DevOps', subtext: 'Build scalable infrastructure', gradient: 'from-[#4F46E5] to-[#8B5CF6]', icon: Target },
  { id: 9, title: 'Interview & Placement Prep', subtext: 'Crack opportunities confidently', gradient: 'from-[#C084FC] to-[#6C2BFF]', icon: CheckCircle },
];

const PremiumExploreCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white pb-8 overflow-hidden">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-black text-[#1A1A1A] mb-4 tracking-tight">Explore Career Paths Like</h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto px-4">
          Discover curated learning journeys designed for modern careers, real-world skills, internships, and future opportunities.
        </p>
      </div>

      <div className="relative w-full">
        <div className="overflow-hidden py-4 -mx-2 px-2">
          <motion.div 
            className="flex"
            animate={{ x: `-${currentIndex * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            {[0, 1, 2].map((slideIndex) => (
              <div key={slideIndex} className="w-full flex-shrink-0 px-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {carouselCards.slice(slideIndex * 3, slideIndex * 3 + 3).map((card) => (
                  <div 
                    key={card.id} 
                    className={`relative overflow-hidden rounded-[2rem] p-8 aspect-[4/3] flex flex-col justify-between group cursor-pointer bg-gradient-to-br ${card.gradient} shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}
                  >
                    <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md z-10 shadow-sm border border-white/20">
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="z-10 mt-auto">
                      <h3 className="text-2xl font-black text-white mb-2 leading-tight tracking-tight">{card.title}</h3>
                      <p className="text-white/90 font-medium text-base">{card.subtext}</p>
                    </div>

                    {/* Abstract Right Visuals */}
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-48 h-[120%] opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                      {card.id === 1 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-40 h-40 rounded-full border-[1px] border-white/30" />
                          <div className="absolute w-32 h-32 rounded-full border-[2px] border-white/50 rotate-45" />
                          <div className="absolute w-20 h-20 bg-white/20 blur-xl rounded-full" />
                        </div>
                      )}
                      {card.id === 2 && (
                        <div className="absolute inset-0 flex items-center justify-center rotate-12">
                          <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 transform -rotate-12 translate-x-4 -translate-y-4 shadow-2xl" />
                          <div className="absolute w-24 h-24 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 transform rotate-6 -translate-x-4 translate-y-4 shadow-xl" />
                        </div>
                      )}
                      {card.id === 3 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-48 h-48 fill-white/20 drop-shadow-2xl">
                            <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" />
                          </svg>
                        </div>
                      )}
                      {card.id === 4 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 shadow-[0_0_40px_rgba(255,255,255,0.3)] translate-x-4" />
                          <div className="absolute w-24 h-40 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 -translate-x-8" />
                        </div>
                      )}
                      {card.id === 5 && (
                        <div className="absolute inset-0 flex items-center justify-center rotate-45">
                          <div className="w-40 h-12 rounded-full border-2 border-white/40" />
                          <div className="absolute w-40 h-12 rounded-full border-2 border-white/20 rotate-45" />
                          <div className="absolute w-40 h-12 rounded-full border border-white/10 -rotate-45" />
                        </div>
                      )}
                      {card.id === 6 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-40 h-40 stroke-white/40 stroke-[2] fill-transparent drop-shadow-2xl">
                            <path d="M10 90 L50 30 L90 10" />
                            <circle cx="90" cy="10" r="4" className="fill-white/80" />
                          </svg>
                        </div>
                      )}
                      {card.id === 7 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-36 h-36 fill-white/20 stroke-white/40 stroke-2 drop-shadow-2xl">
                            <path d="M50 10 L90 25 L90 60 Q90 85 50 95 Q10 85 10 60 L10 25 Z" />
                          </svg>
                        </div>
                      )}
                      {card.id === 8 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-32 h-20 bg-white/20 backdrop-blur-md rounded-full border border-white/30 translate-y-4" />
                          <div className="absolute w-20 h-20 bg-white/30 backdrop-blur-lg rounded-full border border-white/40 -translate-y-2 -translate-x-4" />
                          <div className="absolute w-16 h-16 bg-white/20 backdrop-blur-md rounded-full border border-white/20 -translate-y-4 translate-x-6" />
                        </div>
                      )}
                      {card.id === 9 && (
                        <div className="absolute inset-0 flex items-center justify-center rotate-12">
                           <svg viewBox="0 0 100 100" className="w-40 h-40 fill-white/20 drop-shadow-2xl">
                            <polygon points="50,10 61,35 88,35 66,51 74,77 50,60 26,77 34,51 12,35 39,35" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        </div>

        <div className="flex justify-center items-center gap-3 mt-10">
          {[0, 1, 2].map((idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 rounded-full ${
                currentIndex === idx 
                  ? 'w-4 h-4 bg-[#6C2BFF]' 
                  : 'w-2.5 h-2.5 bg-gray-200 hover:bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const CoursesOverview: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStates, setUserStates] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');

  const userId = user?.uid || 'test-user';

  const createSlug = (title: string, id: string) => {
    if (!title || !id) return '';
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${slug}--${id}`;
  };

  const handleCourseClick = (course: Course) => {
    const slug = createSlug(course.title, course._id);
    if (slug) navigate(`/learn/courses/${slug}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const coursesRes = await fetch(`${API_BASE_URL}/api/courses`);

        if (!coursesRes.ok) {
          setCourses([]);
          return;
        }

        const data = await coursesRes.json();
        if (data && Array.isArray(data) && data.length > 0) {
          // AWS Filter logic preserved
          const awsRegex = /\baws\b/;
          const filteredCourses = data.filter((c: any) => {
            const title = (c.title || '').toLowerCase();
            const role = (c.role_tag || '').toLowerCase();
            const provider = (c.provider || c.organization || '').toLowerCase();
            return !(awsRegex.test(title) || awsRegex.test(role) || awsRegex.test(provider));
          });
          setCourses(filteredCourses);
        } else {
          setCourses([]);
        }
      } catch (err) {
        setCourses([]);
      } finally {
        setLoading(false);
      }

      if (userId) {
        try {
          const stateRes = await fetch(`${API_BASE_URL}/api/user-courses/${userId}`);
          if (!stateRes.ok) return;
          const stateData = await stateRes.json();

          const states: { [key: string]: string } = {};
          stateData.enrolled?.forEach((c: Course) => { states[c._id] = 'ENROLLED'; });
          stateData.in_cart?.forEach((c: Course) => { states[c._id] = 'IN_CART'; });
          stateData.available?.forEach((c: Course) => { states[c._id] = 'NOT_PURCHASED'; });

          setUserStates(states);
        } catch (err) { }
      }
    };

    fetchData();
  }, [userId]);

  const dynamicCategories = useMemo(() => {
    const predefined = ['All', 'Backend', 'Frontend', 'Software Engineering', 'Data', 'AI', 'Cyber'];
    const cats = new Set(predefined);
    if (courses && courses.length > 0) {
      courses.forEach(c => {
        if (c.role_tag) cats.add(c.role_tag);
      });
    }
    return Array.from(cats);
  }, [courses]);

  const filteredCourses = useMemo(() => {
    let filtered = courses;
    if (activeCategory !== 'All') {
      filtered = filtered.filter(c => c.role_tag === activeCategory);
    }
    if (searchQuery) {
      filtered = filtered.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  }, [activeCategory, courses, searchQuery]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#F8F9FC]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6C2BFF]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-[#1A1A1A]">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#F4F2FE] via-[#FAF9FF] to-white pt-32 pb-24 px-6 relative overflow-hidden flex flex-col items-center text-center">
        {/* Background Building Image */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2000" className="w-full h-full object-cover opacity-30 grayscale" alt="Campus" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-white" />
        </div>

        {/* Soft background glow orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#6C2BFF]/10 to-transparent rounded-full blur-[100px] pointer-events-none transform translate-x-1/3 -translate-y-1/3 z-0" />
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#EC4899]/5 to-transparent rounded-full blur-[80px] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-0" />

        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black leading-[1.05] tracking-tight text-[#1A1A1A] mb-6 text-center">
            MASTER REAL SKILLS<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C2BFF] to-[#EC4899]">NOT JUST COURSES</span>
          </h1>

          {/* Subheadline */}
          <p className="text-[#6C2BFF] font-black text-lg md:text-2xl mb-6 tracking-wider uppercase">
            AI • Development • Product • Career Systems
          </p>

          {/* Paragraph */}
          <p className="text-gray-600 text-base md:text-lg mb-12 max-w-2xl text-center font-medium leading-relaxed">
            Learn from curated industry-grade modules built for real-world outcomes, internships, projects, and hiring readiness.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-5 mb-16 relative z-20">
            {/* Primary CTA - Premium Shadow */}
            <button 
              onClick={() => {
                document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' });
              }} 
              className="group relative flex items-center justify-center gap-2 bg-gradient-to-r from-[#5B21F3] via-[#6C2BFF] to-[#A855F7] shadow-[0_4px_14px_0_rgba(108,43,255,0.39),inset_0_1px_1px_rgba(255,255,255,0.25),inset_0_-1px_2px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(108,43,255,0.3),inset_0_1px_1px_rgba(255,255,255,0.25),inset_0_-1px_2px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 text-white w-full sm:w-[240px] px-10 py-4 rounded-xl font-bold text-base transition-all duration-200 ease-out active:scale-[0.98]"
            >
              Explore Courses <ChevronRight className="w-5 h-5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
            </button>

            {/* Secondary CTA - Soft Shadow */}
            <Link 
              to="/learn/career-fit" 
              className="relative flex items-center justify-center bg-white border border-gray-200 text-[#1A1A1A] w-full sm:w-[240px] px-10 py-4 rounded-xl font-bold text-base shadow-[0_4px_14px_0_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 hover:border-gray-300 transition-all duration-200 ease-out active:scale-[0.98]"
            >
              Take Career Assessment
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-16 text-sm">
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 bg-[#F4EEFF] rounded-xl flex items-center justify-center text-[#6C2BFF]">
                <User className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xl font-black text-[#1A1A1A] leading-none mb-1">4K+</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Students</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 bg-[#F4EEFF] rounded-xl flex items-center justify-center text-[#6C2BFF]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xl font-black text-[#1A1A1A] leading-none mb-1">100+</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Elite Modules</div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 bg-[#F4EEFF] rounded-xl flex items-center justify-center text-[#6C2BFF]">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xl font-black text-[#1A1A1A] leading-none mb-1">Hiring</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Focused Tracks</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlapping Angled Ticker */}
      <div className="relative w-full z-30 -mt-6 md:-mt-10 h-[70px] md:h-[100px] overflow-hidden">
        {/* Horizontal Blue Base */}
        <div className="absolute bottom-0 w-full h-full bg-gradient-to-r from-[#2563EB] via-[#6C2BFF] to-[#8B5CF6]" />
        
        {/* White Cover to hide blue above the strip */}
        <div className="absolute w-[110%] h-[300px] bg-white -left-[5%] bottom-[2px] md:bottom-[4px] origin-left -rotate-2 z-10" />

        {/* Angled Black Strip */}
        <div className="absolute w-[110%] bg-[#0A0514] h-[40px] md:h-[48px] flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.3)] -left-[5%] bottom-[2px] md:bottom-[4px] origin-left -rotate-2 z-20 border-b border-white/5">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
            className="flex whitespace-nowrap gap-12 md:gap-20 items-center text-white text-[9px] md:text-[10px] font-bold tracking-[0.3em] opacity-90 w-fit"
          >
            {[...Array(20)].map((_, i) => (
              <span key={i} className="flex items-center gap-12 md:gap-20">
                <Star className="w-3 h-3 text-[#C084FC] opacity-90" /> STUDLYF
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Category Section */}
      <div className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#1A1A1A]">What do you want to become?</h2>
            <button className="text-[#6C2BFF] font-bold hover:underline flex items-center text-sm uppercase tracking-wider">
              Explore all careers <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {dynamicCategories.slice(0, 6).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`p-6 rounded-2xl text-left transition-all border group ${activeCategory === cat
                    ? 'bg-[#F4EEFF] border-[#6C2BFF] shadow-md'
                    : 'bg-white border-gray-100 hover:border-[#6C2BFF]/30 hover:shadow-lg'
                  }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${activeCategory === cat ? 'bg-[#6C2BFF] text-white' : 'bg-[#F8F9FC] text-[#6C2BFF] group-hover:bg-[#6C2BFF] group-hover:text-white'
                  }`}>
                  <CategoryIcon category={cat} className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-[#1A1A1A] mb-1 line-clamp-2">{cat}</h3>
                <p className="text-xs text-gray-500">{getCategoryDesc(cat)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>



      {/* Recommended Courses Section (Dark Theme) */}
      <div id="courses-section" className="bg-[#0F0824] py-24 px-6 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 mb-4">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Recommended For You</span>
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">Based on your interests & goals</h2>
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-grow lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#6C2BFF] transition-colors"
                />
              </div>
              <button className="text-white font-bold hover:underline flex items-center text-sm whitespace-nowrap">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

          {activeCategory !== 'All' && (
            <div className="flex items-center gap-2 mb-8">
              <span className="text-gray-400 text-sm">Showing courses for:</span>
              <span className="bg-[#6C2BFF]/20 text-[#A78BFA] px-3 py-1 rounded-full text-xs font-bold border border-[#6C2BFF]/30 flex items-center gap-2">
                {activeCategory}
                <button onClick={() => setActiveCategory('All')} className="hover:text-white"><Plus className="w-3 h-3 rotate-45" /></button>
              </span>
            </div>
          )}

          {filteredCourses.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
              <Monitor className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <div className="text-xl font-bold text-white mb-2">No Courses Found</div>
              <p className="text-gray-400 text-sm">Try adjusting your filters or search query.</p>
              <button onClick={() => { setActiveCategory('All'); setSearchQuery(''); }} className="mt-6 text-[#A78BFA] hover:text-white font-bold underline">
                Clear Filters
              </button>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredCourses.slice(0, 8).map((course) => (
                  <motion.div key={course._id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="h-full">
                    <DarkCourseCard
                      {...course}
                      user_state={(userStates[course._id] || 'NOT_PURCHASED') as any}
                      onCardClick={handleCourseClick}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Trust Section - Logos */}
      <div className="bg-[#F8F9FC] py-16 px-6 border-y border-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm font-bold text-gray-500 mb-10 tracking-wide">
            Trusted by professionals from leading companies and ambitious learners worldwide
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 lg:gap-20">
            {[
              { name: 'Google', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg', h: 'h-6 md:h-7' },
              { name: 'Microsoft', url: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg', h: 'h-5 md:h-6' },
              { name: 'Amazon', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', h: 'h-6 md:h-7' },
              { name: 'Meta', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg', h: 'h-4 md:h-5' },
              { name: 'Netflix', url: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg', h: 'h-5 md:h-6' },
              { name: 'Stripe', url: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg', h: 'h-6 md:h-7' },
              { name: 'Airbnb', url: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg', h: 'h-6 md:h-7' }
            ].map(company => (
              <img 
                key={company.name}
                src={company.url} 
                alt={company.name}
                className={`${company.h} w-auto object-contain filter brightness-0 opacity-40 hover:opacity-60 transition-opacity duration-300`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quote Section */}
      <div className="bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#0F0824] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C2BFF]/20 rounded-full blur-3xl" />
            <img
              src="/images/satya.jpg"
              alt="Satya Nadella"
              className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-2xl z-10 shadow-lg border border-white/5 bg-[#1A1135]"
            />
            <div className="z-10 relative">
              <div className="text-[#6C2BFF] text-6xl font-serif absolute -top-8 -left-4 opacity-30">"</div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-6 relative z-10">
                The world is changing faster than ever. The best way to prepare for the future is to keep learning, unlearn and relearn. Build skills, build confidence, and most importantly, build the future.
              </h3>
              <div>
                <div className="text-white font-bold text-lg">Satya Nadella</div>
                <div className="text-gray-400 text-sm">CEO, Microsoft</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Student Outcomes Section */}
      <div className="bg-[#F8F9FC] py-24 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1A1A1A] mb-6 tracking-tight">What You'll Walk Away With</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Learn industry-ready skills step-by-step through real projects, guided paths, and hands-on implementation designed for careers, internships, and real-world growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-[2rem] p-8 lg:p-10 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_40px_rgba(108,43,255,0.08)] hover:-translate-y-1 hover:border-[#E9D5FF] transition-all duration-300 group flex flex-col h-full">
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">Build Real-World Skills</h3>
              <p className="text-gray-500 mb-8 flex-grow leading-relaxed">
                Go beyond theory with hands-on projects, practical learning paths, and industry-grade workflows. Learn skills that actually help in internships, hackathons, freelancing, and jobs.
              </p>
              <div className="font-bold text-[#1A1A1A] group-hover:text-[#6C2BFF] transition-colors">
                Build confidence through real implementation.
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-[2rem] p-8 lg:p-10 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_40px_rgba(108,43,255,0.08)] hover:-translate-y-1 hover:border-[#E9D5FF] transition-all duration-300 group flex flex-col h-full">
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">Become Career Ready</h3>
              <p className="text-gray-500 mb-8 flex-grow leading-relaxed">
                Master structured learning paths built around high-growth careers like AI/ML, Full Stack, Product, Data Science, UI/UX, and more.
                <br/><br/>
                Learn what companies actually expect from modern talent.
              </p>
              <div className="font-bold text-[#1A1A1A] group-hover:text-[#6C2BFF] transition-colors">
                Career-focused learning, not random tutorials.
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-[2rem] p-8 lg:p-10 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_40px_rgba(108,43,255,0.08)] hover:-translate-y-1 hover:border-[#E9D5FF] transition-all duration-300 group flex flex-col h-full">
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">Learn With Clarity</h3>
              <p className="text-gray-500 mb-8 flex-grow leading-relaxed">
                No more confusion or tutorial overload. Follow curated step-by-step roadmaps, guided modules, and practical systems that make learning easier and faster.
              </p>
              <div className="font-bold text-[#1A1A1A] group-hover:text-[#6C2BFF] transition-colors">
                Know what to learn, when to learn it, and why.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Career Tracks & FAQ Section */}
      <div className="bg-white py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">

          <PremiumExploreCarousel />

          <div className="bg-[#F8F9FC] border border-gray-200 rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-10 md:gap-16">
              <div className="md:w-1/3">
                <h2 className="text-2xl font-black uppercase text-[#1A1A1A] mb-4">Frequently Asked Questions</h2>
                <p className="text-gray-500 text-sm">Everything you need to know about our structured tracks and platform.</p>
              </div>
              <div className="md:w-2/3 space-y-4">
              {[
                'Are these courses beginner friendly?',
                'Will I get a certificate after completion?',
                'Are projects included in the courses?',
                'Does this help with internships?',
                'Is mentorship or doubt support available?',
                'Can I access the courses on mobile?'
              ].map(q => (
                <div key={q} className="border-b border-gray-200 pb-4">
                  <button className="w-full flex justify-between items-center text-left text-sm font-bold text-gray-700 hover:text-[#6C2BFF] transition-colors">
                    {q}
                    <Plus className="w-4 h-4 flex-shrink-0 ml-4 text-[#6C2BFF]" />
                  </button>
                </div>
              ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Resources & Stories Section */}
      <div className="bg-white py-16 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">

          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">Free Resources</h3>
            <h2 className="text-2xl font-black uppercase text-[#1A1A1A] mb-8">Learn Before You Commit</h2>

            <div className="grid grid-cols-2 gap-4">
              {[
                { title: 'Free Mini Courses', desc: 'Short courses to get started', icon: Play, link: '/learn/courses-overview' },
                { title: 'Cheat Sheets', desc: 'Essential quick reference guides', icon: FileText, link: '/learn/company-modules' },
                { title: 'Practice Challenges', desc: 'Sharpen your skills daily', icon: Target, link: '/job-prep/mock-interview' },
                { title: 'Templates', desc: 'Resume, Project & More', icon: Layout, link: '/job-prep/resume-builder' },
              ].map(res => (
                <Link 
                  key={res.title} 
                  to={res.link}
                  className="flex gap-4 items-start p-4 rounded-2xl hover:bg-[#F8F9FC] transition-colors cursor-pointer border border-transparent hover:border-gray-100"
                >
                  <div className="bg-[#F4EEFF] p-3 rounded-xl text-[#6C2BFF]">
                    <res.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] text-sm">{res.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{res.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-8">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">Community</h3>
                <h2 className="text-2xl font-black uppercase text-[#1A1A1A]">Learners Are Building Real Careers</h2>
              </div>
              <button className="text-[#6C2BFF] font-bold hover:underline flex items-center text-sm hidden sm:flex">
                View all stories <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { name: 'Sneha Reddy', role: 'AI Engineer', text: 'Got my first AI internship at a top product company after completing the AI Engineer Path.', img: 'https://i.pravatar.cc/150?img=32' },
                { name: 'Rohan Das', role: 'Data Analyst', text: 'The projects and real-world case studies helped me crack my dream job.', img: 'https://i.pravatar.cc/150?img=12' }
              ].map(story => (
                <div key={story.name} className="bg-[#F8F9FC] p-6 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={story.img} alt={story.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <h4 className="font-bold text-[#1A1A1A] text-sm">{story.name}</h4>
                      <p className="text-xs text-gray-500">{story.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-medium italic">"{story.text}"</p>
                  <div className="flex gap-1 mt-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />)}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-[#0F0824] py-24 px-6 text-center relative overflow-hidden mt-10">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#6C2BFF]/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-block bg-white/10 px-4 py-1.5 rounded-full border border-white/20 mb-6">
            <span className="text-xs font-bold text-white uppercase tracking-[0.2em]">Ready To Level Up?</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase text-white leading-tight mb-6">
            Start Building <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C2BFF] to-[#EC4899]">Your Future</span> Today
          </h2>
          <p className="text-gray-400 text-lg mb-10">Join ambitious learners building real skills.</p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={() => {
              const el = document.getElementById('courses-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }} className="bg-[#6C2BFF] hover:bg-[#4B1DCC] text-white px-10 py-4 rounded-full font-bold transition-all shadow-[0_0_30px_rgba(108,43,255,0.4)]">
              Explore Courses →
            </button>
            <Link to="/learn/career-fit" className="bg-white text-[#1A1A1A] hover:bg-gray-100 px-10 py-4 rounded-full font-bold transition-all">
              Take Career Assessment
            </Link>
          </div>
        </div>
      </div>


    </div>
  );
};

export default CoursesOverview;