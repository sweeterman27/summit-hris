'use client';

import React from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { AlertTriangle, User, TrendingUp, Clock, ChevronRight, Activity } from 'lucide-react';
import Skeleton from './Skeleton';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function RiskIntelligence() {
  const { data, isLoading } = useSWR('/api/performance/analyze', fetcher);
  const report = data?.report || [];

  const highRisk = report.filter((r: any) => r.healthScore < 50);

  if (isLoading) {
    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 backdrop-blur-xl">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (report.length === 0) return null;

  return (
    <div className="bg-[#0f0d04] border border-red-500/10 rounded-[3rem] p-10 relative overflow-hidden group shadow-deep">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 shadow-lg border border-red-500/20">
              <Activity size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-400">Risk Intelligence</span>
              <p className="text-white/20 text-[9px] font-black uppercase tracking-widest mt-1">Personnel Anomaly Detection active</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Active Alerts</p>
              <p className="text-2xl font-black text-white">{highRisk.length}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-right">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">System Health</p>
              <p className="text-2xl font-black text-emerald-400">Stable</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {highRisk.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
               <Activity size={32} className="text-white/5 mb-4" />
               <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Zero high-risk anomalies detected in current cycle</p>
            </div>
          ) : (
            highRisk.map((emp: any, i: number) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={emp.employeeNo}
                className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.06] hover:border-red-400/20 transition-all group/card relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/20 overflow-hidden border border-white/10">
                      <User size={24} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm tracking-tight">{emp.name}</h4>
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{emp.department}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 text-red-400 font-black text-[10px] uppercase tracking-widest bg-red-400/10 px-3 py-1 rounded-full border border-red-400/20 shadow-lg">
                      <AlertTriangle size={12} />
                      {emp.status}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={12} className="text-brand-gold/60" />
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">OKR Progress</span>
                    </div>
                    <p className="text-xl font-black text-white tracking-tighter">{emp.metrics.okrProgress}%</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={12} className="text-brand-gold/60" />
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Reliability</span>
                    </div>
                    <p className="text-xl font-black text-white tracking-tighter">{emp.metrics.reliability}%</p>
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Neuro Intelligence Insight</span>
                    <span className="text-[10px] font-black text-red-400 tracking-tighter">{emp.healthScore}/100</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${emp.healthScore}%` }}
                      className={`h-full ${emp.healthScore < 40 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-brand-gold shadow-[0_0_10px_rgba(201,162,54,0.5)]'}`}
                    />
                  </div>
                  <p className="text-[10px] text-white/40 leading-relaxed italic line-clamp-2">
                    "{emp.insight}"
                  </p>
                </div>

                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/[0.02] blur-[50px] rounded-full pointer-events-none" />
                
                <button className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 opacity-0 group-hover/card:opacity-100 transition-all translate-x-4 group-hover/card:translate-x-0">
                  <ChevronRight size={18} />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.02] to-transparent pointer-events-none" />
    </div>
  );
}
