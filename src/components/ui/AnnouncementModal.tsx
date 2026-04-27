'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone, Send, Trash2, Clock, ShieldAlert, Edit2, History } from 'lucide-react';
import useSWR, { useSWRConfig } from 'swr';
import { useToast } from './Toast';
import Pagination from './Pagination';

interface Announcement {
  id: string;
  content: string;
  type: 'Info' | 'Urgent' | 'Event';
  priority: number;
  expiryDate?: string;
}

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const DURATIONS = [
  { label: '1 Hour', value: 1 },
  { label: '12 Hours', value: 12 },
  { label: '24 Hours', value: 24 },
  { label: '3 Days', value: 72 },
  { label: '7 Days', value: 168 },
  { label: 'Permanent', value: 0 },
];

export default function AnnouncementModal({ isOpen, onClose, onUpdate }: AnnouncementModalProps) {
  const { data } = useSWR('/api/announcements');
  const { mutate } = useSWRConfig();
  const { toast } = useToast();
  const announcements: Announcement[] = data?.announcements || [];

  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [type, setType] = useState<'Info' | 'Urgent' | 'Event'>('Info');
  const [duration, setDuration] = useState(24);
  const [editId, setEditId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return toast('Broadcast content cannot be empty', 'WARNING', 'VALIDATION ERROR');
    
    setLoading(true);
    
    let expiryDate = '';
    if (duration > 0) {
      const date = new Date();
      date.setHours(date.getHours() + duration);
      expiryDate = date.toISOString();
    }

    const payload = {
      id: editId || Math.random().toString(), 
      content,
      type,
      priority: type === 'Urgent' ? 5 : 1,
      expiryDate
    };

    const newAnnouncements = editId 
      ? announcements.map(a => a.id === editId ? { ...a, ...payload } : a)
      : [payload, ...announcements];

    mutate('/api/announcements', { success: true, announcements: newAnnouncements }, false);

    try {
      const url = '/api/announcements';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, id: editId }) 
      });

      if (res.ok) {
        toast(
          editId ? 'Operational broadcast successfully refined.' : 'New intelligence broadcast authorized and deployed.',
          'SUCCESS',
          'BROADCAST COMMAND'
        );
        setContent('');
        setEditId(null);
        setDuration(24);
        onUpdate();
      } else {
        throw new Error('Failed to deploy');
      }
    } catch (error) {
      toast('Deployment failed. Check system connection.', 'ERROR', 'COMMAND FAILURE');
      mutate('/api/announcements');
    } finally {
      mutate('/api/announcements');
      setLoading(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditId(announcement.id);
    setContent(announcement.content);
    setType(announcement.type);
    toast('Operational Edit Mode activated.', 'INFO', 'SYSTEM READY');
  };

  const handleDelete = async (id: string) => {
    // In Phase 3, we replace confirm() with a custom flow if needed, 
    // but for now let's at least add a toast after action.
    if (!confirm('Purge this announcement?')) return;
    
    const newAnnouncements = announcements.filter(a => a.id !== id);
    mutate('/api/announcements', { success: true, announcements: newAnnouncements }, false);

    try {
      const res = await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Operational intelligence purged from registry.', 'SUCCESS', 'REGISTRY CLEANUP');
        onUpdate();
      }
    } catch (error) {
      toast('Purge failed. Registry locked.', 'ERROR', 'COMMAND FAILURE');
      mutate('/api/announcements');
    } finally {
      mutate('/api/announcements');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-obsidian/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-2xl bg-[#0a0904] border border-white/10 rounded-[3rem] p-10 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative overflow-hidden z-10"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold shadow-lg shadow-brand-gold/5">
                  <Megaphone size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Broadcast Terminal</h2>
                  <p className="text-brand-gold/40 text-[9px] font-black uppercase tracking-[0.3em]">Operational Comms Center</p>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mb-10 space-y-6">
               <div className="relative group">
                 <textarea 
                   required
                   placeholder="Enter encrypted operational broadcast..."
                   value={content}
                   onChange={(e) => setContent(e.target.value)}
                   className="w-full bg-white/[0.03] border border-white/5 rounded-[2rem] p-8 text-white focus:border-brand-gold/30 outline-none transition-all placeholder:text-white/5 font-bold min-h-[120px] resize-none shadow-inner"
                 />
                 <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-30 transition-opacity">
                    <ShieldAlert size={20} className="text-brand-gold" />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">Flash Type</label>
                   <select 
                     value={type}
                     onChange={(e) => setType(e.target.value as any)}
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-6 h-14 text-xs font-black uppercase tracking-widest text-brand-gold outline-none focus:border-brand-gold/30 transition-all cursor-pointer"
                   >
                     <option value="Info" className="bg-brand-obsidian">Info Flash</option>
                     <option value="Urgent" className="bg-brand-obsidian text-red-400">Urgent Alert</option>
                     <option value="Event" className="bg-brand-obsidian text-emerald-400">Event Notice</option>
                   </select>
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">Persistence</label>
                   <select 
                     value={duration}
                     onChange={(e) => setDuration(parseInt(e.target.value))}
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-6 h-14 text-xs font-black uppercase tracking-widest text-white/60 outline-none focus:border-brand-gold/30 transition-all cursor-pointer"
                   >
                     {DURATIONS.map(d => (
                       <option key={d.value} value={d.value} className="bg-brand-obsidian">{d.label}</option>
                     ))}
                   </select>
                 </div>
               </div>

               <button 
                 disabled={loading}
                 className={`w-full h-16 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl ${
                   editId ? 'bg-emerald-500 text-white shadow-emerald-500/10 hover:bg-emerald-600' : 'bg-brand-gold text-brand-obsidian shadow-brand-gold/10 hover:bg-brand-gold/90'
                 }`}
               >
                 {loading ? <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : (
                   <>
                     {editId ? <Edit2 size={18} /> : <Send size={18} />}
                     <span>{editId ? 'Commit Update' : 'Authorize & Deploy'}</span>
                   </>
                 )}
               </button>
               
               {editId && (
                 <button 
                   type="button"
                   onClick={() => {
                     setEditId(null);
                     setContent('');
                   }}
                   className="w-full text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors"
                 >
                   Cancel Operational Edit
                 </button>
               )}
            </form>

            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 flex items-center gap-2">
                   <History size={14} className="text-brand-gold/40" />
                   Active Registry Stream
                 </p>
                 <span className="text-[9px] font-black text-brand-gold/40 uppercase tracking-widest">{announcements.length} BROADCASTS</span>
               </div>

                <div className="space-y-3 max-h-[600px] overflow-hidden pr-2">
                  {announcements.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
                       <Megaphone size={32} className="text-white/5 mb-4" />
                       <p className="text-white/10 text-[10px] font-black uppercase tracking-widest">Awaiting Command Intel</p>
                    </div>
                  ) : (
                    announcements.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(a => (
                     <div key={a.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-brand-gold/20 hover:bg-white/[0.05] transition-all relative overflow-hidden">
                        <div className="flex items-center gap-5 relative z-10">
                          <div className={`w-1.5 h-10 rounded-full ${a.type === 'Urgent' ? 'bg-red-400' : a.type === 'Event' ? 'bg-emerald-400' : 'bg-brand-gold'} shadow-lg`} />
                          <div className="flex flex-col">
                            <p className="text-xs font-bold text-white group-hover:text-brand-gold transition-colors line-clamp-1">{a.content}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                 a.type === 'Urgent' ? 'bg-red-400/10 text-red-400' : a.type === 'Event' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-brand-gold/10 text-brand-gold'
                               }`}>
                                 {a.type}
                               </span>
                               {a.expiryDate && (
                                 <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                                   Expires: {new Date(a.expiryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                               )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 relative z-10 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          <button 
                            onClick={() => handleEdit(a)}
                            className="p-3 text-white/20 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(a.id)}
                            className="p-3 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-brand-gold/[0.03] to-transparent pointer-events-none" />
                     </div>
                    ))
                  )}
                </div>

                <div className="mt-4">
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={Math.ceil(announcements.length / pageSize)}
                    onPageChange={setCurrentPage}
                    totalEntries={announcements.length}
                    pageSize={pageSize}
                  />
                </div>
            </div>

            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
