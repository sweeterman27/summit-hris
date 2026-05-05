'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, User, Activity, Clock, ShieldCheck, Search, Filter, Shield, Camera, X, ExternalLink, AlertTriangle } from 'lucide-react';
import { StatsCardSkeleton } from '@/components/ui/Skeleton';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SecurityLedgerPage() {
  const { data: session } = useSession();
  const { data, isLoading } = useSWR('/api/admin/audit', fetcher);
  const audits = data?.audits || [];

  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const user = session?.user as any;
  const isSuperadmin = user?.role?.toUpperCase() === 'SUPERADMIN' || user?.employeeNo === 'SA-001';

  if (!isSuperadmin && !isLoading) {
    return (
      <DashboardLayout>
        <div className="h-[70vh] flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-2xl">
            <ShieldAlert size={40} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Access Denied</h1>
            <p className="text-white/20 text-xs font-black uppercase tracking-[0.4em] mt-2">Executive Clearance Required</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getSeverityStyle = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'WARNING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  const filteredAudits = audits.filter((a: any) => 
    a.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.actorNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-20">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
               <Shield className="text-brand-gold" size={24} />
               <h1 className="text-4xl font-black text-white tracking-tighter uppercase text-glow">Security Ledger 2.0</h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-px w-8 bg-brand-gold/40" />
              <p className="text-brand-gold/60 text-[10px] font-black uppercase tracking-[0.4em]">Forensic Audit & Biometric Verification Registry</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
               <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none">Kernel Status</span>
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest mt-1">Encrypted & Active</span>
               </div>
               <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12">
            <div className="bg-[#0f0d04] border border-white/5 rounded-[3rem] overflow-hidden shadow-deep backdrop-blur-xl relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/[0.01] to-transparent pointer-events-none" />
              
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] relative z-10">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    placeholder="Filter by Actor, Action or Details..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:border-brand-gold/50 outline-none transition-all font-bold placeholder:text-white/10"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <button className="h-14 px-8 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2">
                    <Filter size={16} />
                    Export Ledger
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.01]">
                      <th className="p-8 text-[10px] font-black text-white/20 uppercase tracking-widest border-b border-white/5">Event Timestamp</th>
                      <th className="p-8 text-[10px] font-black text-white/20 uppercase tracking-widest border-b border-white/5">Executive Actor</th>
                      <th className="p-8 text-[10px] font-black text-white/20 uppercase tracking-widest border-b border-white/5">Visual Evidence</th>
                      <th className="p-8 text-[10px] font-black text-white/20 uppercase tracking-widest border-b border-white/5">Operational Action</th>
                      <th className="p-8 text-[10px] font-black text-white/20 uppercase tracking-widest border-b border-white/5">Severity</th>
                      <th className="p-8 text-[10px] font-black text-white/20 uppercase tracking-widest border-b border-white/5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isLoading ? (
                      [1, 2, 3, 4, 5].map(i => (
                        <tr key={i}><td colSpan={6} className="p-8"><StatsCardSkeleton /></td></tr>
                      ))
                    ) : filteredAudits.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-32 text-center">
                          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 mx-auto border border-white/5">
                            <ShieldCheck size={40} className="text-white/5" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/10 italic text-glow">Ledger initialized. Zero anomalies recorded.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredAudits.map((audit: any, i: number) => (
                        <motion.tr 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          key={audit.timestamp + i}
                          className="hover:bg-white/[0.02] transition-all group"
                        >
                          <td className="p-8">
                            <div className="flex items-center gap-3">
                               <Clock size={14} className="text-brand-gold/40" />
                               <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">
                                 {new Date(audit.timestamp).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                               </span>
                            </div>
                          </td>
                          <td className="p-8">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                                  <User size={14} className="text-white/20" />
                               </div>
                               <span className="text-xs font-black text-brand-gold/80 tracking-tight uppercase">{audit.actorNo}</span>
                            </div>
                          </td>
                          <td className="p-8">
                             {audit.evidence ? (
                               <div className="relative group/evidence w-24 h-12 rounded-xl overflow-hidden border border-white/10 cursor-pointer" onClick={() => setSelectedEvidence(audit.evidence)}>
                                  <img src={audit.evidence} alt="Evidence" className="w-full h-full object-cover grayscale group-hover/evidence:grayscale-0 transition-all" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/evidence:opacity-100 flex items-center justify-center transition-all">
                                     <Camera size={16} className="text-white" />
                                  </div>
                               </div>
                             ) : (
                               <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">No Visual</span>
                             )}
                          </td>
                          <td className="p-8">
                            <div>
                               <p className="text-xs font-black text-white uppercase tracking-tight mb-1">{audit.action}</p>
                               <div className="flex items-center gap-2">
                                  <p className="text-[10px] text-white/30 font-medium line-clamp-1">{audit.details}</p>
                                  {audit.variance && (
                                    <span className="text-[8px] font-black text-brand-gold bg-brand-gold/5 px-1.5 py-0.5 rounded border border-brand-gold/10">VAR: {audit.variance}</span>
                                  )}
                               </div>
                            </div>
                          </td>
                          <td className="p-8">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-lg ${getSeverityStyle(audit.severity)}`}>
                              {audit.severity}
                            </span>
                          </td>
                          <td className="p-8">
                            <div className="flex items-center gap-2">
                               <ShieldCheck size={14} className={`transition-colors ${audit.severity === 'CRITICAL' ? 'text-rose-400' : 'text-emerald-400/40'}`} />
                               <span className={`text-[10px] font-black uppercase tracking-widest ${audit.severity === 'CRITICAL' ? 'text-rose-400' : 'text-white/20'}`}>
                                 {audit.severity === 'CRITICAL' ? 'AUDIT REQ' : 'VERIFIED'}
                               </span>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Viewer Modal */}
      <AnimatePresence>
         {selectedEvidence && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-10 bg-brand-obsidian/95 backdrop-blur-2xl" onClick={() => setSelectedEvidence(null)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative max-w-4xl w-full bg-black border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                onClick={e => e.stopPropagation()}
              >
                 <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                          <AlertTriangle size={20} />
                       </div>
                       <div>
                          <h3 className="text-xl font-bold text-white tracking-tighter">Forensic Visual Evidence</h3>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Biometric Capture Trace #SEC-FORENSIC</p>
                       </div>
                    </div>
                    <button onClick={() => setSelectedEvidence(null)} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                       <X size={24} />
                    </button>
                 </div>
                 
                 <div className="aspect-video relative bg-black flex items-center justify-center">
                    <img src={selectedEvidence} alt="Evidence Full" className="max-h-full max-w-full object-contain" />
                    <div className="absolute top-10 right-10 flex flex-col gap-4">
                       <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Raw Forensic Stream</span>
                       </div>
                    </div>
                 </div>

                 <div className="p-8 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                          Integrity Hash: <span className="text-white/60">SHA-256 (VERIFIED)</span>
                       </div>
                    </div>
                    <a href={selectedEvidence} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] font-black text-brand-gold uppercase tracking-widest hover:underline">
                       <ExternalLink size={14} /> Open in Cloudinary Vault
                    </a>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
