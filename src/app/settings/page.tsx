'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Settings, Shield, MapPin, Clock, Bell, Save, Loader2, RotateCcw, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface SystemSetting {
  name: string;
  value: string;
  description: string;
  lastUpdated: string;
}

export default function GlobalSettings() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const user = session?.user as { role?: string } | undefined;
  const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user?.role?.toUpperCase() || '');

  const fetchSettings = (isManual = false) => {
    if (isManual) setLoading(true);
    fetch('/api/settings', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
      .then(res => res.json())
      .then(data => {
        if (data.success) setSettings(data.settings);
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    
    const initFetch = async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
        const data = await res.json();
        if (isMounted && data.success) {
          setSettings(data.settings);
          setLoading(false);
        }
      } catch {
        console.error("Failed to sync system registry");
      }
    };

    initFetch();
    return () => { isMounted = false; };
  }, []);

  const handleUpdateSetting = (name: string, value: string) => {
    setSettings(prev => prev.map(s => s.name === name ? { ...s, value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'System registry synchronized successfully.' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch {
      setMessage({ type: 'error', text: 'Synchronization failed.' });
    } finally {
      setSaving(false);
    }
  };

  const getIcon = (name: string) => {
    if (name.includes('Latitude') || name.includes('Longitude') || name.includes('Radius')) return <MapPin size={18} />;
    if (name.includes('Shift') || name.includes('Grace')) return <Clock size={18} />;
    return <Zap size={18} />;
  };

  if (!isAdmin) return null;

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tighter flex items-center gap-4">
              <Settings className="text-brand-gold animate-[spin_8s_linear_infinite]" size={36} />
              System Terminal
            </h1>
            <p className="text-brand-gold/60 font-semibold tracking-wide mt-1">Configure global operational protocols</p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => fetchSettings(true)}
              className="h-12 px-6 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl transition-all flex items-center gap-2"
            >
              <RotateCcw size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Reset</span>
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="h-12 px-8 bg-brand-gold hover:bg-brand-gold/90 text-brand-obsidian font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center gap-2 shadow-xl shadow-brand-gold/10 transition-all active:scale-[0.98]"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Commit Changes
            </button>
          </div>
        </div>

        {message.text && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center border ${
              message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Settings Grid */}
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 border border-white/10 rounded-[2rem] animate-pulse" />
            ))
          ) : (
            settings.map((s, i) => (
              <motion.div 
                key={s.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/[0.02] border border-white/5 hover:border-brand-gold/10 rounded-[2.5rem] p-8 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-brand-gold/10 rounded-2xl text-brand-gold group-hover:scale-110 transition-transform">
                    {getIcon(s.name)}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg tracking-tight">{s.name}</h3>
                    <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest mt-1">{s.description}</p>
                  </div>
                </div>

                <div className="w-64">
                   <input 
                     type="text"
                     value={s.value}
                     onChange={(e) => handleUpdateSetting(s.name, e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-right font-black focus:border-brand-gold/50 outline-none transition-all placeholder:text-white/10 tracking-widest"
                   />
                   <p className="text-right text-[8px] text-white/10 mt-2 uppercase font-black">
                     Sync: {s.lastUpdated ? new Date(s.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Initial'}
                   </p>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/5 border border-red-500/10 rounded-[2.5rem] p-10 mt-10">
           <div className="flex items-center gap-4 mb-6">
             <Shield className="text-red-500" size={24} />
             <h4 className="text-red-500 font-black uppercase tracking-[0.3em] text-xs">Security Protocol Override</h4>
           </div>
           <div className="flex items-center justify-between">
              <p className="text-white/40 text-[11px] font-medium leading-relaxed max-w-xl">
                Modifying global coordinates or shift parameters will retroactively affect all attendance validation for the current cycle. Ensure operational alignment before committing.
              </p>
              <button className="px-6 h-12 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                Audit Logs
              </button>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
