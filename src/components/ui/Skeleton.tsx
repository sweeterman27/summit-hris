'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'pill';
}

export default function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  const baseClasses = "bg-white/[0.03] overflow-hidden relative";
  const variantClasses = {
    rectangular: "rounded-2xl",
    circular: "rounded-full",
    pill: "rounded-full",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <motion.div
        animate={{ 
          x: ['-100%', '200%']
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent skew-x-[-20deg]"
      />
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="c-card p-8 min-h-[160px] flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-2 w-16" />
          <Skeleton className="h-1 w-10" />
        </div>
        <Skeleton className="h-8 w-8" variant="circular" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-2 w-32" />
      </div>
    </div>
  );
}

export function IdentityTabletSkeleton() {
  return (
    <div className="c-card p-8 flex flex-col items-center gap-8">
      <Skeleton className="w-36 h-36" variant="circular" />
      <div className="space-y-3 w-full flex flex-col items-center">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" variant="pill" />
          <Skeleton className="h-6 w-6" variant="circular" />
        </div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-4 w-full">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-14 w-full" variant="rectangular" />
    </div>
  );
}
