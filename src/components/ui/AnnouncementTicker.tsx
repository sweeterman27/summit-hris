'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, AlertTriangle, Info, PartyPopper } from 'lucide-react';

interface Announcement {
  id: string;
  content: string;
  type: 'Info' | 'Urgent' | 'Event';
  priority: number;
}

export default function AnnouncementTicker() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => {
        if (data.success) setAnnouncements(data.announcements);
      });
  }, []);

  useEffect(() => {
    if (announcements.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % announcements.length);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [announcements]);

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex];

  const getIcon = (type: string) => {
    switch (type) {
      case 'Urgent': return <AlertTriangle size={14} className="text-red-400" />;
      case 'Event': return <PartyPopper size={14} className="text-emerald-400" />;
      default: return <Info size={14} className="text-brand-gold" />;
    }
  };

  return (
    <div className="w-full bg-white/5 border-y border-white/5 backdrop-blur-sm overflow-hidden h-10 flex items-center">
      <div className="px-6 flex items-center gap-3 border-r border-white/10 h-full bg-brand-obsidian z-10">
        <Megaphone size={16} className="text-brand-gold animate-bounce" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 whitespace-nowrap">Broadcast</span>
      </div>

      <div className="flex-1 relative h-full flex items-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="flex items-center gap-3"
          >
            {getIcon(current.type)}
            <span className={`text-[11px] font-bold tracking-wide ${current.type === 'Urgent' ? 'text-red-400' : 'text-white/80'}`}>
              {current.content}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-6 flex items-center gap-2 opacity-20">
        {announcements.map((_, i) => (
          <div 
            key={i} 
            className={`w-1 h-1 rounded-full transition-all ${i === currentIndex ? 'bg-brand-gold w-3' : 'bg-white'}`} 
          />
        ))}
      </div>
    </div>
  );
}
