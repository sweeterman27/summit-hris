'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Shield, Briefcase, Mail, Key, Hash, Save, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { DEPARTMENTS, POSITIONS } from '@/lib/constants';
import { useToast } from './Toast';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OnboardingModal({ isOpen, onClose, onSuccess }: OnboardingModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingId, setFetchingId] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    employeeNo: '',
    role: 'Employee',
    department: '',
    position: ''
  });

  const fetchNextId = async () => {
    setFetchingId(true);
    try {
      const res = await fetch('/api/employees/next-id');
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, employeeNo: data.nextId }));
        toast(`Operational ID ${data.nextId} reserved.`, 'INFO', 'REGISTRY ASSIGNMENT');
      }
    } catch (err) {
      console.error('Failed to fetch next ID');
    } finally {
      setFetchingId(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNextId();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/employees/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        toast(`${formData.firstName} successfully integrated into the enterprise registry.`, 'SUCCESS', 'ONBOARDING COMPLETE');
        onSuccess();
        onClose();
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          employeeNo: '',
          role: 'Employee',
          department: '',
          position: ''
        });
      } else {
        toast(data.message, 'ERROR', 'ONBOARDING FAILED');
      }
    } catch (err) {
      toast('Neural link error during onboarding.', 'ERROR', 'SYSTEM FAILURE');
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
            className="w-full max-w-2xl bg-[#0a0904] border border-white/10 rounded-[3rem] p-10 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative overflow-hidden z-10"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold shadow-lg">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Strategic Onboarding</h2>
                  <p className="text-brand-gold/40 text-[9px] font-black uppercase tracking-[0.3em]">Initialize Enterprise Identity (HR Step 1/2)</p>
                  <p className="text-white/10 text-[8px] font-bold uppercase tracking-widest mt-1">HR provides basic access. Employee will complete full compliance data upon entry.</p>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-brand-gold transition-colors">
                      <UserPlus size={18} />
                    </div>
                    <input 
                      required
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-brand-gold/40 outline-none transition-all placeholder:text-white/5 font-bold"
                    />
                  </div>
                  <div className="relative group">
                    <input 
                      required
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-8 py-4 text-white focus:border-brand-gold/40 outline-none transition-all placeholder:text-white/5 font-bold"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold/40">
                      <Hash size={18} />
                    </div>
                    <input 
                      readOnly
                      placeholder="Generating ID..."
                      value={formData.employeeNo}
                      className="w-full bg-brand-gold/5 border border-brand-gold/20 rounded-2xl pl-14 pr-6 py-4 text-brand-gold cursor-not-allowed font-black tracking-widest outline-none transition-all"
                    />
                    {fetchingId && (
                       <div className="absolute right-4 top-1/2 -translate-y-1/2">
                         <Loader2 className="animate-spin text-brand-gold/40" size={16} />
                       </div>
                    )}
                    <div className="absolute -top-2 right-4 px-2 bg-[#0a0904] text-[8px] font-black text-brand-gold/40 uppercase tracking-widest border border-brand-gold/20 rounded">
                      Auto-Incremented
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-brand-gold transition-colors">
                      <Mail size={18} />
                    </div>
                    <input 
                      required
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-brand-gold/40 outline-none transition-all placeholder:text-white/5 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-brand-gold transition-colors">
                      <Key size={18} />
                    </div>
                    <input 
                      required
                      type="password"
                      placeholder="Initial Password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-brand-gold/40 outline-none transition-all placeholder:text-white/5 font-bold"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-brand-gold transition-colors">
                      <Shield size={18} />
                    </div>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-brand-gold/40 outline-none transition-all font-bold appearance-none cursor-pointer"
                    >
                      {['Employee', 'Manager', 'HR', 'Admin', 'Superadmin'].map(r => (
                        <option key={r} value={r} className="bg-brand-obsidian">{r} Role</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-brand-gold transition-colors">
                      <Briefcase size={18} />
                    </div>
                    <select 
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-14 pr-10 py-4 text-white focus:border-brand-gold/40 outline-none transition-all font-bold appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-brand-obsidian">Select Department</option>
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d} className="bg-brand-obsidian">{d}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                  </div>
                  <div className="relative group">
                    <select 
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-8 pr-10 py-4 text-white focus:border-brand-gold/40 outline-none transition-all font-bold appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-brand-obsidian">Select Position</option>
                      {POSITIONS.map(p => (
                        <option key={p} value={p} className="bg-brand-obsidian">{p}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || fetchingId}
                  className="w-full h-18 bg-brand-gold hover:bg-white text-brand-obsidian font-black uppercase tracking-[0.4em] text-[11px] rounded-2xl shadow-2xl shadow-brand-gold/20 transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] group/btn"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      <Sparkles size={20} className="group-hover/btn:scale-125 transition-transform" />
                      Commit to Registry
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
