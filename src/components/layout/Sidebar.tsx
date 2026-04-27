'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Settings, 
  LogOut,
  LayoutDashboard,
  Clock,
  Calendar,
  TrendingUp,
  BookOpen,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

const MENU_ITEMS = [
  { label: 'Intelligence', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Library', icon: BookOpen, href: '/documents' },
  { label: 'Calendar', icon: Calendar, href: '/calendar' },
  { label: 'Registry', icon: Users, href: '/employees' },
  { label: 'Chronicle', icon: Clock, href: '/attendance' },
  { label: 'Pipeline', icon: Calendar, href: '/leave' },
  { label: 'Performance Hub', icon: TrendingUp, href: '/performance' },
  { label: 'Terminal', icon: Settings, href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role?.toUpperCase();

  const filteredItems = MENU_ITEMS.filter(item => {
    if (item.href === '/employees' || item.href === '/settings') {
      return ['ADMIN', 'SUPERADMIN', 'HR'].includes(role);
    }
    return true;
  });

  return (
    <aside className="w-72 h-screen fixed left-0 top-0 bg-[#0a0904] border-r border-white/5 flex flex-col z-50 overflow-hidden">
      {/* Background Decorative Shimmer */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-gold/[0.02] to-transparent pointer-events-none" />
      
      <div className="p-8 relative">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="relative">
            {/* Logo Container - Forced Relative & Isolated */}
            <div className="relative w-12 h-12 bg-gradient-to-br from-brand-gold via-brand-gold-bright to-brand-gold rounded-2xl flex items-center justify-center font-black text-brand-obsidian shadow-[0_0_20px_rgba(201,162,54,0.2)] group-hover:shadow-brand-gold/40 group-hover:scale-105 transition-all duration-500 overflow-hidden isolation-auto">
              <span className="relative z-10 text-xl tracking-tighter">S</span>
              
              {/* Shimmer - Strictly contained by parent relative + overflow-hidden */}
              <motion.div 
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-white/40 -skew-x-20 opacity-30 z-0 pointer-events-none" 
              />
            </div>

            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 z-20 pointer-events-none"
            >
              <Sparkles size={14} className="text-brand-gold drop-shadow-lg" />
            </motion.div>
          </div>
          
          <div className="flex flex-col">
            <h1 className="font-black text-2xl tracking-tighter text-white group-hover:text-brand-gold transition-all duration-500">SUMMIT</h1>
            <div className="flex items-center gap-2 -mt-1">
              <motion.div 
                animate={{ width: [8, 16, 8] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="h-[1px] bg-brand-gold/40" 
              />
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 group-hover:text-white/40 transition-colors">Enterprise</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar relative">
        <p className="px-4 text-[10px] font-black text-white/10 uppercase tracking-[0.3em] mb-6">Strategic Operations</p>
        
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={item.href}
              href={item.href}
              className="relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-500 group"
            >
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute inset-0 bg-brand-gold/[0.08] border border-brand-gold/20 rounded-2xl z-0"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                />
              )}
              
              <div className={`relative z-10 transition-all duration-500 ${isActive ? 'text-brand-gold scale-110' : 'text-white/20 group-hover:text-white/60 group-hover:scale-105'}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              
              <span className={`relative z-10 font-bold text-sm tracking-tight transition-all duration-500 ${isActive ? 'text-white translate-x-1' : 'text-white/30 group-hover:text-white/60 group-hover:translate-x-1'}`}>
                {item.label}
              </span>

              {isActive && (
                <motion.div 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute right-4 w-1.5 h-1.5 rounded-full bg-brand-gold shadow-[0_0_10px_rgba(201,162,54,0.5)]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/5 relative bg-black/20">
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white/[0.02] border border-white/5 text-white/30 hover:text-red-400 hover:bg-red-400/5 hover:border-red-400/20 transition-all duration-500 group active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform duration-500" />
            <span className="font-bold text-xs uppercase tracking-widest">Terminate Session</span>
          </div>
          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    </aside>
  );
}
