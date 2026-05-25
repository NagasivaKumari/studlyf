import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, CircleCheck, Lightbulb, Rocket, ShieldCheck, Sparkles, Target, Users } from 'lucide-react';

const principles = [
  {
    title: 'Evidence over noise',
    desc: 'We shape learning around verified outputs, not vague claims.',
    icon: ShieldCheck,
    tone: 'from-[#F97316] to-[#FB7185]',
  },
  {
    title: 'Creative with structure',
    desc: 'The journey feels expressive, but every step still stays focused.',
    icon: Sparkles,
    tone: 'from-[#7C3AED] to-[#06B6D4]',
  },
  {
    title: 'Built for momentum',
    desc: 'From skill checks to projects, we keep learners moving forward.',
    icon: Target,
    tone: 'from-[#F59E0B] to-[#F97316]',
  },
];

const milestones = [
  { year: '01', title: 'Clarify the path', desc: 'Make the learning flow easier to understand and easier to trust.' },
  { year: '02', title: 'Build visible proof', desc: 'Replace generic progress with project evidence and practical skill signals.' },
  { year: '03', title: 'Open real outcomes', desc: 'Connect learners to opportunities, teams, and employers with confidence.' },
];

const impactCards = [
  { label: 'Role-ready', value: 'Skills that translate into interviews' },
  { label: 'Project-first', value: 'A portfolio that shows what you can build' },
  { label: 'Trust layer', value: 'Verification that is clear and auditable' },
];

const About: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-hidden bg-[#FFF8EF] text-slate-950">
      <div className="relative px-6 pb-24 pt-24 sm:pt-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#F97316]/15 blur-3xl" />
          <div className="absolute right-[-6rem] top-0 h-96 w-96 rounded-full bg-[#7C3AED]/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[#F59E0B]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <header className="mb-20 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#F97316] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <Sparkles className="h-3.5 w-3.5" />
                Creative company story
              </span>

              <div className="mt-7 max-w-4xl">
                <p className="text-[10px] font-black uppercase tracking-[0.45em] text-slate-500">About Studlyf</p>
                <h1 className="mt-4 text-5xl font-black tracking-[-0.06em] text-slate-950 sm:text-7xl lg:text-[6.5rem] lg:leading-[0.92]">
                  We turn learning into a visible journey.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                  Studlyf helps learners build real skills, ship credible projects, and connect that proof to real opportunities through a more intentional, story-driven experience.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {impactCards.map((item) => (
                  <div key={item.label} className="rounded-full border border-white/80 bg-white px-4 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F97316]">{item.label}</span>
                    <span className="ml-2 text-sm font-semibold text-slate-700">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.55 }}
              className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl"
            >
              <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-[#F97316] p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-200">Our promise</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">Clearer flow. Stronger proof. Better outcomes.</h2>
                <p className="mt-4 text-sm leading-7 text-white/75">
                  We design the product around clarity so the platform feels easier to trust and easier to use.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {['Learn', 'Build', 'Launch'].map((step, index) => (
                  <div key={step} className="rounded-[1.25rem] border border-slate-200 bg-[#FFF8EF] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#F97316]">0{index + 1}</p>
                    <p className="mt-2 text-lg font-black text-slate-950">{step}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </header>

          <section className="mb-20 grid gap-6 lg:grid-cols-3">
            {principles.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.45 }}
                  className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)]"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.tone} flex items-center justify-center text-white shadow-lg`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-black tracking-[-0.03em] text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.desc}</p>
                </motion.div>
              );
            })}
          </section>

          <section className="mb-20 grid items-start gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
              className="rounded-[2rem] border border-white/80 bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)]"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#F97316]">Our mission</p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">
                We bridge abstract learning and real engineering proof.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                In a world full of generic content, we focus on evidence. That means role-ready training, hands-on projects, and institutional verification that actually means something.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  'Evidence-grade assessments that measure practical judgment.',
                  'Projects shaped like real products, not throwaway demos.',
                  'A platform that feels modern, calm, and easy to navigate.',
                ].map((line) => (
                  <div key={line} className="flex items-start gap-3 rounded-[1.25rem] bg-[#FFF8EF] p-4">
                    <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#F97316]" />
                    <p className="text-sm leading-7 text-slate-700">{line}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="rounded-[2rem] border border-white/80 bg-[#111827] p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-200">How it comes together</p>
              <div className="mt-6 space-y-5">
                {milestones.map((item) => (
                  <div key={item.year} className="flex gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F97316] font-black text-white shadow-lg shadow-orange-500/20">
                      {item.year}
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-[-0.03em]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-white/70">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          <section className="rounded-[2.5rem] border border-white/80 bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#F97316]">Join the platform</p>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
                  Ready to build with more clarity and less noise?
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                  Connect your capability to real opportunities and start shaping a portfolio that looks as intentional as the work behind it.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/learn/assessment-intro')}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-bold text-white shadow-[0_18px_40px_rgba(15,23,42,0.2)] transition-colors hover:bg-black"
                >
                  Start assessment
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('/job-prep/projects')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-colors hover:bg-slate-50"
                >
                  Explore projects
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
