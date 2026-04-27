'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X, ShieldCheck } from 'lucide-react';

type ToastType = 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'INFO', title?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Portal */}
      <div className="fixed bottom-10 right-10 z-[9999] flex flex-col gap-4 w-[400px]">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="relative group"
            >
              <div className="bg-[#0a0904]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                {/* Accent Line */}
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  t.type === 'SUCCESS' ? 'bg-emerald-500' : 
                  t.type === 'ERROR' ? 'bg-red-500' : 
                  t.type === 'WARNING' ? 'bg-amber-500' : 'bg-brand-gold'
                }`} />

                <div className="flex gap-5">
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    t.type === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' : 
                    t.type === 'ERROR' ? 'bg-red-500/10 text-red-500' : 
                    t.type === 'WARNING' ? 'bg-amber-500/10 text-amber-500' : 'bg-brand-gold/10 text-brand-gold'
                  }`}>
                    {t.type === 'SUCCESS' && <CheckCircle2 size={20} />}
                    {t.type === 'ERROR' && <AlertTriangle size={20} />}
                    {t.type === 'WARNING' && <AlertTriangle size={20} />}
                    {t.type === 'INFO' && <Info size={20} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                        {t.title || 'System Notification'}
                      </span>
                      <button 
                        onClick={() => removeToast(t.id)}
                        className="text-white/10 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-white tracking-tight leading-relaxed">
                      {t.message}
                    </p>
                  </div>
                </div>

                {/* Shimmer Effect */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
