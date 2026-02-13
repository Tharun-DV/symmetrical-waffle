'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: 'cyan' | 'emerald' | 'crimson' | 'amber' | 'slate';
  className?: string;
}

const colorMap = {
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  crimson: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  slate: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

const dotColorMap = {
  cyan: 'bg-cyan-500',
  emerald: 'bg-emerald-500',
  crimson: 'bg-rose-500',
  amber: 'bg-amber-500',
  slate: 'bg-slate-500',
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'slate',
  className,
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md transition-shadow hover:shadow-xl hover:shadow-cyan-500/5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-100">{value}</h3>
          
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}

          {trend && (
            <div className={cn(
              "mt-4 flex items-center text-xs font-semibold uppercase tracking-tighter",
              trend.isUp ? "text-emerald-400" : "text-rose-400"
            )}>
              <span className="mr-1">{trend.isUp ? '+' : '-'}{trend.value}%</span>
              <span>from last month</span>
            </div>
          )}
        </div>
        
        <div className={cn("rounded-xl border p-3", colorMap[color])}>
          <Icon size={24} />
        </div>
      </div>

      {/* Industrial detail: Animated scanning line */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden opacity-20">
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className={cn("h-full w-1/3 blur-sm", dotColorMap[color])}
        />
      </div>
    </motion.div>
  );
}
