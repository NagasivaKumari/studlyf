import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import JudgeSidebar from '../../components/judge/JudgeSidebar';
import JudgeDashboard from '../institution-dashboard/judge/JudgeDashboard';

const JudgePortalLayout: React.FC = () => {
    return (
        <div className="h-screen bg-[#020617] flex overflow-hidden font-sans">
            {/* Dedicated Judge Sidebar */}
            <JudgeSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <Routes>
                    <Route index element={<JudgeDashboard />} />
                    <Route path="assignments" element={<div className="p-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-800 rounded-3xl m-8">Use evaluation links sent via email to review assigned projects</div>} />
                    <Route path="leaderboards" element={<div className="p-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-800 rounded-3xl m-8">Leaderboards coming soon</div>} />
                    <Route path="settings" element={<div className="p-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-800 rounded-3xl m-8">Settings coming soon</div>} />
                    <Route path="*" element={<Navigate to="/judge-portal" replace />} />
                </Routes>
            </div>
        </div>
    );
};

export default JudgePortalLayout;
