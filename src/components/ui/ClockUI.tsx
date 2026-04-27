'use client';

import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, Loader2, Camera, ShieldCheck } from 'lucide-react';
import BiometricModal from './BiometricModal';
import AccomplishmentModal from './AccomplishmentModal';
import { useToast } from './Toast';

export default function ClockUI({ onUpdate }: { onUpdate: () => void }) {
  const [loading, setLoading] = React.useState(false);
  const [biometricType, setBiometricType] = React.useState<'in' | 'out' | null>(null);
  const [showAccomplishment, setShowAccomplishment] = React.useState(false);
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  const startClockFlow = (type: 'in' | 'out') => {
    setLoading(true);

    if (!navigator.geolocation) {
      toast('Geolocation services are not supported by this terminal.', 'ERROR', 'SYSTEM INCOMPATIBILITY');
      setLoading(false);
      return;
    }

    toast('Requesting orbital geofence lock...', 'INFO', 'GEOLOCATION SCAN');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        
        if (type === 'out') {
          // Check accomplishment status first
          setShowAccomplishment(true);
        } else {
          setBiometricType(type);
          toast('Geofence locked. Awaiting biometric identity verification.', 'SUCCESS', 'LOCATION VERIFIED');
        }
        setLoading(false);
      },
      (err) => {
        console.error('GPS Error:', err);
        toast('Location access denied. Operational geofence requires active GPS.', 'ERROR', 'ACCESS DENIED');
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleAccomplishmentSubmitted = () => {
    setShowAccomplishment(false);
    setBiometricType('out');
    toast('Geofence locked. Awaiting biometric identity verification.', 'SUCCESS', 'LOCATION VERIFIED');
  };

  const handleVerified = async (photoData: string) => {
    const activeType = biometricType;
    setBiometricType(null);
    setLoading(true);
    toast('Transmitting encrypted operational telemetry...', 'INFO', 'DATA UPLOAD');

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeType,
          lat: coords?.lat,
          lng: coords?.lng,
          photo: photoData
        })
      });
      const data = await res.json();
      
      if (data.success) {
        toast(data.message, 'SUCCESS', 'TERMINAL AUTHORIZED');
        onUpdate();
      } else {
        toast(data.message, 'ERROR', 'AUTHORIZATION DENIED');
      }
    } catch (err) {
      console.error('Clocking Request Error:', err);
      toast('Cloud connectivity error. Transaction cached locally.', 'WARNING', 'LINK FAILURE');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden shadow-deep">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Time Terminal</h2>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck size={10} className="text-brand-gold" />
                <p className="text-brand-gold/60 text-[9px] font-black uppercase tracking-[0.2em]">Biometric & Geofence Active</p>
              </div>
            </div>
            <div className="w-14 h-14 bg-brand-gold/10 border border-brand-gold/20 rounded-2xl flex items-center justify-center text-brand-gold shadow-lg">
              <Clock size={28} strokeWidth={1.5} />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => startClockFlow('in')}
              disabled={loading}
              className="flex-1 h-16 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-xl shadow-emerald-500/10 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><span>Clock In</span> <Camera size={18} /></>}
            </button>
            <button
              onClick={() => startClockFlow('out')}
              disabled={loading}
              className="flex-1 h-16 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" /> : <span>Clock Out</span>}
            </button>
          </div>
        </div>

        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none" />
      </div>

      <BiometricModal 
        isOpen={!!biometricType} 
        onClose={() => setBiometricType(null)} 
        onVerified={handleVerified}
        type={biometricType || 'in'}
      />

      <AccomplishmentModal 
        isOpen={showAccomplishment}
        onClose={() => setShowAccomplishment(false)}
        onSubmitted={handleAccomplishmentSubmitted}
      />
    </>
  );
}
