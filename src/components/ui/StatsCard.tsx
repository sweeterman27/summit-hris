'use client';

import React, { useState, useRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  label: string;
  icon: LucideIcon;
  color?: string;
}

export default function StatsCard({ title, value, label, icon: Icon, color = 'text-brand-gold' }: StatsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <motion.div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative group overflow-hidden glass-panel rounded-[2.5rem] p-8 transition-all duration-500"
    >
      {/* Dynamic Spotlight Glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at ${smoothX}px ${smoothY}px, rgba(201, 162, 54, 0.08), transparent 40%)`,
        }}
      />

      {/* Mesh Background Overlay */}
      <div className="absolute inset-0 mesh-gradient opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-brand-gold/60 transition-colors">{title}</span>
            <div className="h-[2px] w-8 bg-brand-gold/10 group-hover:w-12 transition-all duration-500" />
          </div>
          <div className={`${color} opacity-20 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
            <Icon size={28} strokeWidth={1.5} />
          </div>
        </div>
        
        <div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-white tracking-tighter mb-2 group-hover:text-glow transition-all"
          >
            {value}
          </motion.div>
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest">{label}</p>
        </div>
      </div>

      {/* Static Decorative Glows */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-gold/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-brand-gold/10 transition-all duration-1000" />
      <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-[40px] pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-1000" />
    </motion.div>
  );
}
