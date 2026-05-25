import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Briefcase, BrainCircuit, ShieldCheck, Sparkles, Target, Users } from 'lucide-react';

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
  { value: 'Clear', label: 'product direction' },
  { value: 'Warm', label: 'visual contrast' },
  { value: 'Fast', label: 'path to action' },
];

const MetaMaskSpotlight: React.FC = () => {
  return (
    <section className="bg-[#FFF8EF] py-14 sm:py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-10 sm:mb-14"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#F97316] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <Sparkles className="w-3.5 h-3.5" />
            Why Studlyf feels more MetaMask-like
          </span>
          <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-[#0F172A] sm:text-5xl">
            A cleaner dashboard for learners.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#475569] sm:text-lg">
            We keep the page bright, give key actions more contrast, and make every section feel like part of one focused product flow.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 items-stretch">
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
                    className="group h-full rounded-[1.75rem] border border-white/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)] p-6 sm:p-7 flex flex-col justify-between hover:border-[#F97316]/25 hover:-translate-y-1 transition-all"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-[#F97316]/10 border border-[#F97316]/10 flex items-center justify-center text-[#F97316] group-hover:bg-slate-950 group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="mt-5 text-xl font-black text-[#0F172A] tracking-[-0.03em]">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm text-[#64748B] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#F97316]">
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
            className="rounded-[2rem] border border-white/80 bg-white p-6 sm:p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#F97316]">Product clarity</p>
                <h3 className="mt-2 text-2xl font-black text-[#0F172A]">White space, stronger contrast.</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center text-[#F97316] shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {stats.map((item) => (
                <div key={item.value} className="rounded-2xl bg-[#FFF8EF] border border-white p-4 text-center">
                  <p className="text-lg font-black text-[#0F172A] sm:text-2xl">{item.value}</p>
                  <p className="mt-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] leading-relaxed text-[#64748B]">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {[
                'Crisp hierarchy inspired by product dashboards.',
                'Warm cream surfaces with dark text for better contrast.',
                'Short, direct paths to the most useful actions.',
              ].map((line) => (
                <div key={line} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F97316]/10 text-[#F97316]">
                    <Users className="h-3 w-3" />
                  </div>
                  <p className="text-sm leading-relaxed text-[#475569]">{line}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MetaMaskSpotlight;
