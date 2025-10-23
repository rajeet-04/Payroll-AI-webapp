# Payroll-AI-webapp

# Project Plan: AI-Powered Payroll

# Accounting System

**Version:** 1.1 **Date:** October 23, 2025

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

As requested, the project will be built on the following stack:
● **Frontend: React (Next.js)**
○ _Why:_ Provides a high-performance, server-rendered application, excellent
developer experience, and a robust framework for building a secure, multi-page
user interface.
● **Backend (BaaS): Supabase**
○ _Why:_ Acts as the core backend, providing a Postgres database, user authentication
(Auth), file storage (Storage), and Row Level Security (RLS) out of the box. This
accelerates development significantly.
● **Backend (AI Service): Python (FastAPI)**
○ _Why:_ A dedicated microservice to handle all AI-related logic. This securely
manages API keys, pre-processes data for AI prompts, and interacts with the
Gemini API. (FastAPI is recommended for its high performance and ease of use).
● **AI Model: Gemini API**
○ _Why:_ Provides the core intelligence for the chatbot, data analysis, and anomaly
detection features.


## 3. System Architecture

The system will use a decoupled, "Headless BaaS + AI Microservice" architecture.

1. **User (Admin/Employee):** Interacts with the **Next.js Frontend**.
2. **Next.js Frontend:**
    ○ Handles all UI, routing, and global state (e.g., current view).
    ○ Communicates _directly_ with **Supabase** via supabase-js for standard data
       operations (e.g., fetch employees, login). RLS ensures this is secure.
    ○ Communicates with the **Python AI Backend** for all intelligent tasks, passing an
       optional context object (e.g., POST /api/v1/chat).
3. **Supabase (BaaS):**
    ○ The "source of truth" for all data.
    ○ **Auth:** Manages user login, registration, and sessions (JWTs).
    ○ **Postgres DB:** Stores all core data (employees, payslips, leave, etc.).
    ○ **Storage:** Stores generated PDF payslips, employee contracts, etc.
4. **Python AI Backend (FastAPI):**
    ○ A separate, hosted service (e.g., on Vercel, Railway, or Render).
    ○ Receives requests from the Next.js frontend (e.g., "Explain my tax deduction").
    ○ _Securely_ queries **Supabase** (using supabase-py and a service key) to get
       additional context if needed.
    ○ Constructs a detailed prompt with this context and sends it to the **Gemini API**.
    ○ Returns the clean, formatted AI response to the Next.js frontend.
This architecture is highly secure:
● Client-side API keys (Gemini, Supabase service_role) are never exposed.
● The AI service is the single, secure gateway to Gemini.
● Supabase RLS provides database-level security for all direct data access.

## 4. User Roles & Permissions

1. **admin (Payroll Administrator):**
    ○ Full CRUD (Create, Read, Update, Delete) on employees.
    ○ Can set _employee-specific_ allowance/deduction overrides (e.g., TA/DA).
    ○ Full access to company settings.
    ○ Can configure salary_structures.
    ○ Can run new payrolls and view all historical payslips.
    ○ Can define leave_periods and grant employee_leave_balances.
    ○ Can approve/deny leave_requests.
2. **employee (Standard User):**
    ○ Read-only access to their _own_ profile.
    ○ Update access to _limited_ fields on their own profile (e.g., address, bank info).
    ○ Read-only access to _their own_ payslips.
    ○ Can submit leave_requests and view their _own_ employee_leave_balances.

## 5. Backend Plan: Supabase (The Core)


### 5.1. Database Schema (Core Tables)

```
● profiles: (Links to auth.users)
○ id (uuid, primary key, references auth.users.id)
○ email (text)
○ full_name (text)
○ role (text, e.g., 'admin' or 'employee')
○ company_id (uuid, foreign key to companies)
● companies: (For future multi-tenancy)
○ id (uuid, primary key)
○ name (text)
○ pay_cycle (text, e.g., 'monthly', 'bi-weekly')
● employees: (Main employee data)
○ id (uuid, primary key, default gen_random_uuid())
○ profile_id (uuid, foreign key to profiles)
○ company_id (uuid, foreign key to companies)
○ designation (text)
○ join_date (date)
○ salary_structure_id (uuid, foreign key to salary_structures)
○ allowances_override (jsonb, New: For employee-specific TA/DA, e.g., {"TA": 150,
"DA": 100} )
○ deductions_override (jsonb, New: For employee-specific items )
● salary_structures: (The template for an employee's pay)
○ id (uuid, primary key)
○ company_id (uuid, foreign key to companies)
○ base_pay (numeric)
○ allowances (jsonb, Standard allowances, e.g., {"housing": 500} )
○ deductions_fixed (jsonb, e.g., {"insurance": 50})
○ deductions_percent (jsonb, e.g., {"tax_bracket": "10%", "provident_fund": 5})
● payrolls: (A record of each payroll run )
○ id (uuid, primary key)
○ company_id (uuid, foreign key to companies)
○ pay_period_start (date)
○ pay_period_end (date)
○ status (text, e.g., 'draft', 'processed', 'paid')
● payslips: (The final result for each employee in a payroll run)
○ id (uuid, primary key)
○ payroll_id (uuid, foreign key to payrolls)
○ employee_id (uuid, foreign key to employees)
○ pay_data_snapshot (jsonb, Crucial: A snapshot of all pay components )
■ e.g., {"base": 2000, "housing": 500, "TA": 150, "unpaid_leave_days": 1,
"unpaid_leave_deduction": -100, "tax_paid": -250}
○ gross_pay (numeric)
○ total_deductions (numeric)
○ net_pay (numeric)
● leave_periods ( New Table )
○ id (uuid, primary key)
```

```
○ company_id (uuid, foreign key to companies)
○ name (text, e.g., "2025 Calendar Year")
○ start_date (date)
○ end_date (date)
○ is_active (boolean)
● employee_leave_balances ( New Table )
○ id (uuid, primary key)
○ employee_id (uuid, foreign key to employees)
○ leave_period_id (uuid, foreign key to leave_periods)
○ total_granted (numeric, e.g., 12)
○ leaves_taken (numeric, default 0)
○ (Note: remaining_leaves will be a computed value)
● leave_requests ( New Table )
○ id (uuid, primary key)
○ employee_id (uuid, foreign key to employees)
○ leave_period_id (uuid, foreign key to leave_periods)
○ start_date (date)
○ end_date (date)
○ reason (text)
○ leave_type (text, e.g., 'paid', 'unpaid')
○ status (text, e.g., 'pending', 'approved', 'denied')
```
### 5.2. Authentication & Row Level Security (RLS)

RLS is the most critical security feature. We will enable it on all tables.
● **RLS Policy 1: Employees can only see their own profile.**
CREATE POLICY "Allow employee read-only on own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id AND role = 'employee');
● **RLS Policy 2: Employees can only see their own payslips.**
CREATE POLICY "Allow employee to see own payslips"
ON public.payslips FOR SELECT
USING (auth.uid() = (
SELECT profile_id FROM employees WHERE id = payslips.employee_id
));
● **RLS Policy 3: Admins can see all employees in their company.**
CREATE POLICY "Allow admin full access to employees in their
company"
ON public.employees FOR ALL
USING (
(SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' AND
(SELECT company_id FROM profiles WHERE id = auth.uid()) =
employees.company_id
);
● **RLS Policy 4: Employees can manage their own leave requests.**


```
CREATE POLICY "Allow employee to manage own leave requests"
ON public.leave_requests FOR ALL
USING (auth.uid() = (
SELECT profile_id FROM employees WHERE id =
leave_requests.employee_id
));
● (Note: Additional RLS policies needed for admins on leave tables)
```
### 5.3. Storage

```
● Create one bucket: payslips
● Set security rules so an employee can only read files from a folder matching their
employee_id.
```
## 6. Backend Plan: Python AI Microservice (FastAPI)

### 6.1. Purpose

This service acts as the "AI Brain." It will be hosted separately and securely store the Gemini
API key.

### 6.2. API Endpoints

**1. POST /api/v1/chat (Unified Smart Chat Endpoint)**
    ● **Request:** {"query": "Why was this so high?", "context": { "page_view": "/app/payslips/123",
       "data": { ... } } }
          ○ context object is **optional**.
          ○ The frontend will pass context based on the user's current view.
    ● **Logic:**
       1. Receives the query and optional context.
       2. **If context.data is present:** The AI service uses this data directly to build a rich
          prompt for Gemini (e.g., "User is viewing payslip ID 123 and asked...").
       3. **If context.data is NOT present:** The AI service treats it as a general query (e.g.,
          "What is a 401k?"). It _could_ still fetch generic data from Supabase if needed (e.g.,
          company policies).
       4. Sends the constructed prompt to the Gemini API.
       5. Returns the text response.
    ● **Use:** This single endpoint intelligently handles both general Q&A and highly specific,
       contextual questions based on what the user is doing in the app.
**2. POST /api/v1/analyze-payroll (Admin Feature)**
    ● **Request:** {"payroll_id": "uuid-of-payroll-run"}
    ● **Headers:** Authorization: Bearer <supabase_auth_token> (Must be an admin)
    ● **Logic:**
       1. Fetches _all_ payslips for that payroll_id and _all_ payslips from the _previous_ run.
       2. Sends the mass data to Gemini.
       3. **Prompt:** "Analyze this payroll data. Identify any anomalies or significant changes.


```
List employees with >20% pay change, unusual deductions, or missing pay."
```
4. Returns a JSON list of identified anomalies.

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
■ /leave-management ( New: Admin: Approve/deny requests, manage
periods/balances)
```
### 7.2. UI/UX

```
● Styling: Tailwind CSS
● Component Library: Shadcn UI (Recommended) for professional, pre-built components
(Tables, Forms, Modals) that work perfectly with React and Tailwind.
● AI Chat: Will be a single "chat bubble" component, globally available. It will read the
current page/data from a global state manager to provide context for API calls.
```
### 7.3. Data Fetching

```
● Server Components: Use for initial, non-interactive data loads (e.g., fetching the list of
payslips).
● Client Components: Use for all interactive elements (forms, the AI chat input, buttons).
● State Management:
○ React Context / Zustand: For global state like user auth AND the current
application context (e.g., { "view": "/app/payslips/123", "data": {...} }). The AI Chat
component will read from this.
○ TanStack Query (React Query): For all server-state (fetching, caching, mutating
data from Supabase).
```
## 8. Development Roadmap (Phased)


### Phase 1: Foundation (Sprint 0-1)

```
● [ ] Supabase: Initialize project.
● [ ] Supabase: Define and create all database tables from section 5.1 (including leave
tables).
● [ ] Supabase: Implement Authentication and all RLS policies.
● [ ] Next.js: Setup new project, integrate Tailwind.
● [ ] Next.js: Connect Supabase client (supabase-js).
● [ ] Feature: Build Login, Sign Up, and Logout pages.
● [ ] Feature: Create protected routes for the /app directory.
```
### Phase 2: Core Admin Features (Sprint 2-3)

```
● [ ] Feature: Build Employee Management (CRUD) - forms, tables. Include fields for
allowances_override (TA/DA).
● [ ] Feature: Build Salary Structure (CRUD) - forms for jsonb data.
● [ ] Backend: Write the core "Run Payroll" logic.
○ Must include logic to merge salary_structures.allowances +
employees.allowances_override.
● [ ] Feature: Build Payroll dashboard for Admin (List runs, "Run Payroll" button).
```
### Phase 3: Leave Management (Sprint 4)

```
● [ ] Feature (Admin): Build UI to manage leave_periods and employee_leave_balances.
● [ ] Feature (Admin): Build UI (/leave-management) to approve/deny leave_requests.
● [ ] Feature (Employee): Build UI (/leave) to submit leave_requests and view balance.
● [ ] Backend: Update "Run Payroll" logic to query leave_requests and apply deductions for
'unpaid' leaves, updating the pay_data_snapshot.
● [ ] Backend (Optional): Create a Supabase scheduled function to reset
employee_leave_balances when a leave_period ends.
```
### Phase 4: Core Employee Features (Sprint 5)

```
● [ ] Feature: Build Employee Dashboard (show simple stats, leave balance).
● [ ] Feature: Build Employee Profile (view/edit).
● [ ] Feature: Build Payslip List (Employee can see their payslips).
● [ ] Feature: Build single Payslip view (must clearly show unpaid leave deductions).
```
### Phase 5: AI Integration (Sprint 6-7)

```
● [ ] Python: Setup FastAPI service.
● [ ] Python: Securely add Gemini and Supabase API keys.
● [ ] Python: Build the single POST /api/v1/chat smart endpoint.
● [ ] Next.js: Build the Global AI Chat Component.
● [ ] Next.js: Implement the global state manager (Context/Zustand) to track user's current
view/data.
● [ ] Next.js: Connect Chat component to the global state and the /api/v1/chat endpoint.
```

### Phase 6: Polish & Advanced Features (Ongoing)

```
● [ ] Feature: PDF Generation for payslips.
● [ ] Feature: Store/Retrieve PDF from Supabase Storage.
● [ ] Feature: Build the /api/v1/analyze-payroll AI feature for admins.
● [ ] Infra: Set up email notifications ("Leave Approved", "Payroll Processed").
```
## 9. Future Enhancements & Research (New Section)

This section outlines potential high-value features to explore after the core product is stable.
● **AI-Powered Payroll Forecasting:**
○ **Concept:** An admin-facing tool where they can ask natural language questions like,
"Forecast our total payroll cost for Q1 2026 if we hire 3 new engineers at
$80,000/year" or "Model the cost impact of giving a 5% cost-of-living adjustment to
the support department."
○ **Implementation:** Requires the AI to read current payroll data, accept hypothetical
inputs, and perform calculations.
● **Real-time Compliance & Tax Automation:**
○ **Concept:** An AI assistant, grounded on real-time tax law databases (via Google
Search grounding), that can proactively notify admins of compliance risks.
○ **Example:** "A new state tax law affecting employees in California was just passed.
You have 4 employees in California. Click here to see the impact."
● **AI-Powered Employee Onboarding Workflow:**
○ **Concept:** A conversational AI that guides a new employee through the onboarding
process.
○ **Implementation:** A chatbot workflow that walks the user through filling out their
profile and employees data, asking for bank details, tax forms, etc., and performing
the UPDATE operations on their behalf.
● **Advanced AI Anomaly Detection:**
○ **Concept:** Evolve the /api/v1/analyze-payroll feature from a simple "last month vs.
this month" comparison to a statistical model.
○ **Implementation:** The AI would analyze 12+ months of payroll data to build a
baseline for each employee. It could then flag true statistical anomalies (e.g.,
"John's overtime pay is 3 standard deviations above his 12-month average," "Jane's
tax deduction suddenly dropped 50%").
● **Compensation & Performance Linking:**
○ **Concept:** (Requires integration with an external HRIS/Performance tool) Allow
admins to run reports linking pay to performance.
○ **Example:** "Show me all employees rated 'Exceeds Expectations' and their current
salary band," or "Identify potential pay-equity gaps for female employees in the
engineering department."


