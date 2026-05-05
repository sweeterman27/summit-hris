'use client';

import React from 'react';
import Sidebar from './Sidebar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NotificationBell from './NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';
import DirectiveGate from '../ui/DirectiveGate';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0904] flex items-center justify-center">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-2 border-brand-gold border-t-transparent rounded-2xl" 
        />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#0a0904] flex selection:bg-brand-gold/30 selection:text-white">
      {/* Global Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      <Sidebar />
      
      <div className="flex-1 ml-72 flex flex-col min-h-screen relative">
        {/* Top Navigation Bar */}
        <header className="h-24 border-b border-white/5 px-12 flex items-center justify-between sticky top-0 bg-[#0a0904]/80 backdrop-blur-2xl z-40">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
              <h2 className="text-white font-black text-xl tracking-tighter uppercase">Command Center</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-[1px] w-8 bg-brand-gold/20" />
              <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em]">Strategic Operations Terminal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-10">
            <NotificationBell />
          </div>
        </header>

        <main className="p-12 flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer Ambient Glow */}
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-brand-gold/[0.02] blur-[150px] rounded-full pointer-events-none" />
      </div>

      {/* Mandatory Directive Gate */}
      <DirectiveGate />
    </div>
  );
}
