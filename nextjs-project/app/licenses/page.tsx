'use client';

import React, { useEffect, useState } from 'react';
import { License, licensesAPI, User, usersAPI, licenseUsersAPI, LicenseUser } from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import LicenseForm from '@/components/LicenseForm';
import LicenseDetails from '@/components/LicenseDetails';
import { Plus, FileBadge, Hash, Users, Calendar, DollarSign, RefreshCw, UserPlus, X } from 'lucide-react';
import { cn, formatDate, formatCurrency } from '@/lib/utils';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [assignedUsers, setAssignedUsers] = useState<LicenseUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [detailsLicense, setDetailsLicense] = useState<License | null>(null);

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const data = await licensesAPI.getAll();
      setLicenses(data || []);
    } catch (error) {
      console.error('Failed to load licenses:', error);
      setLicenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLicenses();
  }, []);

  const handleCreate = async (data: Partial<License>) => {
    setSubmitting(true);
    try {
      await licensesAPI.create(data);
      await loadLicenses();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create license:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: Partial<License>) => {
    if (!editingLicense) return;
    setSubmitting(true);
    try {
      await licensesAPI.update(editingLicense.id, data);
      await loadLicenses();
      setEditingLicense(null);
    } catch (error) {
      console.error('Failed to update license:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (license: License) => {
    if (confirm(`Are you sure you want to delete ${license.name}?`)) {
      try {
        await licensesAPI.delete(license.id);
        await loadLicenses();
      } catch (error) {
        console.error('Failed to delete license:', error);
      }
    }
  };

  const loadAssignedUsers = async (license: License) => {
    setSelectedLicense(license);
    setUsersLoading(true);
    try {
      const data = await licenseUsersAPI.getUsers(license.id);
      setAssignedUsers(data || []);
    } catch (error) {
      console.error('Failed to load assigned users:', error);
      setAssignedUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const openAssignModal = async (license: License) => {
    setSelectedLicense(license);
    setUsersLoading(true);
    setIsAssignModalOpen(true);
    try {
      const [usersData, assignedData] = await Promise.all([
        usersAPI.getAll({ status: 'active' }),
        licenseUsersAPI.getUsers(license.id)
      ]);
      setAvailableUsers(usersData || []);
      setAssignedUsers(assignedData || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setAvailableUsers([]);
      setAssignedUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const assignUser = async (userId: number) => {
    if (!selectedLicense) return;
    try {
      await licenseUsersAPI.assignUser(selectedLicense.id, { user_id: userId, role: 'user' });
      const [assignedData] = await Promise.all([
        licenseUsersAPI.getUsers(selectedLicense.id)
      ]);
      setAssignedUsers(assignedData || []);
    } catch (error) {
      console.error('Failed to assign user:', error);
    }
  };

  const removeUser = async (userId: number) => {
    if (!selectedLicense) return;
    try {
      await licenseUsersAPI.removeUser(selectedLicense.id, userId);
      const [assignedData] = await Promise.all([
        licenseUsersAPI.getUsers(selectedLicense.id)
      ]);
      setAssignedUsers(assignedData || []);
    } catch (error) {
      console.error('Failed to remove user:', error);
    }
  };

  const columns = [
    {
      key: 'product',
      header: 'Product / Vendor',
      sortable: true,
      render: (l: License) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileBadge size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-100">{l.product}</p>
            <p className="text-xs text-slate-500">{l.vendor}</p>
          </div>
        </div>
      )
    },
    {
      key: 'license_key',
      header: 'License Key',
      render: (l: License) => (
        <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-300">
          {l.license_key.substring(0, 10)}...
        </code>
      )
    },
    {
      key: 'seats',
      header: 'Utilization',
      render: (l: License) => {
        const percentage = (l.seats_used / l.seats) * 100;
        return (
          <div className="w-32 space-y-1">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-slate-500">
              <span>{l.seats_used} / {l.seats}</span>
              <span>{Math.round(percentage)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  percentage > 90 ? "bg-rose-500" : percentage > 70 ? "bg-amber-500" : "bg-cyan-500"
                )} 
                style={{ width: `${Math.min(100, percentage)}%` }} 
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'expiration_date',
      header: 'Expiration',
      sortable: true,
      render: (l: License) => (
        <div className="flex flex-col">
          <span className={cn(
            "text-xs font-medium",
            l.status === 'expired' ? "text-rose-400" : 
            l.status === 'expiring_soon' ? "text-amber-400" : "text-slate-300"
          )}>
            {l.expiration_date ? formatDate(l.expiration_date) : 'Perpetual'}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">{l.status.replace('_', ' ')}</span>
        </div>
      )
    },
    {
      key: 'cost',
      header: 'Annual Cost',
      sortable: true,
      render: (l: License) => (
        <span className="font-mono text-xs font-bold text-slate-200">
          {formatCurrency(l.cost, l.currency)}
        </span>
      )
    },
    {
      key: 'users',
      header: 'Users',
      render: (l: License) => (
        <button
          onClick={(e) => { e.stopPropagation(); openAssignModal(l); }}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-2.5 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-500/20 transition-colors"
        >
          <Users size={14} />
          Manage
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-100">License Inventory</h2>
          <p className="text-sm text-slate-400">Track software entitlements and seat utilization.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadLicenses}
            className="rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-all"
          >
            <RefreshCw size={20} className={cn(loading && "animate-spin")} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 hover:bg-cyan-400"
          >
            <Plus size={18} />
            Register License
          </button>
        </div>
      </div>

      <DataTable
        data={licenses}
        columns={columns}
        onEdit={(l) => setEditingLicense(l)}
        onDelete={handleDelete}
        onView={(l) => setDetailsLicense(l)}
        viewLabel="Details"
        searchPlaceholder="Filter by product, vendor, or key..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New License Registration"
      >
        <LicenseForm onSubmit={handleCreate} isLoading={submitting} />
      </Modal>

      <Modal
        isOpen={!!editingLicense}
        onClose={() => setEditingLicense(null)}
        title="Modify License Record"
      >
        <LicenseForm 
          initialData={editingLicense || undefined} 
          onSubmit={handleUpdate} 
          isLoading={submitting} 
        />
      </Modal>

      <Modal
        isOpen={!!selectedLicense && !isAssignModalOpen}
        onClose={() => setSelectedLicense(null)}
        title={`${selectedLicense?.product} - Assigned Users`}
      >
        <div className="space-y-4">
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin text-cyan-500" size={24} />
            </div>
          ) : assignedUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">No users assigned to this license.</p>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white mx-auto hover:bg-indigo-400 transition-colors"
              >
                <UserPlus size={16} />
                Assign Users
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-100">{user.username}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                      user.role === 'owner' ? "bg-rose-500/10 text-rose-500" :
                      user.role === 'admin' ? "bg-amber-500/10 text-amber-500" :
                      "bg-cyan-500/10 text-cyan-500"
                    )}>
                      {user.role}
                    </span>
                    <button
                      onClick={() => removeUser(user.user_id)}
                      className="rounded p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 py-3 text-sm text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
              >
                <UserPlus size={16} />
                Add More Users
              </button>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => { setIsAssignModalOpen(false); setSelectedLicense(null); }}
        title={`Assign Users to ${selectedLicense?.product}`}
      >
        <div className="space-y-4">
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin text-cyan-500" size={24} />
            </div>
          ) : (
            <>
              {assignedUsers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Currently Assigned</p>
                  {assignedUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-200">{user.username}</span>
                        <span className="text-xs text-slate-500">({user.email})</span>
                      </div>
                      <button
                        onClick={() => removeUser(user.user_id)}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Available Users</p>
                {availableUsers.filter(u => !assignedUsers.some(au => au.user_id === u.id)).map(user => (
                  <div key={user.id} className="flex items-center justify-between rounded-lg border border-slate-800 p-2 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-200">{user.username}</span>
                      <span className="text-xs text-slate-500">({user.email})</span>
                    </div>
                    <button
                      onClick={() => assignUser(user.id)}
                      className="flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-1 text-xs text-indigo-400 hover:bg-indigo-500/20"
                    >
                      <UserPlus size={12} />
                      Assign
                    </button>
                  </div>
                ))}
                {availableUsers.filter(u => !assignedUsers.some(au => au.user_id === u.id)).length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-4">All users are already assigned.</p>
                )}
              </div>
              </>
          )}
        </div>
      </Modal>

      {detailsLicense && (
        <LicenseDetails
          license={detailsLicense}
          onClose={() => setDetailsLicense(null)}
          onUpdate={loadLicenses}
        />
      )}
    </div>
  );
}
