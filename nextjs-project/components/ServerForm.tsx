'use client';

import React, { useState } from 'react';
import { Server } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Shield, Server as ServerIcon, Globe, Lock, Info } from 'lucide-react';

interface ServerFormProps {
  initialData?: Partial<Server>;
  onSubmit: (data: Partial<Server>) => Promise<void>;
  isLoading?: boolean;
}

export default function ServerForm({ initialData, onSubmit, isLoading }: ServerFormProps) {
  const [formData, setFormData] = useState<Partial<Server>>(initialData || {
    type: 'generic',
    status: 'active',
    port: 80,
    verify_ssl: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const inputClasses = "w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-slate-200 outline-none ring-cyan-500/20 transition-all focus:border-cyan-500/50 focus:ring-4";
  const labelClasses = "mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={labelClasses}>Server Name</label>
          <div className="relative">
            <ServerIcon className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              name="name"
              required
              className={cn(inputClasses, "pl-10")}
              placeholder="Primary Datacenter"
              value={formData.name || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Type</label>
          <select
            name="type"
            className={inputClasses}
            value={formData.type}
            onChange={handleChange}
          >
            <option value="generic">Generic Server</option>
            <option value="proxmox">Proxmox VE</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>IP Address / Hostname</label>
          <div className="relative">
            <Globe className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              name="ip_address"
              required
              className={cn(inputClasses, "pl-10")}
              placeholder="10.0.0.1"
              value={formData.ip_address || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Port</label>
          <input
            name="port"
            type="number"
            required
            className={inputClasses}
            value={formData.port || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      {formData.type === 'proxmox' && (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400">
            <Shield size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider">Proxmox Configuration</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className={labelClasses}>Username</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                <input
                  name="username"
                  className={cn(inputClasses, "pl-10")}
                  placeholder="root"
                  value={formData.username || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                <input
                  name="password"
                  type="password"
                  required
                  className={cn(inputClasses, "pl-10")}
                  placeholder="••••••••"
                  value={formData.password || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Realm</label>
              <input
                name="realm"
                className={inputClasses}
                placeholder="pam"
                value={formData.realm || ''}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Node</label>
              <input
                name="node"
                className={inputClasses}
                placeholder="pve"
                value={formData.node || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="verify_ssl"
              id="verify_ssl"
              className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-cyan-500 outline-none focus:ring-2 focus:ring-cyan-500/20"
              checked={formData.verify_ssl}
              onChange={handleChange}
            />
            <label htmlFor="verify_ssl" className="text-sm text-slate-400">
              Verify SSL Certificate
            </label>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className={labelClasses}>Description</label>
        <div className="relative">
          <Info className="absolute left-3 top-3 text-slate-500" size={18} />
          <textarea
            name="description"
            rows={3}
            className={cn(inputClasses, "pl-10 resize-none")}
            placeholder="Main production cluster for EMEA region..."
            value={formData.description || ''}
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
          {isLoading ? 'Processing...' : initialData ? 'Update Server' : 'Provision Server'}
        </button>
      </div>
    </form>
  );
}
