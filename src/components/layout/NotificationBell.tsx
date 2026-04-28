'use client';

import React, { useState, useRef } from 'react';
import { Bell, Check, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  status: 'Unread' | 'Read';
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Smart Syncing: Polls every 30 seconds, or when tab is refocused
  const { data, mutate } = useSWR('/api/notifications', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true
  });

  const notifications: Notification[] = data?.notifications || [];
  const unreadCount = notifications.filter(n => n.status === 'Unread').length;

  const markAsRead = async (id?: string) => {
    try {
      // Optimistic Update: Update UI immediately
      if (id) {
        mutate({
          ...data,
          notifications: notifications.map(n => n.id === id ? { ...n, status: 'Read' } : n)
        }, false);
      } else {
        mutate({
          ...data,
          notifications: notifications.map(n => ({ ...n, status: 'Read' }))
        }, false);
      }

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { notificationId: id } : { markAll: true })
      });
      
      // Sync back with server
      mutate();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <Check size={14} className="text-emerald-400" />;
      case 'WARNING': return <AlertCircle size={14} className="text-amber-400" />;
      case 'ERROR': return <AlertCircle size={14} className="text-rose-400" />;
      default: return <Clock size={14} className="text-brand-gold" />;
    }
  };

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-3 rounded-xl border transition-all duration-300 ${
          isOpen ? 'bg-brand-gold/10 border-brand-gold text-brand-gold' : 'bg-white/5 border-white/10 text-white/60 hover:text-brand-gold hover:bg-brand-gold/5'
        }`}
      >
        <Bell size={20} className={unreadCount > 0 ? 'animate-pulse' : ''} />
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-4 h-4 bg-brand-gold text-brand-obsidian text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-brand-obsidian"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-4 w-96 bg-brand-obsidian/95 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl z-[100] overflow-hidden"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h3 className="font-bold text-white tracking-tight">Communications</h3>
                <p className="text-[10px] uppercase tracking-widest text-white/40">Neural Sync Active</p>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAsRead()}
                  className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-gold hover:text-white transition-colors"
                >
                  Clear Terminal
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <Bell size={24} className="text-white/10" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Zero active signals</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-5 border-b border-white/5 hover:bg-white/[0.03] transition-all group relative ${notif.status === 'Unread' ? 'bg-brand-gold/[0.03]' : ''}`}
                  >
                    <div className="flex gap-4">
                      <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/5 ${notif.status === 'Unread' ? 'border-brand-gold/20' : ''}`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-bold truncate tracking-tight ${notif.status === 'Unread' ? 'text-brand-gold' : 'text-white/80'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-2 whitespace-nowrap">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                    {notif.status === 'Unread' && (
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg bg-brand-gold text-brand-obsidian shadow-lg hover:scale-110"
                      >
                        <Check size={12} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-white/[0.02] text-center border-t border-white/5">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10">End of Briefing</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
