'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error('Not authenticated');
      const data = await res.json();
      if (data.user.role !== 'admin') {
        router.push('/worker');
        return;
      }
      setUser(data.user);
    } catch (error) {
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const navItems = [
    { href: '/admin', label: 'דשבורד', icon: '📊' },
    { href: '/admin/sales', label: 'מכירות', icon: '💰' },
    { href: '/admin/expenses', label: 'הוצאות', icon: '📝' },
    { href: '/admin/categories', label: 'קטגוריות', icon: '📁' },
    { href: '/admin/suppliers', label: 'ספקים', icon: '🚚' },
    { href: '/admin/employees', label: 'עובדים', icon: '👥' },
    { href: '/admin/targets', label: 'יעדים', icon: '🎯' },
  ];

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div>טוען...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo">
          <div className="logo-icon">🐾</div>
          <div className="logo-text">חנות מספר</div>
        </div>

        <nav className="nav-section">
          <div className="nav-title">ניהול</div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="nav-section" style={{ marginTop: 'auto' }}>
          <div className="nav-title">חשבון</div>
          <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="user-avatar">{user?.name?.charAt(0)}</div>
            <div>
              <div style={{ fontWeight: 500 }}>{user?.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>מנהל</div>
            </div>
          </div>
          <button className="nav-link" onClick={handleLogout}>
            <span className="icon">🚪</span>
            התנתק
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>

      <button 
        className="mobile-menu-btn" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>
    </div>
  );
}
