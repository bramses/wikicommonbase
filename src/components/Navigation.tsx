'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/', label: 'Home', key: 'c' },
    { href: '/reader', label: 'Reader', key: 'v' },
    { href: '/ledger', label: 'Ledger', key: 'b' },
    { href: '/join', label: 'Join', key: 'n' },
    { href: '/graph', label: 'Graph', key: 'm' },
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.ctrlKey || e.metaKey || e.altKey
      ) return;

      const item = navItems.find(n => n.key === e.key.toLowerCase());
      if (item) {
        e.preventDefault();
        router.push(item.href);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [router, navItems]);

  return (
    <nav
      style={{
        background: 'var(--surface-elevated)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="flex justify-between items-center h-20 md:h-24">
          <Link
            href="/"
            className="text-xl font-bold"
            style={{
              color: 'var(--foreground)',
              fontSize: 'var(--text-xl)',
              fontWeight: '700',
              letterSpacing: '-0.02em',
            }}
          >
            WikiGame
          </Link>

          {/* links */}
          <div className="flex items-center gap-x-8 md:gap-x-16">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center rounded-md transition-all duration-200"
                  style={{
                    padding: '0.5rem 0.75rem', // ~px-3 py-2
                    color: active ? 'var(--accent)' : 'var(--foreground-secondary)',
                    fontWeight: active ? 600 : 500,
                    backgroundColor: active ? 'var(--accent-soft)' : 'transparent',
                  }}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="text-sm md:text-base">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}