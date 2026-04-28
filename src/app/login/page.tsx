'use client';

import React, { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, Loader2, Lock, Mail, Fingerprint, Sparkles, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast(res.error, 'ERROR', 'AUTHENTICATION FAILED');
      } else {
        toast('Operational identity confirmed. Redirecting to terminal...', 'SUCCESS', 'ACCESS GRANTED');
        router.push('/dashboard');
      }
    } catch (err) {
      toast('Neural link error. Please try again.', 'ERROR', 'SYSTEM FAILURE');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Cinematic Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-gold/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 mesh-gradient opacity-10" />
        <div className="absolute inset-0 bg-[url('/grain.png')] opacity-[0.03] pointer-events-none" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {mounted && [...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5
            }}
            animate={{ 
              y: [null, '-20%', '120%'],
              opacity: [0, 0.5, 0]
            }}
            transition={{ 
              duration: Math.random() * 10 + 10, 
              repeat: Infinity,
              ease: "linear"
            }}
            className="w-1 h-1 bg-brand-gold/20 rounded-full absolute"
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#0a0904]/80 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] relative overflow-hidden group">
          
          {/* Top Scanline Effect */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent animate-scan" />

          <div className="flex flex-col items-center text-center mb-12">
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 border border-brand-gold/20 rounded-full border-dashed"
              />
              <div className="w-20 h-20 bg-brand-gold rounded-[2rem] flex items-center justify-center relative shadow-[0_0_40px_rgba(201,162,54,0.3)]">
                <ShieldCheck size={40} className="text-brand-obsidian" />
                <motion.div 
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-white/20 rounded-[2rem]" 
                />
              </div>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter mt-10 uppercase">Identity Portal</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="h-px w-6 bg-brand-gold/40" />
              <p className="text-brand-gold/60 font-black tracking-[0.3em] text-[10px] uppercase">Summit Enterprise HRIS</p>
              <div className="h-px w-6 bg-brand-gold/40" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3 relative group/field">
              <div className="flex items-center justify-between px-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-focus-within/field:text-brand-gold transition-colors">Access Identifier</label>
                <Mail size={12} className="text-white/10 group-focus-within/field:text-brand-gold transition-colors" />
              </div>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Operational Email"
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-8 py-5 text-white placeholder:text-white/5 focus:border-brand-gold/40 focus:bg-white/[0.06] outline-none transition-all font-bold text-sm"
              />
            </div>

            <div className="space-y-3 relative group/field">
              <div className="flex items-center justify-between px-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-focus-within/field:text-brand-gold transition-colors">Pass-Link Key</label>
                <Lock size={12} className="text-white/10 group-focus-within/field:text-brand-gold transition-colors" />
              </div>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-8 py-5 text-white placeholder:text-white/5 focus:border-brand-gold/40 focus:bg-white/[0.06] outline-none transition-all font-bold text-sm"
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-18 bg-brand-gold hover:bg-white disabled:opacity-50 text-brand-obsidian font-black uppercase tracking-[0.4em] text-[11px] rounded-2xl shadow-[0_20px_40px_-10px_rgba(201,162,54,0.3)] flex items-center justify-center gap-4 transition-all duration-500 transform active:scale-[0.98] group/btn"
              >
                {loading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <Fingerprint size={20} className="group-hover/btn:scale-110 transition-transform" />
                    <span>Authorize Access</span>
                    <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-12 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Missing Credentials?</span>
              <button 
                type="button"
                onClick={() => window.location.href = 'mailto:hr@summit-enterprise.com?subject=HRIS Account Request'}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold transition-all active:scale-95 flex items-center gap-3"
              >
                <Users size={14} />
                Contact HR Support
              </button>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-full">
               <Sparkles size={12} className="text-brand-gold/40" />
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Secure biometric secondary active</span>
            </div>
            
            <p className="text-center text-white/10 text-[9px] font-black uppercase tracking-[0.2em] leading-relaxed">
              Authorized personnel only <br /> 
              Neural monitoring & Registry logging active
            </p>
          </div>

          {/* Decorative Corner Shimmers */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-brand-gold/[0.03] rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/[0.02] rounded-full blur-[80px] pointer-events-none" />
        </div>
        
        {/* Footnote */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-center text-white/10 text-[10px] font-medium tracking-widest uppercase">
            Powered by Summit Intelligence Protocol v4.0
          </p>
          <div className="h-1 w-12 bg-brand-gold/20 rounded-full" />
        </div>
      </motion.div>
    </div>
  );
}
