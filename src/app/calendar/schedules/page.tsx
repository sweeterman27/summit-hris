'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Clock, Users, ChevronLeft, ChevronRight, Save, Loader2, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface Employee {
  employeeNo: string;
  name: string;
  defaultShift: string;
}

interface Schedule {
  employeeNo: string;
  date: string;
  startTime: string;
  endTime: string;
}

export default function ShiftCommander() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(d.setDate(diff));
  });

  const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes((session?.user as any)?.role?.toUpperCase());

  const fetchRegistry = async () => {
    const res = await fetch('/api/employees');
    const data = await res.json();
    if (data.success) {
      setEmployees(data.employees.map((e: any) => ({
        employeeNo: e.employeeNo,
        name: `${e.firstName} ${e.lastName}`,
        defaultShift: e.shiftStart || '09:00 AM'
      })));
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    const res = await fetch('/api/schedules');
    const data = await res.json();
    if (data.success) setSchedules(data.schedules);
    setLoading(false);
  };

  useEffect(() => {
    fetchRegistry();
    fetchSchedules();
  }, []);

  const weekDays = [...Array(7)].map((_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const getShiftFor = (empNo: string, date: string) => {
    return schedules.find(s => s.employeeNo === empNo && s.date === date)?.startTime || '';
  };

  const handleUpdateShift = async (empNo: string, date: string, startTime: string) => {
    if (!startTime) return;
    setSaving(`${empNo}-${date}`);
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeNo: empNo, date, startTime, endTime: '06:00 PM' })
    });
    if (res.ok) {
      setSchedules(prev => {
        const existing = prev.find(s => s.employeeNo === empNo && s.date === date);
        if (existing) {
          return prev.map(s => s.employeeNo === empNo && s.date === date ? { ...s, startTime } : s);
        }
        return [...prev, { employeeNo: empNo, date, startTime, endTime: '06:00 PM' }];
      });
      toast.success('Shift Synchronized', { position: 'bottom-right', style: { background: '#0a0a0a', color: '#c9a236', border: '1px solid rgba(201,162,54,0.1)' } });
    }
    setSaving(null);
  };

  const moveWeek = (offset: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + offset * 7);
    setCurrentWeekStart(newDate);
  };

  if (!isAdmin) return null;

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tighter flex items-center gap-4">
              <Clock className="text-brand-gold" size={36} />
              Shift Commander
            </h1>
            <p className="text-brand-gold/60 font-semibold tracking-wide mt-1">Operational master schedule & daily overrides</p>
          </div>

          <div className="flex items-center gap-6 bg-white/5 border border-white/10 p-2 rounded-[2rem] backdrop-blur-xl">
            <button onClick={() => moveWeek(-1)} className="p-3 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all">
              <ChevronLeft size={20} />
            </button>
            <div className="text-center px-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Active Cycle</h2>
              <p className="text-xs font-black text-white whitespace-nowrap">
                {weekDays[0].toLocaleDateString()} - {weekDays[6].toLocaleDateString()}
              </p>
            </div>
            <button onClick={() => moveWeek(1)} className="p-3 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="bg-brand-obsidian border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10">
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/20 w-80">Employee Resource</th>
                  {weekDays.map(day => (
                    <th key={day.toISOString()} className="p-8 text-center">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">{day.toLocaleString('default', { weekday: 'short' })}</p>
                       <p className={`text-xs font-black ${formatDate(day) === formatDate(new Date()) ? 'text-brand-gold' : 'text-white/60'}`}>{day.getDate()}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={8} className="p-10 h-24 bg-white/5" />
                    </tr>
                  ))
                ) : (
                  employees.map(emp => (
                    <tr key={emp.employeeNo} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="p-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-brand-gold border border-white/5 group-hover:border-brand-gold/20 transition-all">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-bold tracking-tight">{emp.name}</p>
                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">{emp.employeeNo}</p>
                          </div>
                        </div>
                      </td>
                      {weekDays.map(day => {
                        const dateStr = formatDate(day);
                        const currentVal = getShiftFor(emp.employeeNo, dateStr);
                        const isSaving = saving === `${emp.employeeNo}-${dateStr}`;
                        
                        return (
                          <td key={dateStr} className="p-4">
                            <div className="relative">
                               <input 
                                 type="text"
                                 placeholder={emp.defaultShift}
                                 defaultValue={currentVal}
                                 onBlur={(e) => {
                                   if (e.target.value !== currentVal) {
                                      handleUpdateShift(emp.employeeNo, dateStr, e.target.value);
                                   }
                                 }}
                                 className={`w-full bg-white/[0.02] border ${currentVal ? 'border-brand-gold/40 text-brand-gold' : 'border-white/5 text-white/40'} rounded-2xl px-4 py-4 text-[10px] font-black text-center focus:border-brand-gold outline-none transition-all placeholder:text-white/10 tracking-widest`}
                               />
                               {isSaving && (
                                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                   <Loader2 className="animate-spin text-brand-gold" size={14} />
                                 </div>
                               )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Master Controls */}
        <div className="flex items-center justify-between p-10 bg-white/[0.02] border border-white/5 rounded-[3rem]">
           <div className="flex items-center gap-6">
              <div className="p-4 bg-brand-gold/10 rounded-2xl">
                 <CalendarIcon className="text-brand-gold" size={24} />
              </div>
              <div>
                 <p className="text-white font-bold tracking-tight text-lg">Auto-Propagate Registry</p>
                 <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">Changes are live across all biometric terminal points</p>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                 {[...Array(4)].map((_, i) => (
                   <div key={i} className="w-10 h-10 rounded-full bg-white/10 border-2 border-brand-obsidian" />
                 ))}
              </div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">
                 +142 Active Deployments
              </p>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
