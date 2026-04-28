'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, Search, Shield, UserCircle, Mail, Map, Edit3, Plus } from 'lucide-react';
import Image from 'next/image';
import ProfileModal from '@/components/ui/ProfileModal';
import OnboardingModal from '@/components/ui/OnboardingModal';
import { useSession } from 'next-auth/react';
import Pagination from '@/components/ui/Pagination';
import { motion, AnimatePresence } from 'framer-motion';

interface Employee {
  employeeNo: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  status: string;
  photo?: string;
}

export default function EmployeeDirectory() {
  const { data: session, update } = useSession();
  const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes((session?.user as any)?.role?.toUpperCase());
  
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pendingRole, setPendingRole] = React.useState<{empNo: string, newRole: string, oldRole: string} | null>(null);
  const pageSize = 10;

  const ROLE_HIERARCHY = ['Employee', 'Manager', 'HR', 'Admin', 'Superadmin'];

  const fetchEmployees = () => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEmployees(data.employees);
          setCurrentPage(1);
        }
        setLoading(false);
      });
  };

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  const handleUpdate = async (employeeNo: string, action: string, value?: string) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeNo, action, value })
      });
      if (res.ok) {
        fetchEmployees();
        // RBAC Sync: If updating self, force a session update
        if (employeeNo === (session?.user as any)?.employeeNo && action === 'role') {
          await update({ role: value });
          // Optional: slight delay or refresh to ensure all components sync
          setTimeout(() => window.location.reload(), 500);
        }
      }
    } catch (err) {
      console.error('Update failed');
    }
  };

  const filtered = employees.filter(e => {
    const fullName = `${e.firstName || ''} ${e.lastName || ''}`.toLowerCase();
    const searchLower = search.toLowerCase();
    const empNo = (e.employeeNo || '').toLowerCase();
    
    return fullName.includes(searchLower) || empNo.includes(searchLower);
  });

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="flex items-end gap-10">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tighter">Enterprise Registry</h1>
              <p className="text-brand-gold/60 font-semibold tracking-wide mt-1">Management of organizational access & profiles</p>
            </div>
            
            {isAdmin && (
              <button 
                onClick={() => setIsOnboardingOpen(true)}
                className="mb-1 h-12 px-6 bg-brand-gold hover:bg-brand-gold/90 text-brand-obsidian font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center gap-2 shadow-xl shadow-brand-gold/10 transition-all active:scale-[0.98]"
              >
                <Plus size={16} />
                Onboard New Hire
              </button>
            )}
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-gold transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Search registry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-brand-gold/50 outline-none w-80 transition-all backdrop-blur-xl"
            />
          </div>
        </div>

        {/* Directory Table */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-brand-gold/60">Member Identity</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-brand-gold/60">Department</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-brand-gold/60">System Role</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-brand-gold/60 text-right">Status / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse h-24">
                      <td colSpan={4} className="px-8 py-10 bg-white/[0.01]" />
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-32 text-center text-white/20 text-xs font-bold uppercase tracking-widest italic">
                      Zero matching records found in system
                    </td>
                  </tr>
                ) : (
                  filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((e) => (
                    <tr key={e.employeeNo} className="hover:bg-brand-gold/[0.02] transition-colors group">
                      <td className="px-8 py-8">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 overflow-hidden relative shrink-0">
                            {e.photo ? (
                              <Image src={e.photo} alt={e.firstName} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/20 bg-white/5">
                                <UserCircle size={24} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm leading-tight">{e.firstName} {e.lastName}</p>
                            <div className="flex items-center gap-3 mt-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] text-brand-gold font-mono uppercase tracking-widest">{e.employeeNo}</span>
                              <div className="w-1 h-1 bg-white/20 rounded-full" />
                              <span className="text-[10px] text-white flex items-center gap-1"><Mail size={10} /> {e.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-8">
                        <div className="flex items-center gap-2">
                          <Map size={14} className="text-brand-gold/40" />
                          <span className="text-[11px] font-bold text-white/60 tracking-wider uppercase">{e.department}</span>
                        </div>
                      </td>
                      <td className="px-6 py-8">
                        <select
                          value={e.role}
                          onChange={(ev) => setPendingRole({ empNo: e.employeeNo, newRole: ev.target.value, oldRole: e.role })}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-brand-gold outline-none focus:border-brand-gold/50 transition-all cursor-pointer"
                        >
                          {['Employee', 'Manager', 'HR', 'Admin', 'Superadmin'].map(r => (
                            <option key={r} value={r} className="bg-brand-obsidian">{r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-8 py-8 text-right">
                        <div className="flex items-center justify-end gap-3">
                           <button
                             onClick={() => {
                               setSelectedEmployee(e);
                               setIsModalOpen(true);
                             }}
                             className="p-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl transition-all"
                           >
                             <Edit3 size={16} />
                           </button>
                           <button
                             onClick={() => handleUpdate(e.employeeNo, 'status')}
                             className={`px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
                               e.status === 'Active' 
                                 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400' 
                                 : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400'
                             }`}
                           >
                             {e.status}
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={currentPage}
            totalPages={Math.ceil(filtered.length / pageSize)}
            onPageChange={setCurrentPage}
            totalEntries={filtered.length}
            pageSize={pageSize}
          />
        </div>
      </div>

      <ProfileModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={fetchEmployees}
        employee={selectedEmployee}
        isAdmin={isAdmin}
      />

      <OnboardingModal 
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={fetchEmployees}
      />

      {/* Role Change Confirmation Modal */}
      <AnimatePresence>
        {pendingRole && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-brand-obsidian/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#0a0904] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="relative z-10 text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  ROLE_HIERARCHY.indexOf(pendingRole.newRole) > ROLE_HIERARCHY.indexOf(pendingRole.oldRole)
                    ? 'bg-brand-gold/10 text-brand-gold'
                    : 'bg-rose-500/10 text-rose-500'
                }`}>
                  <Shield size={32} />
                </div>
                
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
                  {ROLE_HIERARCHY.indexOf(pendingRole.newRole) > ROLE_HIERARCHY.indexOf(pendingRole.oldRole)
                    ? 'Confirm System Upgrade'
                    : 'Confirm Role Restriction'}
                </h3>
                
                <p className="text-white/60 text-sm leading-relaxed mb-8">
                  You are about to change the system role from <span className="text-white font-bold">{pendingRole.oldRole}</span> to <span className="text-brand-gold font-bold">{pendingRole.newRole}</span>. 
                  {ROLE_HIERARCHY.indexOf(pendingRole.newRole) < ROLE_HIERARCHY.indexOf(pendingRole.oldRole) 
                    ? " This will restrict current access levels."
                    : " This will grant elevated operational permissions."}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setPendingRole(null)}
                    className="h-14 rounded-2xl bg-white/5 border border-white/10 text-white/40 font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                  >
                    Abort Change
                  </button>
                  <button 
                    onClick={() => {
                      handleUpdate(pendingRole.empNo, 'role', pendingRole.newRole);
                      setPendingRole(null);
                    }}
                    className={`h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all active:scale-95 ${
                      ROLE_HIERARCHY.indexOf(pendingRole.newRole) > ROLE_HIERARCHY.indexOf(pendingRole.oldRole)
                        ? 'bg-brand-gold text-brand-obsidian shadow-brand-gold/20'
                        : 'bg-rose-500 text-white shadow-rose-500/20'
                    }`}
                  >
                    Confirm & Commit
                  </button>
                </div>
              </div>

              {/* Decorative Glow */}
              <div className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-[100px] pointer-events-none ${
                ROLE_HIERARCHY.indexOf(pendingRole.newRole) > ROLE_HIERARCHY.indexOf(pendingRole.oldRole)
                  ? 'bg-brand-gold/10'
                  : 'bg-rose-500/10'
              }`} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
