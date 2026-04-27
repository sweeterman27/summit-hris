'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Shield, Layers, Save, Loader2, FileUp } from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DocumentUploadModal({ isOpen, onClose, onSuccess }: DocumentUploadModalProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Policy');
  const [targetRoles, setTargetRoles] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/documents/upload?title=${encodeURIComponent(title)}&category=${category}&targetRoles=${targetRoles}&filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file
      });

      if (res.ok) {
        onSuccess();
        onClose();
        setFile(null);
        setTitle('');
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
                <h2 className="text-3xl font-bold text-white tracking-tighter">Library Terminal</h2>
                <p className="text-brand-gold/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Resource Archive Protocol</p>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all
                  ${file ? 'border-brand-gold/50 bg-brand-gold/5' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}
                `}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <div className={`p-5 rounded-2xl ${file ? 'bg-brand-gold/20 text-brand-gold' : 'bg-white/5 text-white/20'}`}>
                  {file ? <FileText size={32} /> : <FileUp size={32} />}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white tracking-tight">
                    {file ? file.name : 'Select Enterprise Resource'}
                  </p>
                  <p className="text-[10px] text-white/20 uppercase tracking-widest font-black mt-1">PDF, DOCX, or Images accepted</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold/40" size={18} />
                  <input 
                    required
                    placeholder="Document Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all placeholder:text-white/10 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Layers className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold/40" size={18} />
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold appearance-none"
                    >
                      {['Policy', 'Handbook', 'Forms', 'Training', 'Notice'].map(c => (
                        <option key={c} value={c} className="bg-brand-obsidian">{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold/40" size={18} />
                    <select 
                      value={targetRoles}
                      onChange={(e) => setTargetRoles(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold appearance-none"
                    >
                      <option value="All" className="bg-brand-obsidian">Global Access</option>
                      <option value="Admin" className="bg-brand-obsidian">Admin Only</option>
                      <option value="Manager" className="bg-brand-obsidian">Management</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full h-16 bg-brand-gold hover:bg-brand-gold/90 text-brand-obsidian font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-xl shadow-brand-gold/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <Save size={18} />
                    Deploy Resource
                  </>
                )}
              </button>
            </form>

            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
