import React from 'react';
import { motion } from 'framer-motion';

const PremiumStorytellingSection: React.FC = () => {
  // Carefully curated, high-quality visuals representing a premium tech ecosystem
  const categories = [
    { title: "Advanced Architecture", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80" },
    { title: "Data Science & AI", img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80" },
    { title: "Product Engineering", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80" },
    { title: "Design Systems", img: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80" },
    { title: "Startup Ecosystem", img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" },
    { title: "Software Development", img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80" },
    { title: "Abstract Logic", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80" },
    { title: "System Operations", img: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80" },
    { title: "Creative Coding", img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80" },
    { title: "Creative Flow", img: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80" },
    { title: "Machine Learning", img: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80" },
    { title: "Cyber Security", img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80" },
    { title: "Cloud Architecture", img: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80" },
    { title: "Interactive Media", img: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80" },
    { title: "Blockchain & Web3", img: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&q=80" }
  ];

  const journeySteps = [
    {
      title: "Industry-Level Learning Paths",
      desc: "Access structured learning roadmaps designed for real-world industry skills in AI, tech, product, design, and emerging domains."
    },
    {
      title: "Internship & Hiring Opportunities",
      desc: "Unlock internship openings, startup opportunities, hiring support, and exposure to career-building experiences."
    },
    {
      title: "Real Projects & Open Source Exposure",
      desc: "Work on practical projects, collaborate with teams, contribute to open-source, and build proof of work."
    },
    {
      title: "Startup & Product Building Ecosystem",
      desc: "Learn how startups are built, validate ideas, explore entrepreneurship, and build products from scratch."
    },
    {
      title: "Career Roadmaps & Mentorship",
      desc: "Receive guidance from mentors, structured career direction, personalized learning paths, and growth support."
    },
    {
      title: "Resume, Portfolio & Placement Readiness",
      desc: "Build strong resumes, optimize portfolios, prepare for interviews, and become placement-ready."
    }
  ];

  // Distribute into 4 staggered rows and duplicate 4x for ultra-wide seamless scrolling
  const set1 = categories.slice(0, 5);
  const set2 = categories.slice(5, 10);
  const set3 = categories.slice(10, 15);
  const set4 = [categories[2], categories[6], categories[11], categories[13], categories[4]];

  const row1 = [...set1, ...set1, ...set1, ...set1];
  const row2 = [...set2, ...set2, ...set2, ...set2];
  const row3 = [...set3, ...set3, ...set3, ...set3];
  const row4 = [...set4, ...set4, ...set4, ...set4];

  return (
    <section className="relative w-full bg-[#050816] flex flex-col items-center overflow-hidden py-24 my-8">
      
      <style>{`
        @keyframes drift-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes drift-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-drift-left {
          animation: drift-left 80s linear infinite;
          width: max-content;
        }
        .animate-drift-right {
          animation: drift-right 90s linear infinite;
          width: max-content;
        }
      `}</style>

      {/* 1. CINEMATIC BASE LAYER */}
      <div className="absolute inset-0 bg-[#050816] z-0" />

      {/* 2. IMMERSIVE LAYERED BACKGROUND GRID WITH PARALLAX DEPTH */}
      <div className="absolute inset-0 z-[1] flex flex-col gap-8 sm:gap-10 justify-center items-center opacity-[0.45] scale-[1.3] pointer-events-none transform -rotate-2">
        {[1, 2, 3].map((setIndex) => (
          <React.Fragment key={`set-${setIndex}`}>
            {/* Row 1: Midground (slight blur for depth of field) */}
            <div className="flex gap-8 sm:gap-10 animate-drift-left blur-[2px]">
              {row1.map((cat, idx) => (
                <div key={`r1-${setIndex}-${idx}`} className="w-[320px] sm:w-[420px] h-[200px] sm:h-[260px] rounded-[2rem] overflow-hidden relative flex-shrink-0 shadow-2xl">
                  <img src={cat.img} alt={cat.title} className="w-full h-full object-cover saturate-50 contrast-125 mix-blend-luminosity opacity-80" />
                </div>
              ))}
            </div>
            {/* Row 2: Foreground (sharp) */}
            <div className="flex gap-8 sm:gap-10 animate-drift-right -ml-40">
              {row2.map((cat, idx) => (
                <div key={`r2-${setIndex}-${idx}`} className="w-[320px] sm:w-[420px] h-[200px] sm:h-[260px] rounded-[2rem] overflow-hidden relative flex-shrink-0 shadow-2xl border border-white/5">
                  <img src={cat.img} alt={cat.title} className="w-full h-full object-cover saturate-100 opacity-90" />
                </div>
              ))}
            </div>
            {/* Row 3: Foreground (sharp) */}
            <div className="flex gap-8 sm:gap-10 animate-drift-left -ml-20">
              {row3.map((cat, idx) => (
                <div key={`r3-${setIndex}-${idx}`} className="w-[320px] sm:w-[420px] h-[200px] sm:h-[260px] rounded-[2rem] overflow-hidden relative flex-shrink-0 shadow-2xl border border-white/5">
                  <img src={cat.img} alt={cat.title} className="w-full h-full object-cover saturate-100 opacity-90" />
                </div>
              ))}
            </div>
            {/* Row 4: Deep Background (heavy blur) */}
            <div className="flex gap-8 sm:gap-10 animate-drift-right -ml-60 blur-[6px]">
              {row4.map((cat, idx) => (
                <div key={`r4-${setIndex}-${idx}`} className="w-[320px] sm:w-[420px] h-[200px] sm:h-[260px] rounded-[2rem] overflow-hidden relative flex-shrink-0 shadow-2xl">
                  <img src={cat.img} alt={cat.title} className="w-full h-full object-cover saturate-50 opacity-60" />
                </div>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* 3. AMBIENT GRADIENTS (Darkens the mosaic slightly and adds rich tone) */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-b from-[#050816]/95 via-[#050816]/30 to-[#050816]/95 pointer-events-none" />

      {/* 4. THE GLOWING VEIL (Top Atmospheric Curve) */}
      <div className="absolute top-0 left-0 w-full h-[400px] z-[3] pointer-events-none">
        {/* Smooth structural fade that hides the top edge of the grid entirely */}
        <div 
          className="absolute inset-0"
          style={{ background: 'radial-gradient(130% 100% at 50% 100%, transparent 20%, rgba(5,8,22,0.85) 45%, #050816 75%)' }} 
        />
        {/* Layer 1: Broad, deep purple veil */}
        <div 
          className="absolute inset-0 mix-blend-screen opacity-50"
          style={{ background: 'radial-gradient(130% 100% at 50% 100%, transparent 20%, rgba(124,58,237,0.3) 38%, rgba(5,8,22,0) 65%)' }} 
        />
        {/* Layer 2: Subtle pink/blue inner rim for cinematic tension */}
        <div 
          className="absolute inset-0 mix-blend-screen opacity-70"
          style={{ background: 'radial-gradient(110% 100% at 50% 100%, transparent 25%, rgba(236,72,153,0.15) 35%, rgba(59,130,246,0.1) 45%, transparent 60%)' }} 
        />
      </div>

      {/* 5. THE GLOWING VEIL (Bottom Atmospheric Curve) */}
      <div className="absolute bottom-0 left-0 w-full h-[400px] z-[3] pointer-events-none">
        {/* Structural fade masking the bottom edge */}
        <div 
          className="absolute inset-0"
          style={{ background: 'radial-gradient(130% 100% at 50% 0%, transparent 25%, rgba(5,8,22,0.85) 50%, #050816 80%)' }} 
        />
        {/* Bottom edge ambient lighting */}
        <div 
          className="absolute inset-0 mix-blend-screen opacity-40"
          style={{ background: 'radial-gradient(130% 100% at 50% 0%, transparent 25%, rgba(59,130,246,0.2) 40%, rgba(124,58,237,0.1) 55%, transparent 70%)' }} 
        />
      </div>

      {/* 6. FOREGROUND CONTENT (Premium Storytelling Journey) */}
      <div className="relative z-[10] w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 z-20">
        
        {/* Top Centered Header */}
        <div className="flex flex-col items-center text-center mb-24 lg:mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6C2BFF]/10 border border-[#6C2BFF]/20 text-[#A78BFA] text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(108,43,255,0.2)]">
              Structured Growth
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-white drop-shadow-2xl mb-8 leading-[1.1] max-w-4xl">
              Your Complete STUDLYF Growth Journey
            </h2>
            <p className="text-lg sm:text-2xl text-gray-300 font-medium drop-shadow-xl mb-6 leading-relaxed max-w-3xl">
              From learning industry skills to internships, mentorship, real-world projects, and career readiness — STUDLYF gives you a structured ecosystem to grow step-by-step.
            </p>
            <p className="text-[#A78BFA] font-bold text-lg sm:text-xl drop-shadow-lg">
              Everything you need to go from beginner to builder in one guided journey.
            </p>
          </motion.div>
        </div>

        {/* Alternating Journey Flow */}
        <div className="relative w-full pb-20 max-w-5xl mx-auto">
          {/* Central dotted path connecting steps */}
          <div className="absolute left-[30px] md:left-1/2 top-0 bottom-[100px] w-0.5 md:-translate-x-1/2 border-l-2 border-dashed border-[#6C2BFF]/30 hidden sm:block z-0" />
          
          <div className="flex flex-col gap-24 sm:gap-32 relative z-10 w-full">
            {journeySteps.map((step, idx) => {
              const isLeft = idx % 2 === 0;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-150px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="relative group w-full"
                >
                  <div className={`relative flex flex-col md:flex-row items-center justify-between w-full ${isLeft ? '' : 'md:flex-row-reverse'}`}>
                    
                    {/* Empty space for the opposite side on desktop */}
                    <div className="hidden md:block w-[45%]" />
                    
                    {/* Center Connection Dot */}
                    <div className="absolute left-[30px] md:left-1/2 -translate-x-[calc(50%+30px)] md:-translate-x-1/2 w-4 h-4 rounded-full bg-[#050816] border-2 border-[#6C2BFF] hidden sm:block group-hover:bg-[#6C2BFF] group-hover:shadow-[0_0_15px_#6C2BFF] transition-all duration-500 z-10" />

                    {/* The Card */}
                    <div className="w-full sm:pl-16 md:pl-0 md:w-[45%] relative">
                      
                      {/* Oversized background number */}
                      <div className={`absolute -top-10 sm:-top-16 text-[8rem] sm:text-[10rem] font-black text-white/[0.02] group-hover:text-[#6C2BFF]/10 transition-colors duration-700 pointer-events-none select-none z-0 tracking-tighter ${isLeft ? '-left-6 sm:-left-12' : '-left-6 sm:-left-12 md:left-auto md:-right-12'}`}>
                        {idx + 1}
                      </div>

                      <div className="relative z-10 flex-1 bg-white/[0.03] border border-white/10 p-6 sm:p-8 rounded-[2rem] backdrop-blur-2xl hover:bg-white/[0.06] hover:border-[#6C2BFF]/40 transition-all duration-500 shadow-2xl hover:-translate-y-2">
                        <div className="flex flex-col gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C2BFF]/20 to-pink-500/10 border border-[#6C2BFF]/20 flex items-center justify-center text-[#A78BFA] font-black text-2xl group-hover:scale-110 group-hover:text-white transition-all duration-500 shadow-[0_0_10px_rgba(108,43,255,0.2)]">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-2xl sm:text-3xl leading-tight mb-4 group-hover:text-[#A78BFA] transition-colors duration-300">
                              {step.title}
                            </h4>
                            <p className="text-gray-400 text-base sm:text-lg leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

    </section>
  );
};

export default PremiumStorytellingSection;
