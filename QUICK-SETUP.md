# Quick Setup Guide

## Prerequisites
- Supabase project created and configured
- Database migrations applied (both schema and RLS policies)
- Public schema exposed for Data API

## Step-by-Step Setup

### 1. Database Setup (One-Time)

Run these SQL commands in Supabase SQL Editor:

```sql
-- 1. Create your company
INSERT INTO companies (name, pay_cycle)
VALUES ('Your Company Name', 'monthly')
RETURNING id;
-- Copy the returned id

-- 2. Get your user ID from Authentication > Users in Supabase Dashboard
-- Copy the User ID

-- 3. Promote yourself to admin
UPDATE profiles 
SET role = 'admin', company_id = 'paste-company-id-here'
WHERE id = 'paste-user-id-here';

-- 4. Verify
SELECT * FROM profiles WHERE id = 'paste-user-id-here';
-- Should show role='admin' and company_id set
```

### 2. Start the Application

```powershell
# Terminal 1: Start Backend (optional, for AI features)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start Frontend
cd frontend
pnpm install  # if not already done
pnpm run dev
```

### 3. Access the Application

Open browser: `http://localhost:3000`

### 4. First-Time Admin Setup

1. **Login** with your admin account

2. **Create Leave Period:**
   - Go to "Leave Management"
   - Click "Create Leave Period"
   - Name: "2025 Annual Leave"
   - Start Date: 2025-01-01
   - End Date: 2025-12-31
   - Click "Create Period"

3. **Add First Employee:**
   - Go to "Employees"
   - Click "Add Employee"
   - Fill in:
     - Full Name: John Doe
     - Email: john@company.com
     - Password: Password123!
     - Designation: Software Engineer
     - Join Date: (select date)
   - Click "Add Employee"

4. **Run First Payroll:**
   - Go to "Payroll"
   - Click "Run Payroll"
   - Start Date: 2025-01-01
   - End Date: 2025-01-31
   - Click "Run Payroll"

### 5. Test Employee Features

1. **Open in Incognito/Private Window**
2. **Login** as the employee (john@company.com)
3. **Test Features:**
   - View Dashboard (should see payslip)
   - Go to "My Payslips" (should see January payroll)
   - Go to "Leave Requests"
   - Click "Request Leave"
   - Submit a leave request

4. **Back to Admin:**
   - Go to "Leave Management"
   - You should see the pending request
   - Click "Approve"

5. **Back to Employee:**
   - Go to "Leave Requests"
   - Request should now show "approved"

## Common Issues

### 1. Profile Creation Error
**Problem:** "The schema must be one of the following: api"

**Solution:**
- Go to Supabase Dashboard > Settings > API
- Change to "Use public schema for Data API"
- Save

### 2. No Profile After Signup
**Problem:** User in auth.users but not in profiles table

**Solution:**
```sql
-- Add the INSERT policy
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());
```

### 3. Employee Dashboard Shows "No employee record"
**Problem:** Profile exists but no employee record

**Solution:**
- Admin needs to add the employee via the Employees page
- Or manually link profile to employee in SQL

### 4. Leave Request Fails
**Problem:** "No active leave period found"

**Solution:**
- Admin must create a leave period first
- Go to Leave Management > Create Leave Period

## Tips

1. **Always start with Leave Period** - Create this before adding employees
2. **Use strong passwords** - Supabase requires min 6 characters
3. **Email confirmations** - Disable in Supabase for testing
4. **Multiple browsers** - Test admin and employee in different browsers
5. **Refresh pages** - After actions, refresh to see updated data

## Test Credentials

After setup, you'll have:
- **Admin:** your-email@domain.com / your-password
- **Employee:** john@company.com / Password123!

## Next Steps

1. Add more employees
2. Run monthly payroll
3. Test leave approval workflow
4. Explore dashboard analytics
5. Check payslip generation

## Support

If issues persist:
1. Check Supabase logs (Supabase Dashboard > Logs)
2. Check browser console for errors
3. Verify RLS policies are active
4. Confirm Data API uses public schema
