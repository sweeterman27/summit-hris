'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Activity, Zap, ShieldAlert, TrendingUp, Info, Loader2, Search, Filter } from 'lucide-react';

interface NeuroMetric {
  employeeNo: string;
  name: string;
  department: string;
  photo: string;
  healthScore: number;
  status: string;
  insight: string;
  metrics: {
    okrProgress: number;
    reliability: number;
  };
}

export default function NeuroAnalysis() {
  const [data, setData] = useState<NeuroMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/performance/analyze');
      const json = await res.json();
      if (json.success) setData(json.report);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const filtered = data.filter(item => 
    (selectedDept === 'All' || item.department === selectedDept) &&
    (item.name.toLowerCase().includes(filter.toLowerCase()) || item.status.toLowerCase().includes(filter.toLowerCase()))
  );

  const departments = ['All', ...new Set(data.map(d => d.department))];

  return (
    <div className="space-y-8">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
               <input 
                 type="text" 
                 placeholder="Search Identity or Status..." 
                 value={filter}
                 onChange={(e) => setFilter(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:border-brand-gold/50 outline-none transition-all"
               />
            </div>
            <div className="relative">
               <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
               <select 
                 value={selectedDept}
                 onChange={(e) => setSelectedDept(e.target.value)}
                 className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-10 py-3 text-sm text-white focus:border-brand-gold/50 outline-none transition-all appearance-none cursor-pointer"
               >
                 {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
               </select>
            </div>
         </div>
         <button onClick={fetchAnalysis} className="p-3 bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold rounded-2xl transition-all">
            <Activity size={20} />
         </button>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-6">
           <Loader2 className="animate-spin text-brand-gold" size={48} />
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Running Neuro-Diagnostic Sequence</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <AnimatePresence mode="popLayout">
              {filtered.map((item, idx) => (
                <motion.div 
                  key={item.employeeNo}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 hover:border-white/10 transition-all group relative overflow-hidden"
                >
                   {/* Background Glow based on health */}
                   <div className={`absolute -top-20 -right-20 w-40 h-40 blur-[80px] opacity-20 pointer-events-none rounded-full ${
                     item.healthScore > 80 ? 'bg-emerald-500' : 
                     item.healthScore > 50 ? 'bg-brand-gold' : 'bg-red-500'
                   }`} />

                   <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 overflow-hidden">
                            {item.photo ? (
                               <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                               <Brain className={item.healthScore > 80 ? 'text-emerald-400' : item.healthScore > 50 ? 'text-brand-gold' : 'text-red-400'} size={28} />
                            )}
                         </div>
                         <div>
                            <h3 className="text-xl font-bold text-white tracking-tighter">{item.name}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-0.5">{item.department} • {item.employeeNo}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${
                           item.healthScore > 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                           item.healthScore > 50 ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/20' : 
                           'bg-red-500/10 text-red-400 border-red-500/20'
                         }`}>
                            {item.status}
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="space-y-3">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Alignment</span>
                            <span className="text-[10px] font-black text-white">{item.metrics.okrProgress}%</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${item.metrics.okrProgress}%` }} className="h-full bg-brand-gold shadow-[0_0_10px_rgba(202,138,4,0.5)]" />
                         </div>
                      </div>
                      <div className="space-y-3">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Reliability</span>
                            <span className="text-[10px] font-black text-white">{item.metrics.reliability}%</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${item.metrics.reliability}%` }} className="h-full bg-white/40" />
                         </div>
                      </div>
                   </div>

                   <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-4">
                      <Zap size={18} className="text-brand-gold shrink-0 mt-0.5" />
                      <p className="text-xs text-white/60 leading-relaxed font-medium italic">"{item.insight}"</p>
                   </div>

                   {/* Footer Insight */}
                   <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2 text-white/20">
                         <Activity size={12} />
                         <span className="text-[8px] font-black uppercase tracking-widest">Neuro Score</span>
                      </div>
                      <div className="text-2xl font-black text-white tracking-tighter">
                         {item.healthScore}<span className="text-brand-gold text-xs">/100</span>
                      </div>
                   </div>
                </motion.div>
              ))}
           </AnimatePresence>
        </div>
      )}
    </div>
  );
}
