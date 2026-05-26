import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Zap, Crown, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentDiscounts: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#05050A] text-white pt-24 pb-20 px-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#6C2BFF]/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <Link to="/studhub" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to STUDHub
        </Link>

        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-[#6C2BFF]/20 text-[#A88CFF] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-[#6C2BFF]/30">
            <Gift className="w-4 h-4" /> Exclusive Offers
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C2BFF] to-[#EC4899]">Discounts</span></h1>
          <p className="text-xl text-gray-400 font-medium">Unlock premium software, tools, and subscriptions built for your growth, at a fraction of the cost.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'GitHub Pro', desc: 'Free access to GitHub Pro while you are a student.', icon: Zap },
            { name: 'Notion Plus', desc: 'Organize your entire life and studies for free.', icon: Crown },
            { name: 'Figma Edu', desc: 'Design without limits using Figma Education.', icon: Gift }
          ].map((item, idx) => (
            <motion.div key={idx} whileHover={{ y: -5 }} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-[#6C2BFF]/50 hover:bg-white/10 transition-all cursor-pointer group">
              <div className="w-14 h-14 bg-[#1A0B2E] border border-[#6C2BFF]/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <item.icon className="w-6 h-6 text-[#A88CFF]" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{item.name}</h3>
              <p className="text-gray-400 leading-relaxed mb-6">{item.desc}</p>
              <button className="text-[#A88CFF] font-bold text-sm flex items-center gap-2 group-hover:text-white transition-colors">
                Claim Offer &rarr;
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDiscounts;
