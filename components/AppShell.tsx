'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMember } from '@/components/MemberContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Home, CreditCard, QrCode, Users, Bell, Shield, Menu, X,
  ChevronDown, Scan, History, Wallet, ShieldCheck
} from 'lucide-react';

const BOTTOM_NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home, roles: ['head', 'adult', 'teen', 'child', 'elder'] },
  { href: '/send', label: 'Pay', icon: CreditCard, roles: ['head', 'adult', 'teen', 'child', 'elder'], primary: true },
  { href: '/scan', label: 'Scan', icon: QrCode, roles: ['head', 'adult', 'teen', 'child', 'elder'] },
  { href: '/history', label: 'History', icon: History, roles: ['head', 'adult', 'teen', 'child', 'elder'] },
  { href: '/contacts', label: 'Contacts', icon: Users, roles: ['head', 'adult', 'teen', 'child', 'elder'] },
];

const HEAD_ONLY_NAV = [
  { href: '/dashboard', label: 'Family Dashboard', icon: ShieldCheck, roles: ['head'] },
  { href: '/members', label: 'Member Limits', icon: Users, roles: ['head'] },
  { href: '/notifications', label: 'Notifications', icon: Bell, roles: ['head'], badge: true },
  { href: '/demo', label: 'Demo Scenarios', icon: Shield, roles: ['head', 'adult', 'teen', 'child', 'elder'] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeMember, allMembers, setActiveMemberId, unreadCount, refreshUnreadCount } = useMember();
  const [showMemberSwitcher, setShowMemberSwitcher] = useState(false);
  const [showHeadMenu, setShowHeadMenu] = useState(false);
  const isHead = activeMember?.role === 'head';

  useEffect(() => {
    refreshUnreadCount();
    const timer = setInterval(refreshUnreadCount, 3000);
    return () => clearInterval(timer);
  }, [refreshUnreadCount]);

  const filteredBottomNav = BOTTOM_NAV_ITEMS.filter(item => item.roles.includes(activeMember?.role || ''));
  const filteredHeadNav = HEAD_ONLY_NAV.filter(item => item.roles.includes(activeMember?.role || ''));

  const isBottomNavActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href + '/'));

  return (
    <div className="app-shell min-h-screen bg-slate-50">
      {/* Top Bar - Clean and minimal like payment apps */}
      <header className="topbar sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2" aria-label="Guardian Pay Home">
              <svg className="w-8 h-8 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-xl font-bold text-slate-900">Guardian Pay</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Member Switcher */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100"
                onClick={() => setShowMemberSwitcher(!showMemberSwitcher)}
                aria-label={`Viewing as ${activeMember?.name}`}
                aria-expanded={showMemberSwitcher}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                     style={{ backgroundColor: getRoleColor(activeMember?.role) }}>
                  {activeMember?.name?.charAt(0)}
                </div>
                <span className="font-medium text-slate-900 hidden sm:block">{activeMember?.name}</span>
                <ChevronDown size={16} className={cn('text-slate-500 transition-transform', showMemberSwitcher && 'rotate-180')} />
              </Button>

              {showMemberSwitcher && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMemberSwitcher(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-4 top-full z-50 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 animate-in slide-in-from-top-2 duration-150">
                    {allMembers.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setActiveMemberId(m.id); setShowMemberSwitcher(false); }}
                        className={cn(
                          'w-full px-4 py-3 text-left flex items-center gap-3 transition-colors',
                          activeMember?.id === m.id ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                             style={{ backgroundColor: getRoleColor(m.role) }}>
                          {m.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{m.name}</p>
                          <p className="text-xs text-slate-500 capitalize">{m.role}</p>
                        </div>
                        {activeMember?.id === m.id && (
                          <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Head Menu / Notifications */}
            {isHead ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 rounded-xl hover:bg-slate-100"
                  onClick={() => setShowHeadMenu(!showHeadMenu)}
                  aria-label="Head menu"
                  aria-expanded={showHeadMenu}
                >
                  <Shield className="w-6 h-6 text-teal-600" aria-hidden="true" />
                </Button>
                {showHeadMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowHeadMenu(false)} aria-hidden="true" />
                    <div className="absolute right-4 top-full z-50 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 animate-in slide-in-from-top-2 duration-150">
                      {filteredHeadNav.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowHeadMenu(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 text-left transition-colors',
                            isBottomNavActive(item.href) ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          <item.icon size={20} className={cn('flex-shrink-0', isBottomNavActive(item.href) && 'text-teal-600')} aria-hidden="true" />
                          <span className="font-medium">{item.label}</span>
                          {item.badge && unreadCount > 0 && (
                            <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </Link>
                      ))}
                      <hr className="my-2 border-slate-200" />
                      <Link
                        href="/"
                        onClick={() => setShowHeadMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-left text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                      >
                        <Shield size={20} className="text-slate-400" aria-hidden="true" />
                        <span>Demo Scenarios</span>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-xl hover:bg-slate-100"
                aria-label="Notifications"
              >
                <Bell className="w-6 h-6 text-slate-600" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="page-content pb-24 pt-4 px-4" id="main-content">
        {children}
      </main>

      {/* Floating Action Button - Primary Action */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 md:hidden">
        <Link href="/send" className="block">
          <Button size="icon" className="w-14 h-14 rounded-full bg-teal-600 text-white shadow-xl hover:bg-teal-700 hover:shadow-2xl transition-all duration-200" aria-label="Send Money">
            <CreditCard className="w-7 h-7" aria-hidden="true" />
          </Button>
        </Link>
      </div>

      {/* Bottom Navigation Bar - Like PhonePe/GPay/Paytm */}
      <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-bottom md:hidden">
        <div className="grid grid-cols-5">
          {filteredBottomNav.map((item) => {
            const Icon = item.icon;
            const isActive = isBottomNavActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-3 px-2 transition-colors',
                  item.primary
                    ? 'relative z-10'
                    : isActive
                      ? 'text-teal-600'
                      : 'text-slate-500 active:text-slate-700'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={cn(
                  'relative p-2 rounded-xl transition-all duration-200',
                  item.primary
                    ? 'bg-teal-600 text-white shadow-lg'
                    : isActive
                      ? 'bg-teal-50 text-teal-600'
                      : 'text-slate-500 hover:bg-slate-100'
                )}>
                  <Icon size={24} aria-hidden="true" />
                </div>
                <span className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-teal-600' : 'text-slate-500'
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar for Head */}
      {isHead && (
        <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:w-64 bg-white border-r border-slate-200 z-40 transform transition-transform duration-300" style={{ top: '64px' }}>
          <nav className="p-4 space-y-1" aria-label="Head navigation">
            {filteredHeadNav.map((item) => {
              const Icon = item.icon;
              const isActive = isBottomNavActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-slate-100'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={20} className={cn('flex-shrink-0', isActive && 'text-teal-600')} aria-hidden="true" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && unreadCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-4 left-4 right-4 p-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">Prototype • PayPal Sandbox Only</p>
          </div>
        </aside>
      )}

      <style jsx>{`
        .app-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .topbar {
          backdrop-filter: blur(8px);
          background: rgba(255, 255, 255, 0.95);
        }
        .page-content {
          flex: 1;
          padding-bottom: 100px; /* Space for bottom nav on mobile */
        }
        .bottom-nav {
          backdrop-filter: blur(8px);
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
        }
        @media (min-width: 768px) {
          .page-content {
            padding-left: 80px;
            padding-bottom: 32px;
          }
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
      `}</style>
    </div>
  );
}

function getRoleColor(role?: string): string {
  return '#0f5b5a';
}