# 📱 Application Features Guide

Complete guide to all features implemented in the Payroll AI application.

## 🎨 User Interface

### Theme System

**Dark Mode, Light Mode & System Preference**

The application features a beautiful theme system that adapts to your preferences:

- **Light Mode**: Clean, professional interface perfect for daytime use
- **Dark Mode**: Easy on the eyes, ideal for low-light environments  
- **System Mode**: Automatically matches your operating system's theme preference

**How to Use:**
- Click the theme toggle button (sun/moon icon) in the header
- Select Light, Dark, or System from the dropdown menu
- Your preference is saved automatically

### Minimalist Design

- **Clean Layout**: Uncluttered interface focusing on essential information
- **Consistent Spacing**: Comfortable reading and interaction  
- **Smooth Animations**: Subtle transitions for better user experience
- **Responsive**: Works perfectly on desktop, tablet, and mobile devices

---

## 🔐 Authentication System

### Sign Up
- Email and password registration
- Automatic profile creation
- Email validation
- Secure password requirements (minimum 6 characters)

### Sign In
- Email and password authentication
- Secure session management with JWT
- Remember me functionality
- Password reset capability (Supabase managed)

### Security Features
- Row Level Security (RLS) at database level
- Protected routes with middleware
- Role-based access control (Admin/Employee)
- Automatic session refresh
- Secure logout

---

## 👨‍💼 Admin Features

### Dashboard

**Organization Overview**
- Total active employees count
- Payroll runs statistics
- Latest payroll status
- Trend analysis
- Quick action shortcuts

**Recent Activity**
- Recently added employees
- Recent payroll runs
- Pending approvals

### Employee Management

**View All Employees**
- List of all active employees
- Employee details (name, designation, join date)
- Active/Inactive status badges
- Quick search and filter (future enhancement)

**Add/Edit Employees**
- Personal information
- Designation and department
- Join date
- Salary structure assignment
- Custom allowances and deductions
- Employee activation/deactivation

### Payroll Processing

**Create Payroll Runs**
- Select pay period dates
- Automatic calculation of salaries
- Override capability for special cases
- Draft, Process, and Paid statuses

**Payroll History**
- View all past payroll runs
- Detailed breakdown per employee
- Export capabilities (future enhancement)
- Correction and adjustment support

**Features:**
- Automatic tax calculations
- Allowances and deductions tracking
- Gross pay and net pay calculation
- Compliance with configured tax rules

### Leave Management

**Approve/Deny Requests**
- View all pending leave requests
- Employee information and leave dates
- Reason for leave
- One-click approve/deny
- Notification to employees (future)

**Manage Leave Periods**
- Create annual leave periods
- Allocate leave balances to employees
- Track leave usage across organization
- Generate leave reports (future)

### AI Features (Admin)

**Payroll Analysis**
- Anomaly detection in payroll data
- Compare current vs previous payrolls
- Flag unusual deductions or allowances
- Identify significant pay changes
- AI-powered insights and recommendations

---

## 👤 Employee Features

### Personal Dashboard

**Quick Overview**
- Latest payslip summary
- Current leave balance
- Designation and role
- Quick links to common actions

**Statistics**
- Net pay this period
- Total leaves remaining
- Leave requests status
- Payroll trends (future)

### View Payslips

**Payslip List**
- All historical payslips
- Monthly breakdown
- Gross pay and net pay
- Easy sorting and filtering

**Payslip Details**
- Base salary
- Allowances breakdown
- Deductions breakdown
- Tax information
- Net pay calculation
- Download as PDF (future)

**Features:**
- Secure access to own data only
- Clear breakdown of all components
- Historical comparison
- Mobile-friendly viewing

### Leave Management

**Request Leave**
- Select start and end dates
- Specify leave type (paid/unpaid)
- Add reason
- Submit for approval
- Track request status

**Leave Balance**
- Total granted leaves
- Leaves taken
- Remaining balance
- Leave period information

**Request History**
- All past requests
- Status (pending/approved/denied)
- Dates and reasons
- Approval information

### Profile Management

**View Personal Information**
- Full name
- Email address
- Role
- Designation
- Join date
- Employment status

**Update Profile** (Limited)
- Request profile updates
- Contact administrator for changes
- Security settings

### AI Assistant (Employee)

**Context-Aware Help**
- Ask questions about payslips
- Understand deductions
- Get tax information
- Explain compensation components
- General payroll queries

**Features:**
- Natural language interface
- Privacy-first (PII sanitization)
- Contextual based on current page
- Fast, intelligent responses

---

## 🤖 AI Integration

### Smart Chat Assistant

**Capabilities:**
- Answer payroll-related questions
- Explain deductions and allowances
- Provide tax information
- Help navigate the application
- Context-aware responses

**How It Works:**
1. User asks a question
2. System checks authentication for sensitive queries
3. Sanitizes any personal information
4. Sends to Gemini AI with context
5. Returns helpful, accurate response

**Security:**
- PII data is never sent to AI
- All queries are logged (metadata only)
- Rate limiting to control costs
- Admin-only for sensitive operations

### Payroll Analysis

**Anomaly Detection:**
- Statistical analysis of payroll data
- Compare with historical patterns
- Flag significant changes (>20%)
- Identify calculation errors
- Suggest corrective actions

**AI-Powered Insights:**
- Trends in compensation
- Unusual patterns
- Cost optimization suggestions
- Compliance recommendations

---

## 🔒 Security Features

### Row Level Security (RLS)

**Database Level Protection:**
- Employees can only see their own data
- Admins can only access their company's data
- No cross-company data leakage
- Automatic enforcement at query level

### Authentication Security

**JWT-Based Auth:**
- Secure token-based authentication
- Short-lived access tokens
- Automatic session refresh
- Secure logout with token invalidation

### API Security

**Backend Protection:**
- API key stored securely in environment
- CORS protection
- Rate limiting (configurable)
- Request validation
- SQL injection prevention

### Data Privacy

**PII Protection:**
- Sensitive data encrypted at rest
- Bank details never sent to AI
- Audit logging for sensitive operations
- GDPR-compliant data handling

---

## 📊 Database Schema

### Core Tables

**companies**
- Organization information
- Pay cycle configuration
- Company-specific settings

**profiles**
- User account information
- Extends auth.users
- Role assignment (admin/employee)

**employees**
- Employee records
- Salary structure links
- Custom allowances/deductions
- Employment status

**salary_structures**
- Salary templates
- Base pay
- Standard allowances
- Default deductions

**payrolls**
- Payroll run records
- Pay period dates
- Status tracking
- Audit information

**payslips**
- Individual payslips
- Snapshot of pay components
- Gross/net pay
- PDF storage (optional)

**Leave Management Tables**
- leave_periods
- employee_leave_balances
- leave_requests

---

## 🚀 Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn UI
- **Theme**: next-themes
- **Authentication**: Supabase Auth
- **State**: React Hooks

### Backend
- **Framework**: FastAPI (Python)
- **AI**: Google Gemini API
- **Validation**: Pydantic
- **PDF**: ReportLab (ready)

### Database
- **Platform**: Supabase
- **Database**: PostgreSQL
- **Auth**: Supabase Auth
- **Security**: Row Level Security

### Deployment
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: Supabase Cloud

---

## 🎯 Future Enhancements

### Planned Features

1. **PDF Generation**
   - Generate beautiful payslip PDFs
   - Download and email capabilities
   - Custom branding

2. **Email Notifications**
   - Payslip notifications
   - Leave request updates
   - System announcements

3. **Advanced Reporting**
   - Financial reports
   - Payroll analytics
   - Export to Excel/CSV

4. **Bulk Operations**
   - Bulk employee import
   - Mass leave allocation
   - Batch payroll processing

5. **Attendance Integration**
   - Track working hours
   - Overtime calculation
   - Integration with biometric systems

6. **Mobile App**
   - Native iOS and Android apps
   - Push notifications
   - Offline support

7. **Multi-Currency**
   - Support multiple currencies
   - Exchange rate management
   - Regional tax rules

8. **Advanced AI**
   - Predictive analytics
   - Budget forecasting
   - Compliance automation

---

## 📱 Usage Tips

### For Administrators

1. **Set Up Company First**: Configure company settings and salary structures before adding employees
2. **Create Templates**: Set up salary structure templates for common roles
3. **Regular Audits**: Use AI analysis to review each payroll run
4. **Document Changes**: Use notes/comments for payroll adjustments
5. **Backup Data**: Export important data regularly

### For Employees

1. **Check Payslips Regularly**: Review each payslip for accuracy
2. **Use AI Assistant**: Ask questions if anything is unclear
3. **Plan Leave**: Submit leave requests well in advance
4. **Update Profile**: Keep contact information current
5. **Download Payslips**: Save for tax filing and records

### Best Practices

1. **Security**: Never share your password
2. **Leave Requests**: Provide clear reasons and sufficient notice
3. **Questions**: Use the AI assistant or contact admin
4. **Mobile Access**: Use responsive interface on any device
5. **Theme**: Choose what's comfortable for your eyes

---

**Enjoy using Payroll AI! 🎉**
