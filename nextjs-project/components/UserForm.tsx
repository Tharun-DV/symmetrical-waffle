'use client';

import React, { useState } from 'react';
import { User, CreateUserRequest } from '@/lib/api';
import { cn } from '@/lib/utils';
import { User as UserIcon, Mail, Phone, Building, Shield, Lock, Eye, EyeOff } from 'lucide-react';

interface UserFormProps {
  initialData?: Partial<User>;
  onSubmit: (data: CreateUserRequest) => Promise<void>;
  isLoading?: boolean;
  isEdit?: boolean;
}

export default function UserForm({ initialData, onSubmit, isLoading, isEdit }: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: initialData?.username || '',
    email: initialData?.email || '',
    full_name: initialData?.full_name || '',
    department: initialData?.department || '',
    role: initialData?.role || 'user',
    status: initialData?.status || 'active',
    phone: initialData?.phone || '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const inputClasses = "w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-slate-200 outline-none ring-cyan-500/20 transition-all focus:border-cyan-500/50 focus:ring-4";
  const labelClasses = "mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={labelClasses}>Username</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              name="username"
              required
              className={cn(inputClasses, "pl-10")}
              placeholder="jdoe"
              value={formData.username}
              onChange={handleChange}
              disabled={isEdit}
            />
          </div>
        </div>

        {!isEdit && (
          <div className="space-y-2">
            <label className={labelClasses}>Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required={!isEdit}
                minLength={8}
                className={cn(inputClasses, "pl-10 pr-10")}
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className={labelClasses}>Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              name="email"
              type="email"
              required
              className={cn(inputClasses, "pl-10")}
              placeholder="john.doe@company.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Full Name</label>
          <input
            name="full_name"
            className={inputClasses}
            placeholder="John Doe"
            value={formData.full_name}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Department</label>
          <div className="relative">
            <Building className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              name="department"
              className={cn(inputClasses, "pl-10")}
              placeholder="Engineering"
              value={formData.department}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              name="phone"
              type="tel"
              className={cn(inputClasses, "pl-10")}
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Role</label>
          <div className="relative">
            <Shield className="absolute left-3 top-3 text-slate-500" size={18} />
            <select
              name="role"
              className={cn(inputClasses, "pl-10")}
              value={formData.role}
              onChange={handleChange}
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Status</label>
          <select
            name="status"
            className={inputClasses}
            value={formData.status}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-800 pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-cyan-500 px-8 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 hover:bg-cyan-400 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : initialData?.id ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
}
