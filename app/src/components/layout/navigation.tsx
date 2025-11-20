'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@prisma/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface NavigationProps {
  workspaceSlug?: string
  profile?: Profile
}

export function Navigation({ workspaceSlug, profile }: NavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Build navigation links based on workspace context
  const navLinks = workspaceSlug
    ? [
        { href: `/w/${workspaceSlug}/dashboard`, label: 'Dashboard' },
        { href: `/w/${workspaceSlug}/chatflows`, label: 'Chatflows' },
        { href: `/w/${workspaceSlug}/analytics`, label: 'Analytics' },
        { href: `/w/${workspaceSlug}/settings`, label: 'Settings' },
      ]
    : [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/preview', label: 'Preview Chat' },
        { href: '/analytics', label: 'Analytics' },
        { href: '/settings', label: 'Settings' },
      ]

  const secondaryLinks = [
    { href: '/feedback', label: 'Feedback' },
    { href: '/changelog', label: 'Changelog' },
    { href: '/help', label: 'Help' },
    { href: '/docs', label: 'Docs' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Get initials for avatar fallback
  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email?.slice(0, 2).toUpperCase() || 'U'
  }

  return (
    <nav className="h-16 border-b border-[var(--border-primary)] bg-[var(--background-primary)]">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link
            href={workspaceSlug ? `/w/${workspaceSlug}/dashboard` : '/'}
            className="flex items-center gap-2"
          >
            <span className="text-2xl font-bold">iO</span>
            <span className="text-xl font-light">zen</span>
          </Link>
        </div>

        {/* Center: Primary Navigation */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname?.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors rounded-md',
                  'relative',
                  isActive
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)]" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Right: Secondary Links + User Menu */}
        <div className="flex items-center gap-4">
          {secondaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--background-tertiary)] transition-colors"
                  aria-label="User menu"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile.avatarUrl || undefined} />
                    <AvatarFallback className="bg-[var(--background-tertiary)] text-[var(--text-secondary)] text-xs">
                      {getInitials(profile.name, profile.email)}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {profile.name || 'User'}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {profile.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={workspaceSlug ? `/w/${workspaceSlug}/settings` : '/settings'}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 cursor-pointer text-red-500 focus:text-red-500"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              className="w-10 h-10 rounded-full bg-[var(--background-tertiary)] border border-[var(--border-primary)] flex items-center justify-center hover:bg-[var(--border-primary)] transition-colors"
              aria-label="User menu"
            >
              <User className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
