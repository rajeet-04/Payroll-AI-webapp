# Payroll-AI-webapp

# Project Plan: AI-Powered Payroll

# Accounting System

**Version:** 1.1 **Date:** 2025-10-23

## 1. Project Overview & Goals

### 1.1. Mission

To build a modern, secure, and intelligent payroll accounting system. The system will automate
core payroll processing for administrators and provide employees with transparent access to
their compensation data. An integrated AI assistant (powered by the Gemini API) will offer
contextual support and financial insights.

### 1.2. Core Goals

```
● For Administrators: Drastically reduce the time and effort spent on payroll processing,
employee management, and compliance reporting.
● For Employees: Provide a simple, self-service portal to view payslips, manage personal
information, request leave, and understand their compensation through an AI-powered
assistant.
● For the System: Ensure data security, accuracy, and scalability using a modern,
decoupled technology stack.
```

## 2. Technology Stack

As requested, the project will be built on the following stack (adjusted for free-tier constraints):
● **Frontend: React (Next.js)**
○ _Why:_ Provides a high-performance, server-rendered application, excellent
developer experience, and a robust framework for building a secure, multi-page
user interface.
● **Backend (BaaS): Supabase (Postgres + Auth)**
○ _Why:_ Acts as the core backend, providing a Postgres database and user authentication
(Auth). On free tier, Supabase Storage may not be available or advisable — see Storage notes.
● **Backend (AI + File Service): Python (FastAPI) hosted on Render**
○ _Why:_ A dedicated microservice to handle all AI-related logic, safely manage API keys,
pre-process data for AI prompts, and serve signed PDF URLs. Render is recommended for
FastAPI on free-tier friendly hosting. Vercel is appropriate for Next.js frontend only.
● **AI Model: Gemini API**
○ _Why:_ Provides the core intelligence for the chatbot, data analysis, and anomaly
detection.

## 3. System Architecture

The system will use a decoupled, "Headless BaaS + AI Microservice" architecture (with
storage adapted to free-tier constraints):

1. **User (Admin/Employee):** Interacts with the **Next.js Frontend**.
2. **Next.js Frontend:**
    ○ Handles all UI, routing, and global state (e.g., current view).
    ○ Communicates _directly_ with **Supabase** via supabase-js for standard data
       operations (e.g., fetch employees, login). RLS ensures this is secure.
    ○ Communicates with the **Python AI Backend** for all intelligent tasks, passing an
       optional context object (e.g., POST /api/v1/chat).
3. **Supabase (BaaS):**
    ○ The "source of truth" for all structured data.
    ○ **Auth:** Manages user login, registration, and sessions (JWTs).
    ○ **Postgres DB:** Stores core data (employees, payslips, leave, etc.). On the free tier
      we will use Postgres to store small binary blobs (payslips) if object storage is
      unavailable. (See Storage section for constraints and recommendations.)
4. **Python AI Backend (FastAPI):**
    ○ A separate, hosted service on Render.
    ○ Receives requests from the Next.js frontend (e.g., "Explain my tax deduction").
    ○ Validates the incoming Supabase JWT (short-lived) and verifies the user's role and
      company scope before performing any service_role queries.
    ○ Uses a SUPABASE_SERVICE_KEY only when necessary and only after additional server-side
      authorization checks. All service_role use is audited and logged.
    ○ Constructs a detailed prompt with sanitized context and sends it to the **Gemini API**.
    ○ Returns the clean, formatted AI response to the Next.js frontend.

This architecture is secure if implemented correctly:
● Client-side API keys (Gemini, Supabase service_role) are never exposed.
● The AI service is the single, secure gateway to Gemini, and it enforces authorization
  checks before using elevated DB privileges.
● Supabase RLS provides DB-level security for all direct data access from clients.

## 4. User Roles & Permissions

1. **admin (Payroll Administrator):**
    ○ Full CRUD on employees within their company.
    ○ Can set _employee-specific_ allowance/deduction overrides.
    ○ Full access to company settings.
    ○ Can configure salary_structures.
    ○ Can run payrolls and view historical payslips.
    ○ Can manage leave_periods and employee_leave_balances.
    ○ Can approve/deny leave_requests.
2. **employee (Standard User):**
    ○ Read-only access to their _own_ profile.
    ○ Update access to limited fields on their profile (e.g., address, bank info — bank details are
      only sent to AI after redaction/consent).
    ○ Read-only access to _their own_ payslips.
    ○ Can submit leave_requests and view their leave balances.

## 5. Backend Plan: Supabase (The Core)

### 5.1. Database Schema (Core Tables)

Key notes applied:
- Use explicit types (numeric/decimal) for amounts and decimals for percentages (e.g., 0.10 for 10%).
- Keep payroll calculations deterministic: define the order, rounding behavior, and signed conventions
  (positive numbers for amounts; components have a "kind" field: 'allowance' or 'deduction').

```
● profiles: (Links to auth.users)
○ id (uuid, primary key, references auth.users.id)
○ auth_user_id (text) -- optional alias to auth.users
○ email (text)  -- optional, canonical source is auth.users.email
○ full_name (text)
○ role (role_enum, e.g., 'admin' or 'employee')
○ company_id (uuid, foreign key to companies)
● companies:
○ id (uuid, primary key)
○ name (text)
○ pay_cycle (pay_cycle_enum, e.g., 'monthly', 'bi-weekly')
● employees: (Main employee data)
○ id (uuid, primary key, default gen_random_uuid())  <-- CANONICAL ID FOR STORAGE & FILES
○ profile_id (uuid, foreign key to profiles)
○ company_id (uuid, foreign key to companies)
○ designation (text)
○ join_date (date)
○ salary_structure_id (uuid, foreign key to salary_structures)
○ allowances_override (jsonb, e.g., {"TA": 150, "DA": 100})
○ deductions_override (jsonb)
○ external_identifier (text) -- optional for payroll provider mapping
● salary_structures:
○ id (uuid, primary key)
○ company_id (uuid, foreign key to companies)
○ base_pay (numeric)
○ allowances (jsonb, e.g., {"housing": 500})
○ deductions_fixed (jsonb, e.g., {"insurance": 50})
○ deductions_percent (jsonb, e.g., {"tax": 0.10, "provident_fund": 0.05})
○ tax_bracket_id (uuid) -- optional reference to tax tables when needed
● payrolls:
○ id (uuid, primary key)
○ company_id (uuid, foreign key to companies)
○ pay_period_start (date)
○ pay_period_end (date)
○ status (payroll_status_enum, e.g., 'draft','processed','paid')
○ created_by (uuid references profiles.id)
○ created_at (timestamp)
● payslips:
○ id (uuid, primary key)
○ payroll_id (uuid, foreign key to payrolls)
○ employee_id (uuid, foreign key to employees)
○ pay_data_snapshot (jsonb) -- snapshot of all components as positive numbers
○ gross_pay (numeric)
○ total_deductions (numeric)
○ net_pay (numeric)
○ pdf_blob (bytea) -- small binary blob for free-tier storage (optional, see Storage notes)
○ created_at (timestamp)
○ created_by (uuid references profiles.id)
○ correction_of (uuid nullable) -- reference a previous payslip if this is a correction
● leave_periods:
○ id (uuid, primary key)
○ company_id (uuid, foreign key to companies)
○ name (text)
○ start_date (date)
○ end_date (date)
○ is_active (boolean)
● employee_leave_balances:
○ id (uuid, primary key)
○ employee_id (uuid, foreign key to employees)
○ leave_period_id (uuid, foreign key to leave_periods)
○ total_granted (numeric)
○ leaves_taken (numeric, default 0)
○ remaining_leaves (generated as total_granted - leaves_taken or a view)
● leave_requests:
○ id (uuid, primary key)
○ employee_id (uuid, foreign key to employees)
○ leave_period_id (uuid, foreign key to leave_periods)
○ start_date (date)
○ end_date (date)
○ reason (text)
○ leave_type (text, e.g., 'paid', 'unpaid')
○ status (text, e.g., 'pending', 'approved', 'denied')
```

Notes on storage of PDFs on the free tier
- Because Supabase Storage may not be available on your current free plan, and hosting on Render does not provide durable object storage, the recommended MVP approach is:
  1. Store the payslip binary (PDF) directly in Postgres using a bytea column (payslips.pdf_blob). This is acceptable for small teams and small number of payslips (MVP). Be mindful of DB size limits on free tier.
  2. Alternatively, store only the pay_data_snapshot (jsonb) and generate PDFs on-demand in the FastAPI service. When a user requests a download, FastAPI renders the PDF and streams it to the user without storing it. This saves DB space but increases CPU/transient usage.
  3. When/if object storage is added later (Supabase Storage or S3-compatible), migrate stored PDFs from the DB to object storage and store object paths using employee.id as folder key (e.g., payslips/{employee_id}/{payroll_id}.pdf).

Because we've chosen employee.id as the canonical storage ID (Option B):
- If object storage becomes available later, files will be stored under paths keyed by employees.id.
- When using the DB blob approach, tag the payslip rows with employee_id to ensure queries & access controls map correctly.

### 5.2. Authentication & Row Level Security (RLS)

RLS is the most critical security feature. We will enable it on all tables. Below are explicit policies and operational notes.

Operational recommendation for migrations and RLS enabling:
1. Create tables first.
2. Seed an initial admin (using service_role via a secure migration script) so RLS policies have a known admin identity during enabling.
3. Add RLS policies after the admin is seeded.

Policies (examples)
- Helper function (recommended):
```
CREATE FUNCTION public.is_admin_of_company(company uuid) RETURNS boolean AS $$
  SELECT (role = 'admin') FROM public.profiles WHERE id = auth.uid() AND company_id = company;
$$ LANGUAGE sql STABLE;
```
- Profiles (employees can read own profile; admins can manage profiles in their company):
```
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_employee_read_own" ON public.profiles FOR SELECT
  USING (auth.uid() = id AND role = 'employee');
CREATE POLICY "profiles_admin_manage_company" ON public.profiles FOR ALL
  USING (public.is_admin_of_company(company_id))
  WITH CHECK (public.is_admin_of_company(company_id));
```
- Employees (admins can full access within their company; employees can access their own employee row):
```
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employees_admin_company" ON public.employees FOR ALL
  USING (public.is_admin_of_company(company_id))
  WITH CHECK (public.is_admin_of_company(company_id));
CREATE POLICY "employees_employee_own" ON public.employees FOR SELECT
  USING (auth.uid() = (SELECT profile_id FROM public.employees WHERE public.employees.id = id));
```
- Payslips (employees can see their own payslips; admins can see payslips for their company):
```
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payslips_employee_own" ON public.payslips FOR SELECT
  USING (auth.uid() = (SELECT profile_id FROM public.employees WHERE public.employees.id = payslips.employee_id));
CREATE POLICY "payslips_admin_company" ON public.payslips FOR SELECT
  USING (public.is_admin_of_company((SELECT company_id FROM public.employees WHERE public.employees.id = payslips.employee_id)));
```
- Leave requests (employee manages own; admins within company can manage):
```
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leave_requests_employee_own" ON public.leave_requests FOR ALL
  USING (auth.uid() = (SELECT profile_id FROM public.employees WHERE public.employees.id = leave_requests.employee_id));
CREATE POLICY "leave_requests_admin_company" ON public.leave_requests FOR ALL
  USING (public.is_admin_of_company((SELECT company_id FROM public.employees WHERE public.employees.id = leave_requests.employee_id)));
```

RLS performance and caution notes
- Keep policies as simple as possible, and prefer helper functions (like is_admin_of_company) to centralize logic.
- Avoid long-running complex subqueries in RLS that may impact query performance. Test RLS policies with realistic datasets.

### 5.3. Storage

Because the canonical ID for storage is employees.id (Option B):
- Object storage paths (future): payslips/{employee_id}/{payroll_id}.pdf
- When using DB blob storage on the free tier, store pdf_blob in payslips and use employee_id in queries to serve/authorize access.
- If you cannot store blobs in DB due to space, use on-demand PDF generation (no persistent storage) and log the access.

Access control for files
- If files are stored in object storage later, ensure the storage policy compares the authenticated user's profile_id to the employee mapping. If using employees.id as canonical key, implement a signed server endpoint in FastAPI that verifies auth.uid() maps to the employee_id, then returns a signed object storage URL. This avoids exposing service_role to the client and keeps storage policies simple.

## 6. Backend Plan: Python AI Microservice (FastAPI)

### 6.1. Purpose

This service acts as the "AI Brain." It will be hosted on Render and securely store the Gemini
API key and, if needed, a supabase service key with tightly controlled usage.

### 6.2. API Endpoints

Security model
- All endpoints that access private context data must require a valid Supabase JWT from the
  client. The FastAPI service must validate and decode the JWT, verify its signature and
  expiry, and then fetch the user's profile from Supabase to check role & company.
- Only after server-side authorization checks are satisfied should the FastAPI service use the
  SUPABASE_SERVICE_KEY to perform elevated queries. All such actions must be logged.

**1. POST /api/v1/chat (Unified Smart Chat Endpoint)**
    ● **Auth:** Optional for public/general queries; REQUIRED for contextual queries containing
      references to internal data (e.g., payslip IDs). The presence of context.data that references
      internal IDs must force authentication and server-side verification.
    ● **Request:** {"query": "Why was this so high?", "context": { "page_view": "/app/payslips/123", "data": { ... } }}
    ● **Logic:**
       1. Validate JWT if context.data references a private resource.
       2. If context.data present and references private records, map any employee identifiers
          through the DB and sanitize PII (see Prompt Sanitization section) before constructing
          the prompt.
       3. Use the Gemini API with sanitized prompt and return a concise response.
    ● **Rate limiting & cost controls:** enforce rate limits per-user and per-company, and
      implement a budget cap for AI queries.

**2. POST /api/v1/analyze-payroll (Admin Feature)**
    ● **Auth:** REQUIRED (must be admin). Re-validate JWT and confirm admin role + company scope.
    ● **Request:** {"payroll_id": "uuid-of-payroll-run"}
    ● **Logic:**
       1. Fetch payslips for payroll_id and previous run using service_role ONLY after authorization.
       2. Preprocess/aggregate data server-side to produce a compact summary (do not send full PII-heavy
          records to the model). Examples: per-employee gross/net/percent_change, flags for new
          deductions.
       3. Send the summarized payload to Gemini (or optionally run a local statistical anomaly
          detection step first to reduce AI calls / cost).
       4. Return a structured JSON list of anomalies.
    ● **Response schema (example):**
    ```json
    [
      {
        "employee_id": "uuid",
        "metric": "net_pay",
        "previous_value": 2500.00,
        "current_value": 3200.00,
        "percent_change": 0.28,
        "severity": "high",
        "suggested_action": "Review overtime entries"
      }
    ]
    ```

Prompt sanitization & PII policy
- Do not send raw sensitive fields to Gemini. Examples of fields to strip or redact unless
explicitly consented to and required: bank_account_number, ssn/tax_id, full_date_of_birth,
passport numbers, direct personal contact details.
- Prefer pseudonymous identifiers (employee_id) with server-side mapping when needed.
- Log only metadata about prompts (user id, action, length) and avoid logging full prompts that
contain PII.

Service key usage & audit
- Keep SUPABASE_SERVICE_KEY in server secrets only. Rotate keys regularly.
- Limit the use of the service key to endpoints that absolutely require it.
- Log queries made via service_role and maintain an audit trail.

## 7. Frontend Plan: Next.js App

### 7.1. Project Structure (App Router)

```
● /app
○ / (Marketing page / Redirect to login)
○ /login (Auth page)
○ /auth/callback (Supabase auth callback)
○ /app (Protected Route Group - requires login)
■ /layout.tsx (Main sidebar/navbar + Global AI Chat Component )
■ /dashboard (Admin vs. Employee dashboard)
■ /employees (Admin: Employee list)
■ /employees/[id] (Admin: View/Edit Employee, set TA/DA overrides )
■ /payroll (Admin: List of payroll runs)
■ /payslips (Employee: List of their payslips)
■ /payslips/[id] (Employee: View single payslip)
■ /profile (User's own profile)
■ /leave ( New: Employee: Request leave, view balance/history)
■ /leave-management ( New: Admin: Approve/deny requests, manage periods/balances)
```

### 7.2. UI/UX

```
● Styling: Tailwind CSS
● Component Library: Shadcn UI (Recommended)
● AI Chat: Single chat bubble component, global state provides context to the chat.
```

### 7.3. Data Fetching & State

```
● Server Components: initial data loads.
● Client Components: interactive elements.
● State Management: React Context / Zustand for global app context; TanStack Query for server-state.
```

## 8. Development Roadmap (Phased)

Phases retained, with clarifications and acceptance criteria added in each sprint.

### Phase 1: Foundation (Sprint 0-1)

```
● [ ] Supabase: Initialize project (dev) and create DB migrations.
● [ ] Supabase: Define and create all database tables from section 5.1 (including leave tables).
● [ ] Supabase: Implement Authentication and RLS policies (seed admin first; enable RLS after seed).
● [ ] Next.js: Setup new project, integrate Tailwind.
● [ ] Next.js: Connect Supabase client (supabase-js).
● [ ] Feature: Build Login, Sign Up, and Logout pages.
● [ ] Feature: Create protected routes for the /app directory.
```

### Phase 2: Core Admin Features (Sprint 2-3)

```
● [ ] Feature: Build Employee Management (CRUD) - forms, tables. Include fields for allowances_override.
● [ ] Feature: Build Salary Structure (CRUD) - forms for jsonb data.
● [ ] Backend: Write the core "Run Payroll" logic with a deterministic calculation spec.
  ○ Must include merging salary_structures.allowances + employees.allowances_override.
  ○ Use explicit rounding rules and unit test vectors.
● [ ] Feature: Build Payroll dashboard for Admin (List runs, "Run Payroll" button).
```

Payroll calculation spec (brief)
- Input sources: salary_structures.base_pay, allowances (structure), employees.allowances_override, deductions_fixed, deductions_percent.
- Step 1: Resolve base_pay and allowances: merged_allowances = merge(base_allowances, overrides) where overrides replace or add.
- Step 2: Compute gross_pay = base_pay + sum(merged_allowances)
- Step 3: Apply fixed deductions: fixed_total = sum(deductions_fixed)
- Step 4: Apply percent deductions: percent_total = sum(component_amount = basis * percent) (basis=base_pay or gross as defined per component)
- Step 5: total_deductions = fixed_total + percent_total
- Step 6: net_pay = gross_pay - total_deductions
- Rounding: Round to 2 decimal places at component level and final totals. Document rounding method and unit test vectors.

### Phase 3: Leave Management (Sprint 4)

```
● [ ] Admin: manage leave_periods and employee_leave_balances.
● [ ] Admin: approve/deny leave_requests.
● [ ] Employee: submit leave_requests and view balance.
● [ ] Backend: Update "Run Payroll" logic to account for unpaid leaves, applying deductions and adding snapshot entries.
● [ ] Backend (Optional): Scheduled function to reset employee_leave_balances when a leave_period ends.
```

### Phase 4: Core Employee Features (Sprint 5)

```
● [ ] Employee Dashboard, Profile, Payslip List, Single Payslip View (showing deductions clearly).
```

### Phase 5: AI Integration (Sprint 6-7)

```
● [ ] FastAPI: Setup service on Render.
● [ ] FastAPI: Securely store Gemini and (limited) Supabase service keys.
● [ ] FastAPI: Build POST /api/v1/chat endpoint (contextual auth checks and prompt sanitization).
● [ ] Next.js: Global AI Chat Component and global state integration.
● [ ] FastAPI: Build POST /api/v1/analyze-payroll with server-side summarization + anomaly schema.
```

### Phase 6: Polish & Advanced Features (Ongoing)

```
● [ ] Feature: PDF Generation for payslips (store in DB blob for free-tier or generate-on-demand).
● [ ] Feature: Store/Retrieve PDFs from object storage when available; migrate from DB blob when possible.
● [ ] Feature: Build the /api/v1/analyze-payroll AI feature for admins.
● [ ] Infra: Email notifications and monitoring.
```

## 9. Future Enhancements & Research (New Section)

(Kept as in original plan; mostly unchanged but note PII constraints for AI features.)

## 10. Security & Operational Notes (Added)

- Do not expose service_role or Gemini keys in client builds.
- Validate Supabase JWT in the FastAPI service; check role and company scope before elevated queries.
- Prompt sanitization: redact PII before sending to Gemini; store only metadata in logs.
- Payslips are immutable by default. Any corrections must create a new payslip row with correction_of set.
- Seed an initial admin with migration scripts before enabling RLS in production.
- Audit logs: record payroll runs, who triggered them, and the payroll_id in an audit table or log.

## 11. Indexes & Performance

- Add indexes on employees(profile_id), payslips(employee_id), payrolls(company_id, pay_period_start), and frequent search fields.
- Test run payroll performance with realistic data or sample dataset to identify slow queries.

## 12. Testing Strategy

- Unit tests: payroll calculation logic with example vectors.
- Integration tests: RLS behavior and end-to-end auth flows (use test JWTs and test seed users).
- E2E tests: login, run payroll, view payslip, download PDF.

## 13. Migration & Seeding

- Migration order: create tables -> seed admin -> add RLS policies.
- Provide a secure script to create the first admin (invitation or seeded user via service_role only in CI/migrations).

## 14. Change log & versioning

- Keep PLAN.md versioned. This document is v1.1 and includes security and storage updates for the free-tier environment.
