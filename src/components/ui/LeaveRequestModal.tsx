'use client';

import React from 'react';
import { X, Send, Calendar, FileText, Loader2 } from 'lucide-react';

export default function LeaveRequestModal({ isOpen, onClose, onUpdate }: { isOpen: boolean; onClose: () => void; onUpdate: () => void }) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    type: 'Sick',
    start: '',
    end: '',
    days: 1,
    reason: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        onUpdate();
        onClose();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-brand-obsidian/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-brand-obsidian border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <button onClick={onClose} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="mb-10">
          <h2 className="text-3xl font-bold text-white tracking-tighter">File Absence</h2>
          <p className="text-brand-gold/60 text-xs font-semibold uppercase tracking-widest mt-1">Submit for HR synchronization</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Category</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all"
              >
                {['Sick', 'Vacation', 'Annual', 'Emergency', 'Additional', 'Birthday', 'Others'].map(t => (
                  <option key={t} value={t} className="bg-brand-obsidian">{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Total Days</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                value={formData.days}
                onChange={(e) => setFormData({ ...formData, days: parseFloat(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Start Date</label>
              <input
                type="date"
                required
                value={formData.start}
                onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">End Date</label>
              <input
                type="date"
                required
                value={formData.end}
                onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Reason / Remarks</label>
            <textarea
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Provide context for this request..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:border-brand-gold/50 outline-none transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-gold hover:bg-brand-gold/90 disabled:opacity-50 text-brand-obsidian font-bold py-5 rounded-2xl shadow-xl shadow-brand-gold/10 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><span>Submit Pipeline Request</span> <Send size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
