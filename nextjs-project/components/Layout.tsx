'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Server, 
  ShieldCheck, 
  FileBadge, 
  Menu, 
  X, 
  Bell, 
  Settings,
  Shield,
  Zap,
  Activity,
  HardDrive,
  AlertTriangle,
  Users,
  BarChart3,
  LogOut,
  User as UserIcon,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { isAuthenticated as checkAuthFn, getStoredUser as getUserFn, authAPI as authApiObj, User as UserType } from '@/lib/api';

interface SidebarItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}

function SidebarItem({ href, icon: Icon, label, active }: SidebarItemProps) {
  return (
    <Link href={href}>
      <div className={cn(
        "group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300",
        active 
          ? "bg-cyan-500/10 text-cyan-400" 
          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
      )}>
        {active && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 h-6 w-1 rounded-r-full bg-cyan-400"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <Icon size={20} className={cn("transition-transform duration-300 group-hover:scale-110", active && "text-cyan-400")} />
        <span className="font-medium tracking-wide">{label}</span>
      </div>
    </Link>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    const checkAuthStatus = () => {
      const authenticated = checkAuthFn();
      const storedUser = getUserFn();
      setIsAuth(authenticated);
      setUser(storedUser);

      if (!authenticated && pathname !== '/login') {
        router.push('/login');
      }
    };

    checkAuthStatus();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await authApiObj.logout();
    } catch {
      // Ignore logout errors
    }
    router.push('/login');
  };

  const navigation = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/servers', icon: Server, label: 'Servers' },
    { href: '/licenses', icon: FileBadge, label: 'Licenses' },
    { href: '/licenses/reports', icon: BarChart3, label: 'Reports' },
    { href: '/users', icon: Users, label: 'Users' },
    { href: '/compliance', icon: ShieldCheck, label: 'Compliance' },
    { href: '/infrastructure', icon: HardDrive, label: 'Infrastructure' },
    { href: '/monitoring', icon: Activity, label: 'Monitoring' },
    { href: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  ];

  // Show login page without sidebar
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-slate-950">
        {children}
      </div>
    );
  }

  // Not authenticated and not on login - redirect
  if (!isAuth) {
    return null;
  }

  // Authenticated user - show full layout with sidebar
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100 contrast-150" />
      </div>

      {/* Navigation */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-full border-r border-slate-800 bg-slate-950/80 backdrop-blur-xl transition-all duration-500",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center justify-between px-6">
            {isSidebarOpen ? (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500 shadow-lg shadow-cyan-500/20">
                  <Shield className="text-slate-950" size={18} strokeWidth={2.5} />
                </div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  GUARD<span className="text-cyan-400">OS</span>
                </span>
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500 mx-auto">
                <Shield className="text-slate-950" size={18} strokeWidth={2.5} />
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-2 px-3 py-4">
            {navigation.map((item) => (
              <SidebarItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={isSidebarOpen ? item.label : ''}
                active={pathname === item.href}
              />
            ))}
          </nav>

          <div className="border-t border-slate-800 p-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-500",
        isSidebarOpen ? "pl-64" : "pl-20"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 h-20 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-md">
          <div className="flex h-full items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-slate-200">
                {navigation.find(n => n.href === pathname)?.label || 'System'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-4 py-1.5 text-xs font-mono text-cyan-400">
                <Zap size={12} className="fill-cyan-400" />
                SYSTEM_STABLE
              </div>
              
              <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
                <button className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors">
                  <Bell size={20} />
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 border border-slate-700 shadow-inner flex items-center justify-center">
                      <UserIcon size={16} className="text-white" />
                    </div>
                    <ChevronDown size={16} className={cn("transition-transform", showUserMenu && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden"
                      >
                        <div className="p-3 border-b border-slate-800">
                          <p className="font-medium text-white">{user?.full_name || user?.username}</p>
                          <p className="text-sm text-slate-400">{user?.email}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-cyan-500/20 text-cyan-400 rounded capitalize">
                            {user?.role}
                          </span>
                        </div>
                        <div className="p-2">
                          <Link
                            href="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Settings size={16} />
                            Settings
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <LogOut size={16} />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
