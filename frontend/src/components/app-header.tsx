"use client"

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Bell, LogOut, User, Menu } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'
import { useState } from 'react'

interface AppHeaderProps {
  user: any
  profile: any
}

export function AppHeader({ user, profile }: AppHeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex h-14 sm:h-16 items-center justify-between border-b bg-card px-4 sm:px-6">
      {/* Mobile Menu Trigger */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="mr-2 sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DialogTrigger>
        <VisuallyHidden>
          <DialogTitle>Navigation Menu</DialogTitle>
        </VisuallyHidden>
        <DialogContent className="p-0 h-full sm:h-auto sm:max-w-xs bg-background/90 backdrop-blur-md">
          <AppSidebar user={user} profile={profile} isMobile={true} onClose={() => setMobileMenuOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="flex-1 min-w-0">
        <h1 className="text-xs sm:text-base lg:text-lg font-semibold truncate">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!
        </h1>
        <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground">
          {profile?.role === 'admin'
            ? 'Manage your organization'
            : 'View your payroll information'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 backdrop-blur-md bg-white/70 dark:bg-gray-800/70">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
