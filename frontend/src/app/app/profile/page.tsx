import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">
          Manage your personal information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            View and update your profile details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={profile?.full_name || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={profile?.role || ''} disabled className="capitalize" />
          </div>
          {employee && (
            <>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input value={employee.designation || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Join Date</Label>
                <Input
                  value={new Date(employee.join_date).toLocaleDateString()}
                  disabled
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your account preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Contact your administrator to update your profile information.
          </p>
          <Button variant="outline">Request Profile Update</Button>
        </CardContent>
      </Card>
    </div>
  )
}
