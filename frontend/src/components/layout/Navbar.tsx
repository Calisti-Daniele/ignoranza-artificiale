'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Gateway' },
  { href: '/chat', label: 'Chat' },
  { href: '/vergogna', label: 'Hall of Shame' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 h-12 bg-[--background] border-b border-[--border] flex items-center px-4 sm:px-6"
      role="navigation"
      aria-label="Navigazione principale"
    >
      <div className="flex items-center gap-4 sm:gap-8 w-full min-w-0">
        {/* Logo — truncated on very small screens */}
        <Link
          href="/"
          className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.06em] sm:tracking-[0.08em] text-[--text-primary] hover:text-white transition-colors shrink-0 truncate max-w-[140px] sm:max-w-none"
        >
          <span className="hidden xs:inline">Ignoranza Artificiale™</span>
          <span className="xs:hidden">IA™</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-3 sm:gap-6 ml-auto shrink-0">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.04em] sm:tracking-[0.06em] transition-colors duration-150',
                  'relative whitespace-nowrap',
                  isActive
                    ? 'text-[--text-primary]'
                    : 'text-[--text-muted] hover:text-[--text-primary]',
                )}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute -bottom-[13px] left-0 right-0 h-px bg-[--accent-system]"
                    aria-hidden="true"
                  />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
