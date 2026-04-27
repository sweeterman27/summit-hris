'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Filter, Eye, CheckCircle, AlertCircle, 
  ExternalLink, MessageSquare, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import useSWR, { mutate } from 'swr';

interface ARReport {
  id: string;
  employeeNo: string;
  name: string;
  date: string;
  summary: string;
  mediaUrls: string[];
  status: 'Pending' | 'Approved' | 'Under Review';
  remarks: string;
  timestamp: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AccomplishmentRegistry() {
  const { data, isLoading } = useSWR('/api/accomplishments', fetcher);
  const reports: ARReport[] = data?.reports || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedReport, setSelectedReport] = useState<ARReport | null>(null);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         r.employeeNo.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (status: string) => {
    if (!selectedReport) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/accomplishments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedReport.id, status, remarks })
      });
      if (res.ok) {
        mutate('/api/accomplishments');
        setSelectedReport(null);
        setRemarks('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-gold transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Search Intelligence Registry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-1.5 rounded-2xl">
          {['All', 'Pending', 'Approved', 'Under Review'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === f ? 'bg-brand-gold text-brand-obsidian' : 'text-white/40 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3].map(i => (
            <div key={i} className="h-64 bg-white/5 border border-white/5 rounded-[2.5rem] animate-pulse" />
          ))
        ) : filteredReports.length === 0 ? (
          <div className="col-span-full py-20 text-center text-white/20 text-sm font-black uppercase tracking-[0.3em] italic">
            Registry Empty - No proof-of-work documents found
          </div>
        ) : (
          filteredReports.map(report => (
            <div 
              key={report.id}
              className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:border-brand-gold/30 transition-all group relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                    report.status === 'Approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    report.status === 'Under Review' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    'bg-brand-gold/10 border-brand-gold/20 text-brand-gold'
                  }`}>
                    {report.status}
                  </div>
                  <span className="text-[10px] font-mono text-white/20">{report.date}</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{report.name}</h3>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-6">ID: #{report.employeeNo}</p>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-6">
                  <p className="text-xs text-white/60 leading-relaxed line-clamp-3 italic">
                    "{report.summary}"
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {report.mediaUrls.map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-lg bg-brand-gold/20 border border-brand-obsidian flex items-center justify-center text-brand-gold text-[10px] font-black">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setSelectedReport(report)}
                    className="h-10 px-6 bg-white/5 hover:bg-brand-gold/10 text-[9px] font-black uppercase tracking-widest text-brand-gold border border-brand-gold/10 rounded-xl transition-all flex items-center gap-2"
                  >
                    <Eye size={14} />
                    Audit
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Audit Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
          <div className="w-full max-w-4xl bg-[#0a0904] border border-brand-gold/20 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute inset-0 mesh-gradient opacity-10" />

            <div className="relative z-10 flex flex-col h-full overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-brand-gold/10 border border-brand-gold/20 rounded-2xl flex items-center justify-center text-brand-gold shadow-2xl">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Operational Audit</h2>
                    <p className="text-brand-gold/60 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Proof-of-Work Verification for {selectedReport.name}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedReport(null)} className="text-white/20 hover:text-white transition-colors">
                  <Eye size={24} className="rotate-45" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">Evidence Summary</label>
                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 text-sm text-white/80 leading-[1.8] italic">
                      {selectedReport.summary}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">Administrative Remarks</label>
                    <textarea 
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter audit remarks or rejection reasons..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white focus:border-brand-gold/50 outline-none min-h-[120px] resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest">Media Proof-of-Work</label>
                  <div className="grid grid-cols-1 gap-4">
                    {selectedReport.mediaUrls.map((url, i) => (
                      <a 
                        key={i} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-6 bg-brand-gold/5 border border-brand-gold/20 rounded-2xl group hover:bg-brand-gold/10 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <CheckCircle size={20} className="text-brand-gold" />
                          <span className="text-xs font-bold text-white uppercase tracking-widest">Proof Document {i + 1}</span>
                        </div>
                        <ExternalLink size={18} className="text-brand-gold group-hover:scale-110 transition-transform" />
                      </a>
                    ))}
                  </div>

                  <div className="flex gap-4 pt-8">
                    <button 
                      onClick={() => handleUpdateStatus('Approved')}
                      disabled={processing}
                      className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      {processing ? <Loader2 className="animate-spin" /> : <><CheckCircle size={16} /> Approve Shift</>}
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus('Under Review')}
                      disabled={processing}
                      className="flex-1 h-14 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      {processing ? <Loader2 className="animate-spin" /> : <><AlertCircle size={16} /> Under Review</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
