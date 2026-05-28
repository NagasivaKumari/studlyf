import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoadmapNodeData } from '../../data/roadmapData';
import { ExternalLink, X, CheckCircle } from 'lucide-react';

interface FocusPanelProps {
  node: RoadmapNodeData | null;
  isOpen: boolean;
  onClose: () => void;
  isCompleted: boolean;
  onToggleComplete: (id: string) => void;
}

const FocusPanel: React.FC<FocusPanelProps> = ({ 
  node, 
  isOpen, 
  onClose, 
  isCompleted, 
  onToggleComplete 
}) => {
  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && node && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[#0A0514]/40 backdrop-blur-sm"
          />

          {/* Slide-out Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-gray-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Execution Workspace</span>
              <button 
                onClick={onClose}
                className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 hover:scale-105 transition-all text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-black text-[#1A1A1A] mb-4 leading-tight">
                  {node.title}
                </h2>
              </div>

              {/* Simple Explanation */}
              <div className="bg-[#F8F9FA] p-6 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-black text-[#6C2BFF] uppercase tracking-[0.2em] block mb-3 flex items-center gap-2">
                  <span className="w-4 h-4 bg-[#6C2BFF]/10 rounded flex items-center justify-center text-[10px]">🧠</span> 
                  Simple Explanation
                </span>
                <p className="text-gray-700 font-medium leading-relaxed">
                  {node.simpleExplanation || (node as any).description}
                </p>
              </div>

              {/* Why This Matters */}
              {(node.whyItMatters || (node as any).description) && (
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-3">Why This Matters</span>
                  <p className="text-gray-600 font-medium leading-relaxed text-sm">
                    {node.whyItMatters || (node as any).description}
                  </p>
                </div>
              )}

              {/* Key Concepts */}
              {((node.keyConcepts?.length > 0) || ((node as any).executionSteps?.length > 0)) && (
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">What You Actually Need To Learn</span>
                  <ul className="space-y-3">
                    {(node.keyConcepts || (node as any).executionSteps || []).map((step: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#6C2BFF] mt-2" />
                        <span className="text-sm font-bold text-gray-800 leading-snug">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Curated Resources */}
              {((node.resources?.length > 0) || (node as any).docLink) && (
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Curated Learning Resources</span>
                  <div className="space-y-3">
                    {node.resources ? node.resources.map((res, idx) => {
                      const tagColors = {
                        "Best Starting Point": "bg-green-100 text-green-700 border-green-200",
                        "Official Docs": "bg-blue-100 text-blue-700 border-blue-200",
                        "Beginner Friendly": "bg-purple-100 text-purple-700 border-purple-200",
                        "Practice Resource": "bg-orange-100 text-orange-700 border-orange-200",
                        "Advanced Reading": "bg-red-100 text-red-700 border-red-200"
                      };
                      const colorClass = tagColors[res.type as keyof typeof tagColors] || "bg-gray-100 text-gray-700 border-gray-200";

                      return (
                        <a 
                          key={idx}
                          href={res.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 p-4 rounded-xl hover:border-[#6C2BFF] hover:shadow-[0_4px_20px_rgba(108,43,255,0.1)] transition-all group"
                        >
                          <span className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#6C2BFF] transition-colors line-clamp-1">
                            {res.title}
                          </span>
                          <div className="flex items-center gap-3 justify-between sm:justify-end">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${colorClass} whitespace-nowrap`}>
                              {res.type}
                            </span>
                            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-[#6C2BFF] transition-colors flex-shrink-0" />
                          </div>
                        </a>
                      );
                    }) : (
                      <a 
                        href={(node as any).docLink?.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-between bg-white border border-gray-200 p-4 rounded-xl hover:border-[#6C2BFF] hover:shadow-md transition-all group"
                      >
                        <span className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#6C2BFF] transition-colors">
                          {(node as any).docLink?.title}
                        </span>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#6C2BFF] transition-colors" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div className="p-6 border-t border-gray-100 bg-white">
              <button
                onClick={() => onToggleComplete(node.id)}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-black text-sm transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100' 
                    : 'bg-[#1A1A1A] text-white hover:bg-[#6C2BFF] shadow-lg hover:shadow-xl hover:-translate-y-1'
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle className="w-5 h-5" /> Completed
                  </>
                ) : (
                  'MARK AS COMPLETE'
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FocusPanel;
