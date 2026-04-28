'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Mail, Briefcase, MapPin, Target, ChevronDown, Cake, Smartphone } from 'lucide-react';
import { DEPARTMENTS, POSITIONS } from '@/lib/constants';
import MapSelector from './MapSelector';

interface Employee {
  employeeNo: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  department?: string;
  position?: string;
  workLat?: string;
  workLng?: string;
  workRadius?: string;
  shiftStart?: string;
  shiftEnd?: string;
  birthdate?: string;
  civilStatus?: string;
  gender?: string;
  mobileNo?: string;
  completeAddress?: string;
  sssNo?: string;
  tinNo?: string;
  philhealthNo?: string;
  pagibigNo?: string;
  emergencyContact?: string;
  emergencyNo?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  employee: Employee | null;
  isAdmin: boolean;
}

export default function ProfileModal({ isOpen, onClose, onUpdate, employee, isAdmin }: ProfileModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    department: '',
    position: '',
    workLat: '',
    workLng: '',
    workRadius: '',
    shiftStart: '',
    shiftEnd: '',
    birthdate: '',
    civilStatus: '',
    gender: '',
    mobileNo: '',
    completeAddress: '',
    sssNo: '',
    tinNo: '',
    philhealthNo: '',
    pagibigNo: '',
    emergencyContact: '',
    emergencyNo: ''
  });
  const [activeTab, setActiveTab] = useState<'identity' | 'personal' | 'compliance' | 'workspace'>('identity');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        middleName: employee.middleName || '',
        email: employee.email || '',
        department: employee.department || '',
        position: employee.position || '',
        workLat: employee.workLat || '',
        workLng: employee.workLng || '',
        workRadius: employee.workRadius || '100',
        shiftStart: employee.shiftStart || '',
        shiftEnd: employee.shiftEnd || '',
        birthdate: employee.birthdate || '',
        civilStatus: employee.civilStatus || '',
        gender: employee.gender || '',
        mobileNo: employee.mobileNo || '',
        completeAddress: employee.completeAddress || '',
        sssNo: employee.sssNo || '',
        tinNo: employee.tinNo || '',
        philhealthNo: employee.philhealthNo || '',
        pagibigNo: employee.pagibigNo || '',
        emergencyContact: employee.emergencyContact || '',
        emergencyNo: employee.emergencyNo || ''
      });
    }
  }, [employee, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employeeNo: employee?.employeeNo,
          ...formData 
        })
      });
      if (res.ok) {
        onUpdate();
        onClose();
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
            className="w-full max-w-2xl max-h-[90vh] bg-brand-obsidian border border-white/10 rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] relative overflow-hidden z-10 flex flex-col"
          >
            {/* Header - Fixed */}
            <div className="p-10 pb-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tighter">Profile Terminal</h2>
                  <p className="text-brand-gold/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Identity & Workspace Configuration</p>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all">
                  <X size={20} />
                </button>
              </div>

              {/* Tab Switcher */}
              <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl mb-4">
                 <button 
                   type="button"
                   onClick={() => setActiveTab('identity')}
                   className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'identity' ? 'bg-brand-gold text-brand-obsidian shadow-lg' : 'text-white/40 hover:text-white'}`}
                 >
                   Identity
                 </button>
                 <button 
                   type="button"
                   onClick={() => setActiveTab('personal')}
                   className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'personal' ? 'bg-brand-gold text-brand-obsidian shadow-lg' : 'text-white/40 hover:text-white'}`}
                 >
                   Personal
                 </button>
                 <button 
                   type="button"
                   onClick={() => setActiveTab('compliance')}
                   className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'compliance' ? 'bg-brand-gold text-brand-obsidian shadow-lg' : 'text-white/40 hover:text-white'}`}
                 >
                   Compliance
                 </button>
                 <button 
                   type="button"
                   onClick={() => setActiveTab('workspace')}
                   className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'workspace' ? 'bg-brand-gold text-brand-obsidian shadow-lg' : 'text-white/40 hover:text-white'}`}
                 >
                   Workspace
                 </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto px-10 custom-scrollbar">
                <div className="space-y-8 pb-10">
                {activeTab === 'identity' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">First Name</label>
                         <div className="relative">
                           <User className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold/40" size={18} />
                           <input 
                             value={formData.firstName}
                             onChange={(e) => setFormData({...formData, firstName: e.target.value.toUpperCase()})}
                             className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold"
                           />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Middle Name</label>
                         <input 
                           value={formData.middleName}
                           onChange={(e) => setFormData({...formData, middleName: e.target.value.toUpperCase()})}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Last Name</label>
                         <div className="relative">
                           <User className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold/40" size={18} />
                           <input 
                             value={formData.lastName}
                             onChange={(e) => setFormData({...formData, lastName: e.target.value.toUpperCase()})}
                             className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold"
                           />
                         </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Enterprise Email</label>
                       <div className="relative">
                         <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold/40" size={18} />
                         <input 
                           value={formData.email}
                           onChange={(e) => setFormData({...formData, email: e.target.value})}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold"
                         />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Department</label>
                          <div className="relative">
                            <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold/40" size={18} />
                            <select 
                              value={formData.department}
                              onChange={(e) => setFormData({...formData, department: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-10 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold appearance-none cursor-pointer [color-scheme:dark]"
                            >
                              <option value="" className="bg-brand-obsidian text-white">Select Department</option>
                              {DEPARTMENTS.map(d => (
                                <option key={d} value={d} className="bg-brand-obsidian text-white">{d}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                          </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Position</label>
                           <div className="relative">
                             <Target className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold/40" size={18} />
                             <select 
                               value={formData.position}
                               onChange={(e) => setFormData({...formData, position: e.target.value})}
                               className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-10 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold appearance-none cursor-pointer [color-scheme:dark]"
                             >
                               <option value="" className="bg-brand-obsidian text-white">Select Position</option>
                               {POSITIONS.map(p => (
                                 <option key={p} value={p} className="bg-brand-obsidian text-white">{p}</option>
                               ))}
                             </select>
                             <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                           </div>
                        </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'personal' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Birthdate</label>
                         <div className="relative">
                           <Cake className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold/40" size={18} />
                           <input 
                             type="date"
                             value={formData.birthdate}
                             onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                             className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold [color-scheme:dark]"
                           />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Civil Status</label>
                         <select 
                           value={formData.civilStatus}
                           onChange={(e) => setFormData({...formData, civilStatus: e.target.value})}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold appearance-none cursor-pointer [color-scheme:dark]"
                         >
                            <option value="" className="bg-brand-obsidian text-white">Select Status</option>
                            <option value="Single" className="bg-brand-obsidian text-white">Single</option>
                            <option value="Married" className="bg-brand-obsidian text-white">Married</option>
                            <option value="Widowed" className="bg-brand-obsidian text-white">Widowed</option>
                            <option value="Separated" className="bg-brand-obsidian text-white">Separated</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Gender</label>
                         <select 
                           value={formData.gender}
                           onChange={(e) => setFormData({...formData, gender: e.target.value})}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold appearance-none cursor-pointer [color-scheme:dark]"
                         >
                            <option value="" className="bg-brand-obsidian text-white">Select Gender</option>
                            <option value="Male" className="bg-brand-obsidian text-white">Male</option>
                            <option value="Female" className="bg-brand-obsidian text-white">Female</option>
                            <option value="Other" className="bg-brand-obsidian text-white">Other</option>
                         </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Mobile Number</label>
                       <div className="relative">
                         <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold/40" size={18} />
                         <input 
                           placeholder="+63 9XX XXX XXXX"
                           value={formData.mobileNo}
                           onChange={(e) => setFormData({...formData, mobileNo: e.target.value})}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold"
                         />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Complete Residential Address</label>
                       <textarea 
                         value={formData.completeAddress}
                         onChange={(e) => setFormData({...formData, completeAddress: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold min-h-[100px] resize-none"
                       />
                    </div>

                    <div className="p-6 bg-brand-gold/5 rounded-[2rem] border border-brand-gold/10 grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold/60 ml-2">Emergency Contact</label>
                         <input 
                           placeholder="Full Name"
                           value={formData.emergencyContact}
                           onChange={(e) => setFormData({...formData, emergencyContact: e.target.value.toUpperCase()})}
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-white focus:border-brand-gold/50 outline-none transition-all font-bold text-xs"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold/60 ml-2">Emergency Number</label>
                         <input 
                           placeholder="Phone Number"
                           value={formData.emergencyNo}
                           onChange={(e) => setFormData({...formData, emergencyNo: e.target.value})}
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-white focus:border-brand-gold/50 outline-none transition-all font-bold text-xs"
                         />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'compliance' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">SSS Number</label>
                         <input 
                           value={formData.sssNo}
                           onChange={(e) => setFormData({...formData, sssNo: e.target.value})}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold"
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">TIN Number</label>
                         <input 
                           value={formData.tinNo}
                           onChange={(e) => setFormData({...formData, tinNo: e.target.value})}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold"
                         />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">PhilHealth ID</label>
                         <input 
                           value={formData.philhealthNo}
                           onChange={(e) => setFormData({...formData, philhealthNo: e.target.value})}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold"
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Pag-IBIG MID</label>
                         <input 
                           value={formData.pagibigNo}
                           onChange={(e) => setFormData({...formData, pagibigNo: e.target.value})}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold"
                         />
                       </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'workspace' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="p-6 bg-brand-gold/5 rounded-[2rem] border border-brand-gold/10 space-y-6">
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-3">
                           <MapPin className="text-brand-gold" size={18} />
                           <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold/60">Geofence Registry</p>
                         </div>
                         {!isAdmin && (
                           <span className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">Radius managed by HR</span>
                         )}
                      </div>

                      <MapSelector 
                        lat={Number(formData.workLat)}
                        lng={Number(formData.workLng)}
                        radius={Number(formData.workRadius)}
                        onChange={(lat, lng) => setFormData({ ...formData, workLat: lat.toString(), workLng: lng.toString() })}
                        onRadiusChange={isAdmin ? (r) => setFormData({ ...formData, workRadius: r.toString() }) : undefined}
                        isAdmin={isAdmin}
                      />

                      <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                           <Clock className="text-brand-gold" size={18} />
                           <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold/60">Temporal Shift Details</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[8px] font-black uppercase text-white/20 ml-2">Shift Start</p>
                            <input 
                              placeholder="e.g. 09:00 AM"
                              readOnly={!isAdmin}
                              value={formData.shiftStart}
                              onChange={(e) => setFormData({...formData, shiftStart: e.target.value})}
                              className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-brand-gold/50 ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-black uppercase text-white/20 ml-2">Shift End</p>
                            <input 
                              placeholder="e.g. 06:00 PM"
                              readOnly={!isAdmin}
                              value={formData.shiftEnd}
                              onChange={(e) => setFormData({...formData, shiftEnd: e.target.value})}
                              className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-brand-gold/50 ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Fixed Footer */}
              <div className="p-10 pt-4 bg-brand-obsidian border-t border-white/5 relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 bg-brand-gold hover:bg-white text-brand-obsidian font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-brand-gold/10 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-brand-obsidian/30 border-t-brand-obsidian rounded-full animate-spin" /> : (
                    <>
                      <Save size={16} />
                      <span>Synchronize Identity Registry</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Minimal Icons
function Clock({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
