'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Target, AlignLeft, BarChart3, Trash2 } from 'lucide-react';

interface PerformanceRecord {
  id?: string;
  title?: string;
  description?: string;
  quarter?: string;
  target?: number;
  current?: number;
  parentId?: string;
}

interface PerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  employeeNo: string;
  mode: 'add_objective' | 'add_kr' | 'edit';
  initialData?: PerformanceRecord | null;
}

export default function PerformanceModal({ isOpen, onClose, onUpdate, employeeNo, mode, initialData }: PerformanceModalProps) {
  // We initialize state directly from props. 
  // To ensure state updates when initialData changes, the parent should provide a unique 'key'.
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    quarter: initialData?.quarter || 'Q2 FY2026',
    target: initialData?.target || 100,
    parentId: mode === 'add_kr' ? initialData?.parentId || '' : (initialData?.parentId || '')
  });
  const [loading, setLoading] = useState(false);

  // Sync state ONLY when initialData/mode changes (to handle cases where key isn't used)
  // But wait, the user specifically wants to avoid setState in useEffect.
  // If we use a key, we don't need this useEffect at all.
  // I will remove it and instruct the parent to use a key.
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const body = mode === 'edit' 
        ? { id: initialData?.id, ...formData } 
        : { employeeNo, ...formData, parentId: mode === 'add_kr' ? initialData?.parentId : '' };

      const res = await fetch('/api/performance', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        onUpdate();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this OKR?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/performance?id=${initialData?.id}`, { method: 'DELETE' });
      if (res.ok) {
        onUpdate();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
            className="w-full max-w-xl bg-brand-obsidian border border-white/10 rounded-[3rem] p-10 shadow-[0_0_80px_rgba(0,0,0,0.5)] relative overflow-hidden z-10"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tighter">
                  {mode === 'edit' ? 'Modify Registry' : mode === 'add_kr' ? 'Deploy Key Result' : 'Strategic Objective'}
                </h2>
                <p className="text-brand-gold/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Performance Architecture</p>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Target className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold/40" size={18} />
                <input 
                  required
                  placeholder="Title / Key Result Name"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all placeholder:text-white/10 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <BarChart3 className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold/40" size={18} />
                  <input 
                    type="number"
                    placeholder="Target Value"
                    value={formData.target}
                    onChange={(e) => setFormData({...formData, target: parseFloat(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold"
                  />
                </div>
                <div className="relative">
                  <input 
                    placeholder="Quarter (e.g. Q2 FY2026)"
                    value={formData.quarter}
                    onChange={(e) => setFormData({...formData, quarter: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="relative">
                <AlignLeft className="absolute left-5 top-6 text-brand-gold/40" size={18} />
                <textarea 
                  placeholder="Strategic details and alignment..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all placeholder:text-white/10 font-medium resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                {mode === 'edit' && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex-1 h-16 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    <span>Purge</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] h-16 bg-brand-gold hover:bg-brand-gold/90 text-brand-obsidian font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-brand-gold/10 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-brand-obsidian/30 border-t-brand-obsidian rounded-full animate-spin" /> : (
                    <>
                      <Save size={16} />
                      <span>{mode === 'edit' ? 'Commit Sync' : 'Deploy OKR'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
