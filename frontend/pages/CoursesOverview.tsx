import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';

const CoursesOverview: React.FC = () => {
    const navigate = useNavigate();

    const [courses, setCourses] = useState<any[]>([]);
    const [searchParams] = useSearchParams();

    const initialCategory = searchParams.get('category') || 'All';
    const [activeCategory, setActiveCategory] =
        useState<string>(initialCategory);

    /* Fetch courses */
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                console.log('🔵 Fetching courses from:', `${API_BASE_URL}/api/courses`);
                const res = await fetch(`${API_BASE_URL}/api/courses`);
                console.log('📥 Response status:', res.status);
                
                const data = await res.json();
                console.log('✅ Courses data:', data);

                if (data && Array.isArray(data)) {
                    console.log('📊 Total courses received:', data.length);
                    // Display ALL courses - removed AWS filter
                    setCourses(data);
                    console.log('✓ All courses set in state');
                } else {
                    console.warn('⚠️ Data is not an array');
                    setCourses([]);
                }
            } catch (err) {
                console.error("💥 Fetch Error:", err);
                setCourses([]);
            }
        };

        fetchCourses();
    }, []);

    /* Create slug */
    const createSlug = (title: string, id: string) => {
        if (!title || !id) return '';

        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        return `${slug}--${id}`;
    };

    /* Dynamic Categories */
    const dynamicCategories = useMemo(() => {
        const predefined = [
            'All',
            'Backend',
            'Frontend',
            'Software Engineering',
            'Data',
            'AI',
            'Cyber'
        ];

        const cats = new Set(predefined);

        courses.forEach((c) => {
            if (c.role_tag) {
                cats.add(c.role_tag);
            }
        });

        return Array.from(cats);
    }, [courses]);

    /* Filter Courses */
    const filteredCourses = useMemo(() => {
        if (activeCategory === 'All') return courses;

        return courses.filter(
            (course) => course.role_tag === activeCategory
        );
    }, [activeCategory, courses]);

    return (
        <div className="min-h-screen bg-[#FAFAFA] overflow-x-hidden">

            {/* HERO */}
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">

                <div className="max-w-6xl mx-auto text-center relative z-10">

                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-white border border-[#7C3AED]/15 shadow-sm px-5 py-2 rounded-full mb-8"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                        <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-[0.4em]">
                            Learn → Courses
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-6xl lg:text-8xl font-black text-[#111827] tracking-tighter leading-[0.88] mb-6 uppercase"
                    >
                        Master Your <br />

                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4DFF] via-[#EC4899] to-[#FF5B5B]">
                            ADVANCED MODULES
                        </span>

                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed"
                    >
                        Elite curriculum. Real hiring partners.
                        Verified skills that matter.
                        <br />
                        Pick your path and start building today.
                    </motion.p>

                </div>

            </section>

            {/* COURSES SECTION */}
            <section
                id="elite-catalog"
                className="max-w-7xl mx-auto px-4 sm:px-8 pb-32 pt-20"
            >

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">

                    <div>
                        <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-[0.5em] mb-4 block">
                            Proprietary Elite Modules
                        </span>

                        <h2 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tighter uppercase leading-[0.9]">
                            Available <br />

                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4DFF] via-[#EC4899] to-[#FF5B5B] inline-block">
                                Elite Knowledge
                            </span>

                        </h2>

                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-nowrap overflow-x-auto gap-2 pb-2">

                        {dynamicCategories.map((cat) => (

                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border whitespace-nowrap ${activeCategory === cat
                                        ? 'bg-[#111827] text-white border-[#111827] shadow-lg scale-105'
                                        : 'bg-white text-gray-400 border-gray-100 hover:border-[#7C3AED]/30 hover:text-gray-600'
                                    }`}
                            >
                                {cat}
                            </button>

                        ))}

                    </div>

                </div>

                {/* Debug Info */}
                <div className="mb-8 text-xs text-gray-500 font-mono bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div>API: {API_BASE_URL}/api/courses</div>
                    <div>Total courses: {courses.length}</div>
                    <div>Filtered courses: {filteredCourses.length}</div>
                    <div>Category: {activeCategory}</div>
                </div>

                {filteredCourses.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-2xl font-black text-gray-400 mb-4">No Courses Found</div>
                        {courses.length === 0 && (
                            <div className="text-sm text-gray-500">
                                Courses not loading from API. Check browser console for errors.
                            </div>
                        )}
                        {courses.length > 0 && activeCategory !== 'All' && (
                            <div className="text-sm text-gray-500">
                                No courses in {activeCategory} category.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    <AnimatePresence mode="popLayout">

                        {filteredCourses.map((course) => (

                            <motion.div
                                key={course._id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                whileHover={{ y: -10 }}
                                onClick={() =>
                                    navigate(
                                        `/learn/courses/${createSlug(
                                            course.title,
                                            course._id
                                        )}`
                                    )
                                }
                                className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer group flex flex-col h-full"
                            >

                                <div className="h-56 relative overflow-hidden">

                                    <img
                                        src={
                                            course.image ||
                                            'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800'
                                        }
                                        alt={course.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />

                                </div>

                                <div className="p-8 flex flex-col flex-grow">

                                    <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-tight group-hover:text-[#7C3AED] transition-colors">
                                        {course.title}
                                    </h3>

                                    <p className="text-gray-500 text-xs mb-6 line-clamp-2 leading-relaxed flex-grow">
                                        {course.description}
                                    </p>

                                    <div className="flex items-center justify-between pt-6 border-t border-gray-100">

                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                            School of {course.school || 'Engineering'}
                                        </span>

                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-[#7C3AED] group-hover:text-white transition-all">

                                            <ChevronRight className="w-5 h-5" />

                                        </div>

                                    </div>

                                </div>

                            </motion.div>

                        ))}

                    </AnimatePresence>

                </div>
                )}

            </section>

            {/* Bottom CTA */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-24">

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="bg-[#111827] rounded-[2.5rem] p-10 sm:p-14 flex flex-col sm:flex-row items-center justify-between gap-10"
                >

                    <div>

                        <p className="text-[10px] font-black text-[#A78BFA] uppercase tracking-[0.5em] mb-3">
                            Not sure which track?
                        </p>

                        <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-tight">
                            Take our Career Fit <br />

                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4DFF] via-[#EC4899] to-[#FF5B5B] inline-block">
                                Assessment.
                            </span>

                        </h3>

                    </div>

                    <style>{`
                        @keyframes sa-shimmer {
                            0%   { transform: translateX(-180%) skewX(-20deg); }
                            100% { transform: translateX(300%) skewX(-20deg); }
                        }
                        @keyframes sa-orb1 {
                            0%,100% { transform: translate(0px,0px) scale(1);    opacity:0.55; }
                            40%     { transform: translate(8px,-6px) scale(1.3);  opacity:0.9; }
                            70%     { transform: translate(-4px,4px) scale(0.8);  opacity:0.4; }
                        }
                        @keyframes sa-orb2 {
                            0%,100% { transform: translate(0px,0px) scale(1);     opacity:0.4; }
                            35%     { transform: translate(-10px,-8px) scale(1.4); opacity:0.85; }
                            65%     { transform: translate(6px,5px) scale(0.75);   opacity:0.35; }
                        }
                        @keyframes sa-orb3 {
                            0%,100% { transform: translate(0px,0px) scale(1);    opacity:0.5; }
                            50%     { transform: translate(6px,8px) scale(1.25);  opacity:0.9; }
                        }
                        .sa-btn {
                            position: relative;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            padding: 16px 40px;
                            background: #7C3AED;
                            color: #fff;
                            font-weight: 800;
                            font-size: 13px;
                            letter-spacing: 0.12em;
                            text-transform: uppercase;
                            border: none;
                            border-radius: 16px;
                            cursor: pointer;
                            overflow: hidden;
                            transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
                            box-shadow: 0 4px 20px rgba(124,58,237,0.4), 0 1px 0 rgba(255,255,255,0.12) inset;
                        }
                        .sa-btn::before {
                            content: '';
                            position: absolute;
                            inset: 0;
                            border-radius: 16px;
                            background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 55%);
                            pointer-events: none;
                            z-index: 1;
                        }
                        .sa-btn::after {
                            content: '';
                            position: absolute;
                            top: 0; left: 0;
                            width: 40%; height: 100%;
                            background: linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.24) 50%, transparent 80%);
                            animation: sa-shimmer 2.8s ease-in-out infinite;
                            pointer-events: none;
                            z-index: 2;
                        }
                        .sa-btn:hover {
                            transform: translateY(-3px) scale(1.04);
                            box-shadow: 0 0 0 5px rgba(139,92,246,0.18), 0 0 32px 12px rgba(139,92,246,0.45), 0 16px 40px rgba(109,40,217,0.5);
                        }
                        .sa-btn:active { transform: scale(0.97); }
                        .sa-orb {
                            position: absolute;
                            border-radius: 50%;
                            pointer-events: none;
                            filter: blur(7px);
                            z-index: 1;
                        }
                        .sa-orb1 { width:28px; height:28px; background:radial-gradient(circle,rgba(196,168,255,0.95),transparent 70%); top:-4px; left:18px; animation:sa-orb1 3.2s ease-in-out infinite; }
                        .sa-orb2 { width:22px; height:22px; background:radial-gradient(circle,rgba(255,255,255,0.8),transparent 70%);  bottom:-2px; right:48px; animation:sa-orb2 4s ease-in-out infinite; }
                        .sa-orb3 { width:18px; height:18px; background:radial-gradient(circle,rgba(167,139,250,0.9),transparent 70%); top:4px; right:18px;  animation:sa-orb3 2.6s ease-in-out infinite; }
                        .sa-label { position:relative; z-index:5; display:flex; align-items:center; gap:8px; }
                    `}</style>

                    <button
                        className="sa-btn"
                        onClick={() => navigate('/learn/career-fit')}
                    >
                        <span className="sa-orb sa-orb1" />
                        <span className="sa-orb sa-orb2" />
                        <span className="sa-orb sa-orb3" />
                        <span className="sa-label">
                            Start Assessment
                            <ArrowRight className="w-4 h-4" />
                        </span>
                    </button>

                </motion.div>

            </section>

        </div>
    );
};

export default CoursesOverview;