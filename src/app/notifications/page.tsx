'use client';

import React from 'react';
import useSWR from 'swr';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { Bell, Check, Clock, AlertCircle, Trash2, Filter, Search } from 'lucide-react';
import { StatsCardSkeleton } from '@/components/ui/Skeleton';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NotificationsPage() {
  const { data, mutate, isLoading } = useSWR('/api/notifications', fetcher);
  const notifications = data?.notifications || [];

  const markAsRead = async (id?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { notificationId: id } : { markAll: true })
      });
      mutate();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20"><Check size={20} /></div>;
      case 'WARNING': return <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20"><AlertCircle size={20} /></div>;
      case 'ERROR': return <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400 border border-rose-500/20"><AlertCircle size={20} /></div>;
      default: return <div className="p-3 bg-brand-gold/10 rounded-2xl text-brand-gold border border-brand-gold/20"><Clock size={20} /></div>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-20">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Communication Hub</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-px w-8 bg-brand-gold/40" />
              <p className="text-brand-gold/60 text-[10px] font-black uppercase tracking-[0.4em]">Historical operational briefing</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => markAsRead()}
              className="h-14 px-8 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Check size={16} />
              Mark all as read
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-brand-obsidian/40 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    placeholder="Search logs..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:border-brand-gold/50 outline-none transition-all font-bold"
                  />
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all">
                    <Filter size={18} />
                  </button>
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {isLoading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="p-8">
                      <StatsCardSkeleton />
                    </div>
                  ))
                ) : notifications.length === 0 ? (
                  <div className="py-32 flex flex-col items-center justify-center">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                      <Bell size={40} className="text-white/5" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/10 italic">Zero active signals in registry</p>
                  </div>
                ) : (
                  notifications.map((notif: any, i: number) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={notif.id}
                      className={`p-8 hover:bg-white/[0.02] transition-all group ${notif.status === 'Unread' ? 'bg-brand-gold/[0.02]' : ''}`}
                    >
                      <div className="flex gap-8">
                        {getIcon(notif.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`text-lg font-black tracking-tight ${notif.status === 'Unread' ? 'text-brand-gold' : 'text-white'}`}>
                              {notif.title}
                            </h3>
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                                {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString()}
                              </span>
                              {notif.status === 'Unread' && (
                                <button 
                                  onClick={() => markAsRead(notif.id)}
                                  className="w-8 h-8 rounded-lg bg-brand-gold text-brand-obsidian flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                                >
                                  <Check size={14} strokeWidth={3} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-white/40 leading-relaxed max-w-3xl font-medium">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-10">
            <div className="bg-brand-gold/5 border border-brand-gold/10 rounded-[2.5rem] p-10">
              <h4 className="text-brand-gold font-black text-[10px] uppercase tracking-[0.4em] mb-6">Neural Status</h4>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Unread Briefings</span>
                  <span className="text-2xl font-black text-white">{notifications.filter((n: any) => n.status === 'Unread').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total Archived</span>
                  <span className="text-2xl font-black text-white">{notifications.length}</span>
                </div>
                <div className="h-px bg-white/5" />
                <p className="text-[10px] text-white/20 leading-relaxed italic">
                  Communications are retained for 30 operational cycles before being archived to long-term storage.
                </p>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden">
               <AlertCircle className="text-white/5 absolute -right-4 -bottom-4" size={120} />
               <h4 className="text-white font-black text-[10px] uppercase tracking-[0.4em] mb-6 relative z-10">Registry Policy</h4>
               <p className="text-[11px] text-white/40 leading-relaxed font-bold uppercase tracking-widest relative z-10">
                 All system notifications are logged with cryptographic timestamps for administrative audit integrity.
               </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
