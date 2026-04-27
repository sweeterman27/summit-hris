'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Target, TrendingUp, CheckCircle2, AlertCircle, Save, Loader2, Plus, Users, Search, Edit2, Brain } from 'lucide-react';
import PerformanceModal from '@/components/ui/PerformanceModal';
import NeuroAnalysis from '@/components/ui/NeuroAnalysis';
import Pagination from '@/components/ui/Pagination';
import { motion, AnimatePresence } from 'framer-motion';
interface KeyResult {
  id: string;
  title: string;
  target: number;
  current: number;
  status: string;
}

interface Objective {
  id: string;
  title: string;
  description: string;
  quarter: string;
  keyResults: KeyResult[];
  parentId?: string;
}

interface PerformanceUser {
  employeeNo: string;
  role: string;
  name?: string;
}

interface PerformanceRecord {
  id?: string;
  title?: string;
  description?: string;
  quarter?: string;
  target?: number;
  current?: number;
  parentId?: string;
}

export default function PerformanceHub() {
  const { data: session } = useSession();
  const user = session?.user as PerformanceUser | undefined;
  const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user?.role?.toUpperCase() || '');

  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'objectives' | 'neuro'>('objectives');
  
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add_objective' | 'add_kr' | 'edit'>('add_objective');
  const [activeData, setActiveData] = useState<PerformanceRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchPerformance = (empNo?: string) => {
    setLoading(true);
    const target = empNo || selectedEmployee;
    fetch(`/api/performance?employeeNo=${target}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setObjectives(data.objectives);
          setCurrentPage(1);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    if (user?.employeeNo) {
      if (!selectedEmployee) {
        setSelectedEmployee(user.employeeNo);
      }
      fetchPerformance(user.employeeNo);
    }
  }, [user?.employeeNo]);

  const handleUpdateProgress = async (id: string, newVal: number) => {
    setUpdating(id);
    try {
      const res = await fetch('/api/performance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, current: newVal })
      });
      if (res.ok) fetchPerformance();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const totalProgress = objectives.length > 0 
    ? Math.round(objectives.reduce((acc, obj) => {
        const objProg = obj.keyResults.length > 0 
          ? obj.keyResults.reduce((a, kr) => a + (kr.current / kr.target), 0) / obj.keyResults.length 
          : 0;
        return acc + objProg;
      }, 0) / objectives.length * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tighter">Performance Hub</h1>
            <p className="text-brand-gold/60 font-semibold tracking-wide mt-1">Strategic alignment & neuro-objective tracking</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
             {/* Tab Switcher */}
             <div className="flex p-1.5 bg-white/5 border border-white/10 rounded-2xl">
                <button 
                  onClick={() => setActiveTab('objectives')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'objectives' ? 'bg-brand-gold text-brand-obsidian shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                  Objective Registry
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => setActiveTab('neuro')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'neuro' ? 'bg-brand-gold text-brand-obsidian shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    <Brain size={12} />
                    Neuro-Intelligence
                  </button>
                )}
             </div>

            {isAdmin && activeTab === 'objectives' && (
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-gold transition-colors" size={18} />
                <input 
                  placeholder="Audit Employee No."
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPerformance()}
                  className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-white focus:border-brand-gold/50 outline-none w-48 transition-all text-xs font-bold"
                />
              </div>
            )}
            {isAdmin && activeTab === 'objectives' && (
              <button
                onClick={() => {
                  setModalMode('add_objective');
                  setActiveData(null);
                  setIsModalOpen(true);
                }}
                className="bg-brand-gold hover:bg-brand-gold/90 text-brand-obsidian font-black uppercase tracking-widest text-[10px] h-12 px-6 rounded-2xl shadow-xl shadow-brand-gold/10 flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <Plus size={16} />
                <span>Assign Objective</span>
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'neuro' ? (
             <motion.div 
               key="neuro"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
             >
                <NeuroAnalysis />
             </motion.div>
          ) : (
            <motion.div 
              key="objectives"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-10"
            >
              {/* Global Progress Bar */}
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div>
                    <h3 className="text-xl font-bold text-white">{isAdmin ? 'Enterprise Performance Index' : 'Personal Operational Efficiency'}</h3>
                    <p className="text-xs text-white/40 font-medium">Aggregated progress across all active Key Results</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black text-brand-gold tracking-tighter">{totalProgress}%</p>
                  </div>
                </div>
                <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 relative z-10">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${totalProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-brand-gold/40 to-brand-gold" 
                  />
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-brand-gold/10 transition-all duration-700" />
              </div>

              {/* Objectives Grid */}
              <div className="grid grid-cols-12 gap-8">
                {loading ? (
                   [...Array(3)].map((_, i) => (
                      <div key={i} className="col-span-12 lg:col-span-6 bg-white/5 border border-white/10 rounded-[2.5rem] h-80 animate-pulse" />
                   ))
                ) : objectives.length === 0 ? (
                  <div className="col-span-12 py-20 bg-white/5 border border-white/10 rounded-[2.5rem] text-center">
                    <Target size={48} className="mx-auto text-white/10 mb-4" />
                    <h3 className="text-white/40 font-bold uppercase tracking-widest font-mono italic">No objectives assigned to this registry</h3>
                  </div>
                ) : (
            objectives.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((obj) => (
              <div key={obj.id} className="col-span-12 lg:col-span-6 bg-white/5 border border-white/10 rounded-[3rem] p-10 backdrop-blur-xl group hover:border-brand-gold/30 transition-all duration-500">
                <div className="flex items-start justify-between mb-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold group-hover:scale-110 transition-transform duration-500">
                        <Target size={24} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">{obj.quarter}</span>
                        <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">{obj.title}</h3>
                      </div>
                    </div>
                    <p className="text-xs text-white/40 font-medium leading-relaxed max-w-sm">{obj.description}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                       <button 
                         onClick={() => {
                            setModalMode('add_kr');
                            setActiveData({ parentId: obj.id });
                            setIsModalOpen(true);
                         }}
                         className="p-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl transition-all"
                         title="Add Key Result"
                       >
                         <Plus size={16} />
                       </button>
                       <button 
                         onClick={() => {
                            setModalMode('edit');
                            setActiveData(obj);
                            setIsModalOpen(true);
                         }}
                         className="p-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl transition-all"
                         title="Edit Objective"
                       >
                         <Edit2 size={16} />
                       </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {obj.keyResults.map((kr) => (
                    <div key={kr.id} className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/[0.08] transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[11px] font-black uppercase text-white/80 tracking-wider w-1/2">{kr.title}</h4>
                        <div className="flex items-center gap-4">
                          <input 
                            type="number"
                            className="bg-brand-obsidian/40 border border-white/10 rounded-xl px-3 py-1 w-20 text-center text-xs font-bold text-brand-gold focus:border-brand-gold/50 outline-none transition-all"
                            value={kr.current}
                            onChange={(e) => handleUpdateProgress(kr.id, parseFloat(e.target.value))}
                          />
                          <span className="text-white/20 font-black">/</span>
                          <span className="text-xs font-bold text-white/60">{kr.target}</span>
                          <div className="flex gap-1">
                            {isAdmin && (
                              <button 
                                onClick={() => {
                                  setModalMode('edit');
                                  setActiveData(kr);
                                  setIsModalOpen(true);
                                }}
                                className="text-white/20 hover:text-brand-gold transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                            )}
                            <button 
                              className="text-brand-gold hover:text-white transition-colors"
                              title="Progress locked to registry"
                            >
                              {updating === kr.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (kr.current / kr.target) * 100)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-brand-gold" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              ))
            )}
          </div>

          <Pagination 
            currentPage={currentPage}
            totalPages={Math.ceil(objectives.length / pageSize)}
            onPageChange={setCurrentPage}
            totalEntries={objectives.length}
            pageSize={pageSize}
          />
        </motion.div>
      )}
    </AnimatePresence>
  </div>

      <PerformanceModal 
        key={isModalOpen ? `${activeData?.id || modalMode}-${selectedEmployee}` : 'closed'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={() => fetchPerformance()}
        employeeNo={selectedEmployee}
        mode={modalMode}
        initialData={activeData}
      />
    </DashboardLayout>
  );
}
