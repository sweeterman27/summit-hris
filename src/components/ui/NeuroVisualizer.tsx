'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, TrendingUp, Zap, AlertTriangle, ShieldCheck, Target, BrainCircuit } from 'lucide-react';

interface NeuroVisualizerProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
}

export default function NeuroVisualizer({ isOpen, onClose, data }: NeuroVisualizerProps) {
  if (!data) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-obsidian/90 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-5xl h-[85vh] bg-[#0c0b05] border border-brand-gold/20 rounded-[3.5rem] shadow-[0_0_100px_rgba(201,162,54,0.15)] relative overflow-hidden z-10 flex flex-col"
          >
            {/* Ambient Kinetic Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent animate-pulse" />
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
            </div>

            {/* Header */}
            <div className="p-12 pb-6 relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold shadow-[0_0_30px_rgba(201,162,54,0.2)]">
                  <BrainCircuit size={32} strokeWidth={1.5} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Neuro-Intelligence Visualizer</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="h-[1px] w-12 bg-brand-gold/40" />
                    <p className="text-brand-gold/60 text-[10px] font-black uppercase tracking-[0.4em]">Real-time Personnel proficiency matrix</p>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all">
                <X size={24} />
              </button>
            </div>

            {/* Content Registry */}
            <div className="flex-1 overflow-y-auto px-12 pb-12 custom-scrollbar relative z-10">
              <div className="grid grid-cols-12 gap-8">
                {data.map((emp, i) => (
                  <motion.div 
                    key={emp.employeeNo}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="col-span-12 lg:col-span-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 hover:border-brand-gold/30 transition-all group relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-8 relative z-10">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white/20 text-lg">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white tracking-tight group-hover:text-glow transition-all">{emp.name}</h3>
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{emp.department} • {emp.employeeNo}</p>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 ${
                        emp.status === 'Elite Performer' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10' :
                        emp.status === 'Burnout Warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10' :
                        emp.status === 'Engagement Drop' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10' :
                        'bg-brand-gold/10 text-brand-gold border-brand-gold/20 shadow-brand-gold/10'
                      }`}>
                        <Zap size={12} fill="currentColor" />
                        {emp.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">OKR Proficiency</span>
                          <span className="text-sm font-black text-white">{emp.metrics.okrProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${emp.metrics.okrProgress}%` }}
                            className="h-full bg-brand-gold shadow-[0_0_15px_rgba(201,162,54,0.4)]"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Attendance Pulse</span>
                          <span className="text-sm font-black text-white">{emp.metrics.reliability}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${emp.metrics.reliability}%` }}
                            className="h-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5 relative z-10 group-hover:bg-brand-gold/[0.02] transition-all">
                       <div className="flex items-center gap-3 mb-3">
                         <Activity size={14} className="text-brand-gold" />
                         <span className="text-[9px] font-black text-brand-gold/60 uppercase tracking-[0.3em]">AI Insight Matrix</span>
                       </div>
                       <p className="text-xs text-white/40 leading-relaxed font-medium italic">
                         "{emp.insight}"
                       </p>
                    </div>

                    {/* Neuro Score Indicator */}
                    <div className="absolute bottom-6 right-8 text-right flex flex-col items-end opacity-20 group-hover:opacity-100 transition-all">
                       <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Health Index</span>
                       <span className={`text-3xl font-black tracking-tighter ${
                         emp.healthScore > 80 ? 'text-emerald-400' : 
                         emp.healthScore > 50 ? 'text-brand-gold' : 
                         'text-rose-500'
                       }`}>
                         {emp.healthScore}
                       </span>
                    </div>

                    <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-brand-gold/[0.03] blur-3xl rounded-full pointer-events-none" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer Stats */}
            <div className="p-10 border-t border-white/5 bg-[#0c0b05] relative z-20 flex items-center justify-between">
              <div className="flex items-center gap-12">
                 <div className="flex flex-col">
                   <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">System Entropy</span>
                   <span className="text-xl font-black text-emerald-400 tracking-tighter">0.024 Hz</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Neural Nodes Active</span>
                   <span className="text-xl font-black text-white tracking-tighter">{data.length}</span>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="h-10 px-6 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                    <ShieldCheck size={14} className="text-brand-gold" />
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Protocol: Summit-91W</span>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
