'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ClockUI from '@/components/ui/ClockUI';
import { Calendar, MapPin, History, Search, User, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

interface AttendanceRecord {
  id: string;
  employeeNo?: string;
  name?: string;
  date: string;
  timeIn: string;
  timeOut: string;
  hours: number;
  status: string;
  location: string;
}

export default function AttendancePage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role?.toUpperCase();
  const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(role);
  const isSuperAdmin = role === 'SUPERADMIN';
  const isHR = role === 'HR';
  
  const [records, setRecords] = React.useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterEmp, setFilterEmp] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  const fetchRecords = (empNo?: string) => {
    setLoading(true);
    const url = empNo ? `/api/attendance?employeeNo=${empNo}` : '/api/attendance';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRecords(data.records);
          setCurrentPage(1); // Reset to first page on new fetch
        }
        setLoading(false);
      });
  };

  React.useEffect(() => {
    fetchRecords();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords(filterEmp);
  };

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-white tracking-tighter">Timekeeping Hub</h1>
              {isSuperAdmin && (
                <span className="bg-brand-gold/10 text-brand-gold text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-brand-gold/20 flex items-center gap-2">
                  <ShieldCheck size={12} />
                  Absolute Oversight
                </span>
              )}
              {isHR && (
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-2">
                  <ShieldCheck size={12} />
                  Managerial View
                </span>
              )}
            </div>
            <p className="text-brand-gold/60 font-semibold tracking-wide mt-1">Registry of organizational operational hours</p>
          </div>
          
          {isAdmin && (
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-gold transition-colors" size={20} />
              <input 
                type="text"
                placeholder="Employee No. / Global Search"
                value={filterEmp}
                onChange={(e) => setFilterEmp(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none w-80 transition-all backdrop-blur-xl"
              />
            </form>
          )}
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Clock Terminal (Hidden for Superadmin) */}
          {!isSuperAdmin && (
            <div className="col-span-12 lg:col-span-4">
              <ClockUI onUpdate={() => fetchRecords()} />
              
              <div className="mt-8 p-8 bg-white/5 border border-white/5 rounded-[2.5rem] transition-all hover:bg-white/[0.04]">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-6 flex items-center gap-2">
                  <Calendar size={14} className="text-brand-gold" />
                  Operational Schedule
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-[9px] font-black text-brand-gold uppercase tracking-widest">Shift Start</span>
                    <span className="text-sm font-black text-white">{(session?.user as any)?.shiftStart || '09:00 AM'}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-[9px] font-black text-brand-gold uppercase tracking-widest">Shift End</span>
                    <span className="text-sm font-black text-white">{(session?.user as any)?.shiftEnd || '06:00 PM'}</span>
                  </div>
                </div>

                <p className="text-[9px] text-white/30 leading-relaxed font-medium mt-6 uppercase tracking-wider text-center">
                  All shifts are validated against the enterprise geofence. 
                </p>
              </div>
            </div>
          )}

          {/* Right Column: History Table */}
          <div className={`col-span-12 ${isSuperAdmin ? 'lg:col-span-12' : 'lg:col-span-8'}`}>
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl h-full flex flex-col">
              <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                  <History size={14} />
                  {isAdmin ? 'Enterprise Chronicle Audit' : 'Personal Activity History'}
                </span>
                {isAdmin && records.length > 0 && (
                  <span className="text-[10px] font-bold text-brand-gold/40">
                    Showing {records.length} records
                  </span>
                )}
              </div>

              <div className="overflow-x-auto flex-grow">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-brand-gold/60">Identity & Date</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-brand-gold/60">In / Out</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-brand-gold/60">Location</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-brand-gold/60 text-right">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      [...Array(8)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={4} className="px-8 py-10 h-16 bg-white/[0.01]" />
                        </tr>
                      ))
                    ) : records.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-white/20 text-xs font-bold uppercase tracking-widest italic">
                          No records found in registry
                        </td>
                      </tr>
                    ) : (
                      records.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((r) => (
                        <tr key={r.id} className="hover:bg-brand-gold/[0.02] transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              {isAdmin && (
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-gold/40 group-hover:text-brand-gold transition-colors">
                                  <User size={14} />
                                </div>
                              )}
                              <div>
                                <p className="text-white font-bold text-sm leading-tight">
                                  {isAdmin && r.name ? r.name : new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {isAdmin && r.name && <span className="text-[9px] text-white/20 font-mono">{new Date(r.date).toLocaleDateString()}</span>}
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                    r.status === 'On Time' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                  }`}>
                                    {r.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6 font-mono text-[11px] text-white/60">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400 font-bold">{r.timeIn ? new Date(r.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}</span>
                              <span className="text-white/20">→</span>
                              <span className="text-brand-gold font-bold">{r.timeOut ? new Date(r.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-2 text-white/40 group-hover:text-white/60 transition-colors">
                              <MapPin size={12} className="text-brand-gold/60" />
                              <span className="text-[10px] font-bold truncate max-w-[200px]">{r.location?.split(' (')[0] || '—'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <span className="text-white font-black text-lg tracking-tighter">{r.hours ? `${r.hours}h` : '—'}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination 
                currentPage={currentPage}
                totalPages={Math.ceil(records.length / pageSize)}
                onPageChange={setCurrentPage}
                totalEntries={records.length}
                pageSize={pageSize}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
