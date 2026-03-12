'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, ListChecks, Brain } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin', label: 'Admin', icon: Settings },
    { href: '/test', label: 'Take Test', icon: ListChecks },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white transition-all group-hover:scale-110 group-hover:rotate-6 shadow-lg">
                <Brain size={24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-foreground leading-none">DISC</span>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none">Portal</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 font-bold text-sm">
            {links.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-primary text-white shadow-lg scale-105'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
