
import React, { useState } from 'react';
import { 
    Plus, 
    Trash2, 
    GripVertical, 
    Settings2, 
    Clock, 
    ChevronDown, 
    ChevronUp,
    FileText,
    Gavel,
    Trophy,
    UserCheck,
    CheckCircle2,
    Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FieldBuilder from './FieldBuilder';
import JudgeAssignment from './JudgeAssignment';
import { IStage } from '../../../types/event';

interface StageBuilderProps {
    stages: IStage[];
    onUpdate: (stages: IStage[]) => void;
    onConfigureQuiz?: (stageId: string) => void;
    availableJudges?: any[];
}

const STAGE_TYPES = [
    { id: 'REGISTRATION', label: 'Registration', icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'TEAM_FORMATION', label: 'Team Formation', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'QUIZ', label: 'Quiz', icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'SUBMISSION', label: 'Submission', icon: Plus, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'REVIEW', label: 'Review', icon: Gavel, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'FINAL', label: 'Final', icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'CUSTOM', label: 'Custom', icon: Settings2, color: 'text-slate-500', bg: 'bg-slate-50' },
];

const normalizeStageTypeId = (rawType: string | undefined) => {
    const cleaned = String(rawType || '').trim();
    if (!cleaned) return 'CUSTOM';
    const normalized = cleaned.replace(/\s+/g, '_').toUpperCase();
    const known = new Set(STAGE_TYPES.map((t) => t.id));
    return known.has(normalized) ? normalized : 'CUSTOM';
};

const getStageMeta = (rawType: string | undefined) => {
    const normalized = normalizeStageTypeId(rawType);
    return STAGE_TYPES.find((t) => t.id === normalized) || STAGE_TYPES[STAGE_TYPES.length - 1];
};

const StageBuilder: React.FC<StageBuilderProps> = ({ stages, onUpdate, onConfigureQuiz, availableJudges = [] }) => {
    const [expandedStage, setExpandedStage] = useState<string | null>(null);

    const computeStatus = (startDate?: string, endDate?: string): IStage['status'] => {
        const now = new Date();
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (end && end.getHours() === 0 && end.getMinutes() === 0 && !String(endDate).includes('T')) {
            end.setHours(23, 59, 59, 999);
        }

        if (start && now < start) return 'Upcoming';
        if (end && now > end) return 'Completed';
        return 'Active';
    };

    const calculateStatus = (startDate: string, endDate: string): IStage['status'] => {
        return computeStatus(startDate, endDate);
    };

    const addStage = () => {
        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const newStage: IStage = {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
            name: 'New Stage',
            type: 'SUBMISSION',
            start_date: startDate,
            end_date: endDate,
            status: computeStatus(startDate, endDate),
            visibility: 'Public',
            roundMode: 'Online',
            description: 'Submit your project / abstract',
        };
        onUpdate([...stages, newStage]);
        setExpandedStage(newStage.id);
    };

    const removeStage = (id: string) => {
        onUpdate(stages.filter(s => s.id !== id));
    };

    const updateStage = (id: string, updates: Partial<IStage>) => {
        onUpdate(stages.map(s => {
            if (s.id === id) {
                const updated = { ...s, ...updates };
                // Recalculate status if dates changed
                if (updates.start_date || updates.end_date) {
                    updated.status = calculateStatus(
                        updates.start_date || s.start_date,
                        updates.end_date || s.end_date
                    );
                }
                // If type changed away from REVIEW, clear stale judgeIds
                if (updates.type && updates.type !== s.type && updates.type !== 'REVIEW') {
                    updated.config = { ...(updated.config || {}) };
                    delete updated.config.judgeIds;
                }
                return updated;
            }
            return s;
        }));
    };

    const moveStage = (index: number, direction: 'up' | 'down') => {
        const newStages = [...stages];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < stages.length) {
            [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];
            onUpdate(newStages);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Event Stage Engine</h3>
                    <p className="text-sm text-slate-500">Configure your competition lifecycle and rules per stage</p>
                </div>
                <button 
                    onClick={addStage}
                    className="flex items-center gap-2 bg-[#6C3BFF] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-100 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <Plus size={18} />
                    Add Stage
                </button>
            </div>

            <div className="space-y-4">
                {stages.length === 0 ? (
                    <div className="p-12 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                        <Settings2 size={48} className="mb-4 opacity-20" />
                        <p className="font-bold">No stages configured yet</p>
                        <p className="text-xs mt-1">Start by adding a Registration or Submission stage</p>
                    </div>
                ) : (
                    stages.map((stage, index) => {
                        const stageTypeId = normalizeStageTypeId(stage.type);
                        const stageMeta = getStageMeta(stage.type);
                        const showStageBrief = stageTypeId !== 'REGISTRATION' && stageTypeId !== 'TEAM_FORMATION';
                        const showFieldBuilder = stageTypeId === 'SUBMISSION';
                        return (
                        <div 
                            key={stage.id}
                            className={`bg-white border rounded-3xl transition-all ${expandedStage === stage.id ? 'border-[#6C3BFF] shadow-xl shadow-purple-50 ring-1 ring-purple-100' : 'border-slate-100 shadow-sm'}`}
                        >
                            {/* Header */}
                            <div 
                                className="p-5 flex items-center gap-4 cursor-pointer"
                                onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                            >
                                <div className="p-2 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                                    <GripVertical size={20} />
                                </div>

                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stageMeta?.bg || 'bg-slate-50'}`}>
                                    {React.createElement(stageMeta?.icon || Settings2, {
                                        size: 20,
                                        className: stageMeta?.color || 'text-slate-500'
                                    })}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-900">{stage.name}</h4>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            computeStatus(stage.start_date, stage.end_date) === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {computeStatus(stage.start_date, stage.end_date)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                            <Clock size={12} />
                                            {stage.start_date} — {stage.end_date}
                                        </span>
                                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                            <CheckCircle2 size={12} />
                                            {stageMeta?.label || stage.type}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col gap-1">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); moveStage(index, 'up'); }}
                                            disabled={index === 0}
                                            className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                                        >
                                            <ChevronUp size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); moveStage(index, 'down'); }}
                                            disabled={index === stages.length - 1}
                                            className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                                        >
                                            <ChevronDown size={14} />
                                        </button>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); removeStage(stage.id); }}
                                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Details Panel */}
                            <AnimatePresence>
                                {expandedStage === stage.id && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-8 border-t border-slate-50 bg-slate-50/30 grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stage Name</label>
                                                <input 
                                                    type="text" 
                                                    value={stage.name}
                                                    onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-100 outline-none font-bold text-slate-900"
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stage Type</label>
                                                <select 
                                                    value={stageTypeId}
                                                    onChange={(e) => updateStage(stage.id, { type: e.target.value as any })}
                                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-100 outline-none font-bold text-slate-900"
                                                >
                                                    {STAGE_TYPES.map(t => (
                                                        <option key={t.id} value={t.id}>{t.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Round Mode</label>
                                                <select
                                                    value={stage.roundMode || 'Online'}
                                                    onChange={(e) => updateStage(stage.id, { roundMode: e.target.value as any })}
                                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-100 outline-none font-bold text-slate-900"
                                                >
                                                    <option value="Online">Online</option>
                                                    <option value="Offline">Offline</option>
                                                    <option value="Hybrid">Hybrid</option>
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                                                    <input 
                                                        type="date" 
                                                        value={stage.start_date}
                                                        onChange={(e) => updateStage(stage.id, { start_date: e.target.value })}
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                                                    <input 
                                                        type="date" 
                                                        value={stage.end_date}
                                                        onChange={(e) => updateStage(stage.id, { end_date: e.target.value })}
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visibility</label>
                                                <div className="flex gap-2">
                                                    {['Public', 'Private', 'Shortlisted Only'].map((v) => (
                                                        <button 
                                                            key={v}
                                                            onClick={() => updateStage(stage.id, { visibility: v as any })}
                                                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all border ${
                                                                stage.visibility === v ? 'bg-[#6C3BFF] text-white border-[#6C3BFF]' : 'bg-white text-slate-400 border-slate-200'
                                                            }`}
                                                        >
                                                            {v}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {showStageBrief && (
                                                <div className="md:col-span-2 p-8 bg-emerald-50/30 rounded-[2rem] border border-emerald-100/50">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                                            <Plus size={20} />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">Stage Instructions</h5>
                                                            <p className="text-[10px] text-slate-500 font-medium">Add clear instructions that participants will see in the UI for this stage</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 mb-6">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stage instructions</label>
                                                        <textarea
                                                            value={stage.description || ''}
                                                            onChange={(e) => updateStage(stage.id, { description: e.target.value })}
                                                            placeholder={
                                                                stageTypeId === 'SUBMISSION'
                                                                    ? 'Tell participants exactly what to submit, expected format, and any rules.'
                                                                    : 'Tell participants what they should know, do, or follow for this stage.'
                                                            }
                                                            className="w-full min-h-28 px-5 py-4 bg-white border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-200 outline-none font-medium text-slate-700"
                                                        />
                                                    </div>

                                                    {showFieldBuilder ? (
                                                        <FieldBuilder 
                                                            fields={stage.config?.fields || []} 
                                                            onUpdate={(newFields) => updateStage(stage.id, { 
                                                                config: { ...(stage.config || {}), fields: newFields } 
                                                            })} 
                                                        />
                                                    ) : (
                                                        <div className="p-4 bg-white border border-emerald-100 rounded-2xl text-xs text-slate-500 font-medium">
                                                            This stage uses the instruction box only. Student-input fields are available for submission stages.
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {stageTypeId === 'REVIEW' && (
                                                <div className="md:col-span-2 p-8 bg-purple-50/30 rounded-[2rem] border border-purple-100/50">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                                            <Gavel size={20} />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">Judge Assignment & Rubric</h5>
                                                            <p className="text-[10px] text-slate-500 font-medium">Select experts to evaluate submissions for this stage</p>
                                                        </div>
                                                    </div>

                                                    <JudgeAssignment 
                                                        assignedJudgeIds={stage.config?.judgeIds || []}
                                                        onUpdate={(newJudgeIds) => updateStage(stage.id, {
                                                            config: { ...(stage.config || {}), judgeIds: newJudgeIds }
                                                        })}
                                                        availableJudges={availableJudges}
                                                    />
                                                </div>
                                            )}

                                            {stageTypeId === 'QUIZ' ? (
                                                <div className="md:col-span-2 p-8 bg-amber-50/30 rounded-[2rem] border border-amber-100/50 space-y-4">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div>
                                                            <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                                                Assessment settings
                                                            </h5>
                                                            <p className="text-[10px] text-slate-500 font-medium">
                                                                Attach a single-choice/coding assessment and set pass mark.
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => onConfigureQuiz?.(stage.id)}
                                                            className="px-5 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#6C3BFF] transition-all"
                                                        >
                                                            Configure questions
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pass mark (%)</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={100}
                                                                value={stage.config?.pass_mark ?? 70}
                                                                onChange={(e) =>
                                                                    updateStage(stage.id, {
                                                                        config: { ...(stage.config || {}), pass_mark: Number(e.target.value) },
                                                                    })
                                                                }
                                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Linked quiz</label>
                                                            <div className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold">
                                                                {stage.config?.quiz_id ? String(stage.config.quiz_id) : 'Not configured'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                    })
                )}
            </div>
        </div>
    );
};

export default StageBuilder;
