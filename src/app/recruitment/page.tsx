'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { UserPlus, Mail, Calendar, Briefcase, ChevronRight, Loader2, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Applicant {
  id: string;
  name: string;
  email: string;
  roleApplied: string;
  status: 'New' | 'Interviewing' | 'Hired';
  appliedDate: string;
  notes: string;
}

const KANBAN_STAGES = ['New', 'Interviewing', 'Hired'] as const;

export default function RecruitmentPipeline() {
  const { data: session } = useSession();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newApp, setNewApp] = useState({ name: '', email: '', roleApplied: '', notes: '' });

  const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes((session?.user as any)?.role?.toUpperCase() || '');

  const fetchApplicants = () => {
    setLoading(true);
    fetch('/api/recruitment')
      .then(res => res.json())
      .then(data => {
        if (data.success) setApplicants(data.applicants);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  const handleAddApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/recruitment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApp)
    });
    if (res.ok) {
      toast.success('Applicant Added to Pipeline', { style: { background: '#050505', color: '#c9a236', border: '1px solid rgba(201,162,54,0.2)' } });
      setIsModalOpen(false);
      setNewApp({ name: '', email: '', roleApplied: '', notes: '' });
      fetchApplicants();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic UI update
    const previous = [...applicants];
    setApplicants(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
    
    const res = await fetch('/api/recruitment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus })
    });
    const data = await res.json();
    
    if (data.success) {
      if (data.message) {
        toast.success(data.message, { 
          duration: 5000,
          style: { background: '#050505', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' } 
        });
      }
    } else {
      toast.error('Failed to transition applicant');
      setApplicants(previous);
    }
  };

  if (!isAdmin) return null;

  return (
    <DashboardLayout>
      <div className="space-y-10 min-h-[calc(100vh-80px)]">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tighter flex items-center gap-4">
              <UserPlus className="text-brand-gold" size={36} />
              Onboarding Pipeline
            </h1>
            <p className="text-brand-gold/60 font-semibold tracking-wide mt-1">Enterprise Applicant Tracking System</p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-12 px-8 bg-brand-gold hover:bg-brand-gold/90 text-brand-obsidian font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center gap-2 shadow-xl shadow-brand-gold/10 transition-all active:scale-[0.98]"
          >
            <Plus size={16} />
            Add Candidate
          </button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
          {KANBAN_STAGES.map(stage => {
            const stageApplicants = applicants.filter(a => a.status === stage);
            return (
              <div key={stage} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 flex flex-col min-h-[600px] shadow-2xl shadow-black/50 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${stage === 'New' ? 'bg-blue-400' : stage === 'Interviewing' ? 'bg-brand-gold' : 'bg-emerald-400'} shadow-[0_0_10px_currentColor]`} />
                    <h3 className="text-white font-bold tracking-tight uppercase">{stage}</h3>
                  </div>
                  <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-white/40">
                    {stageApplicants.length}
                  </span>
                </div>

                <div className="flex-1 space-y-4 relative z-10 custom-scrollbar overflow-y-auto pr-2">
                  <AnimatePresence>
                    {loading ? (
                       <div className="h-32 bg-white/5 animate-pulse rounded-[2rem] border border-white/5" />
                    ) : stageApplicants.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/10">Empty Queue</p>
                      </div>
                    ) : (
                      stageApplicants.map((app, i) => (
                        <motion.div 
                          key={app.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-brand-obsidian border border-white/10 hover:border-brand-gold/30 rounded-[2rem] p-5 cursor-pointer group transition-all"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-white font-bold tracking-tight text-lg">{app.name}</h4>
                              <p className="text-[10px] text-brand-gold/60 font-black uppercase tracking-widest mt-1 flex items-center gap-1">
                                <Briefcase size={10} /> {app.roleApplied}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-white/40 text-xs font-medium">
                              <Mail size={12} /> {app.email}
                            </div>
                            <div className="flex items-center gap-2 text-white/40 text-xs font-medium">
                              <Calendar size={12} /> {new Date(app.appliedDate).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            {stage === 'New' && (
                              <button 
                                onClick={() => handleStatusChange(app.id, 'Interviewing')}
                                className="flex-1 py-3 bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                              >
                                Interview <ChevronRight size={12} />
                              </button>
                            )}
                            {stage === 'Interviewing' && (
                              <button 
                                onClick={() => handleStatusChange(app.id, 'Hired')}
                                className="flex-1 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                              >
                                Hire Candidate <CheckCircle2 size={12} />
                              </button>
                            )}
                            {stage === 'Hired' && (
                              <div className="flex-1 py-3 bg-white/5 border border-white/10 text-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                <Sparkles size={12} /> Auto-Provisioned
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>

                {stage === 'Hired' && (
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none rounded-full" />
                )}
                {stage === 'Interviewing' && (
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-gold/5 blur-[100px] pointer-events-none rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Applicant Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-obsidian/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-brand-obsidian border border-white/10 rounded-[3rem] p-10 shadow-[0_0_80px_rgba(0,0,0,0.5)] relative overflow-hidden z-10"
            >
              <h2 className="text-3xl font-bold text-white tracking-tighter mb-8">New Candidate</h2>
              <form onSubmit={handleAddApplicant} className="space-y-4">
                <input required placeholder="Full Name" value={newApp.name} onChange={e => setNewApp({...newApp, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all placeholder:text-white/20 font-bold" />
                <input required type="email" placeholder="Email Address" value={newApp.email} onChange={e => setNewApp({...newApp, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all placeholder:text-white/20 font-bold" />
                <input required placeholder="Role Applied For (e.g. Senior Developer)" value={newApp.roleApplied} onChange={e => setNewApp({...newApp, roleApplied: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all placeholder:text-white/20 font-bold" />
                
                <button type="submit" className="w-full h-16 mt-4 bg-brand-gold hover:bg-brand-gold/90 text-brand-obsidian font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-xl shadow-brand-gold/10 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                  Inject to Pipeline
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
