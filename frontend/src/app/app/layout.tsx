'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { getCurrentUser } from '@/lib/api/proxy'

interface Profile {
  id?: string
  email?: string
  full_name?: string
  role?: string
  company_id?: string
}

interface UserInfo {
  email?: string | null
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      try {
        const profileData = await getCurrentUser()

        if (!profileData) {
          throw new Error('No profile returned')
        }

        if (isMounted) {
          console.log('App layout loaded profile:', profileData)
          setProfile(profileData)
          setUser({ email: profileData.email })
        }
      } catch (error) {
        console.error('App layout authentication failed:', error)
        if (isMounted) {
          router.replace('/login')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading your workspace...</span>
        </div>
      </div>
    )
  }

  if (!profile || !user) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader user={user} profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
