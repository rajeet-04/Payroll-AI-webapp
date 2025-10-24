# Payroll AI - Supabase Database Layer

A comprehensive multi-tenant PostgreSQL database architecture powering the AI-driven payroll management system. Built with Supabase's Backend-as-a-Service platform, featuring enterprise-grade security, real-time capabilities, and seamless integration with the FastAPI backend and Next.js frontend.

## 🎯 What This Database Does

**Payroll AI Database** is the central data layer that powers intelligent payroll processing with:

- **Multi-tenant Architecture**: Complete company data isolation with shared infrastructure
- **Role-Based Security**: Granular access control with Row Level Security (RLS) policies
- **Real-time Synchronization**: Live data updates across web and mobile clients
- **AI-Ready Data**: Structured data optimized for AI analysis and insights
- **Audit Trail**: Complete change tracking and compliance logging
- **Scalable Design**: PostgreSQL optimization for high-performance payroll operations

## 🏗️ Tech Stack & Architecture

### Core Database Platform
- **PostgreSQL 15+**: Enterprise-grade relational database with advanced features
- **Supabase**: Open-source Firebase alternative providing:
  - Managed PostgreSQL hosting
  - Built-in authentication system
  - Real-time subscriptions
  - Automatic API generation
  - Row Level Security (RLS)
  - Serverless edge functions

### Database Design Patterns
- **Multi-tenancy**: Company-based data partitioning with shared schema
- **Normalized Schema**: Optimized for complex payroll calculations and reporting
- **JSONB Storage**: Flexible metadata storage for allowances, deductions, and custom fields
- **UUID Primary Keys**: Globally unique identifiers for distributed systems
- **Audit Triggers**: Automatic timestamp updates and change tracking

### Security & Compliance
- **Row Level Security (RLS)**: Database-level access control policies
- **JWT Authentication**: Supabase Auth integration with automatic token validation
- **Data Encryption**: TLS encryption for data in transit and at rest
- **GDPR Compliance**: Data minimization and user consent management
- **Indian Compliance**: Tax calculation support and financial data protection

### Performance Optimization
- **Strategic Indexing**: Optimized queries for payroll processing and reporting
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Complex joins and aggregations for analytics
- **Caching Ready**: Designed for Redis integration and query result caching

## 🏛️ Database Architecture Overview

### Multi-Tenant Design
```
Supabase Project (Shared Infrastructure)
├── Company A Database Schema
│   ├── Employees (Company A only)
│   ├── Payrolls (Company A only)
│   ├── Salary Structures (Company A only)
│   └── Leave Management (Company A only)
├── Company B Database Schema
│   ├── Employees (Company B only)
│   ├── Payrolls (Company B only)
│   └── ... (Company B data only)
└── Shared Tables (Global)
    ├── Companies (All companies)
    └── System Configuration
```

### Core Entity Relationships
```
Companies (1) ──── (M) Profiles (extends auth.users)
    │                    │
    ├── (1) ──── (M) Employees
    │              │
    │              ├── (1) ──── (M) Salary Structures
    │              │
    │              ├── (1) ──── (M) Payslips
    │              │
    │              ├── (1) ──── (M) Leave Requests
    │              │
    │              └── (1) ──── (M) Leave Balances
    │
    ├── (1) ──── (M) Payrolls
    │              │
    │              └── (1) ──── (M) Payslips
    │
    └── (1) ──── (M) Leave Periods
```

## 📊 Database Schema Deep Dive

### Core Tables

#### Companies Table
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    pay_cycle pay_cycle_enum NOT NULL DEFAULT 'monthly',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: Multi-tenant root entity defining company boundaries
- **Pay Cycle**: Monthly, bi-weekly, or weekly payroll processing
- **Isolation**: All child data scoped to company_id

#### Profiles Table (Auth Extension)
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT,
    full_name TEXT NOT NULL,
    role role_enum NOT NULL DEFAULT 'employee',
    company_id UUID REFERENCES companies(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: User profiles extending Supabase Auth
- **Role-based Access**: Admin vs Employee permissions
- **Company Association**: Links users to their employer

#### Employees Table
```sql
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    designation TEXT,
    join_date DATE NOT NULL,
    salary_structure_id UUID REFERENCES salary_structures(id),
    allowances_override JSONB DEFAULT '{}',
    deductions_override JSONB DEFAULT '{}',
    external_identifier TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: Employee master data with salary configuration
- **Profile Link**: Connects to authentication system
- **Salary Flexibility**: Base structure with individual overrides
- **External Integration**: Support for HR system imports

#### Salary Structures Table
```sql
CREATE TABLE salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    name TEXT,
    base_pay NUMERIC(10, 2) NOT NULL,
    allowances JSONB DEFAULT '{}',
    deductions_fixed JSONB DEFAULT '{}',
    deductions_percent JSONB DEFAULT '{}',
    tax_bracket_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: Flexible salary component configuration
- **JSONB Flexibility**: Dynamic allowances and deductions
- **Tax Integration**: Ready for tax bracket calculations
- **Employee-Specific**: One-to-one relationship with employees

#### Payrolls Table
```sql
CREATE TABLE payrolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    status payroll_status_enum NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: Payroll processing batches and status tracking
- **Period Definition**: Start/end dates for payroll runs
- **Status Workflow**: Draft → Processed → Paid lifecycle
- **Audit Trail**: Creator tracking for compliance

#### Payslips Table
```sql
CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_id UUID NOT NULL REFERENCES payrolls(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    pay_data_snapshot JSONB NOT NULL,
    gross_pay NUMERIC(10, 2) NOT NULL,
    total_deductions NUMERIC(10, 2) NOT NULL,
    net_pay NUMERIC(10, 2) NOT NULL,
    pdf_blob BYTEA,
    correction_of UUID REFERENCES payslips(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: Individual payment records with PDF storage
- **Data Snapshot**: Immutable payroll calculation data
- **PDF Storage**: Secure document storage in database
- **Correction Support**: Amendment tracking for compliance

### Leave Management Tables

#### Leave Periods Table
```sql
CREATE TABLE leave_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: Fiscal year definitions for leave entitlements

#### Employee Leave Balances Table
```sql
CREATE TABLE employee_leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    leave_period_id UUID NOT NULL REFERENCES leave_periods(id),
    total_granted NUMERIC(5, 2) NOT NULL DEFAULT 0,
    leaves_taken NUMERIC(5, 2) NOT NULL DEFAULT 0,
    remaining_leaves NUMERIC(5, 2) GENERATED ALWAYS AS (total_granted - leaves_taken) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, leave_period_id)
);
```
**Purpose**: Leave entitlement tracking with automatic calculations

#### Leave Requests Table
```sql
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    leave_period_id UUID NOT NULL REFERENCES leave_periods(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INTEGER DEFAULT 0,
    reason TEXT,
    leave_type TEXT NOT NULL DEFAULT 'paid',
    status TEXT NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: Leave request workflow with approval tracking

## 🔒 Security Architecture

### Row Level Security (RLS) Implementation

#### Security Helper Function
```sql
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
```

#### Access Control Matrix
| Table | Employee Access | Admin Access | Security Notes |
|-------|----------------|--------------|----------------|
| companies | View own company | Update own company | Company isolation |
| profiles | CRUD own profile | CRUD company profiles | Role-based management |
| employees | View own record | Full CRUD company employees | Employee privacy |
| salary_structures | No direct access | Full CRUD company structures | Sensitive financial data |
| payrolls | No access | Full CRUD company payrolls | Admin-only processing |
| payslips | View own payslips | View company payslips, create new | PDF security |
| leave_periods | View company periods | Full CRUD company periods | Shared company data |
| leave_balances | View own balances | Full CRUD company balances | Privacy protected |
| leave_requests | Full CRUD own requests | Full CRUD company requests | Workflow management |

### Authentication Flow
```
Client Request → Supabase Auth → JWT Token → RLS Policy Check → Data Access
```

### Data Protection Layers
1. **Transport Security**: TLS 1.3 encryption
2. **Authentication**: JWT token validation
3. **Authorization**: RLS policy enforcement
4. **Data Encryption**: AES-256 encryption at rest
5. **Audit Logging**: Complete access logging

## 🔄 How It Works

### Multi-Tenant Data Isolation
```
Company Registration → Company Record Created → Users Assigned → RLS Policies Applied
                                      ↓
Employee Onboarding → Profile Created → Employee Record → Salary Structure
                                      ↓
Payroll Processing → Company Payroll Run → Individual Payslips → PDF Generation
```

### Payroll Calculation Pipeline
```
Employee Data → Salary Structure → Leave Deductions → Allowance Calculations
         ↓
Tax Estimation → Deduction Processing → Gross/Net Calculation → Payslip Generation
```

### Real-time Synchronization
- **Live Updates**: Instant UI updates via Supabase subscriptions
- **Conflict Resolution**: Optimistic concurrency control
- **Offline Support**: Local state management with sync on reconnect

### AI Integration Data Flow
```
User Query → Context Fetch (Database) → Data Sanitization → AI Processing → Response
```

## 🚀 Getting Started

### Prerequisites
- Supabase account and project
- PostgreSQL knowledge (optional but helpful)
- Understanding of database migrations

### Database Setup

1. **Create Supabase Project**
   ```bash
   # Via Supabase CLI (recommended)
   supabase init
   supabase start
   ```

2. **Apply Migrations**
   ```sql
   -- Run in Supabase SQL Editor or via CLI
   -- Apply migrations in order:
   -- 1. 20251023000001_initial_schema.sql
   -- 2. 20251023000002_rls_policies.sql
   -- 3. 20251024000001_add_employee_to_salary_structures.sql
   -- 4. update_rls_policies.sql
   ```

3. **Configure Authentication**
   - Enable email/password authentication
   - Configure JWT expiry settings
   - Set up password policies

4. **Environment Variables**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   ```

### Testing Data Setup

1. **Create Test Company**
   ```sql
   INSERT INTO companies (name, pay_cycle) 
   VALUES ('Test Company', 'monthly');
   ```

2. **Create Test Users**
   ```sql
   -- Via Supabase Auth dashboard or API
   -- Then create corresponding profiles
   ```

3. **Seed Sample Data**
   ```sql
   -- Insert sample employees, salary structures, etc.
   ```

## 📈 Performance & Optimization

### Indexing Strategy
```sql
-- Core performance indexes
CREATE INDEX idx_profiles_company ON profiles(company_id);
CREATE INDEX idx_employees_profile ON employees(profile_id);
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_salary_structures_employee ON salary_structures(employee_id);
CREATE INDEX idx_payrolls_company ON payrolls(company_id);
CREATE INDEX idx_payslips_employee ON payslips(employee_id);
CREATE INDEX idx_payslips_payroll ON payslips(payroll_id);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
```

### Query Optimization
- **Partitioning**: Consider table partitioning for large datasets
- **Archiving**: Implement data archiving for old payroll records
- **Caching**: Use Redis for frequently accessed data
- **Connection Pooling**: Optimize database connection usage

### Monitoring & Maintenance
- **Performance Monitoring**: Query performance and slow query analysis
- **Backup Strategy**: Automated daily backups with point-in-time recovery
- **Maintenance Windows**: Scheduled maintenance for large operations
- **Capacity Planning**: Monitor growth and scale accordingly

## 🔧 Development Workflow

### Schema Migrations
```bash
# Using Supabase CLI
supabase migration new add_new_feature
# Edit the generated SQL file
supabase db push  # Apply to local database
supabase db push --include-all  # Apply to linked project
```

### Local Development
```bash
# Start local Supabase stack
supabase start

# Reset database
supabase db reset

# View logs
supabase logs
```

### Testing Strategy
- **Unit Tests**: Individual function and trigger testing
- **Integration Tests**: API endpoint validation with database
- **Security Tests**: RLS policy verification
- **Performance Tests**: Load testing for payroll processing

## 📊 Analytics & Reporting

### Built-in Analytics
- **Payroll Trends**: Month-over-month salary analysis
- **Leave Patterns**: Employee leave utilization tracking
- **Cost Analysis**: Department-wise expense reporting
- **Compliance Reports**: Audit-ready payroll documentation

### Custom Reporting Queries
```sql
-- Monthly payroll summary
SELECT
    DATE_TRUNC('month', p.created_at) as month,
    COUNT(*) as total_payslips,
    SUM(ps.gross_pay) as total_gross,
    SUM(ps.net_pay) as total_net
FROM payrolls p
JOIN payslips ps ON p.id = ps.payroll_id
WHERE p.company_id = $1
GROUP BY DATE_TRUNC('month', p.created_at)
ORDER BY month DESC;
```

## 🔒 Compliance & Security

### Indian Regulatory Compliance
- **Data Localization**: Support for data residency requirements
- **Tax Compliance**: Integration-ready for Indian tax calculations
- **Audit Trail**: Complete transaction logging for regulatory audits
- **Data Retention**: Configurable data retention policies

### Security Best Practices
- **Principle of Least Privilege**: Minimal required permissions
- **Data Encryption**: End-to-end encryption for sensitive data
- **Regular Security Audits**: Automated vulnerability scanning
- **Incident Response**: Comprehensive breach response procedures

## 🚀 Scaling & Production

### Horizontal Scaling
- **Read Replicas**: Separate read workloads from writes
- **Database Sharding**: Company-based data distribution
- **Caching Layer**: Redis integration for performance
- **CDN Integration**: Static asset optimization

### High Availability
- **Multi-zone Deployment**: Geographic redundancy
- **Automated Failover**: Zero-downtime database switching
- **Backup Strategy**: Continuous backup with instant recovery
- **Monitoring**: 24/7 performance and availability monitoring

### Cost Optimization
- **Resource Allocation**: Right-sizing database instances
- **Query Optimization**: Efficient query patterns
- **Data Archiving**: Automated archival of old records
- **Usage Monitoring**: Cost tracking and optimization

## 🤝 Integration Patterns

### Backend Integration (FastAPI)
```python
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Authenticated query
response = supabase.table('employees').select('*').execute()

# RLS automatically applies based on JWT token
```

### Frontend Integration (Next.js)
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Real-time subscription
const subscription = supabase
  .channel('payrolls')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'payrolls' }, 
    (payload) => console.log('Change received!', payload))
  .subscribe()
```

### AI Service Integration
```python
# Data fetching for AI context
employee_data = supabase.table('employees').select('''
    *,
    salary_structures(*),
    payslips(*, payrolls(*))
''').eq('id', employee_id).execute()

# Sanitize sensitive data before AI processing
sanitized_data = sanitize_for_ai(employee_data)
```

## 📋 Migration Files Overview

### 20251023000001_initial_schema.sql
- **Purpose**: Core database schema creation
- **Tables Created**: All main entities with relationships
- **Indexes**: Performance optimization indexes
- **Triggers**: Automatic timestamp updates

### 20251023000002_rls_policies.sql
- **Purpose**: Security policy implementation
- **RLS Enable**: Row Level Security on all tables
- **Policies**: Granular access control rules
- **Helper Functions**: Admin verification functions

### 20251024000001_add_employee_to_salary_structures.sql
- **Purpose**: Schema enhancement for employee-specific salary structures
- **Changes**: Added employee_id foreign key
- **Migration**: Data migration for existing records

### update_rls_policies.sql
- **Purpose**: Policy refinement and WITH CHECK clauses
- **Updates**: Enhanced security policies with insert validation

## 🔄 Future Roadmap

### Planned Enhancements
- **Advanced Analytics**: Real-time dashboard data aggregation
- **Multi-currency Support**: International payroll expansion
- **Audit Triggers**: Enhanced change tracking and compliance
- **Performance Optimization**: Query optimization and caching
- **Backup Automation**: Advanced backup and recovery features

### Technical Improvements
- **GraphQL API**: More flexible data querying capabilities
- **Event Streaming**: Real-time event processing and notifications
- **Machine Learning**: Predictive analytics for payroll insights
- **Microservices**: Database decomposition for better scalability

---

**Payroll AI Database** - The secure, scalable foundation powering intelligent payroll management for modern Indian businesses, built on Supabase's enterprise-grade PostgreSQL platform.</content>
<parameter name="filePath">c:\Users\rajee.RAJEET\Documents\Payroll-AI-webapp\supabase\README.md