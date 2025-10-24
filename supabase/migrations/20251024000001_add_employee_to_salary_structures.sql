-- Add employee_id column to salary_structures table
ALTER TABLE public.salary_structures 
ADD COLUMN employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_salary_structures_employee ON public.salary_structures(employee_id);

-- Make name column nullable since we'll auto-generate it from employee name
ALTER TABLE public.salary_structures 
ALTER COLUMN name DROP NOT NULL;

-- Add days_requested column to leave_requests table if not exists
ALTER TABLE public.leave_requests
ADD COLUMN IF NOT EXISTS days_requested INTEGER DEFAULT 0;

-- Update existing salary structures to link to employees if they have salary_structure_id
UPDATE public.salary_structures ss
SET employee_id = e.id
FROM public.employees e
WHERE e.salary_structure_id = ss.id;
