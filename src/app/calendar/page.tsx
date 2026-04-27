'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Trash2, Edit3, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import EventModal from '@/components/ui/EventModal';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  type: string;
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes((session?.user as any)?.role?.toUpperCase());

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    // Fetch a slightly wider range to handle multi-day events that cross month boundaries
    const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    try {
      const res = await fetch(`/api/events?month=${monthStr}`);
      const data = await res.json();
      if (data.success) setEvents(data.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const days = [];
  // Padding for first week
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`pad-${i}`} className="h-36 border-b border-r border-white/5 bg-white/[0.01]" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    // Multi-day filter logic
    const dayEvents = events.filter(e => {
      const eventStart = e.startDate;
      const eventEnd = e.endDate || e.startDate;
      return dateStr >= eventStart && dateStr <= eventEnd;
    });

    const isToday = new Date().toISOString().split('T')[0] === dateStr;

    days.push(
      <div 
        key={d} 
        className={`h-36 border-b border-r border-white/5 p-4 relative group transition-all hover:bg-white/[0.03] ${isToday ? 'bg-brand-gold/[0.02]' : ''}`}
        onClick={() => {
          if (isAdmin) {
            setSelectedDate(dateStr);
            setModalMode('add');
            setSelectedEvent(null);
            setIsModalOpen(true);
          }
        }}
      >
        <span className={`text-[10px] font-black ${isToday ? 'text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg' : 'text-white/20'}`}>
          {String(d).padStart(2, '0')}
        </span>
        
        <div className="mt-3 space-y-1.5 overflow-y-auto max-h-[85px] custom-scrollbar pr-1">
          {dayEvents.map(e => {
            const isStart = e.startDate === dateStr;
            const isEnd = (e.endDate || e.startDate) === dateStr;
            const isMultiDay = e.endDate && e.endDate !== e.startDate;

            return (
              <motion.div 
                key={e.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={(ev) => {
                  ev.stopPropagation();
                  setSelectedEvent(e);
                  setModalMode('edit');
                  setIsModalOpen(true);
                }}
                className={`text-[9px] font-bold px-2 py-1.5 cursor-pointer transition-all hover:brightness-125 flex items-center gap-1.5 ${
                  isMultiDay ? (
                    isStart ? 'rounded-l-lg rounded-r-none border-l' : 
                    isEnd ? 'rounded-r-lg rounded-l-none border-r' : 
                    'rounded-none border-x-0'
                  ) : 'rounded-lg border'
                } ${
                  e.type === 'Holiday' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                  e.type === 'Meeting' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                  'bg-brand-gold/20 text-brand-gold border-brand-gold/20'
                }`}
              >
                {isStart && <div className={`w-1 h-1 rounded-full ${e.type === 'Holiday' ? 'bg-red-400' : e.type === 'Meeting' ? 'bg-emerald-400' : 'bg-brand-gold'}`} />}
                <span className="truncate flex-1">{isStart ? e.title : <span className="opacity-40 italic font-medium">Cont. {e.title}</span>}</span>
              </motion.div>
            );
          })}
        </div>

        {isAdmin && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus size={14} className="text-brand-gold/40 hover:text-brand-gold" />
          </div>
        )}
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tighter">Event Horizon</h1>
            <p className="text-brand-gold/60 font-semibold tracking-wide mt-1">Enterprise operational schedule</p>
          </div>
          
          <div className="flex items-center gap-6 bg-white/5 border border-white/10 p-2 rounded-[2rem] backdrop-blur-xl">
            <button onClick={prevMonth} className="p-3 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-sm font-black uppercase tracking-widest text-white w-44 text-center">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextMonth} className="p-3 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-brand-obsidian border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
          <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.02]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-5 text-center text-[10px] font-black uppercase tracking-widest text-white/20">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 min-h-[700px] bg-white/[0.01]">
            {days}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-10 px-10 py-6 bg-white/[0.02] border border-white/5 rounded-[2rem]">
           <div className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
             <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Corporate Holiday</span>
           </div>
           <div className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
             <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Strategic Meeting</span>
           </div>
           <div className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-brand-gold shadow-[0_0_10px_rgba(202,138,4,0.3)]" />
             <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">General Event</span>
           </div>
           <div className="ml-auto flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase">
             <Clock size={12} />
             <span>Timezone: PHT (UTC+8)</span>
           </div>
        </div>
      </div>

      <EventModal 
        key={`${modalMode}-${selectedEvent?.id || selectedDate || 'new'}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={fetchEvents}
        mode={modalMode}
        event={selectedEvent}
        defaultDate={selectedDate}
      />
    </DashboardLayout>
  );
}
