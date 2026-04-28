'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, FileText, Camera, CheckCircle2, Loader2, Upload, Trash2 } from 'lucide-react';
import { useToast } from './Toast';

interface AccomplishmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function AccomplishmentModal({ isOpen, onClose, onSubmitted }: AccomplishmentModalProps) {
  const [summary, setSummary] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > 3) {
        toast('Maximum 3 files allowed for evidentiary proof.', 'WARNING', 'LIMIT REACHED');
        return;
      }
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const compressImage = (file: File): Promise<Blob | File> => {
    if (!file.type.startsWith('image/')) return Promise.resolve(file);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new (window as any).Image();
        img.src = event.target?.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1200; // Slightly higher quality for work proof
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(blob || file);
          }, 'image/jpeg', 0.8);
        };
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      toast('Please provide a summary of your daily achievements.', 'WARNING', 'INPUT REQUIRED');
      return;
    }
    if (files.length === 0) {
      toast('Evidence is required. Please upload at least one screenshot/media.', 'WARNING', 'MISSING PROOF');
      return;
    }

    setLoading(true);
    setProgress(10);
    toast('Compressing and transmitting data...', 'INFO', 'DATA SYNC');

    try {
      // Stage 1: Compression (10% - 40%)
      const optimizedFiles = await Promise.all(files.map(async (file, i) => {
        const compressed = await compressImage(file);
        setProgress(10 + ((i + 1) / files.length) * 30);
        return compressed;
      }));

      // Stage 2: Upload (40% - 90%)
      setProgress(45);
      const formData = new FormData();
      formData.append('summary', summary);
      optimizedFiles.forEach((blob, i) => {
        const originalFile = files[i];
        formData.append('files', blob, originalFile.name);
      });

      const res = await fetch('/api/accomplishments', {
        method: 'POST',
        body: formData,
      });

      setProgress(95);

      const data = await res.json();
      if (data.success) {
        setProgress(100);
        toast('Accomplishment report synchronized. Clock-out authorized.', 'SUCCESS', 'REGISTRY UPDATED');
        setTimeout(() => {
          setSummary('');
          setFiles([]);
          onSubmitted();
          setProgress(0);
        }, 500);
      } else {
        toast(data.message || 'Transmission failed.', 'ERROR', 'SYSTEM FAILURE');
      }
    } catch (err) {
      console.error('Submission Error:', err);
      toast('Neural link error. Please try again.', 'ERROR', 'CONNECTION LOST');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-xl bg-brand-obsidian border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="absolute inset-0 mesh-gradient opacity-10 pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-gold/10 border border-brand-gold/20 rounded-2xl flex items-center justify-center text-brand-gold">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Accomplishment Registry</h2>
                  <p className="text-brand-gold/60 text-[9px] font-black uppercase tracking-[0.2em] mt-1">Pre-Clock-Out Operational Briefing</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Work Summary</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Summarize your primary objectives achieved during this shift..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white placeholder:text-white/10 focus:border-brand-gold/50 outline-none transition-all min-h-[150px] resize-none"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Evidence & Proof-of-Work (Max 3)</label>
                
                <div className="grid grid-cols-1 gap-4">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group">
                      <div className="flex items-center gap-3">
                        <Camera size={16} className="text-brand-gold/40" />
                        <span className="text-[11px] font-bold text-white/60 truncate max-w-[250px]">{file.name}</span>
                      </div>
                      <button type="button" onClick={() => removeFile(i)} className="text-red-400/40 hover:text-red-400 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  
                  {files.length < 3 && (
                    <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 hover:border-brand-gold/40 rounded-[2rem] cursor-pointer transition-all hover:bg-brand-gold/5 group">
                      <Upload size={24} className="text-brand-gold/40 group-hover:text-brand-gold transition-colors mb-3" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white/60 transition-colors">Capture or Upload Media</span>
                      <input type="file" className="hidden" multiple accept="image/*,video/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 bg-brand-gold hover:bg-white disabled:opacity-50 text-brand-obsidian font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl shadow-xl transition-all flex flex-col items-center justify-center gap-1 active:scale-[0.98] relative overflow-hidden"
                >
                  {loading ? (
                    <>
                      <div className="flex items-center gap-3 relative z-10">
                        <Loader2 className="animate-spin" size={18} />
                        <span>Transmitting {Math.round(progress)}%</span>
                      </div>
                      <div 
                        className="absolute bottom-0 left-0 h-1 bg-brand-obsidian/20 transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      />
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span>Transmit Registry Data</span>
                      <Send size={18} />
                    </div>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
