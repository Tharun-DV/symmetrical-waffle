'use client';

import React, { useEffect, useState } from 'react';
import { alertsAPI, Alert, AlertRule, serversAPI, Monitor, Server } from '@/lib/api';
import { Bell, AlertTriangle, CheckCircle, XCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Modal from '@/components/Modal';
import AlertRuleForm from '@/components/AlertRuleForm';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [alertsData, rulesData, serversData] = await Promise.all([
        alertsAPI.getAlerts({}),
        alertsAPI.getRules(),
        serversAPI.getAll(),
      ]);
      setAlerts(alertsData || []);
      setRules(rulesData || []);
      setServers(serversData || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (data: any) => {
    setSubmitting(true);
    try {
      await alertsAPI.createRule(data);
      await loadData();
      setIsRuleModalOpen(false);
    } catch (error) {
      console.error('Failed to create alert rule:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async (id: number) => {
    try {
      await alertsAPI.acknowledge(id);
      await loadData();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await alertsAPI.resolve(id);
      await loadData();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) {
      return;
    }
    try {
      await alertsAPI.deleteRule(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete alert rule:', error);
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const totalAlerts = alerts.length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-100">Alerts & Notifications</h2>
          <p className="text-sm text-slate-400">System monitoring alerts and thresholds</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-4 py-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              totalAlerts > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
            )} />
            <span className="text-xs font-mono text-slate-400">
              {totalAlerts} alerts ({activeAlerts.length} active)
            </span>
          </div>
          <button
            onClick={() => setIsRuleModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
          >
            <Plus size={18} />
            Create Alert Rule
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-widest text-slate-500">Total Alerts</span>
                <Bell size={20} className="text-slate-400" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-100">{totalAlerts}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-widest text-slate-500">Active Alerts</span>
                <AlertTriangle size={20} className="text-cyan-400" />
              </div>
              <p className="mt-2 text-3xl font-bold text-cyan-400">{activeAlerts.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-widest text-slate-500">Critical</span>
                <XCircle size={20} className="text-rose-400" />
              </div>
              <p className="mt-2 text-3xl font-bold text-rose-400">{criticalAlerts}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-100">Alert Rules ({rules.length})</h3>
              {rules.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-12 text-center">
                  <Bell size={48} className="mb-4 text-slate-500" />
                  <h3 className="text-lg font-bold text-slate-300">No Alert Rules</h3>
                  <p className="text-slate-500">Create rules to monitor your systems</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm transition-all hover:border-slate-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-3 w-3 rounded-full",
                            rule.enabled ? "bg-cyan-500" : "bg-slate-600"
                          )} />
                          <div>
                            <h4 className="font-medium text-slate-100">{rule.name}</h4>
                            <p className="text-sm text-slate-400">
                              {rule.type} • {rule.condition_type}
                              {rule.threshold !== null && ` • ${rule.threshold}`}
                            </p>
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Target ID: {rule.target_id} • Created: {new Date(rule.created_at).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Rule"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-100">Recent Alerts</h3>
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-12 text-center">
                  <CheckCircle size={48} className="mb-4 text-emerald-500" />
                  <h3 className="text-lg font-bold text-slate-300">No Active Alerts</h3>
                  <p className="text-slate-500">System is operating normally</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "flex items-center justify-between rounded-xl border bg-slate-900/50 p-4 backdrop-blur-sm transition-all",
                        alert.severity === 'critical' && "border-rose-500/50 bg-rose-500/5",
                        alert.severity === 'high' && "border-orange-500/50 bg-orange-500/5",
                        alert.severity === 'medium' && "border-amber-500/50 bg-amber-500/5",
                        alert.status === 'acknowledged' && "opacity-60"
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          {alert.severity === 'critical' && <XCircle size={18} className="text-rose-400" />}
                          {alert.severity === 'high' && <AlertTriangle size={18} className="text-orange-400" />}
                          {alert.severity === 'medium' && <Bell size={18} className="text-amber-400" />}
                          {alert.severity === 'low' && <Bell size={18} className="text-emerald-400" />}
                          <div>
                            <h4 className="font-medium text-slate-100">{alert.target_name || 'Unknown'}</h4>
                            <p className="text-sm text-slate-400">{alert.message}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 uppercase font-bold">{alert.status}</span>
                          <span>{new Date(alert.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleAcknowledge(alert.id)}
                              className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                              title="Acknowledge"
                            >
                              <CheckCircle size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        title="Create Alert Rule"
      >
        <AlertRuleForm
          onSubmit={handleCreateRule}
          onCancel={() => setIsRuleModalOpen(false)}
        />
      </Modal>
    </div>
  );
}