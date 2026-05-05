'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Send, Users, User, Bell, Shield, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function BroadcastTerminal() {
  const [target, setTarget] = React.useState('ALL');
  const [targetValue, setTargetValue] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [type, setType] = React.useState('INFO');
  const [isSending, setIsSending] = React.useState(false);
  const { toast } = useToast();

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return toast('Encryption Failed: Missing briefing headers', 'ERROR');

    setIsSending(true);
    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, targetValue, title, message, type })
      });
      const data = await res.json();
      if (data.success) {
        toast('Briefing Dispatched: Strategic broadcast synchronized', 'SUCCESS');
        setTitle('');
        setMessage('');
        setTargetValue('');
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast(`Dispatch Error: ${err.message}`, 'ERROR');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#0c0b05] border border-brand-gold/10 rounded-[3rem] p-10 relative overflow-hidden group shadow-deep">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/[0.02] to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold shadow-lg border border-brand-gold/20">
              <Bell size={22} className={isSending ? 'animate-bounce' : ''} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-gold">Notification Hub</span>
              <p className="text-white/20 text-[9px] font-black uppercase tracking-widest mt-1">Superadmin Broadcast Terminal active</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-brand-gold shadow-[0_0_10px_rgba(201,162,54,0.5)]" />
             <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Broadcast Protocol: Encrypted</span>
          </div>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Target Selection</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ALL', icon: Shield, label: 'All' },
                  { id: 'ROLE', icon: Users, label: 'Role' },
                  { id: 'INDIVIDUAL', icon: User, label: 'Person' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTarget(t.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                      target === t.id ? 'bg-brand-gold/10 border-brand-gold/40 text-brand-gold shadow-lg' : 'bg-white/5 border-white/5 text-white/20 hover:border-white/10'
                    }`}
                  >
                    <t.icon size={18} className="mb-2" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Briefing Intensity</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'INFO', icon: Info, color: 'text-brand-gold' },
                  { id: 'SUCCESS', icon: CheckCircle, color: 'text-emerald-400' },
                  { id: 'WARNING', icon: AlertTriangle, color: 'text-amber-400' },
                  { id: 'ERROR', icon: XCircle, color: 'text-rose-500' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                      type === t.id ? 'bg-white/10 border-white/20 shadow-lg' : 'bg-white/5 border-white/5 opacity-40 hover:opacity-100'
                    }`}
                  >
                    <t.icon size={18} className={t.color} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {target !== 'ALL' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">
                {target === 'ROLE' ? 'Specify Role (ADMIN, HR, EMPLOYEE)' : 'Employee Number (e.g., SA-001)'}
              </label>
              <input
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={target === 'ROLE' ? "Enter Role..." : "Enter ID..."}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-brand-gold/50 outline-none transition-all font-bold placeholder:text-white/10"
              />
            </motion.div>
          )}

          <div className="space-y-6">
            <div className="space-y-4">
               <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Briefing Header</label>
               <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Strategic subject line..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-brand-gold/50 outline-none transition-all font-black placeholder:text-white/10"
              />
            </div>
            <div className="space-y-4">
               <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Detailed Intel</label>
               <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Compose operational communication..."
                className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-5 text-sm text-white focus:border-brand-gold/50 outline-none transition-all font-medium placeholder:text-white/10 resize-none"
              />
            </div>
          </div>

          <button
            disabled={isSending}
            className="w-full h-16 bg-gradient-to-r from-brand-gold to-brand-gold-bright rounded-2xl font-black text-brand-obsidian uppercase tracking-[0.4em] shadow-[0_0_30px_rgba(201,162,54,0.3)] hover:shadow-brand-gold/60 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:grayscale"
          >
            {isSending ? (
              <div className="w-6 h-6 border-4 border-brand-obsidian/20 border-t-brand-obsidian rounded-full animate-spin" />
            ) : (
              <>
                <Send size={20} strokeWidth={3} />
                Synchronize Broadcast
              </>
            )}
          </button>
        </form>
      </div>

      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-brand-gold/[0.02] blur-[100px] rounded-full pointer-events-none" />
    </div>
  );
}
