-- Helper function to check if user is admin of a company
CREATE OR REPLACE FUNCTION public.is_admin_of_company(company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
        AND company_id = company_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Policies for companies
CREATE POLICY "Users can view their own company"
    ON public.companies FOR SELECT
    USING (id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update their company"
    ON public.companies FOR UPDATE
    USING (public.is_admin_of_company(id));

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Admins can view profiles in their company"
    ON public.profiles FOR SELECT
    USING (public.is_admin_of_company(company_id));

CREATE POLICY "Admins can manage profiles in their company"
    ON public.profiles FOR ALL
    USING (public.is_admin_of_company(company_id));

-- Policies for employees
CREATE POLICY "Employees can view their own employee record"
    ON public.employees FOR SELECT
    USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage employees in their company"
    ON public.employees FOR ALL
    USING (public.is_admin_of_company(company_id));

-- Policies for salary_structures
CREATE POLICY "Admins can view salary structures in their company"
    ON public.salary_structures FOR SELECT
    USING (public.is_admin_of_company(company_id));

CREATE POLICY "Admins can manage salary structures in their company"
    ON public.salary_structures FOR ALL
    USING (public.is_admin_of_company(company_id));

-- Policies for payrolls
CREATE POLICY "Admins can view payrolls in their company"
    ON public.payrolls FOR SELECT
    USING (public.is_admin_of_company(company_id));

CREATE POLICY "Admins can manage payrolls in their company"
    ON public.payrolls FOR ALL
    USING (public.is_admin_of_company(company_id));

-- Policies for payslips
CREATE POLICY "Employees can view their own payslips"
    ON public.payslips FOR SELECT
    USING (
        employee_id IN (
            SELECT id FROM public.employees WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view payslips in their company"
    ON public.payslips FOR SELECT
    USING (
        public.is_admin_of_company(
            (SELECT company_id FROM public.employees WHERE id = employee_id)
        )
    );

CREATE POLICY "Admins can manage payslips in their company"
    ON public.payslips FOR INSERT
    WITH CHECK (
        public.is_admin_of_company(
            (SELECT company_id FROM public.employees WHERE id = employee_id)
        )
    );

-- Policies for leave_periods
CREATE POLICY "Users can view leave periods for their company"
    ON public.leave_periods FOR SELECT
    USING (
        company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admins can manage leave periods in their company"
    ON public.leave_periods FOR ALL
    USING (public.is_admin_of_company(company_id));

-- Policies for employee_leave_balances
CREATE POLICY "Employees can view their own leave balances"
    ON public.employee_leave_balances FOR SELECT
    USING (
        employee_id IN (
            SELECT id FROM public.employees WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage leave balances in their company"
    ON public.employee_leave_balances FOR ALL
    USING (
        public.is_admin_of_company(
            (SELECT company_id FROM public.employees WHERE id = employee_id)
        )
    );

-- Policies for leave_requests
CREATE POLICY "Employees can manage their own leave requests"
    ON public.leave_requests FOR ALL
    USING (
        employee_id IN (
            SELECT id FROM public.employees WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage leave requests in their company"
    ON public.leave_requests FOR ALL
    USING (
        public.is_admin_of_company(
            (SELECT company_id FROM public.employees WHERE id = employee_id)
        )
    );
