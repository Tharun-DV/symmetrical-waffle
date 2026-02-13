'use client';

import React, { useState } from 'react';
import { Monitor } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Globe, Activity, Clock } from 'lucide-react';

interface MonitorFormProps {
  onSubmit: (data: Partial<Monitor>) => Promise<void>;
  isLoading?: boolean;
}

export default function MonitorForm({ onSubmit, isLoading }: MonitorFormProps) {
  const [formData, setFormData] = useState<Partial<Monitor>>({
    type: 'http',
    interval: 60,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  const inputClasses = "w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-slate-200 outline-none ring-cyan-500/20 transition-all focus:border-cyan-500/50 focus:ring-4";
  const labelClasses = "mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className={labelClasses}>Monitor Name</label>
        <div className="relative">
          <Activity className="absolute left-3 top-3 text-slate-500" size={18} />
          <input
            name="name"
            required
            className={cn(inputClasses, "pl-10")}
            placeholder="Production API"
            value={formData.name || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={labelClasses}>Type</label>
          <select
            name="type"
            className={inputClasses}
            value={formData.type}
            onChange={handleChange}
          >
            <option value="http">HTTP Check</option>
            <option value="ping">Ping (ICMP)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Interval (seconds)</label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              name="interval"
              type="number"
              min="10"
              required
              className={cn(inputClasses, "pl-10")}
              value={formData.interval || 60}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClasses}>Target URL / IP</label>
        <div className="relative">
          <Globe className="absolute left-3 top-3 text-slate-500" size={18} />
          <input
            name="target"
            required
            className={cn(inputClasses, "pl-10")}
            placeholder={formData.type === 'http' ? "https://api.example.com" : "192.168.1.1"}
            value={formData.target || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-800 pt-6">
        <button
          type="button"
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-cyan-500 px-8 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 hover:bg-cyan-400 disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Monitor'}
        </button>
      </div>
    </form>
  );
}
