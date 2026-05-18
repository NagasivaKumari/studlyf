import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';
import {
  ArrowLeft,
  CheckCircle2,
  PlayCircle,
  FileText,
  Award,
  Globe,
  Smartphone,
  Infinity,
  Zap,
  Target,
  Star,
  Users,
  Clock,
  Calendar,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../AuthContext';

interface Course {
  _id: string;
  title: string;
  description: string;
  role_tag: string;
  difficulty?: string;
  skills?: string[];
  duration?: string;
  image?: string;
  standard?: string;
  price?: number;
  rating?: number;
  total_reviews?: number;
  total_hours?: number | string;
  level?: string;
  key_topics?: string[];
  last_updated?: string;
  instructor?: string;
  instructor_name?: string;
  instructor_image?: string;
  instructor_description?: string;
  is_bestseller?: boolean;
  is_premium?: boolean;
  school?: string;
  user_state?: 'NOT_PURCHASED' | 'IN_CART' | 'ENROLLED';
}

/* ─────────────────────────── mock fallback data ─────────────────────────── */
const MOCK_COURSES: Course[] = [];


const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [courseModules, setCourseModules] = useState<any[]>([]);
  const [userState, setUserState] = useState<'NOT_PURCHASED' | 'IN_CART' | 'ENROLLED'>('NOT_PURCHASED');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const userId = user?.uid || 'test-user';

  // Extract actual course ID from slug (everything after --)
  const extractCourseId = (slug: string | undefined) => {
    if (!slug) return '';
    // Split by double dash to get the ID
    const parts = slug.split('--');
    if (parts.length > 1) {
      return parts[parts.length - 1]; // Return the full ID
    }
    return slug; // Fallback to the whole slug if no separator found
  };

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        // Get course details
        const courseRes = await fetch(`${API_BASE_URL}/api/courses`);
        const coursesDataFromApi = await courseRes.json();

        // Merge API data with MOCK data for fallback
        const allCourses = [...MOCK_COURSES, ...(coursesDataFromApi || [])];

        // Extract ID from slug and find matching course
        const courseIdFromSlug = extractCourseId(courseId);
        const foundCourse = allCourses.find((c: Course) => c._id === courseIdFromSlug);

        if (foundCourse) {
          setCourse(foundCourse);

          // Fetch modules from the modules collection
          try {
            const modulesRes = await fetch(`${API_BASE_URL}/api/courses/${foundCourse._id}/modules`);
            const modulesData = await modulesRes.json();
            if (Array.isArray(modulesData) && modulesData.length > 0) {
              setCourseModules(modulesData);
            }
          } catch (modErr) {
            console.error('Error fetching modules:', modErr);
          }

          // Get user state for this course
          if (userId) {
            const stateRes = await fetch(`${API_BASE_URL}/api/user-courses/${userId}`);
            const stateData = await stateRes.json();

            if (stateData.enrolled.some((c: Course) => c._id === foundCourse._id)) {
              setUserState('ENROLLED');
            } else if (stateData.in_cart.some((c: Course) => c._id === foundCourse._id)) {
              setUserState('IN_CART');
            } else {
              setUserState('NOT_PURCHASED');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        // Direct fallback if fetch fails
        const courseIdFromSlug = extractCourseId(courseId);
        const fallbackCourse = MOCK_COURSES.find(c => c._id === courseIdFromSlug);
        if (fallbackCourse) setCourse(fallbackCourse);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, userId]);

  const handleEnrollNow = () => {
    if (!course) return;

    // Map role_tag to track slug
    const roleMap: Record<string, string> = {
      'AI': 'ai',
      'Software Engineering': 'swe',
      'Data': 'data',
      'PM': 'pm',
      'Cyber': 'cyber',
      'Frontend': 'swe', // Default complex roles to SWE
      'Backend': 'swe'
    };

    const rawTag = course.role_tag || 'custom';
    const trackSlug = roleMap[rawTag] || encodeURIComponent(rawTag);
    navigate(`/learn/enroll/${trackSlug}?courseId=${course._id}`);
  };

  const handleGoToCart = () => {
    navigate('/learn/cart');
  };

  const handleGoToCourse = () => {
    navigate(`/learn/course-player/${courseId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="font-mono text-xs tracking-widest uppercase text-[#7C3AED]">Loading Course...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-black text-[#111827] mb-4">Course Not Found</h2>
          <button
            onClick={() => navigate('/learn/courses')}
            className="px-6 py-3 bg-[#7C3AED] text-white font-black text-sm uppercase tracking-[0.2em] rounded-xl hover:bg-[#6D28D9] transition-all"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const rating = Number(course.rating) || 4.5;
  const reviews = Number(course.total_reviews) || 1250;
  const price = Number(course.price) || 49.99;
  const totalHours = course.total_hours || course.duration || '12 weeks';
  const level = course.level || course.difficulty || 'Intermediate';
  const topics = course.key_topics || course.skills || ['System Design', 'Architecture', 'Performance'];
  const instructorName = course.instructor_name || course.instructor || 'Eshwar G';
  const instructorRole = course.instructor_description || `Expert ${course.role_tag} Engineer`;
  const instructorImg = course.instructor_image || '/images/Eshwar.jpg';
  const displayImage = course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200';

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#7C3AED]/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/learn/courses')}
          className="flex items-center gap-2 text-gray-600 hover:text-[#7C3AED] transition-all mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-[0.2em]">Back to Courses</span>
        </motion.button>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column - Course Info */}
          <div className="lg:col-span-2">
            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-2 mb-6"
            >
              <span className="bg-white text-[#7C3AED] border-2 border-[#7C3AED] text-xs font-black px-4 py-2 uppercase tracking-widest rounded-full">
                {level}
              </span>
              {course.is_bestseller && (
                <span className="bg-yellow-500 text-white text-xs font-black px-4 py-2 uppercase tracking-widest rounded-full">
                  Bestseller
                </span>
              )}
              {course.is_premium && (
                <span className="bg-purple-600 text-white text-xs font-black px-4 py-2 uppercase tracking-widest rounded-full">
                  Premium
                </span>
              )}
              <span className="bg-gray-900 text-white text-xs font-black px-4 py-2 uppercase tracking-widest rounded-full">
                {course.role_tag}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#111827] tracking-tight mb-6 leading-tight"
            >
              {course.title}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-700 mb-8 leading-relaxed"
            >
              {course.description}
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-6 mb-12 pb-8 border-b border-gray-200"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-900">{rating.toFixed(1)}</span>
                <span className="text-sm text-gray-600">({reviews.toLocaleString()} reviews)</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <Users className="w-5 h-5" />
                <span className="text-sm font-bold">{(reviews * 2.3).toFixed(0)} students</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-bold">{totalHours}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-bold">{course.last_updated || 'Recently updated'}</span>
              </div>
            </motion.div>

            {/* What You'll Learn */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-12"
            >
              <h2 className="text-3xl font-black text-[#111827] mb-6 uppercase tracking-tight">What You'll Learn</h2>
              <div className="grid md:grid-cols-2 gap-4 bg-gray-50 border border-gray-200 rounded-2xl p-8">
                {topics.slice(0, 8).map((topic, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#7C3AED] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 font-medium">{topic}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Course Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-12"
            >
              <h2 className="text-3xl font-black text-[#111827] mb-6 uppercase tracking-tight">Course Content</h2>
              <div className="space-y-4">
                {courseModules.length > 0 ? (
                  courseModules.map((module: any, idx: number) => (
                    <div key={module._id || idx} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#7C3AED]/30 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] font-black text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{module.title || `Module ${idx + 1}`}</h3>
                            <p className="text-sm text-gray-600">
                              Theory • Video • Quiz • {module.estimated_time || '45 min'}
                            </p>
                          </div>
                        </div>
                        <PlayCircle className="w-5 h-5 text-[#7C3AED]" />
                      </div>
                    </div>
                  ))
                ) : (
                  [
                    { title: 'Introduction & Setup', lessons: 5, duration: '45 min' },
                    { title: 'Core Concepts', lessons: 12, duration: '2.5 hours' },
                    { title: 'Advanced Techniques', lessons: 8, duration: '1.8 hours' },
                    { title: 'Real-world Projects', lessons: 6, duration: '3 hours' },
                    { title: 'Best Practices & Optimization', lessons: 7, duration: '1.5 hours' },
                    { title: 'Final Capstone Project', lessons: 1, duration: 'Self-paced', isProject: true },
                  ].map((section, idx) => (
                    <div key={idx} className={`bg-white border rounded-xl p-6 transition-all ${section.isProject ? 'border-[#7C3AED] shadow-md shadow-[#7C3AED]/10' : 'border-gray-200 hover:border-[#7C3AED]/30'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {section.isProject ? <div className="w-5 h-5 rounded-full bg-[#7C3AED] flex-shrink-0" /> : <PlayCircle className="w-5 h-5 text-[#7C3AED]" />}
                          <div>
                            <h3 className={`font-bold ${section.isProject ? 'text-[#7C3AED]' : 'text-gray-900'}`}>{section.title}</h3>
                            <p className="text-sm text-gray-600">{section.lessons} lesson{section.lessons > 1 ? 's' : ''} • {section.duration}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Requirements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-12"
            >
              <h2 className="text-3xl font-black text-[#111827] mb-6 uppercase tracking-tight">Requirements</h2>
              <ul className="space-y-3">
                {[
                  'Basic understanding of programming concepts',
                  'Access to a computer with internet connection',
                  'Willingness to learn and practice',
                  'No prior experience in this specific field required'
                ].map((req, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-700">
                    <div className="w-2 h-2 rounded-full bg-[#7C3AED] mt-2 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Instructor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gray-50 border border-gray-200 rounded-2xl p-8"
            >
              <h2 className="text-2xl font-black text-[#111827] mb-6 uppercase tracking-tight">Instructor</h2>
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-2xl font-black overflow-hidden flex-shrink-0">
                  <img src={instructorImg} alt={instructorName} className="w-full h-full object-cover" onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructorName)}&background=7C3AED&color=fff`;
                  }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{instructorName}</h3>
                  <p className="text-gray-600 mb-4">{instructorRole}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{rating} Instructor Rating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{(reviews * 2.3).toFixed(0)} Students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4" />
                      <span>Multiple Courses</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Sticky Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="sticky top-32"
            >
              <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-xl">
                {/* Course Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={displayImage}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                <div className="p-6">
                  {/* Price */}
                    <div className="mb-6">
                      <div className="text-4xl font-black text-[#111827] mb-1">
                        {course.price && Number(course.price) > 0 ? `₹${Number(course.price).toLocaleString('en-IN')}` : 'FREE'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {course.price && Number(course.price) > 0 ? 'One-time Payment' : 'Free Enrollment'}
                      </div>
                    </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 mb-6">
                    {userState === 'NOT_PURCHASED' && (
                      <button
                        onClick={handleEnrollNow}
                        className="glow-btn glow-btn-purple w-full py-4 text-sm uppercase tracking-[0.2em] rounded-xl"
                      >
                        <span className="glow-orb glow-orb-1" />
                        <span className="glow-orb glow-orb-2" />
                        <span className="glow-orb glow-orb-3" />
                        <span className="glow-label flex items-center gap-2"><Zap className="w-5 h-5" /> Enroll Now</span>
                      </button>
                    )}

                    {userState === 'IN_CART' && (
                      <button
                        onClick={handleEnrollNow}
                        className="glow-btn glow-btn-purple w-full py-4 text-sm uppercase tracking-[0.2em] rounded-xl"
                      >
                        <span className="glow-orb glow-orb-1" />
                        <span className="glow-orb glow-orb-2" />
                        <span className="glow-orb glow-orb-3" />
                        <span className="glow-label">Complete Enrollment</span>
                      </button>
                    )}

                    {userState === 'ENROLLED' && (
                      <button
                        onClick={handleGoToCourse}
                        disabled={actionLoading}
                        className="glow-btn glow-btn-purple w-full py-4 text-sm uppercase tracking-[0.2em] rounded-xl"
                        style={{background:'#16a34a'}}
                      >
                        <span className="glow-orb glow-orb-1" style={{background:'radial-gradient(circle,rgba(134,239,172,0.9),transparent 70%)'}} />
                        <span className="glow-orb glow-orb-2" />
                        <span className="glow-orb glow-orb-3" style={{background:'radial-gradient(circle,rgba(74,222,128,0.9),transparent 70%)'}} />
                        <span className="glow-label flex items-center gap-2"><BookOpen className="w-5 h-5" /> Go to Course</span>
                      </button>
                    )}
                  </div>

                  {/* Course Includes */}
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-black text-[#111827] uppercase tracking-[0.2em]">This course includes:</h3>
                    <div className="space-y-3">
                      {[
                        { icon: PlayCircle, text: `${totalHours} on-demand video` },
                        { icon: FileText, text: '15 articles' },
                        { icon: Award, text: 'Certificate of completion' },
                        { icon: Infinity, text: 'Full lifetime access' },
                        { icon: Smartphone, text: 'Access on mobile and desktop' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm text-gray-700">
                          <item.icon className="w-4 h-4 text-[#7C3AED]" />
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
