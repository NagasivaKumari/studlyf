import React, { Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Bot, Sparkles } from 'lucide-react';
import Scene from '@/components/HashTableVisualizer/Scene';
import ControlPanel from '@/components/HashTableVisualizer/ControlPanel';
import OperationLog from '@/components/ArrayVisualizer/OperationLog';
import { useHashTableOperations } from '@/components/HashTableVisualizer/useHashTableOperations';

const HashTablePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { questionTitle, companyId } = (location.state as any) || {};
  const { buckets, logs, createTable, insert, deleteKey, search, clear } = useHashTableOperations();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090B1A]">
      <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>

        {questionTitle && (
          <div className="flex items-center gap-3 px-6 py-2 bg-[#7C3AED]/10 backdrop-blur-md border border-[#7C3AED]/20 rounded-xl">
            <Bot className="w-4 h-4 text-[#7C3AED]" />
            <div>
              <span className="text-[8px] font-black text-[#7C3AED] uppercase block tracking-widest">Active Context</span>
              <h1 className="text-white text-[11px] font-bold uppercase tracking-wider">{questionTitle}</h1>
            </div>
            <div className="ml-4 pl-4 border-l border-[#7C3AED]/20">
              <span className="text-[8px] font-black text-white/30 uppercase block tracking-widest">Protocol</span>
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Hash Table Visualizer</span>
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={<div className="flex items-center justify-center h-full text-white/70">Loading 3D scene...</div>}>
        <Scene buckets={buckets} />
      </Suspense>
      
      <div className="absolute top-24 left-6 z-10">
        <ControlPanel onCreateTable={createTable} onInsert={insert} onDelete={deleteKey} onSearch={search} onClear={clear} />
      </div>
      
      <div className="absolute top-24 right-6 z-10">
        <OperationLog logs={logs} />
      </div>

      {questionTitle && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-4">
          <Sparkles className="w-5 h-5 text-[#7C3AED]" />
          <p className="text-white/70 text-sm font-medium">Use the controls to simulate the <span className="text-white font-bold">"{questionTitle}"</span> logic in 3D.</p>
        </div>
      )}
    </div>
  );
};

export default HashTablePage;
