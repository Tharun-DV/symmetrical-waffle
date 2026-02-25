'use client';

import React, { useEffect, useState, useRef } from 'react';
import { User, usersAPI, License, CreateUserRequest } from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import UserForm from '@/components/UserForm';
import { Plus, User as UserIcon, Mail, Building, Shield, RefreshCw, Key, Upload, Download, X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userLicenses, setUserLicenses] = useState<License[]>([]);
  const [licensesLoading, setLicensesLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; failed: string[]; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersAPI.getAll();
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    try {
      const result = await usersAPI.importUsers(file);
      setImportResult(result);
      await loadUsers();
      if (result.failed.length === 0) {
        toast.success(`Successfully imported ${result.imported} users`);
      } else {
        toast.warning(`Imported ${result.imported} users, ${result.failed.length} failed`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTemplate = () => {
    usersAPI.downloadTemplate();
  };

  const handleCreate = async (data: CreateUserRequest) => {
    setSubmitting(true);
    try {
      await usersAPI.create(data);
      await loadUsers();
      setIsModalOpen(false);
      toast.success('User created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: CreateUserRequest) => {
    if (!editingUser) return;
    setSubmitting(true);
    try {
      const { password, ...updateData } = data;
      await usersAPI.update(editingUser.id, updateData);
      await loadUsers();
      setEditingUser(null);
      toast.success('User updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.username}?`)) {
      try {
        await usersAPI.delete(user.id);
        await loadUsers();
        toast.success(`User "${user.username}" deleted successfully`);
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete user');
      }
    }
  };

  const loadUserLicenses = async (user: User) => {
    setSelectedUser(user);
    setLicensesLoading(true);
    try {
      const data = await usersAPI.getLicenses(user.id);
      setUserLicenses(data || []);
    } catch (error) {
      console.error('Failed to load user licenses:', error);
      setUserLicenses([]);
    } finally {
      setLicensesLoading(false);
    }
  };

  const columns = [
    {
      key: 'username',
      header: 'User',
      sortable: true,
      render: (u: User) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <UserIcon size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-100">{u.username}</p>
            <p className="text-xs text-slate-500">{u.full_name || 'No name'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      render: (u: User) => (
        <div className="flex items-center gap-2 text-slate-300">
          <Mail size={14} className="text-slate-500" />
          {u.email}
        </div>
      )
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (u: User) => (
        <div className="flex items-center gap-2 text-slate-300">
          <Building size={14} className="text-slate-500" />
          {u.department || '-'}
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      render: (u: User) => (
        <span className={cn(
          "rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-tighter",
          u.role === 'admin' ? "bg-rose-500/10 text-rose-500" :
          u.role === 'manager' ? "bg-amber-500/10 text-amber-500" :
          "bg-cyan-500/10 text-cyan-500"
        )}>
          {u.role}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (u: User) => (
        <span className={cn(
          "rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-tighter",
          u.status === 'active' ? "bg-emerald-500/10 text-emerald-500" :
          u.status === 'inactive' ? "bg-slate-500/10 text-slate-500" :
          "bg-rose-500/10 text-rose-500"
        )}>
          {u.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-100">User Management</h2>
          <p className="text-sm text-slate-400">Manage users and license assignments.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadUsers}
            className="rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-all"
          >
            <RefreshCw size={20} className={cn(loading && "animate-spin")} />
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-all"
          >
            <Download size={18} />
            Template
          </button>
          <label className="flex items-center gap-2 rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-all cursor-pointer">
            <Upload size={18} />
            {importing ? 'Importing...' : 'Import CSV'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
              disabled={importing}
            />
          </label>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 hover:bg-cyan-400"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      <DataTable
        data={users}
        columns={columns}
        onEdit={(u) => setEditingUser(u)}
        onDelete={handleDelete}
        onView={(u) => loadUserLicenses(u)}
        searchPlaceholder="Filter by username, email, or department..."
        viewLabel="Licenses"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New User"
      >
        <UserForm onSubmit={handleCreate} isLoading={submitting} />
      </Modal>

      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User"
      >
        <UserForm 
          initialData={editingUser || undefined} 
          onSubmit={handleUpdate} 
          isLoading={submitting}
          isEdit
        />
      </Modal>

      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`${selectedUser?.username}'s Licenses`}
      >
        <div className="space-y-4">
          {licensesLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin text-cyan-500" size={24} />
            </div>
          ) : userLicenses.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No licenses assigned to this user.</p>
          ) : (
            <div className="space-y-3">
              {userLicenses.map(license => (
                <div key={license.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Key size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-100">{license.product}</p>
                      <p className="text-xs text-slate-500">{license.vendor}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-200">{license.license_key.substring(0, 8)}...</p>
                    <p className="text-xs text-slate-500">{license.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!importResult}
        onClose={() => setImportResult(null)}
        title="Import Results"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <CheckCircle className="text-emerald-500" size={24} />
            <div>
              <p className="font-bold text-emerald-400">{importResult?.imported} users imported successfully</p>
              <p className="text-sm text-slate-400">out of {importResult?.total} total rows</p>
            </div>
          </div>

          {importResult && importResult.failed && importResult.failed.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertCircle size={18} />
                <span className="font-medium">{importResult.failed.length} rows failed</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {importResult.failed.map((msg, i) => (
                  <p key={i} className="text-xs text-slate-500 bg-slate-900/50 p-2 rounded">{msg}</p>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setImportResult(null)}
            className="w-full py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors"
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
}
