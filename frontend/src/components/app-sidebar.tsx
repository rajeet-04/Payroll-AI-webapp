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
  User,
} from 'lucide-react'

interface ProfileSummary {
  full_name?: string | null
  role?: string | null
}

interface AppSidebarProps {
  profile: ProfileSummary
}

export function AppSidebar({ profile }: AppSidebarProps) {
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
    <aside className="w-64 border-r bg-card">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
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
