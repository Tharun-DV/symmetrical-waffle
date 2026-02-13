'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Server, serversAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Terminal as TerminalIcon, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface ShellTerminalProps {
  server: Server;
}

export default function ShellTerminal({ server }: ShellTerminalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkTerminalAccess() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/servers/${server.id}/shell`);
        if (!response.ok) {
          throw new Error('Failed to check terminal access');
        }
        const data = await response.json();
        
        if (data.type === 'redirect') {
          setError(null);
        } else if (data.error) {
          setError(data.error);
        }
      } catch (err) {
        console.error('Failed to check terminal access:', err);
        setError('Failed to check terminal access');
      } finally {
        setLoading(false);
      }
    }

    checkTerminalAccess();
  }, [server.id]);

  return (
    <div className="flex flex-col h-[600px] bg-[#0a0a0f] border border-border cyber-chamfer relative overflow-hidden group">
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/30 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_5px_#00ff88]" />
          <span className="font-accent font-bold text-xs tracking-[0.2em] text-primary">PROXMOX_SHELL // {server.name}</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1"><TerminalIcon size={12} /> NOVNC</span>
          <span className="opacity-50">|</span>
          <span className="text-primary/70">{server.ip_address}:{server.port}</span>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f]/50 gap-4">
            <RefreshCw className="animate-spin text-primary" size={32} />
            <div className="text-center space-y-2">
              <span className="font-mono text-xs text-primary/50 animate-pulse tracking-widest block">INITIALIZING PROXMOX TERMINAL</span>
              <p className="text-xs text-slate-500">Establishing connection via Proxmox API...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
            <AlertCircle size={48} className="text-destructive mb-4" />
            <h4 className="font-heading text-xl text-destructive tracking-widest mb-2 uppercase">Connection Failure</h4>
            <p className="font-mono text-sm text-muted-foreground mb-6 max-w-md">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-destructive/10 border border-destructive text-destructive font-accent uppercase tracking-widest hover:bg-destructive hover:text-foreground transition-all cyber-chamfer-sm"
            >
              Retry Connection
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="h-full flex items-center justify-center bg-[#0a0a0f]/50 p-8">
            <div className="text-center space-y-6 max-w-lg">
              <ExternalLink className="w-16 h-16 text-cyan-400 mx-auto opacity-50" size={64} />
              <h3 className="text-2xl font-bold text-slate-100">Access Proxmox Web Interface</h3>
              <p className="text-sm text-slate-400">
                The terminal can be accessed directly through Proxmox's built-in web interface
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.open(`https://${server.ip_address}:${server.port}`, '_blank')}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 font-bold uppercase tracking-widest hover:bg-cyan-500/20 transition-all cyber-chamfer"
                >
                  <ExternalLink size={20} />
                  Open Proxmox Web UI
                </button>
                <div className="text-[10px] font-mono text-slate-500 space-y-1">
                  <p>Server: {server.ip_address}:{server.port}</p>
                  <p>Node: {server.node || 'pve'}</p>
                  <p>Username: {server.username || 'root@pam'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(0,255,136,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,136,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
    </div>
  );
}
