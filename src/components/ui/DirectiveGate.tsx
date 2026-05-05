'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, CheckCircle2, Lock, ArrowRight, Zap } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DirectiveGate() {
  const { data, mutate } = useSWR('/api/notifications', fetcher, { refreshInterval: 5000 });
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const criticalNotif = data?.notifications?.find((n: any) => 
    n.status === 'Unread' && (n.type === 'ERROR' || n.type === 'CRITICAL')
  );

  const handleAcknowledge = async () => {
    if (!criticalNotif) return;
    setIsAcknowledging(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: criticalNotif.id })
      });
      mutate();
    } catch (error) {
      console.error('Failed to acknowledge:', error);
    } finally {
      setIsAcknowledging(false);
    }
  };

  if (!criticalNotif) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-brand-obsidian/95 backdrop-blur-2xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.05)_0%,transparent_70%)] pointer-events-none" />
        
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-[#0a0904] border-2 border-rose-500/30 rounded-[3.5rem] w-full max-w-2xl p-12 shadow-[0_0_100px_rgba(239,68,68,0.15)] relative overflow-hidden"
        >
          {/* Cyber Alert Header */}
          <div className="flex items-center gap-6 mb-10">
            <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-pulse">
              <ShieldAlert size={40} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Mandatory Directive</h2>
                <div className="px-3 py-1 bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full">Immediate Action</div>
              </div>
              <p className="text-rose-500/60 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">Acknowledge this briefing to unlock the dashboard</p>
            </div>
          </div>

          {/* Intel Card */}
          <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 mb-10 relative group">
             <div className="absolute top-6 right-8 text-rose-500/20 group-hover:text-rose-500/40 transition-colors">
                <Lock size={48} />
             </div>
             
             <h3 className="text-xl font-bold text-white mb-4 tracking-tight flex items-center gap-3">
                <Zap size={18} className="text-brand-gold" />
                {criticalNotif.title}
             </h3>
             
             <div className="space-y-4">
                <p className="text-white/60 text-sm leading-relaxed italic">
                  "{criticalNotif.message}"
                </p>
                <div className="h-px bg-white/5 w-full" />
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/20">
                   <span>Origin: Enterprise Command</span>
                   <span>Timestamp: {new Date(criticalNotif.createdAt).toLocaleString()}</span>
                </div>
             </div>
          </div>

          {/* Acknowledgement Button */}
          <button 
            onClick={handleAcknowledge}
            disabled={isAcknowledging}
            className="w-full h-20 bg-rose-500 hover:bg-rose-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
          >
            {isAcknowledging ? (
              <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Confirm Understanding & Unlock
                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>

          <p className="text-center mt-8 text-[9px] font-black text-white/10 uppercase tracking-widest">
            By acknowledging, you confirm receipt of this operational directive. 
            All interactions are logged in the Security Ledger.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
