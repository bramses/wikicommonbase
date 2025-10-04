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
    { href: '/graph', label: 'Graph', key: 'm' }
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle navigation if no input is focused and no modifiers are pressed
      if (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const item = navItems.find(nav => nav.key === event.key.toLowerCase());
      if (item) {
        event.preventDefault();
        router.push(item.href);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              WikiGame
            </Link>
          </div>
          <div className="flex space-x-8">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium group
                  ${pathname === item.href
                    ? 'border-blue-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }
                `}
              >
                <span>{item.label}</span>
                <kbd className="ml-2 px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 group-hover:bg-gray-200 dark:group-hover:bg-gray-600">
                  {item.key}
                </kbd>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}