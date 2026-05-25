import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Landmark, Rocket, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentSchemes: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#05050A] text-white pt-24 pb-20 px-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#EC4899]/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <Link to="/studhub" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to STUDHub
        </Link>

        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-[#EC4899]/20 text-[#F472B6] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-[#EC4899]/30">
            <Landmark className="w-4 h-4" /> Government & Grants
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EC4899] to-[#6C2BFF]">Schemes</span></h1>
          <p className="text-xl text-gray-400 font-medium">Discover fellowships, government grants, and scholarships tailored to fund your education and startup ideas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: 'National Scholarship Portal', desc: 'Centralized platform for state and national level scholarships.', icon: GraduationCap },
            { name: 'Startup India Seed Fund', desc: 'Financial assistance for early-stage student startups.', icon: Rocket },
            { name: 'Prime Minister Research Fellowship', desc: 'For students pursuing research in top institutions.', icon: Landmark },
            { name: 'AICTE Internships', desc: 'Government verified internships for technical students.', icon: GraduationCap }
          ].map((item, idx) => (
            <motion.div key={idx} whileHover={{ y: -5 }} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-[#EC4899]/50 hover:bg-white/10 transition-all cursor-pointer group">
              <div className="w-14 h-14 bg-[#2A0A18] border border-[#EC4899]/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <item.icon className="w-6 h-6 text-[#F472B6]" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{item.name}</h3>
              <p className="text-gray-400 leading-relaxed mb-6">{item.desc}</p>
              <button className="text-[#F472B6] font-bold text-sm flex items-center gap-2 group-hover:text-white transition-colors">
                Explore Scheme &rarr;
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentSchemes;
