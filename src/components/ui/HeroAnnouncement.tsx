'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, AlertCircle, Sparkles, ChevronRight, Settings, X, ShieldCheck } from 'lucide-react';
import useSWR from 'swr';
import Skeleton from './Skeleton';

interface Announcement {
  id: string;
  content: string;
  type: 'Info' | 'Urgent' | 'Event';
  priority: number;
}

interface HeroAnnouncementProps {
  onManage?: () => void;
  isAdmin?: boolean;
}

export default function HeroAnnouncement({ onManage, isAdmin }: HeroAnnouncementProps) {
  const { data, isLoading } = useSWR('/api/announcements');
  const announcements: Announcement[] = data?.announcements || [];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (announcements.length > 1 && !showDetail) {
      const timer = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % announcements.length);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [announcements, showDetail]);

  if (isLoading) {
    return (
      <div className="relative w-full rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-10 mb-10 overflow-hidden">
        <div className="flex items-center gap-8">
          <Skeleton className="w-16 h-16" variant="rectangular" />
          <div className="flex-1 space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-2 w-24" />
              <Skeleton className="h-2 w-32" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <motion.div 
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent skew-x-[-20deg]"
        />
      </div>
    );
  }

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex];

  const getStyle = (type: string) => {
    switch (type) {
      case 'Urgent': return {
        border: 'border-red-500/30',
        bg: 'bg-red-500/5',
        text: 'text-red-400',
        icon: <AlertCircle className="text-red-400" size={24} />,
        glow: 'shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)]'
      };
      case 'Event': return {
        border: 'border-emerald-500/30',
        bg: 'bg-emerald-500/5',
        text: 'text-emerald-400',
        icon: <Sparkles className="text-emerald-400" size={24} />,
        glow: 'shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)]'
      };
      default: return {
        border: 'border-brand-gold/30',
        bg: 'bg-brand-gold/5',
        text: 'text-brand-gold',
        icon: <Megaphone className="text-brand-gold" size={24} />,
        glow: 'shadow-[0_0_50px_-12px_rgba(212,175,55,0.3)]'
      };
    }
  };

  const style = getStyle(current.type);

  const modalContent = (
    <AnimatePresence>
      {showDetail && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-3xl cursor-zoom-out"
            onClick={() => setShowDetail(false)}
          />

          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`w-full max-w-3xl bg-[#0a0904] border ${style.border} rounded-[3rem] p-12 shadow-[0_0_120px_rgba(0,0,0,1)] relative overflow-hidden z-10`}
          >
            <div className="absolute inset-0 mesh-gradient opacity-10 pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl ${style.bg} border ${style.border} flex items-center justify-center shadow-2xl`}>
                    {style.icon}
                  </div>
                  <div>
                    <h3 className={`text-[12px] font-black uppercase tracking-[0.5em] ${style.text}`}>{current.type} Intelligence</h3>
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mt-1">Authorized Command Level Briefing</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDetail(false)} 
                  className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-12 min-h-[300px] flex items-start">
                <p className="text-2xl font-bold text-white leading-[1.8] tracking-tight whitespace-pre-wrap selection:bg-brand-gold/30">
                  {current.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4">
                 <div className="flex items-center gap-8">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">Classification</span>
                      <div className="flex items-center gap-2">
                         <ShieldCheck size={16} className={style.text} />
                         <span className="text-xs font-black text-white uppercase tracking-widest">Priority {current.priority}</span>
                      </div>
                    </div>
                 </div>

                 <button 
                  onClick={() => setShowDetail(false)}
                  className={`h-16 px-12 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] border transition-all active:scale-95 flex items-center gap-3 ${style.text} ${style.border} hover:bg-white/5 shadow-2xl`}
                 >
                   <span>Confirm Receipt</span>
                   <ChevronRight size={14} />
                 </button>
              </div>
            </div>

            <div className={`absolute -bottom-24 -right-24 w-96 h-96 ${style.bg} rounded-full blur-[120px] pointer-events-none opacity-50`} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative w-full rounded-[2.5rem] border ${style.border} ${style.bg} ${style.glow} overflow-hidden group mb-10 transition-all duration-500 hover:scale-[1.005]`}
      >
        <div className="absolute top-0 right-0 w-[400px] h-full bg-gradient-to-l from-brand-gold/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 p-10 flex items-center justify-between gap-10">
          <button 
            onClick={() => setShowDetail(true)}
            className="flex items-center gap-8 flex-1 min-w-0 text-left group/content outline-none"
          >
            <div className="relative shrink-0">
              <div className={`w-16 h-16 rounded-2xl ${style.bg} border ${style.border} flex items-center justify-center group-hover/content:scale-110 transition-transform duration-500`}>
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
                >
                  {style.icon}
                </motion.div>
              </div>
              {current.type === 'Urgent' && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${style.text}`}>
                  {current.type} Broadcast
                </span>
                <div className="h-px w-12 bg-white/10" />
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                  Index {currentIndex + 1}/{announcements.length}
                </span>
                <div className="flex items-center gap-1.5 ml-2 opacity-0 group-hover/content:opacity-100 transition-opacity">
                  <ChevronRight size={10} className={style.text} />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${style.text}`}>View Full Intel</span>
                </div>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.h2 
                  key={current.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-2xl font-bold text-white leading-relaxed line-clamp-2 pr-10"
                >
                  {current.content}
                </motion.h2>
              </AnimatePresence>
            </div>
          </button>

          <div className="flex items-center gap-8 shrink-0">
            <div className="flex gap-2.5">
              {announcements.map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${i === currentIndex ? 'bg-brand-gold w-10 shadow-[0_0_10px_rgba(201,162,54,0.5)]' : 'bg-white/10 hover:bg-white/30'}`}
                />
              ))}
            </div>
            
            {isAdmin && (
              <>
                <div className="h-10 w-px bg-white/5" />
                <button 
                  onClick={onManage}
                  className="h-14 px-8 bg-white/5 hover:bg-brand-gold/10 border border-white/10 hover:border-brand-gold/30 rounded-2xl flex items-center gap-3 text-brand-gold font-bold uppercase tracking-widest text-[10px] transition-all group/btn shadow-xl active:scale-95"
                >
                  <Settings size={14} className="group-hover/btn:rotate-90 transition-transform duration-500" />
                  Manage
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Render Modal via Portal */}
      {mounted && typeof document !== 'undefined' && createPortal(modalContent, document.body)}
    </>
  );
}
