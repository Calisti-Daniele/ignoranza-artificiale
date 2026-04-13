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
      className="fixed top-0 left-0 right-0 z-40 h-12 bg-[--background] border-b border-[--border] flex items-center px-6"
      role="navigation"
      aria-label="Navigazione principale"
    >
      <div className="flex items-center gap-8 w-full">
        {/* Logo */}
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.08em] text-[--text-primary] hover:text-white transition-colors shrink-0"
        >
          Ignoranza Artificiale™
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6 ml-auto">
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
                  'font-mono text-[11px] uppercase tracking-[0.06em] transition-colors duration-150',
                  'relative',
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
