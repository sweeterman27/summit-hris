'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronRight, Sparkles, UserCheck } from 'lucide-react';
import ProfileModal from './ProfileModal';

export default function ProfileCompletionReminder() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/employees/me')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(data.profile);
        }
        setLoading(false);
      });
  }, []);

  if (loading || !profile) return null;

  const requiredFields = [
    'middleName', 'birthdate', 'civilStatus', 'gender', 
    'mobileNo', 'completeAddress', 'sssNo', 'tinNo', 
    'philhealthNo', 'pagibigNo', 'emergencyContact', 'emergencyNo'
  ];

  const missingFields = requiredFields.filter(f => !profile[f] || profile[f] === '');
  const isComplete = missingFields.length === 0;

  if (isComplete) return null;

  const completionPercentage = Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group overflow-hidden bg-[#0f0d04] border border-brand-gold/20 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(212,175,55,0.05)] mb-10"
      >
        <div className="absolute inset-0 mesh-gradient opacity-10 group-hover:opacity-20 transition-opacity" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-brand-gold/10 flex items-center justify-center text-brand-gold border border-brand-gold/20 shadow-xl relative shrink-0">
               <AlertTriangle size={28} className="animate-pulse" />
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0f0d04]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tighter uppercase mb-1">Incomplete Identity Registry</h3>
              <p className="text-brand-gold/60 text-[10px] font-black uppercase tracking-[0.2em]">Your profile is currently at {completionPercentage}% compliance</p>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {missingFields.slice(0, 3).map(f => (
                  <span key={f} className="px-3 py-1 bg-white/5 rounded-md text-[8px] font-black text-white/40 uppercase tracking-widest border border-white/5">
                    Missing: {f.replace(/([A-Z])/g, ' $1')}
                  </span>
                ))}
                {missingFields.length > 3 && (
                  <span className="px-3 py-1 bg-white/5 rounded-md text-[8px] font-black text-white/40 uppercase tracking-widest border border-white/5">
                    + {missingFields.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-16 px-10 bg-brand-gold hover:bg-white text-brand-obsidian font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-2xl shadow-brand-gold/20 transition-all flex items-center gap-3 active:scale-[0.98] group/btn shrink-0"
          >
            <Sparkles size={16} className="group-hover/btn:rotate-12 transition-transform" />
            Complete Onboarding
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-brand-gold/20 w-full overflow-hidden">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${completionPercentage}%` }}
             className="h-full bg-brand-gold shadow-[0_0_10px_#d4af37]"
           />
        </div>
      </motion.div>

      <ProfileModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={() => window.location.reload()}
        employee={profile}
        isAdmin={false}
      />
    </>
  );
}
