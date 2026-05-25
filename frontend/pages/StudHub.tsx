import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, BrainCircuit, Gift, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudHub: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#05050A] text-white pt-24 pb-32 font-sans selection:bg-[#6C2BFF]/30">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section 1 -> CEO Video */}
        <div className="mb-24 relative mt-8">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-[#6C2BFF]/20 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="text-center mb-10 relative z-10">
            <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter">Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C2BFF] to-[#EC4899]">STUDHub</span></h1>
            <p className="text-xl text-gray-400 font-medium">The central nervous system for your student growth.</p>
          </div>

          <div className="relative w-full max-w-4xl mx-auto rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(108,43,255,0.15)] group cursor-pointer bg-black aspect-video flex items-center justify-center">
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1200" 
              alt="CEO Message" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                <PlayCircle className="w-10 h-10 text-white fill-white/20" />
              </div>
              <p className="mt-6 font-bold text-lg tracking-widest uppercase text-white/90">What is STUDHub?</p>
              <p className="text-sm text-gray-400 mt-2">A message from our Founder</p>
            </div>
          </div>
        </div>

        {/* Section 2 -> 3 Large Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <motion.div 
            whileHover={{ y: -10 }}
            onClick={() => navigate('/ai-tools')}
            className="group relative h-[400px] rounded-[2rem] overflow-hidden border border-white/10 cursor-pointer shadow-lg hover:shadow-[0_20px_60px_rgba(108,43,255,0.2)] transition-all duration-500"
          >
            <img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=600" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000" alt="AI Tools" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <div className="w-12 h-12 bg-[#6C2BFF]/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-[#6C2BFF]/30 mb-6">
                <BrainCircuit className="w-6 h-6 text-[#A88CFF]" />
              </div>
              <h2 className="text-4xl font-black text-white mb-3 tracking-tight">AI Tools</h2>
              <p className="text-gray-300 text-lg font-medium">Master the tools defining the future.</p>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            whileHover={{ y: -10 }}
            onClick={() => navigate('/student-discounts')}
            className="group relative h-[400px] rounded-[2rem] overflow-hidden border border-white/10 cursor-pointer shadow-lg hover:shadow-[0_20px_60px_rgba(236,72,153,0.2)] transition-all duration-500"
          >
            <img src="https://images.unsplash.com/photo-1607083206968-13611e3d76ba?auto=format&fit=crop&q=80&w=600" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000" alt="Discounts" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <div className="w-12 h-12 bg-[#EC4899]/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-[#EC4899]/30 mb-6">
                <Gift className="w-6 h-6 text-[#F472B6]" />
              </div>
              <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Student Discounts</h2>
              <p className="text-gray-300 text-lg font-medium">Premium tools, student prices.</p>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            whileHover={{ y: -10 }}
            onClick={() => navigate('/student-schemes')}
            className="group relative h-[400px] rounded-[2rem] overflow-hidden border border-white/10 cursor-pointer shadow-lg hover:shadow-[0_20px_60px_rgba(59,130,246,0.2)] transition-all duration-500"
          >
            <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000" alt="Schemes" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-blue-500/30 mb-6">
                <Landmark className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Student Schemes</h2>
              <p className="text-gray-300 text-lg font-medium">Grants, scholarships, and funding.</p>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default StudHub;
