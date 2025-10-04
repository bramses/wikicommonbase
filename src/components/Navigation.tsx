'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/reader', label: 'Reader' },
    { href: '/ledger', label: 'Ledger' },
    { href: '/join', label: 'Join' },
    { href: '/graph', label: 'Graph' }
  ];

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
                  inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                  ${pathname === item.href
                    ? 'border-blue-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}