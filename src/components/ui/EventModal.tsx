'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Calendar, Clock, AlignLeft, Tag, MapPin, Users, Flag, ChevronDown, Search, Check, Loader2, Landmark } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  type: string;
  priority?: string;
  location?: string;
  collaborators?: string;
}

interface Employee {
  employeeNo: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  mode: 'add' | 'edit';
  event: Event | null;
  defaultDate: string | null;
}

export default function EventModal({ isOpen, onClose, onUpdate, mode, event, defaultDate }: EventModalProps) {
  const [formData, setFormData] = useState(() => {
    if (mode === 'edit' && event) {
      return {
        title: event.title || '',
        description: event.description || '',
        startDate: event.startDate || '',
        endDate: event.endDate || event.startDate || '',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        type: event.type || 'Event',
        priority: event.priority || 'Medium',
        location: event.location || '',
        collaborators: event.collaborators || ''
      };
    }
    const today = defaultDate || new Date().toISOString().split('T')[0];
    return {
      title: '',
      description: '',
      startDate: today,
      endDate: today,
      startTime: '09:00',
      endTime: '10:00',
      type: 'Event',
      priority: 'Medium',
      location: '',
      collaborators: ''
    };
  });

  const [isMultiDay, setIsMultiDay] = useState(() => 
    mode === 'edit' && event ? (!!event.endDate && event.endDate !== event.startDate) : false
  );
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollabs, setSelectedCollabs] = useState<string[]>(() => 
    mode === 'edit' && event && event.collaborators ? event.collaborators.split(',').filter(Boolean) : []
  );
  const [showCollabSearch, setShowCollabSearch] = useState(false);
  const [showDeptSearch, setShowDeptSearch] = useState(false);

  useEffect(() => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => {
        if (data.success) setEmployees(data.employees);
      });
  }, []);

  const departments = Array.from(new Set(employees.map(e => e.department))).filter(Boolean);

  const tagDepartment = (dept: string) => {
    const deptEmployees = employees
      .filter(e => e.department === dept)
      .map(e => `${e.firstName} ${e.lastName}`);
    
    setSelectedCollabs(prev => {
      const newSet = new Set([...prev, ...deptEmployees]);
      return Array.from(newSet);
    });
    setShowDeptSearch(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const finalData = {
      ...formData,
      endDate: isMultiDay ? formData.endDate : formData.startDate,
      collaborators: selectedCollabs.join(',')
    };
    try {
      const res = await fetch('/api/events', {
        method: mode === 'add' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'add' ? finalData : { id: event?.id, ...finalData })
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/events?id=${event?.id}`, { method: 'DELETE' });
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

  const toggleCollab = (id: string) => {
    setSelectedCollabs(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const filteredEmployees = employees.filter(emp => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-brand-obsidian/80 backdrop-blur-md flex justify-center items-start p-4 md:p-10 custom-scrollbar">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none"
            onClick={onClose}
          />

          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-2xl bg-brand-obsidian border border-white/10 rounded-[3rem] p-8 md:p-10 shadow-[0_0_80px_rgba(0,0,0,0.5)] relative z-10 my-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tighter">
                  {mode === 'add' ? 'Event Terminal' : 'Registry Update'}
                </h2>
                <p className="text-brand-gold/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Enterprise Operational Planner</p>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title & Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold/40" size={18} />
                  <input 
                    required
                    type="text"
                    placeholder="Event Title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all placeholder:text-white/10 font-bold"
                  />
                </div>
                <div className="relative">
                   <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold/40" size={18} />
                   <select 
                     value={formData.type}
                     onChange={(e) => setFormData({...formData, type: e.target.value})}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-10 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold appearance-none [color-scheme:dark]"
                   >
                     <option value="Meeting" className="bg-brand-obsidian">Strategic Meeting</option>
                     <option value="Training" className="bg-brand-obsidian">Training Session</option>
                     <option value="Town Hall" className="bg-brand-obsidian">Town Hall</option>
                     <option value="Holiday" className="bg-brand-obsidian">Corporate Holiday</option>
                     <option value="Event" className="bg-brand-obsidian">General Event</option>
                   </select>
                   <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
              </div>

              {/* Date Logic */}
              <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                 <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Temporal Configuration</label>
                    <button 
                      type="button"
                      onClick={() => setIsMultiDay(!isMultiDay)}
                      className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-all border ${
                        isMultiDay ? 'bg-brand-gold text-brand-obsidian border-brand-gold' : 'bg-transparent text-white/40 border-white/10'
                      }`}
                    >
                      {isMultiDay ? 'Multi-Day Active' : 'Single Day'}
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <p className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-2">Start Point</p>
                       <input 
                         type="date"
                         value={formData.startDate}
                         onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold [color-scheme:dark]"
                       />
                    </div>
                    {isMultiDay && (
                       <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
                          <p className="text-[8px] font-black text-brand-gold/40 uppercase tracking-widest ml-2">Conclusion Point</p>
                          <input 
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                            className="w-full bg-white/5 border border-brand-gold/20 rounded-2xl px-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold shadow-[0_0_20px_rgba(202,138,4,0.05)] [color-scheme:dark]"
                          />
                       </motion.div>
                    )}
                 </div>

                 <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="relative">
                      <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10" size={16} />
                      <input 
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-white text-xs focus:border-brand-gold/50 outline-none transition-all font-bold [color-scheme:dark]"
                      />
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10" size={16} />
                      <input 
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-white text-xs focus:border-brand-gold/50 outline-none transition-all font-bold [color-scheme:dark]"
                      />
                    </div>
                 </div>
              </div>

              {/* Location & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold/40" size={18} />
                    <input 
                      type="text"
                      placeholder="Venue / Digital Link"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all placeholder:text-white/10 font-bold"
                    />
                 </div>
                 <div className="relative">
                    <Flag className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold/40" size={18} />
                    <select 
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-10 py-4 text-white focus:border-brand-gold/50 outline-none transition-all font-bold appearance-none [color-scheme:dark]"
                    >
                      <option value="Low" className="bg-brand-obsidian">Low Priority</option>
                      <option value="Medium" className="bg-brand-obsidian">Medium Priority</option>
                      <option value="High" className="bg-brand-obsidian">High Urgency</option>
                      <option value="Critical" className="bg-brand-obsidian">Critical Protocol</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                 </div>
              </div>

              {/* Collaborators Search */}
              <div className="relative">
                 <div className="flex items-center justify-between mb-4 px-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                       <Users size={12} />
                       Collaborators ({selectedCollabs.length})
                    </label>
                    <div className="flex items-center gap-4">
                       <button 
                         type="button"
                         onClick={() => setShowDeptSearch(!showDeptSearch)}
                         className="text-[8px] font-black uppercase text-emerald-400/60 hover:text-emerald-400 transition-colors flex items-center gap-1"
                       >
                         <Landmark size={10} />
                         Tag Department
                       </button>
                       <button 
                         type="button"
                         onClick={() => setSelectedCollabs(employees.map(e => e.firstName + ' ' + e.lastName))}
                         className="text-[8px] font-black uppercase text-brand-gold/60 hover:text-brand-gold transition-colors"
                       >
                         Tag All Force
                       </button>
                    </div>
                 </div>

                 {/* Department Quick Select */}
                 <AnimatePresence>
                    {showDeptSearch && (
                       <motion.div 
                         initial={{ opacity: 0, height: 0 }}
                         animate={{ opacity: 1, height: 'auto' }}
                         exit={{ opacity: 0, height: 0 }}
                         className="mb-4 bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
                       >
                          <div className="p-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                             {departments.map(dept => (
                                <button
                                  key={dept}
                                  type="button"
                                  onClick={() => tagDepartment(dept)}
                                  className="px-4 py-2 bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-xl text-[10px] font-bold text-white/60 hover:text-emerald-400 transition-all text-left truncate"
                                >
                                   {dept}
                                </button>
                             ))}
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>

                 <div className="min-h-[60px] bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-wrap gap-2 transition-all focus-within:border-brand-gold/30">
                    {selectedCollabs.length === 0 && !showCollabSearch && (
                       <p className="text-[10px] text-white/10 font-bold uppercase tracking-widest m-auto">No members tagged</p>
                    )}
                    {selectedCollabs.map(collab => (
                       <div key={collab} className="bg-brand-gold/10 text-brand-gold text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-2 border border-brand-gold/20">
                          {collab}
                          <button type="button" onClick={() => toggleCollab(collab)}><X size={10} /></button>
                       </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => setShowCollabSearch(!showCollabSearch)}
                      className="w-10 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 transition-all ml-auto"
                    >
                       {showCollabSearch ? <X size={14} /> : <Search size={14} />}
                    </button>
                 </div>

                 <AnimatePresence>
                    {showCollabSearch && (
                       <motion.div 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: 10 }}
                         className="absolute bottom-full left-0 right-0 mb-4 bg-brand-obsidian border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden"
                       >
                          <div className="p-4 border-b border-white/5">
                             <input 
                               autoFocus
                               type="text"
                               placeholder="Search Identity Registry..."
                               value={searchQuery}
                               onChange={(e) => setSearchQuery(e.target.value)}
                               className="w-full bg-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-brand-gold/50 outline-none"
                             />
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                             {filteredEmployees.map(emp => {
                                const name = `${emp.firstName} ${emp.lastName}`;
                                const isSelected = selectedCollabs.includes(name);
                                return (
                                   <button
                                     key={emp.employeeNo}
                                     type="button"
                                     onClick={() => toggleCollab(name)}
                                     className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left border-b border-white/[0.02]"
                                   >
                                      <div>
                                         <p className="text-[10px] font-bold text-white tracking-tight">{name}</p>
                                         <p className="text-[8px] text-white/40 uppercase tracking-widest mt-1">{emp.position} • {emp.department}</p>
                                      </div>
                                      {isSelected && <Check size={14} className="text-brand-gold" />}
                                   </button>
                                );
                             })}
                             {filteredEmployees.length === 0 && (
                                <div className="p-10 text-center text-[10px] text-white/20 font-black uppercase tracking-widest">No Matches Found</div>
                             )}
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>

              {/* Description */}
              <div className="relative">
                <AlignLeft className="absolute left-5 top-6 text-brand-gold/40" size={18} />
                <textarea 
                  placeholder="Deployment details & tactical briefing..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none transition-all placeholder:text-white/10 font-medium resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                {mode === 'edit' && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex-1 h-16 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    <span>Purge</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] h-16 bg-brand-gold hover:bg-brand-gold/90 text-brand-obsidian font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-brand-gold/10 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      <Save size={16} />
                      <span>{mode === 'add' ? 'Commit Protocol' : 'Sync Changes'}</span>
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
