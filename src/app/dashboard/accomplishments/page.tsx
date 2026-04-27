'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AccomplishmentRegistry from '@/components/ui/AccomplishmentRegistry';
import { FileText, ShieldCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function AccomplishmentAuditPage() {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const isAdmin = ['ADMIN', 'SUPERADMIN', 'HR'].includes(user?.role?.toUpperCase());

  if (status === 'authenticated' && !isAdmin) {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-20">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Accomplishment Audit</h1>
              <span className="bg-brand-gold/10 text-brand-gold text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-brand-gold/20 flex items-center gap-2">
                <ShieldCheck size={12} />
                High-Integrity Verification
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-px w-8 bg-brand-gold/40" />
              <p className="text-brand-gold/60 text-[10px] font-black uppercase tracking-[0.4em]">Proof-of-work operational registry</p>
            </div>
          </div>
        </div>

        <AccomplishmentRegistry />
      </div>
    </DashboardLayout>
  );
}
