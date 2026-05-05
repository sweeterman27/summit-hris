'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { UserMinus, ShieldOff, CreditCard, ClipboardCheck, ChevronRight, Search, Plus, AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface Offboarding {
  employeeNo: string;
  name: string;
  exitDate: string;
  reason: string;
  itClear: boolean;
  hrClear: boolean;
  financeClear: boolean;
  status: string;
  notes: string;
}

export default function OffboardingCenter() {
  const { data: session } = useSession();
  const [offboardings, setOffboardings] = useState<Offboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<{no: string, name: string} | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);

  const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes((session?.user as any)?.role?.toUpperCase());

  const fetchOffboardings = async () => {
    setLoading(true);
    const res = await fetch('/api/offboarding');
    const data = await res.json();
    if (data.success) setOffboardings(data.offboardings);
    setLoading(false);
  };

  const fetchEmployees = async () => {
    const res = await fetch('/api/employees');
    const data = await res.json();
    if (data.success) setEmployees(data.employees.filter((e: any) => e.status === 'Active'));
  };

  useEffect(() => {
    fetchOffboardings();
    fetchEmployees();
  }, []);

  const handleToggleClearance = async (empNo: string, field: string, current: boolean) => {
    const res = await fetch('/api/offboarding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeNo: empNo, [field]: !current })
    });
    if (res.ok) {
      setOffboardings(prev => prev.map(o => o.employeeNo === empNo ? { ...o, [field]: !current } : o));
      toast.success('Clearance Updated');
    }
  };

  const handleInitiate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      employeeNo: formData.get('employeeNo'),
      name: employees.find(emp => emp.employeeNo === formData.get('employeeNo'))?.firstName + ' ' + employees.find(emp => emp.employeeNo === formData.get('employeeNo'))?.lastName,
      exitDate: formData.get('exitDate'),
      reason: formData.get('reason'),
      notes: formData.get('notes'),
    };

    const res = await fetch('/api/offboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      toast.success('Exit Protocol Initiated');
      setIsModalOpen(false);
      fetchOffboardings();
    } else {
      const data = await res.json();
      toast.error(data.message);
    }
  };

  const handleFinalize = async (empNo: string) => {
    if (!confirm('CRITICAL ACTION: This will permanently deactivate the personnel record and move it to the Archive. Proceed?')) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/offboarding/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeNo: empNo })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Personnel Archived Successfully');
        fetchOffboardings();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Connection failure during archival sequence');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-20">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 uppercase">
              <UserMinus className="text-rose-500" size={36} />
              Exit Protocol Center
            </h1>
            <p className="text-white/20 font-black uppercase text-[10px] tracking-[0.4em] mt-2">Enterprise Offboarding & Asset Recovery Hub</p>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-14 px-10 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 text-rose-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-3 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            Initiate Exit Protocol
          </button>
        </div>

        {/* Active Protocols Table */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/20">Departing Personnel</th>
                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/20">Exit Date</th>
                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/20 text-center">IT Clear</th>
                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/20 text-center">HR Clear</th>
                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/20 text-center">Finance Clear</th>
                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/20 text-right">Operational Status</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {loading ? (
                   [...Array(3)].map((_, i) => <tr key={i}><td colSpan={6} className="p-10 animate-pulse bg-white/5" /></tr>)
                 ) : offboardings.length === 0 ? (
                   <tr>
                      <td colSpan={6} className="p-20 text-center">
                         <CheckCircle2 className="mx-auto text-white/5 mb-6" size={48} />
                         <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Zero Active Exit Protocols. The Fleet is stable.</p>
                      </td>
                   </tr>
                 ) : (
                   offboardings.map(o => (
                     <tr key={o.employeeNo} className="hover:bg-white/[0.01] transition-all group">
                        <td className="p-8">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 font-black">
                                 {o.name.charAt(0)}
                              </div>
                              <div>
                                 <p className="text-white font-bold tracking-tight">{o.name}</p>
                                 <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-1">{o.employeeNo}</p>
                              </div>
                           </div>
                        </td>
                        <td className="p-8">
                           <p className="text-xs font-black text-white/60 tracking-widest">{o.exitDate}</p>
                           <p className="text-[9px] text-rose-500/60 font-bold uppercase mt-1">{o.reason}</p>
                        </td>
                        <td className="p-8 text-center">
                           <button 
                             onClick={() => handleToggleClearance(o.employeeNo, 'itClear', o.itClear)}
                             className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${o.itClear ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/10 border border-white/5 hover:border-emerald-400/40'}`}
                           >
                              <ShieldOff size={18} />
                           </button>
                        </td>
                        <td className="p-8 text-center">
                           <button 
                             onClick={() => handleToggleClearance(o.employeeNo, 'hrClear', o.hrClear)}
                             className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${o.hrClear ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/10 border border-white/5 hover:border-emerald-400/40'}`}
                           >
                              <ClipboardCheck size={18} />
                           </button>
                        </td>
                        <td className="p-8 text-center">
                           <button 
                             onClick={() => handleToggleClearance(o.employeeNo, 'financeClear', o.financeClear)}
                             className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${o.financeClear ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/10 border border-white/5 hover:border-emerald-400/40'}`}
                           >
                              <CreditCard size={18} />
                           </button>
                        </td>
                        <td className="p-8 text-right">
                           <div className="flex items-center justify-end gap-4">
                              {o.itClear && o.hrClear && o.financeClear && o.status !== 'COMPLETED' ? (
                                <button 
                                  onClick={() => handleFinalize(o.employeeNo)}
                                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                                >
                                   <ShieldOff size={14} />
                                   Finalize & Archive
                                </button>
                              ) : (
                                <div className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest ${o.status === 'COMPLETED' ? 'bg-white/5 text-white/20 border border-white/5' : o.itClear && o.hrClear && o.financeClear ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                   {o.status === 'COMPLETED' ? 'ARCHIVED' : o.itClear && o.hrClear && o.financeClear ? 'READY' : 'PROTOCOL ACTIVE'}
                                </div>
                              )}
                              <ChevronRight size={16} className="text-white/10 group-hover:text-white transition-colors" />
                           </div>
                        </td>
                     </tr>
                   ))
                 )}
              </tbody>
           </table>
        </div>

        {/* Initiate Modal */}
        <AnimatePresence>
           {isModalOpen && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0f0d04] border border-white/10 rounded-[3rem] w-full max-w-xl p-12 shadow-2xl"
                >
                   <div className="flex items-center gap-6 mb-10">
                      <div className="w-16 h-16 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-lg">
                         <AlertTriangle size={32} />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Initiate Exit Protocol</h3>
                         <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">Authorized Deactivation Sequence</p>
                      </div>
                   </div>

                   <form onSubmit={handleInitiate} className="space-y-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Target Personnel</label>
                         <select 
                           name="employeeNo"
                           required
                           className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-rose-500/50 outline-none transition-all font-bold appearance-none"
                         >
                            <option value="">Select Employee...</option>
                            {employees.map(emp => (
                              <option key={emp.employeeNo} value={emp.employeeNo}>{emp.firstName} {emp.lastName} ({emp.employeeNo})</option>
                            ))}
                         </select>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Effective Date</label>
                            <input 
                              type="date"
                              name="exitDate"
                              required
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-rose-500/50 outline-none transition-all font-bold"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Primary Reason</label>
                            <select 
                              name="reason"
                              required
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-rose-500/50 outline-none transition-all font-bold appearance-none"
                            >
                               <option value="Resignation">Resignation</option>
                               <option value="Termination">Termination</option>
                               <option value="Contract End">Contract End</option>
                               <option value="Retirement">Retirement</option>
                            </select>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Final Briefing Notes</label>
                         <textarea 
                           name="notes"
                           rows={3}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-rose-500/50 outline-none transition-all font-bold"
                           placeholder="Describe the exit context..."
                         />
                      </div>

                      <div className="flex items-center gap-4 pt-4">
                         <button 
                           type="button" 
                           onClick={() => setIsModalOpen(false)}
                           className="flex-1 h-14 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                         >
                            Cancel Sequence
                         </button>
                         <button 
                           type="submit"
                           className="flex-[2] h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-500/20"
                         >
                            Confirm Initiation
                         </button>
                      </div>
                   </form>
                </motion.div>
             </div>
           )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
