'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeaveRequestModal from '@/components/ui/LeaveRequestModal';
import { CalendarRange, Plus, FileText, CheckCircle2, Clock, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

interface LeaveRequest {
  id: string;
  type: string;
  start: string;
  end: string;
  days: number;
  reason: string;
  status: string;
  remarks?: string;
}

import { useSession } from 'next-auth/react';

export default function LeaveHub() {
  const { data: session } = useSession();
  const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes((session?.user as any)?.role?.toUpperCase());
  
  const [requests, setRequests] = React.useState<LeaveRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [reviewing, setReviewing] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  const fetchRequests = () => {
    fetch('/api/leave')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRequests(data.requests);
          setCurrentPage(1);
        }
        setLoading(false);
      });
  };

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    setReviewing(id);
    const remarks = prompt(`Enter ${action} remarks (optional):`);
    try {
      const res = await fetch('/api/leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, remarks })
      });
      if (res.ok) fetchRequests();
    } catch (err) {
      console.error(err);
    } finally {
      setReviewing(null);
    }
  };

  React.useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tighter">Leave Pipeline</h1>
            <p className="text-brand-gold/60 font-semibold tracking-wide mt-1">Management of your absence credits</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-gold hover:bg-brand-gold/90 text-brand-obsidian font-bold py-4 px-8 rounded-2xl shadow-xl shadow-brand-gold/10 flex items-center gap-3 transition-all active:scale-[0.98]"
          >
            <Plus size={20} />
            <span>File New Request</span>
          </button>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Main List */}
          <div className="col-span-12">
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
              <div className="px-8 py-6 border-b border-white/10 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{isAdmin ? 'Enterprise Review Queue' : 'Request History'}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-brand-gold/60">Category & Dates</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-brand-gold/60">Reason</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-brand-gold/60">Duration</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-brand-gold/60 text-right">Status / Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={4} className="px-8 py-10 h-16 bg-white/[0.01]" />
                        </tr>
                      ))
                    ) : requests.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-24 text-center text-white/20 text-xs font-bold uppercase tracking-widest italic">
                          No active requests in pipeline
                        </td>
                      </tr>
                    ) : (
                      requests.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((r) => (
                        <tr key={r.id} className="hover:bg-brand-gold/[0.02] transition-colors group">
                          <td className="px-8 py-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-gold group-hover:scale-110 transition-transform">
                                <CalendarRange size={18} />
                              </div>
                              <div>
                                <p className="text-white font-bold text-sm">{r.type}</p>
                                <p className="text-[10px] text-white/40 font-mono mt-0.5">
                                  {new Date(r.start).toLocaleDateString()} — {new Date(r.end).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-8">
                            <p className="text-[11px] text-white/60 leading-relaxed max-w-xs">{r.reason}</p>
                            {(r as any).name && isAdmin && (
                               <p className="text-[9px] text-brand-gold mt-1 font-black uppercase tracking-widest">Requester: {(r as any).name}</p>
                            )}
                            {r.remarks && (
                              <p className="text-[9px] text-[#c9a236] mt-2 font-bold uppercase tracking-widest">
                                Reviewer: {r.remarks}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-8">
                            <span className="text-white font-black text-xl tracking-tighter">{r.days}d</span>
                          </td>
                          <td className="px-8 py-8 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {isAdmin && r.status === 'Pending' ? (
                                <>
                                  <button 
                                    onClick={() => handleReview(r.id, 'approve')}
                                    disabled={!!reviewing}
                                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                  >
                                    Approve
                                  </button>
                                  <button 
                                    onClick={() => handleReview(r.id, 'reject')}
                                    disabled={!!reviewing}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
                                  r.status === 'Approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                  r.status === 'Rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                  'bg-brand-gold/10 border-brand-gold/20 text-brand-gold'
                                }`}>
                                  {r.status === 'Approved' ? <CheckCircle2 size={14} /> : 
                                   r.status === 'Rejected' ? <XCircle size={14} /> : <Clock size={14} />}
                                  <span className="text-[10px] font-black uppercase tracking-widest">{r.status}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination 
                currentPage={currentPage}
                totalPages={Math.ceil(requests.length / pageSize)}
                onPageChange={setCurrentPage}
                totalEntries={requests.length}
                pageSize={pageSize}
              />
            </div>
          </div>
        </div>
      </div>

      <LeaveRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={fetchRequests}
      />
    </DashboardLayout>
  );
}
