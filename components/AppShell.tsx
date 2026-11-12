'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMember } from '@/components/MemberContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LayoutDashboard, CreditCard, Users, Bell, Menu, X, Shield, ChevronDown } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/send', label: 'Send Money', icon: CreditCard, roles: ['head', 'adult', 'teen', 'child', 'elder'] },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['head'] },
  { href: '/members', label: 'Member Limits', icon: Users, roles: ['head'] },
  { href: '/notifications', label: 'Notifications', icon: Bell, roles: ['head'], badge: true },
  { href: '/demo', label: 'Demo Scenarios', icon: Shield, roles: ['head', 'adult', 'teen', 'child', 'elder'] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeMember, allMembers, setActiveMemberId, unreadCount, refreshUnreadCount } = useMember();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isHead = activeMember?.role === 'head';

  useEffect(() => {
    refreshUnreadCount();
    const timer = setInterval(refreshUnreadCount, 3000);
    return () => clearInterval(timer);
  }, [refreshUnreadCount]);

  const filteredNavItems = NAV_ITEMS.filter((item) => item.roles.includes(activeMember?.role || ''));

  return (
    <div className="app-shell">
      {/* Mobile sidebar overlay */}
      <div
        className={cn('sidebar-overlay', sidebarOpen && 'open')}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={cn('sidebar', sidebarOpen && 'open')} role="navigation" aria-label="Main navigation">
        <div className="sidebar-header">
          <Link href="/" className="flex items-center gap-2" aria-label="Guardian Pay Home">
            <svg className="shield-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-xl font-bold text-slate-900">Family Guardian</span>
          </Link>
        </div>

        <nav className="sidebar-nav" aria-label="Sidebar navigation">
          <ul className="space-y-1" role="list">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-100'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon size={18} aria-hidden="true" className={cn('flex-shrink-0', isActive && 'text-blue-600')} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && unreadCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <p className="text-xs text-slate-500 text-center">
            Prototype • PayPal Sandbox Only
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar" role="banner">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              aria-expanded={sidebarOpen}
            >
              <Menu size={20} aria-hidden="true" />
            </Button>

            <div className="flex items-center gap-2">
              <svg className="shield-logo text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-xl font-bold text-slate-900 hidden sm:block">Family Guardian</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Viewing as switcher */}
            <div className="relative">
              <label htmlFor="member-switcher" className="sr-only">Viewing as</label>
              <select
                id="member-switcher"
                value={activeMember?.id || 'dad'}
                onChange={(e) => setActiveMemberId(e.target.value)}
                className="appearance-none px-3 py-2 pr-8 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                aria-label="Switch current family member"
              >
                {allMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role.toUpperCase()})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} aria-hidden="true" />
            </div>

            {/* Notification bell for head */}
            {isHead && (
              <Link
                href="/notifications"
                className={cn('relative p-2 rounded-lg transition-colors', pathname === '/notifications' ? 'bg-blue-50' : 'hover:bg-slate-100')}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <Bell size={20} className={cn(pathname === '/notifications' ? 'text-blue-600' : 'text-slate-600')} aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="page-content" id="main-content">
          {children}
        </div>

        {/* Footer */}
        <footer className="site-footer" role="contentinfo">
          <div className="footer-content">
            <p>
              <strong>Family Guardian</strong> • Prototype. PayPal sandbox only. No real money. Not connected to UPI.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}