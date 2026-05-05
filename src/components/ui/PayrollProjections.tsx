'use client';

import React from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, PieChart, ArrowUpRight, Wallet } from 'lucide-react';
import Skeleton from './Skeleton';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PayrollProjections() {
  const { data, isLoading } = useSWR('/api/finance/stats', fetcher);

  if (isLoading) {
    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 backdrop-blur-xl">
        <Skeleton className="h-6 w-48 mb-8" />
        <div className="grid grid-cols-2 gap-8">
           <Skeleton className="h-32 rounded-3xl" />
           <Skeleton className="h-32 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!data?.success) return null;

  const { totalProjected, departmentBreakdown, month, projections } = data;

  return (
    <div className="bg-[#0c0b05] border border-brand-gold/10 rounded-[3rem] p-10 relative overflow-hidden group shadow-deep">
      {/* Background Mesh Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/[0.03] to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold shadow-lg border border-brand-gold/20">
              <Wallet size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-gold">Financial Intelligence</span>
              <p className="text-white/20 text-[9px] font-black uppercase tracking-widest mt-1">Real-time {month} Payroll Projection</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
             <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active Ledger</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Projection Card */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden">
               <span className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4 block">Total Workforce Liability</span>
               <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-black text-white tracking-tighter">₱{totalProjected.toLocaleString()}</span>
                 <span className="text-xs font-bold text-brand-gold/40">PHP</span>
               </div>
               <div className="mt-6 flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                 <ArrowUpRight size={14} />
                 <span>Calculated from active Chronicle logs</span>
               </div>
               <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-gold/[0.02] blur-3xl rounded-full" />
            </div>

            <div className="space-y-4">
               <span className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-2">Departmental Distribution</span>
               <div className="space-y-3">
                 {Object.entries(departmentBreakdown).map(([dept, amount]: any, i) => (
                   <div key={dept} className="space-y-1.5">
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-bold text-white/60">{dept}</span>
                        <span className="text-[10px] font-black text-white">₱{amount.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(amount / totalProjected) * 100}%` }}
                          className="h-full bg-brand-gold shadow-[0_0_10px_rgba(201,162,54,0.3)]"
                        />
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Top Earners / Payout Registry */}
          <div className="lg:col-span-7">
             <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
                <div className="px-8 py-5 border-b border-white/5 bg-white/[0.02]">
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Top Deployment Projections</span>
                </div>
                <div className="divide-y divide-white/5">
                   {projections.map((p: any, i: number) => (
                     <div key={p.employeeNo} className="px-8 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black text-white/20 group-hover:text-brand-gold transition-colors border border-white/5">
                             {i + 1}
                           </div>
                           <div>
                              <p className="text-sm font-bold text-white group-hover:text-glow transition-all">{p.name}</p>
                              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{p.daysWorked} days deployed</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-black text-white tracking-tight">₱{p.projectedEarnings.toLocaleString()}</p>
                           <p className="text-[8px] font-black text-brand-gold/40 uppercase tracking-widest">Est. Payout</p>
                        </div>
                     </div>
                   ))}
                </div>
                <div className="p-6 bg-white/[0.01] text-center">
                   <a href="/finance" className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10 hover:text-brand-gold transition-colors">
                     Access Full Financial Ledger
                   </a>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-brand-gold/[0.02] blur-[100px] rounded-full pointer-events-none" />
    </div>
  );
}
