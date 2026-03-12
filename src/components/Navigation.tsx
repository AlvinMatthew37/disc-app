'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/admin', label: 'Admin (Questions)' },
    { href: '/test', label: 'Take Test' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-lg group-hover:scale-110 transition-transform shadow-md">
                D
              </div>
              <span className="text-xl font-black tracking-tight text-foreground hidden sm:block">DISC Portal</span>
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-4 font-bold text-sm">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-lg scale-105'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
