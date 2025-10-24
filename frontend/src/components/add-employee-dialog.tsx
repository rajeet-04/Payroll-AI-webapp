"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Plus, Loader2 } from "lucide-react"

interface AddEmployeeDialogProps {
  companyId: string
}

export function AddEmployeeDialog({ companyId }: AddEmployeeDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    password: "",
    designation: "",
    joinDate: new Date().toISOString().split('T')[0],
    basePay: "50000",
    allowedLeaves: "20",
    // Allowances
    hra: "10000",
    transportAllowance: "2000",
    mealAllowance: "1500",
    otherAllowances: "0",
    // Fixed Deductions
    providentFund: "0",
    professionalTax: "200",
    // Percentage Deductions
    insurancePremium: "0",
    otherDeductions: "0",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Get current session first to restore it later
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      console.log("Creating new employee with email:", formData.email)
      
      // Create auth user (this creates a new session)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      })

      if (authError) throw authError
      console.log("Auth user created:", authData.user?.id)

      if (authData.user) {
        // Immediately restore the admin session before making DB operations
        if (currentSession) {
          await supabase.auth.setSession({
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token,
          })
          console.log("Admin session restored")
        }

        // Create profile
        console.log("Creating profile for user:", authData.user.id)
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            role: "employee",
            company_id: companyId,
          })

        if (profileError) throw profileError
        console.log("Profile created successfully")

        // Create employee record
        console.log("Creating employee record")
        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .insert({
            profile_id: authData.user.id,
            company_id: companyId,
            designation: formData.designation,
            join_date: formData.joinDate,
            is_active: true,
          })
          .select()
          .single()

        if (employeeError) throw employeeError
        console.log("Employee created:", employeeData.id)

        // Create a salary structure for this employee
        console.log("Creating salary structure")
        const allowances = {
          hra: parseFloat(formData.hra) || 0,
          transport: parseFloat(formData.transportAllowance) || 0,
          meal: parseFloat(formData.mealAllowance) || 0,
          other: parseFloat(formData.otherAllowances) || 0,
        }
        
        const deductionsFixed = {
          pf: parseFloat(formData.providentFund) || 0,
          professional_tax: parseFloat(formData.professionalTax) || 0,
        }
        
        const deductionsPercent = {
          insurance: parseFloat(formData.insurancePremium) || 0,
          other: parseFloat(formData.otherDeductions) || 0,
        }
        
        const { error: salaryError } = await supabase
          .from("salary_structures")
          .insert({
            employee_id: employeeData.id,
            company_id: companyId,
            name: `${formData.fullName} - Salary Structure`,
            base_pay: parseFloat(formData.basePay),
            allowances: allowances,
            deductions_fixed: deductionsFixed,
            deductions_percent: deductionsPercent,
          })

        if (salaryError) throw salaryError
        console.log("Salary structure created successfully")

        // Create or get default working period (inactive leave period for individual requests)
        let { data: workingPeriods } = await supabase
          .from("leave_periods")
          .select("id")
          .eq("company_id", companyId)
          .eq("is_active", false)
          .limit(1)
          .maybeSingle()

        // If no inactive period exists, create a default working period
        if (!workingPeriods) {
          const currentYear = new Date().getFullYear()
          const { data: newPeriod, error: createPeriodError } = await supabase
            .from("leave_periods")
            .insert({
              company_id: companyId,
              name: `${currentYear} Working Year`,
              start_date: `${currentYear}-01-01`,
              end_date: `${currentYear}-12-31`,
              is_active: false,
            })
            .select("id")
            .single()

          if (createPeriodError) {
            console.error("Error creating default working period:", createPeriodError)
          } else {
            workingPeriods = newPeriod
          }
        }

        // Create initial leave balance for working period
        if (workingPeriods && employeeData) {
          const allowedLeaves = parseInt(formData.allowedLeaves) || 20
          const leaveBalances = {
            employee_id: employeeData.id,
            leave_period_id: workingPeriods.id,
            total_granted: allowedLeaves,
            leaves_taken: 0,
          }

          const { error: balanceError } = await supabase
            .from("employee_leave_balances")
            .insert(leaveBalances)

          if (balanceError) {
            console.error("Error creating leave balances:", balanceError)
            throw new Error("Failed to create leave balances: " + balanceError.message)
          }
        } else {
          console.warn("No working period found or created. Leave balance not set.")
          setError("Employee created successfully, but no leave balance was set. A default working period will be created.")
        }

        // Only close and reset if everything succeeded
        if (!error) {
          setOpen(false)
          setFormData({
            email: "",
            fullName: "",
            password: "",
            designation: "",
            joinDate: new Date().toISOString().split('T')[0],
            basePay: "50000",
            allowedLeaves: "20",
            hra: "10000",
            transportAllowance: "2000",
            mealAllowance: "1500",
            otherAllowances: "0",
            providentFund: "0",
            professionalTax: "200",
            insurancePremium: "0",
            otherDeductions: "0",
          })
          router.refresh()
        }
      }
    } catch (error: unknown) {
      console.error("Error adding employee:", error)
      setError(error instanceof Error ? error.message : "Failed to add employee")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="h-full sm:h-auto sm:max-w-[600px] sm:max-h-[90vh] overflow-y-auto backdrop-blur-md bg-white/70 dark:bg-gray-800/70">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Create a new employee account with complete salary structure.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Doe"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Temporary Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="Software Engineer"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="joinDate">Join Date</Label>
              <Input
                id="joinDate"
                type="date"
                value={formData.joinDate}
                onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="basePay">Base Pay (Monthly)</Label>
              <Input
                id="basePay"
                type="number"
                value={formData.basePay}
                onChange={(e) => setFormData({ ...formData, basePay: e.target.value })}
                placeholder="50000"
                required
                min="0"
                disabled={isLoading}
              />
            </div>
            
            {/* Allowances Section */}
            <div className="col-span-2">
              <h3 className="text-sm font-semibold mb-3 mt-2">Allowances</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="hra">HRA</Label>
                  <Input
                    id="hra"
                    type="number"
                    value={formData.hra}
                    onChange={(e) => setFormData({ ...formData, hra: e.target.value })}
                    placeholder="10000"
                    min="0"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="transportAllowance">Transport Allowance</Label>
                  <Input
                    id="transportAllowance"
                    type="number"
                    value={formData.transportAllowance}
                    onChange={(e) => setFormData({ ...formData, transportAllowance: e.target.value })}
                    placeholder="2000"
                    min="0"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mealAllowance">Meal Allowance</Label>
                  <Input
                    id="mealAllowance"
                    type="number"
                    value={formData.mealAllowance}
                    onChange={(e) => setFormData({ ...formData, mealAllowance: e.target.value })}
                    placeholder="1500"
                    min="0"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="otherAllowances">Other Allowances</Label>
                  <Input
                    id="otherAllowances"
                    type="number"
                    value={formData.otherAllowances}
                    onChange={(e) => setFormData({ ...formData, otherAllowances: e.target.value })}
                    placeholder="0"
                    min="0"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
            
            {/* Fixed Deductions Section */}
            <div className="col-span-2">
              <h3 className="text-sm font-semibold mb-3 mt-2">Fixed Deductions</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="providentFund">Provident Fund</Label>
                  <Input
                    id="providentFund"
                    type="number"
                    value={formData.providentFund}
                    onChange={(e) => setFormData({ ...formData, providentFund: e.target.value })}
                    placeholder="0"
                    min="0"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="professionalTax">Professional Tax</Label>
                  <Input
                    id="professionalTax"
                    type="number"
                    value={formData.professionalTax}
                    onChange={(e) => setFormData({ ...formData, professionalTax: e.target.value })}
                    placeholder="200"
                    min="0"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
            
            {/* Percentage Deductions Section */}
            <div className="col-span-2">
              <h3 className="text-sm font-semibold mb-3 mt-2">Percentage Deductions (%)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="insurancePremium">Insurance Premium %</Label>
                  <Input
                    id="insurancePremium"
                    type="number"
                    value={formData.insurancePremium}
                    onChange={(e) => setFormData({ ...formData, insurancePremium: e.target.value })}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="otherDeductions">Other Deductions %</Label>
                  <Input
                    id="otherDeductions"
                    type="number"
                    value={formData.otherDeductions}
                    onChange={(e) => setFormData({ ...formData, otherDeductions: e.target.value })}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="allowedLeaves">Allowed Leaves (Days/Year)</Label>
              <Input
                id="allowedLeaves"
                type="number"
                value={formData.allowedLeaves}
                onChange={(e) => setFormData({ ...formData, allowedLeaves: e.target.value })}
                placeholder="20"
                required
                min="0"
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Employee
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
