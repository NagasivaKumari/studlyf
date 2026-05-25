import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Briefcase, BrainCircuit, Sparkles, Target, ShieldCheck, Users } from 'lucide-react';

const featureCards = [
  {
    title: 'Guided learning paths',
    desc: 'Jump straight into curated tracks for skills, systems, and career readiness.',
    to: '/learn/courses-overview',
    icon: BookOpen,
  },
  {
    title: 'Skill checkups',
    desc: 'Measure your current level and discover where to focus next.',
    to: '/learn/assessment-intro',
    icon: Target,
  },
  {
    title: 'AI support tools',
    desc: 'Use built-in tools to plan, practice, and improve faster.',
    to: '/ai-tools',
    icon: BrainCircuit,
  },
  {
    title: 'Job-ready practice',
    desc: 'Build portfolios, rehearse interviews, and explore opportunities.',
    to: '/job-prep/portfolio',
    icon: Briefcase,
  },
];

const stats = [
  { value: 'Learn', label: 'with structured paths' },
  { value: 'Practice', label: 'with hands-on tasks' },
  { value: 'Grow', label: 'with real outcomes' },
];

const HomepageSpotlight: React.FC = () => {
  return (
    <section className="bg-white py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-10 sm:mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#7C3AED]/15 bg-[#7C3AED]/5 text-[#7C3AED] text-[10px] font-black uppercase tracking-[0.35em]">
            <Sparkles className="w-3.5 h-3.5" />
            Home highlights
          </span>
          <h2 className="mt-5 text-3xl sm:text-5xl font-black text-[#111827] tracking-tight">
            A few quick paths to get moving.
          </h2>
          <p className="mt-4 text-sm sm:text-lg text-[#6B7280] leading-relaxed">
            Keep the page clean and white, but give learners faster access to the most useful parts of Studlyf.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 items-stretch">
          <div className="grid sm:grid-cols-2 gap-4">
            {featureCards.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                >
                  <Link
                    to={item.to}
                    className="group h-full rounded-[1.75rem] border border-gray-100 bg-white shadow-[0_10px_35px_-24px_rgba(15,23,42,0.35)] p-6 sm:p-7 flex flex-col justify-between hover:border-[#7C3AED]/20 hover:-translate-y-1 transition-all"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/8 border border-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="mt-5 text-xl font-black text-[#111827] tracking-tight">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm text-[#6B7280] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#7C3AED]">
                      Explore
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="rounded-[2rem] border border-gray-100 bg-[#F9FAFB] p-6 sm:p-8 shadow-[0_10px_35px_-24px_rgba(15,23,42,0.35)]"
          >
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#7C3AED]">Why Studlyf</p>
                <h3 className="mt-2 text-2xl font-black text-[#111827]">White, clear, and focused.</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-[#7C3AED] shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {stats.map((item) => (
                <div key={item.value} className="rounded-2xl bg-white border border-gray-100 p-4 text-center">
                  <p className="text-lg sm:text-2xl font-black text-[#111827]">{item.value}</p>
                  <p className="mt-1 text-[10px] sm:text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.22em] leading-relaxed">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {[
                'Curated paths for learners, builders, and job seekers.',
                'Low-noise interface with the same white look across the page.',
                'Fast access to courses, assessment, and opportunities.',
              ].map((line) => (
                <div key={line} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center shrink-0">
                    <Users className="w-3 h-3" />
                  </div>
                  <p className="text-sm text-[#475569] leading-relaxed">{line}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HomepageSpotlight;