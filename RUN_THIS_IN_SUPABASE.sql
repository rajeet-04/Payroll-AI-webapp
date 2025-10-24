-- ========================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ========================================
-- This migration adds employee_id to salary_structures table
-- allowing each employee to have their own salary structure

-- Step 1: Add employee_id column to salary_structures table
ALTER TABLE public.salary_structures 
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE;

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_salary_structures_employee 
ON public.salary_structures(employee_id);

-- Step 3: Make name column nullable (auto-generated from employee name)
ALTER TABLE public.salary_structures 
ALTER COLUMN name DROP NOT NULL;

-- Step 4: Add days_requested column to leave_requests if not exists
ALTER TABLE public.leave_requests
ADD COLUMN IF NOT EXISTS days_requested INTEGER DEFAULT 0;

-- ========================================
-- VERIFICATION QUERIES (Optional - Run after migration)
-- ========================================

-- Check if employee_id column was added
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'salary_structures' 
-- AND column_name = 'employee_id';

-- Check if days_requested column was added
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'leave_requests' 
-- AND column_name = 'days_requested';

-- View salary_structures structure
-- SELECT * FROM information_schema.columns 
-- WHERE table_name = 'salary_structures' 
-- ORDER BY ordinal_position;
