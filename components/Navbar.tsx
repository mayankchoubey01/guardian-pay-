'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMember } from './MemberContext';

export default function Navbar() {
  const pathname = usePathname();
  const { activeMember, allMembers, setActiveMemberId, unreadCount } = useMember();
  const isHead = activeMember?.role === 'head';

  return (
    <header className="topbar" role="banner">
      <div className="brand-section">
        <Link href="/" className="brand-title">
          Guardian Pay
        </Link>
        <span className="brand-badge">PayPal Sandbox</span>
      </div>

      <nav className="topbar-nav" aria-label="Main Navigation">
        <Link
          href="/send"
          className={`nav-link ${pathname === '/send' ? 'active' : ''}`}
        >
          Send Money
        </Link>

        {isHead && (
          <>
            <Link
              href="/dashboard"
              className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              href="/members"
              className={`nav-link ${pathname === '/members' ? 'active' : ''}`}
            >
              Member Limits
            </Link>
            <Link
              href="/notifications"
              className={`notif-bell ${pathname === '/notifications' ? 'active' : ''}`}
              aria-label={`Notifications, ${unreadCount} unread`}
            >
              Inbox {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </Link>
          </>
        )}

        <Link
          href="/demo"
          className={`nav-link ${pathname === '/demo' ? 'active' : ''}`}
        >
          Demo Scenarios
        </Link>
      </nav>

      <div className="switcher-box">
        <label htmlFor="member-switcher" className="switcher-label">
          Viewing as:
        </label>
        <select
          id="member-switcher"
          className="switcher-select"
          value={activeMember?.id || 'dad'}
          onChange={(e) => setActiveMemberId(e.target.value)}
          aria-label="Switch current family member"
        >
          {allMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.role.toUpperCase()})
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}

