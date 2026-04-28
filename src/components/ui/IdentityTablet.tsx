'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { Camera, MapPin, BadgeCheck, ShieldCheck, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

import ProfileModal from './ProfileModal';

import useSWR from 'swr';

interface IdentityUser {
  employeeNo: string;
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  position?: string;
  profilePhoto?: string;
}

export default function IdentityTablet() {
  const { data: session } = useSession();
  const sessionUser = session?.user as IdentityUser | undefined;
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  // Fetch live employee data
  const { data: empData, mutate } = useSWR(sessionUser ? '/api/employees' : null);
  
  const compressImage = (file: File): Promise<Blob> => {
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

          // Max resolution 800px (Plenty for a profile card)
          const MAX_SIZE = 800;
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
          }, 'image/jpeg', 0.8); // 80% quality is perfect balance
        };
      };
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionUser) return;

    setUploading(true);
    setProgress(10);
    try {
      const compressedBlob = await compressImage(file);
      setProgress(50);
      
      const res = await fetch(`/api/upload?filename=profile_${sessionUser.employeeNo}_${Date.now()}.jpg`, {
        method: 'POST',
        body: compressedBlob,
      });

      setProgress(90);
      const data = await res.json();
      if (data.success) {
        setProgress(100);
        await mutate(); // Refresh live data
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    }
  };

  // Find the current logged-in user in the live data list
  const liveUser = empData?.employees?.find((e: any) => e.employeeNo?.toString() === sessionUser?.employeeNo?.toString());
  
  // Combine session and live data (Live data takes priority for display)
  const user = liveUser ? {
    ...sessionUser,
    name: `${liveUser.firstName} ${liveUser.lastName}`,
    email: liveUser.email,
    role: liveUser.role, // FIX: Ensure role is pulled from live registry
    department: liveUser.department,
    position: liveUser.position,
    profilePhoto: liveUser.photo || sessionUser?.profilePhoto
  } : sessionUser;

  if (!user) return null;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group overflow-hidden c-card transition-all duration-500 hover:shadow-brand-gold/10"
      >
        {/* Mesh Gradient Background */}
        <div className="absolute inset-0 mesh-gradient opacity-40 group-hover:opacity-60 transition-opacity" />

        <div className="relative z-10 flex flex-col items-center text-center gap-8">
          {/* Avatar Portal - Diamond Standard */}
          <div className="relative group/avatar w-36 h-36 mx-auto mb-6">
            <div className="absolute -inset-1 bg-gradient-to-tr from-brand-gold/40 to-transparent rounded-[2.5rem] blur-sm group-hover/avatar:blur-md transition-all duration-500" />
            <div className="relative w-36 h-36 bg-brand-obsidian rounded-[2.5rem] border border-brand-gold/20 flex items-center justify-center overflow-hidden">
              {user.profilePhoto ? (
                <Image 
                  src={user.profilePhoto} 
                  alt={user.name || 'Profile'} 
                  width={144} 
                  height={144}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110"
                />
              ) : (
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/10 group-hover/avatar:text-brand-gold transition-colors duration-500">
                  <Camera size={32} />
                </div>
              )}
            
              {/* Upload Overlay */}
              <label className="absolute inset-0 bg-brand-obsidian/80 backdrop-blur-md opacity-0 group-hover/avatar:opacity-100 transition-all duration-500 flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin text-brand-gold"><Camera size={24} /></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{progress}% SYNCED</span>
                    <div className="absolute bottom-0 left-0 h-1 bg-brand-gold transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                ) : (
                  <>
                    <Camera size={24} className="text-brand-gold mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Update Core Identity</span>
                  </>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            
            {/* Status Badge - Kinetic */}
            <div className="absolute -bottom-2 -right-2 bg-emerald-500/10 backdrop-blur-xl px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-2 shadow-xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
            </div>
          </div>

          {/* Identity Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="px-4 py-1.5 bg-brand-gold/5 border border-brand-gold/20 rounded-full text-[10px] font-black text-brand-gold uppercase tracking-[0.3em] shadow-inner">
                {user.role}
              </span>
              <div className="w-8 h-8 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold shadow-lg">
                <ShieldCheck size={16} strokeWidth={1.5} />
              </div>
            </div>
            
            <h2 className="text-3xl font-black text-white tracking-tighter text-glow">{user.name}</h2>
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-6 bg-brand-gold/20" />
              <p className="text-brand-gold font-bold text-xs uppercase tracking-widest">{user.position}</p>
              <div className="h-px w-6 bg-brand-gold/20" />
            </div>
          </div>

          {/* Meta Grid - Premium Tiles */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-white/[0.03] p-5 rounded-[1.8rem] border border-white/5 flex flex-col items-center gap-2 hover:bg-white/[0.05] transition-colors group/tile">
              <div className="text-brand-gold/40 group-hover/tile:text-brand-gold group-hover/tile:scale-110 transition-all duration-500"><MapPin size={20} strokeWidth={1.5} /></div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-0.5">Deployment</span>
                <span className="text-xs font-black text-white tracking-wide">{user.department}</span>
              </div>
            </div>
            <div className="bg-white/[0.03] p-5 rounded-[1.8rem] border border-white/5 flex flex-col items-center gap-2 hover:bg-white/[0.05] transition-colors group/tile">
              <div className="text-brand-gold/40 group-hover/tile:text-brand-gold group-hover/tile:scale-110 transition-all duration-500"><BadgeCheck size={20} strokeWidth={1.5} /></div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-0.5">Registry ID</span>
                <span className="text-xs font-black text-white tracking-wide">#{user.employeeNo}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full h-14 bg-white/5 hover:bg-brand-gold/10 text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold border border-brand-gold/10 hover:border-brand-gold/30 rounded-2xl transition-all flex items-center justify-center gap-3 group/btn shadow-xl active:scale-[0.98]"
          >
            <Sparkles size={14} className="group-hover/btn:animate-spin" />
            Manage Operational Profile
          </button>
        </div>
      </motion.div>

      <ProfileModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={() => mutate()} 
        employee={{
          employeeNo: user.employeeNo,
          firstName: liveUser?.firstName || user.name?.split(' ')[0],
          lastName: liveUser?.lastName || user.name?.split(' ').slice(1).join(' '),
          middleName: liveUser?.middleName,
          email: user.email,
          department: user.department,
          position: user.position,
          birthdate: liveUser?.birthdate,
          civilStatus: liveUser?.civilStatus,
          gender: liveUser?.gender,
          mobileNo: liveUser?.mobileNo,
          completeAddress: liveUser?.completeAddress,
          emergencyContact: liveUser?.emergencyContact,
          emergencyNo: liveUser?.emergencyNo
        }}
        isAdmin={false}
      />
    </>
  );
}
