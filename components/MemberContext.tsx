'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface Member {
  id: string;
  name: string;
  role: 'head' | 'adult' | 'teen' | 'child' | 'elder';
  auto_limit: number;
  notify_limit: number;
}

interface MemberContextType {
  activeMember: Member;
  allMembers: Member[];
  setActiveMemberId: (id: string) => void;
  unreadCount: number;
  refreshUnreadCount: () => void;
}

const DEFAULT_MEMBERS: Member[] = [
  { id: 'dad', name: 'Dad', role: 'head', auto_limit: 999999, notify_limit: 999999 },
  { id: 'mom', name: 'Mom', role: 'adult', auto_limit: 25, notify_limit: 100 },
  { id: 'riya', name: 'Riya', role: 'teen', auto_limit: 10, notify_limit: 40 },
  { id: 'aarav', name: 'Aarav', role: 'child', auto_limit: 5, notify_limit: 20 },
  { id: 'grandma', name: 'Grandma', role: 'elder', auto_limit: 10, notify_limit: 30 },
];

const MemberContext = createContext<MemberContextType>({
  activeMember: DEFAULT_MEMBERS[0],
  allMembers: DEFAULT_MEMBERS,
  setActiveMemberId: () => {},
  unreadCount: 0,
  refreshUnreadCount: () => {},
});

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [allMembers, setAllMembers] = useState<Member[]>(DEFAULT_MEMBERS);
  const [activeMemberId, setActiveMemberIdState] = useState<string>('dad');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/count');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch {
      // Keep silent
    }
  }, []);

  // Read from localStorage after hydration to avoid mismatch
  useEffect(() => {
    const saved = localStorage.getItem('guardian_active_member');
    if (saved) {
      setActiveMemberIdState(saved);
    }
    setMounted(true);
  }, []);

  // Only fetch updated limits from server once on mount
  useEffect(() => {
    fetch('/api/members')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setAllMembers(data); })
      .catch(() => { /* Use defaults */ });

    refreshUnreadCount();
    const timer = setInterval(refreshUnreadCount, 3000);
    return () => clearInterval(timer);
  }, [refreshUnreadCount]);

  const setActiveMemberId = useCallback((id: string) => {
    setActiveMemberIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('guardian_active_member', id);
    }
  }, []);

  const activeMember = useMemo(() =>
    allMembers.find((m) => m.id === activeMemberId) || allMembers[0],
    [allMembers, activeMemberId]
  );

  const contextValue = useMemo(() => ({
    activeMember,
    allMembers,
    setActiveMemberId,
    unreadCount,
    refreshUnreadCount,
    mounted,
  }), [activeMember, allMembers, setActiveMemberId, unreadCount, refreshUnreadCount, mounted]);

  // Don't render children until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <MemberContext.Provider value={contextValue}>
        {children}
      </MemberContext.Provider>
    );
  }

  return (
    <MemberContext.Provider value={contextValue}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  const context = useContext(MemberContext);
  if (!context) {
    throw new Error('useMember must be used within a MemberProvider');
  }
  return context;
}

