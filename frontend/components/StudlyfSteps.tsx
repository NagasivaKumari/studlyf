import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    num: "1",
    title: "Create your free account...",
    desc: "Join the fastest-growing ecosystem for ambitious students in seconds, completely free."
  },
  {
    num: "2",
    title: "Discover your roadmap...",
    desc: "Follow highly structured, step-by-step career paths designed to take you from beginner to pro."
  },
  {
    num: "3",
    title: "Unlock the StudHub...",
    desc: "Access verified scholarships, premium software discounts, and exclusive student leverage."
  },
  {
    num: "4",
    title: "Execute and grow...",
    desc: "Start building your portfolio, learning new skills, and connecting with a driven community."
  }
];

const StudlyfSteps: React.FC = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Subtle background glow similar to the image */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-50/40 via-[#6C2BFF]/5 to-pink-50/40 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-8 items-center">
          
          {/* Left Side Copy */}
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] mb-8 leading-tight">
              What <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C2BFF] to-[#EC4899]">STUDLYF</span> provides you
            </h2>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed font-medium">
              STUDLYF transforms your career journey by bringing all the essential tools, roadmaps, and opportunities into one premium ecosystem. The key is our highly structured approach to student growth: combining actionable guidance with real-world leverage to elevate you seamlessly.
            </p>
            <p className="text-[#1A1A1A] font-bold text-lg">
              Get started right away in just four simple steps:
            </p>
          </div>

          {/* Right Side Steps */}
          <div className="relative pt-10 pb-10 pl-4 md:pl-20">
            {/* Dashed Connecting Line */}
            <div className="absolute left-[30px] md:left-[110px] top-[10%] bottom-[10%] w-[150px] pointer-events-none hidden md:block">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 1000">
                <path 
                  d="M 10 0 C 80 150 -50 300 10 500 C 80 750 -50 900 10 1000" 
                  fill="none" 
                  stroke="#D8B4FE" 
                  strokeWidth="3" 
                  strokeDasharray="12 12"
                  className="opacity-50"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            <div className="space-y-16">
              {steps.map((step, index) => {
                const isEven = index % 2 !== 0; // 0 is odd logically, index 1 is visual even (right side)
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    key={index} 
                    className={`relative flex ${isEven ? 'md:ml-32' : ''}`}
                  >
                    {/* Giant Number Behind */}
                    <div className="absolute -left-8 md:-left-20 -top-12 md:-top-16 text-[120px] md:text-[180px] font-black text-[#1A1A1A] leading-none select-none z-0 tracking-tighter">
                      {step.num}
                    </div>
                    
                    {/* Content Card */}
                    <div className="relative z-10 bg-white rounded-3xl p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100 max-w-[320px] ml-16 md:ml-20 hover:-translate-y-2 transition-transform duration-300">
                      <h3 className="text-xl md:text-[22px] font-bold text-[#1A1A1A] mb-3 leading-snug">
                        {step.title}
                      </h3>
                      <p className="text-gray-500 font-medium text-sm md:text-base leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default StudlyfSteps;
