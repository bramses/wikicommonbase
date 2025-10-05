'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { loadSelectedCategories, createUrlWithCategories } from '@/lib/categories';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [unconnectedCount, setUnconnectedCount] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // Track when we're on the client side to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const navItems = useMemo(() => [
    { href: '/', label: 'Home', key: 'c' },
    { href: '/reader', label: 'Reader', key: 'v' },
    { href: '/ledger', label: 'Ledger', key: 'b' },
    { href: '/inbox', label: 'Inbox', key: 'i', badge: unconnectedCount > 0 ? unconnectedCount : undefined },
    { href: '/join', label: 'Join', key: 'n' },
    { href: '/graph', label: 'Graph', key: 'm' },
  ], [unconnectedCount]);

  // Fetch unconnected entries count
  useEffect(() => {
    const fetchUnconnectedCount = async () => {
      try {
        const response = await fetch('/api/entries?limit=1000'); // Get a large batch to count accurately
        if (response.ok) {
          const data = await response.json();
          const unconnectedCount = data.entries.filter((entry: { metadata: { joins: string[] } }) => entry.metadata.joins.length === 0).length;
          setUnconnectedCount(unconnectedCount);
        }
      } catch (error) {
        console.error('Error fetching unconnected count:', error);
      }
    };

    fetchUnconnectedCount();
  }, []);

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

        // For reader page, include categories from localStorage (only on client side)
        let targetUrl = item.href;
        if (item.href === '/reader' && isClient) {
          const categories = loadSelectedCategories();
          targetUrl = createUrlWithCategories(item.href, categories);
        }

        router.push(targetUrl);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [router, navItems, isClient]);

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
            Wikipedia Commonbase
          </Link>

          {/* links */}
          <div className="flex items-center gap-x-8 md:gap-x-16">
            {navItems.map((item) => {
              const active = pathname === item.href;
              // For reader link, include categories from localStorage (only on client side)
              const linkUrl = item.href === '/reader' && isClient
                ? createUrlWithCategories(item.href, loadSelectedCategories())
                : item.href;

              return (
                <Link
                  key={item.href}
                  href={linkUrl}
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
                  {item.badge && (
                    <span
                      style={{
                        marginLeft: 'var(--space-xs)',
                        padding: '2px 6px',
                        background: 'var(--warning)',
                        color: 'white',
                        borderRadius: '50%',
                        fontSize: '10px',
                        fontWeight: '600',
                        minWidth: '18px',
                        height: '18px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}