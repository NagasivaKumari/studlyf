import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Star, Sparkles, Calendar, Trophy, ArrowRight } from 'lucide-react';

const highlights = [
  { title: 'Featured tracks', desc: 'Role-focused learning paths that feel easier to scan.', icon: Star, color: 'from-[#F97316] to-[#F59E0B]', action: 'tracks' as const },
  { title: 'Upcoming events', desc: 'Workshops, live reviews, and hiring events in one place.', icon: Calendar, color: 'from-[#0EA5E9] to-[#6366F1]', action: 'learnHub' as const },
  { title: 'Success stories', desc: 'Learners who landed roles and shipped products.', icon: Trophy, color: 'from-[#F59E0B] to-[#EF4444]', action: 'testimonials' as const },
  { title: 'Tooling & AI', desc: 'Integrated tools to speed up learning and practice.', icon: Sparkles, color: 'from-[#22C55E] to-[#06B6D4]', action: 'aiTools' as const },
];

const MetaMaskHighlights: React.FC = () => {
  const navigate = useNavigate();

  const handleCardAction = (action: 'tracks' | 'learnHub' | 'testimonials' | 'aiTools') => {
    if (action === 'tracks') {
      const tracksSection = document.getElementById('tracks');
      if (tracksSection) {
        tracksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      navigate('/learn/courses-overview');
      return;
    }

    if (action === 'learnHub') {
      navigate('/learn/courses-overview');
      return;
    }

    if (action === 'testimonials') {
      const testimonialsSection = document.getElementById('testimonials');
      if (testimonialsSection) {
        testimonialsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      navigate('/');
      window.setTimeout(() => {
        document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
      return;
    }

    navigate('/ai-tools');
  };

  return (
    <section className="bg-[#FFF8EF] px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#F97316] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <Sparkles className="h-3.5 w-3.5" />
            Quick ways to explore
          </span>
          <p className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
            A homepage that feels structured and polished.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.title}
                type="button"
                whileHover={{ translateY: -6 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCardAction(item.action)}
                className="group text-left rounded-[1.75rem] border border-white/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)] focus:outline-none focus:ring-2 focus:ring-[#F97316]/25"
              >
                <div className="flex h-full flex-col gap-4 p-6">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg shadow-orange-100`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-950 tracking-[-0.03em]">{item.title}</h4>
                    <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 pt-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#F97316]">
                    Explore
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MetaMaskHighlights;
