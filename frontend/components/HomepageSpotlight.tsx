import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Compass, Target, BrainCircuit, Briefcase, Sparkles, ShieldCheck, Users, ChevronRight } from 'lucide-react';

const featureCards = [
  {
    title: 'Guided learning paths',
    desc: 'Follow structured, step-by-step educational journeys designed for real career growth.',
    to: '/learn/courses-overview',
    icon: Compass,
    btnText: 'Explore pathways',
  },
  {
    title: 'Skill checkups',
    desc: 'Precision assessments to identify skill gaps and validate your technical expertise.',
    to: '/learn/assessment-intro',
    icon: Target,
    btnText: 'Start checkup',
  },
  {
    title: 'AI support tools',
    desc: 'Leverage intelligent agents for resume building, interview prep, and instant feedback.',
    to: '/ai-tools',
    icon: BrainCircuit,
    btnText: 'Try AI tools',
  },
  {
    title: 'Job-ready practice',
    desc: 'Build real-world projects and participate in challenges that prove your capabilities.',
    to: '/job-prep/portfolio',
    icon: Briefcase,
    btnText: 'Start practicing',
  },
];

const stats = [
  { value: 'Build', label: 'Real projects' },
  { value: 'Connect', label: 'Mentors & community' },
  { value: 'Grow', label: 'Real opportunities' },
];

const HomepageSpotlight: React.FC = () => {
  return (
    <section className="relative bg-white py-20 sm:py-32 px-4 sm:px-6 overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#7C3AED]/[0.03] blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-16 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#7C3AED]/20 shadow-[0_2px_10px_rgba(124,58,237,0.05)] mb-6">
            <Sparkles className="w-4 h-4 text-[#7C3AED]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7C3AED] mt-[1px]">
              Platform Gateway
            </span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black text-[#0F172A] tracking-tight mb-6">
            Choose your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#4F46E5]">fastest path</span> to growth.
          </h2>
          <p className="text-base sm:text-xl text-[#64748B] leading-relaxed">
            Learn, build, connect, and grow through opportunities, mentorship, projects, and career-driven experiences.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1.3fr_0.9fr] gap-8 items-stretch">
          <div className="grid sm:grid-cols-2 gap-5">
            {featureCards.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={item.to}
                    className="group relative block h-full rounded-[28px] bg-white border border-gray-100 p-8 overflow-hidden transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(124,58,237,0.08)] hover:-translate-y-1 hover:border-[#7C3AED]/20"
                  >
                    {/* Hover Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/[0.01] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10 flex flex-col h-full">
                      {/* Premium Icon Container */}
                      <div className="relative mb-8 self-start">
                        {/* Soft Outer Glow */}
                        <div className="absolute inset-0 bg-[#7C3AED] blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 rounded-[20px]" />
                        
                        {/* Glass Body */}
                        <div className="relative w-[60px] h-[60px] rounded-[22px] bg-white border border-gray-100 shadow-[0_8px_16px_-4px_rgba(0,0,0,0.03),inset_0_1px_4px_rgba(255,255,255,1)] flex items-center justify-center text-[#64748B] group-hover:text-[#7C3AED] group-hover:-translate-y-1 group-hover:shadow-[0_16px_32px_-8px_rgba(124,58,237,0.15),inset_0_1px_4px_rgba(255,255,255,1)] group-hover:border-[#7C3AED]/20 transition-all duration-500 overflow-hidden">
                          {/* Inner Subtle Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <Icon className="w-6 h-6 stroke-[1.5] relative z-10 drop-shadow-sm transition-transform duration-500 group-hover:scale-110" />
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-[#0F172A] tracking-tight mb-3 group-hover:text-[#7C3AED] transition-colors duration-300">
                        {item.title}
                      </h3>

                      <p className="text-sm text-[#64748B] leading-relaxed mb-8 flex-grow group-hover:text-[#475569] transition-colors duration-300">
                        {item.desc}
                      </p>

                      <div className="flex items-center gap-2 text-[12px] font-bold text-[#0F172A] group-hover:text-[#7C3AED] transition-colors duration-300 mt-auto">
                        {item.btnText}
                        <ChevronRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-full rounded-[32px] bg-[#FAFAFA] border border-gray-100 p-8 sm:p-10 overflow-hidden group hover:border-gray-200 transition-all duration-300"
          >
            {/* Subtle mesh/grain or pattern could go here, simulating with a gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#7C3AED]/[0.04] to-transparent rounded-bl-full pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#7C3AED] shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
                  <ShieldCheck className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#64748B] mb-1">Why Studlyf</p>
                  <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">Built for growth.</h3>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-10">
                {stats.map((item) => (
                  <div key={item.value} className="rounded-2xl bg-white border border-gray-100 p-4 text-center shadow-sm hover:shadow-md transition-shadow duration-300">
                    <p className="text-xl sm:text-2xl font-black text-[#0F172A] mb-1">{item.value}</p>
                    <p className="text-[10px] sm:text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em]">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-5">
                {[
                  'A student ecosystem designed for builders, creators, and future leaders.',
                  'Access mentors, communities, collaborations, and startup exposure.',
                  'Turn learning into projects, portfolios, opportunities, and career growth.',
                ].map((line, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-white border border-gray-100 shadow-sm text-[#7C3AED] flex items-center justify-center shrink-0">
                      <Users className="w-3 h-3 stroke-[2]" />
                    </div>
                    <p className="text-[15px] text-[#475569] leading-relaxed font-medium">{line}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HomepageSpotlight;