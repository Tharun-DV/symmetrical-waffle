'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Server, ServerLogEntry, serversAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Terminal, RefreshCw, AlertCircle, Clock } from 'lucide-react';

interface LogViewerProps {
  server: Server;
}

export default function LogViewer({ server }: LogViewerProps) {
  const [logs, setLogs] = useState<ServerLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const data = await serversAPI.getLogs(server.id);
      setLogs(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch logs:', err);
      setError(err.message || 'Failed to connect to server logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [server.id, autoRefresh]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getPriorityColor = (pri: number) => {
    if (pri <= 3) return "text-rose-400"; // Error/Critical
    if (pri === 4) return "text-amber-400"; // Warning
    return "text-slate-400"; // Info/Notice
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden font-mono text-xs">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2 text-slate-400">
          <Terminal size={14} />
          <span className="font-bold uppercase tracking-widest text-[10px]">Live System Logs // {server.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className={cn(
              "w-8 h-4 rounded-full transition-colors relative",
              autoRefresh ? "bg-cyan-500" : "bg-slate-700"
            )}>
              <div className={cn(
                "absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform",
                autoRefresh ? "translate-x-4" : "translate-x-0"
              )} />
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)} 
            />
            <span className="text-slate-500 group-hover:text-slate-300 transition-colors">Auto-Refresh</span>
          </label>
          <button 
            onClick={fetchLogs}
            className="text-slate-400 hover:text-cyan-400 transition-colors p-1"
            title="Refresh Logs"
          >
            <RefreshCw size={14} className={cn(loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Log Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 selection:bg-cyan-500/30"
      >
        {loading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
            <RefreshCw size={24} className="animate-spin" />
            <span>Establishing connection to node...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-rose-500 gap-2 p-8 text-center">
            <AlertCircle size={24} />
            <span className="font-bold">CONNECTION_FAILURE</span>
            <span className="text-slate-500 text-xs">{error}</span>
            <button 
              onClick={fetchLogs}
              className="mt-4 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
            <Clock size={24} />
            <span>No log entries found for this node.</span>
          </div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="flex gap-3 group hover:bg-white/5 py-0.5 rounded px-1">
              <span className="text-slate-600 shrink-0 select-none">
                [{new Date(log.time * 1000).toLocaleTimeString()}]
              </span>
              <span className={cn("shrink-0 font-bold uppercase select-none w-16", getPriorityColor(log.pri))}>
                {log.tag || 'SYSTEM'}
              </span>
              <span className="text-slate-300 break-all">{log.msg}</span>
              <span className="text-slate-700 ml-auto opacity-0 group-hover:opacity-100 transition-opacity select-none">
                {log.node}@{log.user}
              </span>
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-1.5 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            NODE_UP
          </span>
          <span>{logs.length} ENTRIES LOADED</span>
        </div>
        <div className="font-mono">
          PROXMOX_V8_SESSION // {server.ip_address}
        </div>
      </div>
    </div>
  );
}
