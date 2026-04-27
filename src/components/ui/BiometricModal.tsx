/* eslint-disable @typescript-eslint/ban-ts-comment */
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, X, Loader2, ShieldCheck, AlertCircle, Scan, Target, Cpu, Activity, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Deep Polyfill for libraries expecting Node-style 'util' or global TextEncoder
if (typeof window !== 'undefined') {
  // @ts-expect-error
  window.TextEncoder = window.TextEncoder || (typeof TextEncoder !== 'undefined' ? TextEncoder : class {
    encode(str: string) { return new Uint8Array([...str].map(c => c.charCodeAt(0))); }
  });
  // @ts-expect-error
  window.TextDecoder = window.TextDecoder || (typeof TextDecoder !== 'undefined' ? TextDecoder : class {
    decode(arr: Uint8Array) { return String.fromCharCode(...arr); }
  });
  // @ts-expect-error
  window.util = window.util || {};
  // @ts-expect-error
  window.util.TextEncoder = window.util.TextEncoder || window.TextEncoder;
  // @ts-expect-error
  window.util.TextDecoder = window.util.TextDecoder || window.TextDecoder;
}

interface BiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (photoData: string) => void;
  type: 'in' | 'out';
}

type FaceAPI = typeof import('@vladmandic/face-api');

export default function BiometricModal({ isOpen, onClose, onVerified, type }: BiometricModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [faceapi, setFaceapi] = useState<FaceAPI | null>(null);
  const [scanPulse, setScanPulse] = useState(0);

  const stopCamera = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }, []);

  const detectFace = useCallback(async (apiInstance: FaceAPI) => {
    if (!videoRef.current || !apiInstance) return;

    const interval = setInterval(async () => {
      if (!videoRef.current) {
        clearInterval(interval);
        return;
      }

      try {
        const detections = await apiInstance.detectSingleFace(
          videoRef.current,
          new apiInstance.TinyFaceDetectorOptions()
        ).withFaceLandmarks();

        setIsFaceDetected(!!detections);
        setScanPulse(prev => (prev + 1) % 100);
      } catch (err) {
        // Silently skip frames where detection fails or models aren't ready
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const startCamera = useCallback(async (apiInstance: FaceAPI) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onplay = () => {
          setLoading(false);
          detectFace(apiInstance);
        };
      }
    } catch (err) {
      console.error('Camera Error:', err);
      setError('Camera access denied. Please enable webcam permissions.');
      setLoading(false);
    }
  }, [detectFace]);

  const loadModels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const api = await import('@vladmandic/face-api');
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
      
      if (!api.nets.tinyFaceDetector.params) {
        await Promise.all([
          api.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          api.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
      }
      
      setFaceapi(api);
      await startCamera(api);
    } catch (err) {
      console.error('Model Load Error:', err);
      setError('Biometric engine failed to initialize.');
      setLoading(false);
    }
  }, [startCamera]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (isOpen) {
        if (isMounted) await loadModels();
      } else {
        stopCamera();
        setLoading(false);
        setIsFaceDetected(false);
      }
    };
    init();
    return () => { isMounted = false; };
  }, [isOpen, loadModels, stopCamera]);

  const handleVerify = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const data = canvas.toDataURL('image/jpeg');
      onVerified(data);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-brand-obsidian/95 backdrop-blur-xl overflow-hidden">
          {/* Spatial Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(202,138,4,0.05)_0%,transparent_70%)]" />
             <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
          </motion.div>

          {/* Modal Container: Vision HUD Scale */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, rotateX: 10 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.8, opacity: 0, rotateX: -10 }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="w-full max-w-5xl bg-[#1c1917]/40 border border-white/5 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden z-10 flex flex-col md:flex-row"
            style={{ perspective: '1000px' }}
          >
            {/* Header / Sidebar Controls (Desktop) */}
            <div className="w-full md:w-72 p-8 md:p-10 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-between bg-white/[0.02]">
               <div>
                  <div className="flex items-center gap-3 mb-8">
                     <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20">
                        <Cpu className="text-brand-gold" size={20} />
                     </div>
                     <div>
                        <h2 className="text-xl font-bold text-white tracking-tighter">Vision HUD</h2>
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-gold/40">Secure Identity Layer</p>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Operation</p>
                        <div className="flex items-center gap-3">
                           <Zap size={14} className="text-brand-gold" />
                           <span className="text-xs font-bold text-white">{type === 'in' ? 'CLOCK IN PROTOCOL' : 'CLOCK OUT PROTOCOL'}</span>
                        </div>
                     </div>

                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Live Telemetry</p>
                        <div className="space-y-3">
                           <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Detector</span>
                              <span className="text-[8px] font-black uppercase text-emerald-400">Active</span>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">FPS Rate</span>
                              <span className="text-[8px] font-black uppercase text-white">24.0hz</span>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Latency</span>
                              <span className="text-[8px] font-black uppercase text-white">0.02ms</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="hidden md:block">
                  <button 
                    onClick={onClose}
                    className="w-full h-12 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                  >
                    Abort Terminal
                  </button>
               </div>
            </div>

            {/* Main Vision Display */}
            <div className="flex-1 relative bg-black flex flex-col">
               <div className="flex-1 relative overflow-hidden group">
                  <AnimatePresence mode="wait">
                    {loading && (
                      <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-brand-obsidian z-50"
                      >
                        <div className="relative">
                           <Loader2 className="animate-spin text-brand-gold" size={64} strokeWidth={1} />
                           <motion.div 
                             animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                             transition={{ duration: 2, repeat: Infinity }}
                             className="absolute inset-0 bg-brand-gold/20 blur-xl rounded-full"
                           />
                        </div>
                        <div className="text-center">
                           <p className="text-[12px] font-black uppercase tracking-[0.4em] text-white">Booting Neural Engine</p>
                           <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mt-2">Connecting to enterprise biometric node...</p>
                        </div>
                      </motion.div>
                    )}

                    {error && (
                      <motion.div 
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-brand-obsidian p-10 text-center z-50"
                      >
                        <AlertCircle className="text-red-500" size={64} strokeWidth={1} />
                        <div>
                           <p className="text-xl font-bold text-white tracking-tighter">System Malfunction</p>
                           <p className="text-sm font-medium text-red-500/80 mt-2 max-w-xs mx-auto leading-relaxed">{error}</p>
                        </div>
                        <button onClick={onClose} className="px-8 h-12 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Emergency Close</button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Video Stream */}
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-1000 ${loading || error ? 'opacity-0' : 'opacity-100'}`} 
                  />
                  
                  <canvas ref={canvasRef} className="hidden" />

                  {/* HUD LAYER */}
                  {!loading && !error && (
                    <div className="absolute inset-0 z-30 pointer-events-none">
                       {/* Moving Scan Line */}
                       <motion.div 
                         animate={{ top: ['0%', '100%', '0%'] }}
                         transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                         className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-gold/60 to-transparent shadow-[0_0_15px_rgba(202,138,4,0.5)] z-40"
                       />

                       {/* Static Readouts Overlay */}
                       <div className="absolute inset-8 border border-white/10 rounded-[2rem] pointer-events-none">
                          {/* Corner Brackets */}
                          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-brand-gold rounded-tl-[2rem] opacity-40 shadow-[-5px_-5px_15px_rgba(202,138,4,0.2)]" />
                          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-brand-gold rounded-tr-[2rem] opacity-40 shadow-[5px_-5px_15px_rgba(202,138,4,0.2)]" />
                          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-brand-gold rounded-bl-[2rem] opacity-40 shadow-[-5px_5px_15px_rgba(202,138,4,0.2)]" />
                          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-brand-gold rounded-br-[2rem] opacity-40 shadow-[5px_5px_15px_rgba(202,138,4,0.2)]" />

                          {/* Face Tracker HUD */}
                          <motion.div 
                             animate={{ 
                               borderColor: isFaceDetected ? 'rgba(52, 211, 153, 0.4)' : 'rgba(202, 138, 4, 0.1)',
                               scale: isFaceDetected ? 1.02 : 1
                             }}
                             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[400px] border border-white/5 rounded-[100px] flex flex-col items-center justify-between py-10 transition-colors duration-500"
                          >
                             <div className="flex flex-col items-center gap-2">
                                <Target size={24} className={isFaceDetected ? 'text-emerald-400' : 'text-brand-gold/20'} />
                                <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${isFaceDetected ? 'text-emerald-400' : 'text-white/20'}`}>
                                   {isFaceDetected ? 'IDENTITY LOCALIZED' : 'SEEKING BIOMETRIC HASH'}
                                </span>
                             </div>

                             <div className="w-full px-10">
                                <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                                   <motion.div 
                                      animate={{ width: isFaceDetected ? '100%' : '20%' }}
                                      className={`h-full transition-all duration-700 ${isFaceDetected ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-brand-gold'}`}
                                   />
                                </div>
                             </div>
                          </motion.div>

                          {/* Peripheral Data Panels */}
                          <div className="absolute bottom-10 left-10 hidden lg:block">
                             <div className="flex items-center gap-4 text-white/40">
                                <Activity size={16} />
                                <div className="space-y-1">
                                   <div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden">
                                      <motion.div animate={{ x: [-20, 80] }} transition={{ duration: 2, repeat: Infinity }} className="h-full w-4 bg-brand-gold/40" />
                                   </div>
                                   <p className="text-[6px] font-black uppercase tracking-[0.2em]">Neural Signal Pulse</p>
                                </div>
                             </div>
                          </div>

                          <div className="absolute top-10 right-10 hidden lg:block">
                             <div className="text-right">
                                <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-1">Sector 7-G</p>
                                <p className="text-[6px] font-black text-white/20 uppercase tracking-[0.3em]">Encrypted Stream #0942</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}
               </div>

               {/* Interaction Zone */}
               <div className="h-32 bg-[#1c1917] border-t border-white/5 flex items-center px-10 justify-between">
                  <div className="flex items-center gap-6">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 ${isFaceDetected ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-white/5 border border-white/5 text-white/10'}`}>
                        <ShieldCheck size={28} />
                     </div>
                     <div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${isFaceDetected ? 'text-emerald-400' : 'text-white/20'}`}>
                           {isFaceDetected ? 'VERIFICATION READY' : 'WAITING FOR SOURCE'}
                        </p>
                        <p className="text-white font-bold text-lg tracking-tighter">
                           {isFaceDetected ? 'Biometric ID Lock Confirmed' : 'Position Face within Viewport'}
                        </p>
                     </div>
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={!isFaceDetected}
                    className="h-16 px-10 bg-brand-gold hover:bg-brand-gold/90 disabled:opacity-20 disabled:grayscale text-brand-obsidian font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-brand-gold/10 flex items-center gap-4 transition-all active:scale-[0.95]"
                  >
                    <Camera size={18} />
                    Execute Registry Entry
                  </button>
               </div>
            </div>

            {/* Mobile Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 md:hidden w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white z-50"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
