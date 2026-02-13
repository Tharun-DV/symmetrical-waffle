'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { monitorsAPI, serversAPI, Monitor, Server, InfrastructureNode } from '@/lib/api';

interface AlertRuleFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

type AlertType = 'monitor' | 'infrastructure';

interface AlertTypeOption {
  value: AlertType;
  label: string;
}

interface ConditionType {
  value: string;
  label: string;
  needsThreshold: boolean;
}

const alertTypes: AlertTypeOption[] = [
  { value: 'monitor', label: 'Uptime Monitor' },
  { value: 'infrastructure', label: 'Infrastructure' },
];

const conditionTypes: Record<string, ConditionType> = {
  'status_down': { value: 'status_down', label: 'Status Down', needsThreshold: false },
  'latency_high': { value: 'latency_high', label: 'High Latency', needsThreshold: true },
  'uptime_low': { value: 'uptime_low', label: 'Low Uptime', needsThreshold: true },
  'cpu_high': { value: 'cpu_high', label: 'High CPU Usage', needsThreshold: true },
  'memory_high': { value: 'memory_high', label: 'High Memory Usage', needsThreshold: true },
};

const conditionGroups: Record<string, ConditionType[]> = {
  monitor: [
    conditionTypes['status_down'],
    conditionTypes['latency_high'],
    conditionTypes['uptime_low'],
  ],
  infrastructure: [
    conditionTypes['cpu_high'],
    conditionTypes['memory_high'],
  ],
};

interface ThresholdUnit {
  label: string;
  unit: string;
  decimalPlaces: number;
}

const thresholdUnits: Record<string, ThresholdUnit> = {
  'latency_high': { label: 'ms', unit: 'ms', decimalPlaces: 0 },
  'uptime_low': { label: '%', unit: '%', decimalPlaces: 1 },
  'cpu_high': { label: '%', unit: '%', decimalPlaces: 1 },
  'memory_high': { label: 'MB', unit: 'MB', decimalPlaces: 0 },
};

export default function AlertRuleForm({ onSubmit, onCancel, initialData }: AlertRuleFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: (initialData?.type as AlertType) || 'infrastructure',
    target_id: initialData?.target_id || 1,
    condition_type: (initialData?.condition_type as string) || 'cpu_high',
    threshold: initialData?.threshold || null,
  });

  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [infrastructureNodes, setInfrastructureNodes] = useState<InfrastructureNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [serversData, monitorsData] = await Promise.all([
          serversAPI.getAll(),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/monitors`).then(r => r.json()),
        ]);

        setServers(serversData || []);
        setMonitors(monitorsData || []);

        if (formData.type === 'infrastructure') {
          const nodes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/infrastructure/nodes`).then(r => r.json());
          setInfrastructureNodes(nodes || []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [formData.type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const availableConditions = conditionGroups[formData.type] || [];
    const currentCondition = conditionTypes[formData.condition_type];
    const needsThreshold = currentCondition?.needsThreshold || false;

    const payload = needsThreshold
      ? formData
      : { ...formData, threshold: null };

    onSubmit(payload);
  };

  const availableConditions = conditionGroups[formData.type] || [];
  const currentCondition = conditionTypes[formData.condition_type];
  const needsThreshold = currentCondition?.needsThreshold || false;
  const unitInfo = needsThreshold ? thresholdUnits[formData.condition_type] : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Alert Name
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-cyan-500 focus:outline-none"
          placeholder="e.g., CPU High Warning"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Alert Type
        </label>
        <select
          required
          value={formData.type}
          onChange={(e) => setFormData({ 
            ...formData, 
            type: e.target.value as AlertType,
            target_id: 1,
            condition_type: formData.type === 'monitor' ? 'status_down' : 'cpu_high'
          })}
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-cyan-500 focus:outline-none"
        >
          {alertTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Target
        </label>
        <select
          required
          value={formData.target_id}
          onChange={(e) => setFormData({ ...formData, target_id: parseInt(e.target.value) })}
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-cyan-500 focus:outline-none"
          disabled={loading}
        >
          <option value="" disabled>
            {loading ? 'Loading...' : 'Select Target...'}
          </option>
          {formData.type === 'monitor' ? (
            monitors.map((monitor) => (
              <option key={monitor.id} value={monitor.id}>
                {monitor.name} - {monitor.type.toUpperCase()} ({monitor.target})
              </option>
            ))
          ) : (
            infrastructureNodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.node_name} - {node.ip_address}
              </option>
            ))
          )}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Condition
        </label>
        <select
          required
          value={formData.condition_type}
          onChange={(e) => setFormData({ 
            ...formData, 
            condition_type: e.target.value,
          })}
          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-cyan-500 focus:outline-none"
        >
          {availableConditions.map((condition) => (
            <option key={condition.value} value={condition.value}>
              {condition.label}
            </option>
          ))}
        </select>
      </div>

      {needsThreshold && unitInfo ? (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Threshold {unitInfo && `(in ${unitInfo.unit})` || ''}
          </label>
          <input
            type="number"
            step={unitInfo.decimalPlaces === 0 ? 1 : 0.1}
            required
            value={formData.threshold}
            onChange={(e) => setFormData({ ...formData, threshold: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:border-cyan-500 focus:outline-none"
            placeholder={`0${unitInfo.decimalPlaces > 0 ? '.0' : ''} (${unitInfo.unit})`}
          />
        </div>
      ) : (
        <div className="text-xs text-slate-500 italic">
          No threshold needed for this condition
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors"
        >
          Create Rule
        </button>
      </div>
    </form>
  );
}