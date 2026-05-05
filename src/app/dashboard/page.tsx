'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import IdentityTablet from '@/components/ui/IdentityTablet';
import StatsCard from '@/components/ui/StatsCard';
import HeroAnnouncement from '@/components/ui/HeroAnnouncement';
import AnnouncementModal from '@/components/ui/AnnouncementModal';
import { Users, Clock, CalendarDays, AlertCircle, Calendar, Flag, ChevronRight, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { StatsCardSkeleton, IdentityTabletSkeleton } from '@/components/ui/Skeleton';
import Skeleton from '@/components/ui/Skeleton';
import PayrollProjections from '@/components/ui/PayrollProjections';
import BroadcastTerminal from '@/components/ui/BroadcastTerminal';
import ProfileCompletionReminder from '@/components/ui/ProfileCompletionReminder';

export default function Dashboard() {
  const { data: session, status: sessionStatus } = useSession();
  
  const { data: stats, isLoading: isStatsLoading, mutate: mutateStats } = useSWR('/api/stats');
  const { data: eventsData, isLoading: isEventsLoading } = useSWR('/api/events?upcoming=true');
  
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = React.useState(false);

  const user = session?.user as { role?: string; employeeNo?: string } | undefined;
  const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user?.role?.toUpperCase() || '');
  const isSuperadmin = (session?.user as any)?.employeeNo === 'SA-001';
  const upcomingEvents = eventsData?.events || [];

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-20">
        {/* Hero Level Announcement */}
        <HeroAnnouncement 
          isAdmin={isAdmin} 
          onManage={() => setIsAnnouncementModalOpen(true)} 
        />

        {/* Profile Completion Reminder */}
        <ProfileCompletionReminder />

        {/* Header Section */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
              {isAdmin ? 'Dashboard Overview' : 'Personal Dashboard'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-px w-8 bg-brand-gold/40" />
              <p className="text-brand-gold/60 text-[10px] font-black uppercase tracking-[0.4em]">
                {isAdmin ? 'Real-time workforce operational pulse' : 'Your schedule and attendance overview'}
              </p>
            </div>
          </div>

          {/* Security Integrity Status (Superadmin Visibility) */}
          {isSuperadmin && (
            <motion.a 
              href="/admin/ledger"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-6 py-4 bg-brand-obsidian/40 border border-emerald-500/20 rounded-2xl flex items-center gap-4 hover:bg-emerald-500/5 transition-all group"
            >
               <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none">Security Kernel</span>
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest mt-1 group-hover:text-glow transition-all">Verified & Active</span>
               </div>
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.6)]" />
            </motion.a>
          )}
        </div>

        {/* Top Grid */}
        <div className="grid grid-cols-12 gap-10">
          {/* Identity Column */}
          <div className="col-span-12 lg:col-span-4 space-y-10">
            {sessionStatus === 'loading' ? <IdentityTabletSkeleton /> : <IdentityTablet />}

            {/* Upcoming Operations Feed */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden group hover:border-brand-gold/10 transition-all shadow-deep">
               <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold shadow-lg">
                      <Calendar size={16} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Upcoming Events</span>
                  </div>
                  <a href="/calendar" className="text-[9px] font-black uppercase tracking-widest text-brand-gold/40 hover:text-brand-gold transition-colors flex items-center gap-2 group/link">
                    Full Calendar
                    <ChevronRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                  </a>
               </div>

               <div className="space-y-4 relative z-10">
                  {isEventsLoading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)
                  ) : upcomingEvents.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-[2rem]">
                       <Calendar size={24} className="text-white/5 mb-3" />
                       <p className="text-[9px] font-black uppercase tracking-widest text-white/10 italic">No scheduled events</p>
                    </div>
                  ) : (
                    upcomingEvents.map((event: any, i: number) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={event.id} 
                        className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.05] hover:border-brand-gold/20 transition-all cursor-pointer group/item"
                      >
                         <div className="flex items-start justify-between mb-3">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                              event.type === 'Meeting' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              event.type === 'Holiday' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'
                            }`}>
                              {event.type}
                            </span>
                            <span className="text-[9px] font-black text-white/20 group-hover/item:text-brand-gold transition-colors tracking-widest">
                              {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                         </div>
                         <h4 className="text-white text-sm font-bold truncate group-hover/item:text-glow transition-all">{event.title}</h4>
                         {event.location && (
                           <div className="flex items-center gap-1.5 mt-2 text-[9px] text-white/20 font-bold uppercase tracking-widest">
                             <MapPin size={10} className="text-brand-gold/40" />
                             <span className="truncate">{event.location}</span>
                           </div>
                         )}
                      </motion.div>
                    ))
                  )}
               </div>
               
               <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-gold/5 blur-[100px] rounded-full pointer-events-none" />
            </div>
          </div>

          {/* Stats Column */}
          <div className="col-span-12 lg:col-span-8 space-y-10">
            {/* Admin Dashboard */}
            {isAdmin && (
              <>
                <div className="grid grid-cols-3 gap-8">
                  {isStatsLoading ? (
                    [1, 2, 3].map(i => <StatsCardSkeleton key={i} />)
                  ) : (
                    <>
                      <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl group hover:border-red-400/20 transition-all shadow-deep relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-8 relative z-10">
                          <div className="p-3 bg-red-400/10 rounded-xl text-red-400 border border-red-400/20 shadow-lg">
                            <AlertCircle size={20} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Absent Today</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 relative z-10">
                          <h3 className="text-5xl font-black text-white tracking-tighter shrink-0">{stats?.global?.notLoggedIn || 0}</h3>
                          <span className="text-[9px] font-black text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-lg uppercase tracking-widest shadow-xl text-center leading-tight">Action Required</span>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-red-400/[0.02] blur-3xl rounded-full" />
                      </div>

                      <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl group hover:border-emerald-400/20 transition-all shadow-deep relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-8 relative z-10">
                          <div className="p-3 bg-emerald-400/10 rounded-xl text-emerald-400 border border-emerald-400/20 shadow-lg">
                            <Calendar size={20} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">On Leave</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 relative z-10">
                          <h3 className="text-5xl font-black text-white tracking-tighter shrink-0">{stats?.global?.onLeaveToday || 0}</h3>
                          <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 border border-red-400/20 px-3 py-2 rounded-lg uppercase tracking-widest shadow-xl text-center leading-tight">Out of Office</span>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-400/[0.02] blur-3xl rounded-full" />
                      </div>

                      <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl group hover:border-brand-gold/20 transition-all shadow-deep relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-8 relative z-10">
                          <div className="p-3 bg-brand-gold/10 rounded-xl text-brand-gold border border-brand-gold/20 shadow-lg">
                            <Flag size={20} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Daily Events</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 relative z-10">
                          <h3 className="text-5xl font-black text-white tracking-tighter shrink-0">{stats?.global?.eventsToday || 0}</h3>
                          <span className="text-[9px] font-black text-brand-gold/40 bg-brand-gold/5 border border-brand-gold/20 px-3 py-2 rounded-lg uppercase tracking-widest shadow-xl text-center leading-tight">Today's Schedule</span>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-gold/[0.02] blur-3xl rounded-full" />
                      </div>
                    </>
                  )}
                </div>
                <BroadcastTerminal />
                <PayrollProjections />
              </>
            )}

            <div className={`grid ${isAdmin ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'} gap-8`}>
              {isStatsLoading ? (
                [1, 2, 3].map(i => <StatsCardSkeleton key={i} />)
              ) : (
                <>
                  {isAdmin && (
                    <StatsCard 
                      title="Total Workforce"
                      value={stats?.global?.activeEmployees}
                      label="Active employees in system"
                      icon={Users}
                    />
                  )}
                  <StatsCard 
                    title="Duty Status"
                    value={stats?.personal?.isClockedIn ? 'CLOCKED IN' : 'OFF DUTY'}
                    label="Current connection status"
                    icon={Clock}
                    color={stats?.personal?.isClockedIn ? 'text-emerald-400' : 'text-brand-gold'}
                  />
                  {isAdmin && (
                    <StatsCard 
                      title="Pending Requests"
                      value={stats?.global?.pendingLeave}
                      label="Awaiting leave approvals"
                      icon={CalendarDays}
                    />
                  )}
                </>
              )}
            </div>

            {/* Actions Portal */}
            <div className="bg-[#0f0d04] border border-brand-gold/10 rounded-[3rem] p-12 relative overflow-hidden group shadow-deep">
               <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold shadow-lg border border-brand-gold/20">
                      <Flag size={22} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-gold">HR Terminal</span>
                      <p className="text-white/20 text-[9px] font-black uppercase tracking-widest mt-1">Operational Quick Access</p>
                    </div>
                 </div>
                 <div className={`grid ${isAdmin ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2'} gap-8`}>
                    <a href="/leave" className="bg-white/[0.02] hover:bg-brand-gold/[0.08] border border-white/5 hover:border-brand-gold/20 rounded-3xl p-8 transition-all duration-500 group/btn shadow-xl hover:-translate-y-1">
                       <CalendarDays className="text-brand-gold/40 group-hover/btn:text-brand-gold mb-5 transition-all duration-500 group-hover/btn:scale-110" size={32} strokeWidth={1.5} />
                       <h4 className="text-white font-black text-sm mb-1 uppercase tracking-tight">
                         {isAdmin ? 'Leave Management' : 'Request Leave'}
                       </h4>
                       <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Absence Registry</p>
                    </a>
                    <a href="/calendar" className="bg-white/[0.02] hover:bg-brand-gold/[0.08] border border-white/5 hover:border-brand-gold/20 rounded-3xl p-8 transition-all duration-500 group/btn shadow-xl hover:-translate-y-1">
                       <Calendar className="text-brand-gold/40 group-hover/btn:text-brand-gold mb-5 transition-all duration-500 group-hover/btn:scale-110" size={32} strokeWidth={1.5} />
                       <h4 className="text-white font-black text-sm mb-1 uppercase tracking-tight">Events Calendar</h4>
                       <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Workplace Ops</p>
                    </a>
                    {isAdmin && (
                      <a href="/employees" className="bg-white/[0.02] hover:bg-brand-gold/[0.08] border border-white/5 hover:border-brand-gold/20 rounded-3xl p-8 transition-all duration-500 group/btn shadow-xl hover:-translate-y-1">
                        <Users className="text-brand-gold/40 group-hover/btn:text-brand-gold mb-5 transition-all duration-500 group-hover/btn:scale-110" size={32} strokeWidth={1.5} />
                        <h4 className="text-white font-black text-sm mb-1 uppercase tracking-tight">Employee Registry</h4>
                        <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Personnel Database</p>
                      </a>
                    )}
                 </div>
               </div>
               <div className="absolute inset-0 mesh-gradient opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity" />
               <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand-gold/10 blur-[150px] rounded-full pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <AnnouncementModal 
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        onUpdate={() => {}} 
      />
    </DashboardLayout>
  );
}
