-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Admins can update their company" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view profiles in their company" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles in their company" ON public.profiles;
DROP POLICY IF EXISTS "Employees can view their own employee record" ON public.employees;
DROP POLICY IF EXISTS "Admins can manage employees in their company" ON public.employees;
DROP POLICY IF EXISTS "Admins can view salary structures in their company" ON public.salary_structures;
DROP POLICY IF EXISTS "Admins can manage salary structures in their company" ON public.salary_structures;
DROP POLICY IF EXISTS "Admins can view payrolls in their company" ON public.payrolls;
DROP POLICY IF EXISTS "Admins can manage payrolls in their company" ON public.payrolls;
DROP POLICY IF EXISTS "Employees can view their own payslips" ON public.payslips;
DROP POLICY IF EXISTS "Admins can view payslips in their company" ON public.payslips;
DROP POLICY IF EXISTS "Admins can manage payslips in their company" ON public.payslips;
DROP POLICY IF EXISTS "Users can view leave periods for their company" ON public.leave_periods;
DROP POLICY IF EXISTS "Admins can manage leave periods in their company" ON public.leave_periods;
DROP POLICY IF EXISTS "Employees can view their own leave balances" ON public.employee_leave_balances;
DROP POLICY IF EXISTS "Admins can manage leave balances in their company" ON public.employee_leave_balances;
DROP POLICY IF EXISTS "Employees can manage their own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Admins can manage leave requests in their company" ON public.leave_requests;

-- Recreate policies with WITH CHECK clauses

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

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Admins can view profiles in their company"
    ON public.profiles FOR SELECT
    USING (public.is_admin_of_company(company_id));

CREATE POLICY "Admins can manage profiles in their company"
    ON public.profiles FOR ALL
    USING (public.is_admin_of_company(company_id))
    WITH CHECK (public.is_admin_of_company(company_id));

-- Policies for employees
CREATE POLICY "Employees can view their own employee record"
    ON public.employees FOR SELECT
    USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage employees in their company"
    ON public.employees FOR ALL
    USING (public.is_admin_of_company(company_id))
    WITH CHECK (public.is_admin_of_company(company_id));

-- Policies for salary_structures
CREATE POLICY "Admins can view salary structures in their company"
    ON public.salary_structures FOR SELECT
    USING (public.is_admin_of_company(company_id));

CREATE POLICY "Admins can manage salary structures in their company"
    ON public.salary_structures FOR ALL
    USING (public.is_admin_of_company(company_id))
    WITH CHECK (public.is_admin_of_company(company_id));

-- Policies for payrolls
CREATE POLICY "Admins can view payrolls in their company"
    ON public.payrolls FOR SELECT
    USING (public.is_admin_of_company(company_id));

CREATE POLICY "Admins can manage payrolls in their company"
    ON public.payrolls FOR ALL
    USING (public.is_admin_of_company(company_id))
    WITH CHECK (public.is_admin_of_company(company_id));

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
    USING (public.is_admin_of_company(company_id))
    WITH CHECK (public.is_admin_of_company(company_id));

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
    )
    WITH CHECK (
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
    )
    WITH CHECK (
        public.is_admin_of_company(
            (SELECT company_id FROM public.employees WHERE id = employee_id)
        )
    );
