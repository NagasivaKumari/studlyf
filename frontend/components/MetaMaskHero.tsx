import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

const heroStats = [
  { value: '01', label: 'Structured learning' },
  { value: '24/7', label: 'Practice on demand' },
  { value: '100%', label: 'Clearer workflows' },
];

const MetaMaskHero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-[#FFF8EF] px-4 sm:px-6 pt-28 pb-20 sm:pt-32 sm:pb-28">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-[-8%] h-72 w-72 rounded-full bg-[#FFB84D]/30 blur-3xl" />
        <div className="absolute top-16 right-[-8%] h-80 w-80 rounded-full bg-[#7C3AED]/12 blur-3xl" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#FFF3E3] to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#F97316] shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Your home for learning and career growth
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="mt-6 text-5xl font-black tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-[5rem] lg:leading-[0.92]"
          >
            Build your next move with a clearer path.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="mt-6 max-w-xl text-lg leading-8 text-slate-600"
          >
            Studlyf now feels more like a focused product dashboard: crisp layout, warm contrast, and the shortest route from learning to opportunity.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/signup')}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-bold text-white shadow-[0_18px_40px_rgba(15,23,42,0.2)] transition-colors hover:bg-black"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/learn/courses-overview')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-6 py-3.5 text-sm font-bold text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-colors hover:bg-white"
            >
              Explore paths
              <Sparkles className="h-4 w-4 text-[#F97316]" />
            </motion.button>
          </motion.div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {heroStats.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl"
              >
                <p className="text-2xl font-black tracking-tight text-slate-950">{item.value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="relative mx-auto w-full max-w-[620px]"
        >
          <div className="absolute -left-6 top-8 h-28 w-28 rounded-full bg-[#FFB84D]/30 blur-3xl" />
          <div className="absolute -right-6 bottom-10 h-36 w-36 rounded-full bg-[#7C3AED]/15 blur-3xl" />

          <div className="relative overflow-hidden rounded-[2.2rem] border border-white/70 bg-white/85 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
            <div className="rounded-[1.8rem] bg-gradient-to-br from-[#1F2937] via-[#111827] to-[#F97316] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-200">Studlyf dashboard</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight">Everything in one clear place.</h3>
                </div>
                <div className="rounded-full bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/90">
                  MetaMask-inspired flow
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[1.5rem] bg-white/10 p-4 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>Weekly momentum</span>
                    <span>+24%</span>
                  </div>
                  <div className="mt-4 h-28 rounded-[1.25rem] bg-gradient-to-br from-white/15 to-white/5 p-4">
                    <div className="flex h-full items-end gap-2">
                      {[36, 52, 44, 68, 58, 82].map((height, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                          className={`w-full rounded-t-full ${i % 2 === 0 ? 'bg-[#FFB84D]' : 'bg-white'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {[
                    { title: 'Courses', value: '12 tracks', tone: 'bg-[#FFB84D]/15 text-[#FFD79B]' },
                    { title: 'Portfolio', value: 'Live URL', tone: 'bg-white/10 text-white' },
                    { title: 'Assessments', value: 'Instant feedback', tone: 'bg-[#F97316]/20 text-orange-100' },
                  ].map((item) => (
                    <div key={item.title} className={`rounded-[1.35rem] border border-white/10 p-4 ${item.tone}`}>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">{item.title}</p>
                      <p className="mt-2 text-lg font-bold">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-semibold text-white/80">
                <span className="rounded-full bg-white/10 px-3 py-1.5">Cleaner UI</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5">Sharper contrast</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5">More focus</span>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {['Learn', 'Practice', 'Launch'].map((label, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.2 + i * 0.06 }}
                  className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#F97316]">Step {i + 1}</p>
                  <p className="mt-2 text-lg font-black text-slate-950">{label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MetaMaskHero;
