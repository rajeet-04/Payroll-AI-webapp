"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Calendar,
  CheckSquare,
  Settings,
  User,
} from 'lucide-react'

interface AppSidebarProps {
  user: any
  profile: any
  isMobile?: boolean
  onClose?: () => void
}

export function AppSidebar({ user, profile, isMobile = false, onClose }: AppSidebarProps) {
  const pathname = usePathname()
  const isAdmin = profile?.role === 'admin'

  const navigation = [
    {
      name: 'Dashboard',
      href: '/app/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'Employees',
      href: '/app/employees',
      icon: Users,
      show: isAdmin,
    },
    {
      name: 'Payroll',
      href: '/app/payroll',
      icon: DollarSign,
      show: isAdmin,
    },
    {
      name: 'My Payslips',
      href: '/app/payslips',
      icon: FileText,
      show: !isAdmin,
    },
    {
      name: 'Leave Requests',
      href: '/app/leave',
      icon: Calendar,
      show: !isAdmin,
    },
    {
      name: 'Leave Management',
      href: '/app/leave-management',
      icon: CheckSquare,
      show: isAdmin,
    },
    {
      name: 'Profile',
      href: '/app/profile',
      icon: User,
      show: true,
    },
  ]

  return (
    <aside className={cn("border-r bg-card", isMobile ? "flex w-full" : "hidden sm:flex sm:w-64")}>
      <div className="flex h-full flex-col w-full">
        {/* Logo */}
        <div className="flex h-14 sm:h-16 items-center gap-2 border-b px-4 sm:px-6">
          <BarChart3 className="h-6 w-6" />
          <span className="text-lg font-bold">Payroll AI</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) =>
            item.show ? (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ) : null
          )}
        </nav>

        {/* User Info */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {profile?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">
                {profile?.full_name || 'User'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {profile?.role || 'employee'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
