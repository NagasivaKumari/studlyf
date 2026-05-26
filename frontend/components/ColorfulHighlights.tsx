import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Star, Sparkles, Calendar, Trophy } from 'lucide-react';

const highlights = [
  { title: 'Featured Tracks', desc: 'Role-focused tracks for engineers and builders.', icon: Star, color: 'from-[#FF7AB6] to-[#7C3AED]', action: 'tracks' as const },
  { title: 'Upcoming Events', desc: 'Workshops, live reviews, and hiring events.', icon: Calendar, color: 'from-[#06B6D4] to-[#4F46E5]', action: 'learnHub' as const },
  { title: 'Success Stories', desc: 'Learners who landed roles and shipped products.', icon: Trophy, color: 'from-[#F59E0B] to-[#EF4444]', action: 'testimonials' as const },
  { title: 'Tooling & AI', desc: 'Integrated tools to speed up learning and practice.', icon: Sparkles, color: 'from-[#34D399] to-[#06B6D4]', action: 'aiTools' as const },
];

const ColorfulHighlights: React.FC = () => {
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
    <section className="py-12 bg-white px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h3 className="text-sm font-black uppercase tracking-[0.35em] text-[#7C3AED]">Highlights</h3>
          <p className="mt-3 text-xl font-bold text-[#111827]">Quick ways to explore</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {highlights.map((h, i) => {
            const Icon = h.icon;
            return (
              <motion.button
                key={i}
                type="button"
                whileHover={{ translateY: -6 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCardAction(h.action)}
                className="text-left rounded-2xl overflow-hidden shadow-md border border-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
              >
                <div className={`p-6 flex flex-col gap-4 h-full`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${h.color} flex items-center justify-center text-white shadow-lg`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[#111827]">{h.title}</h4>
                    <p className="text-sm text-[#6B7280] mt-1">{h.desc}</p>
                  </div>
                  <div className="mt-auto pt-2">
                    <div className="text-[11px] font-black text-[#7C3AED] uppercase tracking-[0.3em]">Explore →</div>
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

export default ColorfulHighlights;
