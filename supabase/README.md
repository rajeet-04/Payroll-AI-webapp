# Supabase Database Setup

This directory contains database migrations for the Payroll AI application.

## Migrations

1. `20251023000001_initial_schema.sql` - Creates all database tables and indexes
2. `20251023000002_rls_policies.sql` - Implements Row Level Security policies

## Setup Instructions

### Option 1: Using Supabase Dashboard

1. Log in to your Supabase project at https://app.supabase.com
2. Navigate to the SQL Editor
3. Run each migration file in order:
   - First run `20251023000001_initial_schema.sql`
   - Then run `20251023000002_rls_policies.sql`

### Option 2: Using Supabase CLI

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Push migrations:
```bash
supabase db push
```

## Database Schema

### Core Tables

- **companies**: Organization/company information
- **profiles**: User profiles (extends auth.users)
- **employees**: Employee details and employment information
- **salary_structures**: Salary templates with allowances and deductions
- **payrolls**: Payroll run records
- **payslips**: Individual employee payslips
- **leave_periods**: Leave period definitions
- **employee_leave_balances**: Employee leave balances per period
- **leave_requests**: Leave request tracking

### Security

All tables have Row Level Security (RLS) enabled with policies that:
- Allow employees to view their own data
- Allow admins to manage all data within their company
- Prevent cross-company data access

### Initial Admin Setup

After running migrations, you need to create an admin user:

1. Sign up through your application's signup page
2. In Supabase SQL Editor, run:

```sql
-- Create a company
INSERT INTO companies (name, pay_cycle)
VALUES ('Your Company Name', 'monthly')
RETURNING id;

-- Update the user profile to be admin (use the user ID from auth.users)
UPDATE profiles 
SET role = 'admin', company_id = 'your-company-id-from-above'
WHERE id = 'your-user-id-from-auth-users';
```

## Testing

You can test the RLS policies using the Supabase SQL Editor:

```sql
-- Test as employee (replace with actual user ID)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'user-id-here';

-- Try to query data
SELECT * FROM payslips;
```

## Backup

Always backup your database before running migrations in production:

```bash
supabase db dump -f backup.sql
```
