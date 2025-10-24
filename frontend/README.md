# Payroll AI Frontend

A modern, AI-powered payroll management system frontend built with Next.js 16, designed for Indian businesses to streamline payroll processing, employee management, and HR operations.

## 🎯 What This Project Does

**Payroll AI** is a comprehensive web application that revolutionizes payroll management through:

- **AI-Powered Assistance**: Intelligent chat assistant that explains payslips, provides tax advice, and offers leave management guidance
- **Automated Payroll Processing**: Streamlined payroll runs with intelligent validation and error detection
- **Employee Self-Service**: Employees can view payslips, request leaves, and access personal information
- **Admin Dashboard**: Complete HR management with employee onboarding, payroll processing, and analytics
- **Real-time Analytics**: Performance monitoring and business insights with Vercel Analytics and Speed Insights

## 🏗️ Tech Stack

### Core Framework
- **Next.js 16.0.0** - React framework with App Router, Turbopack for fast development
- **React 19.2.0** - Latest React with concurrent features and improved performance
- **TypeScript 5** - Type-safe development with modern JavaScript features

### UI & Styling
- **Tailwind CSS 4.1.16** - Utility-first CSS framework with modern design system
- **Radix UI** - Accessible, unstyled UI components (Dialog, Select, Dropdown, etc.)
- **Lucide React** - Beautiful, consistent icon library
- **next-themes** - Dark/light theme support with system preference detection
- **Tailwind Animate** - CSS animation utilities

### Authentication & Database
- **Supabase** - Backend-as-a-Service providing:
  - PostgreSQL database with real-time subscriptions
  - Authentication with JWT tokens
  - Row Level Security (RLS) policies
  - Server-side rendering support

### AI Integration
- **Google Generative AI (Gemini)** - AI assistant powered by Gemini 2.5 Flash
- **Custom System Instructions** - Context-aware AI responses for different use cases:
  - Payslip explanations
  - Leave management advice
  - Tax optimization suggestions
  - Dashboard insights

### Performance & Analytics
- **Vercel Analytics** - User behavior tracking and conversion analytics
- **Vercel Speed Insights** - Core Web Vitals monitoring and performance metrics

### Development Tools
- **ESLint 9** - Code linting with Next.js configuration
- **TypeScript** - Type checking and IntelliSense support
- **pnpm** - Fast, disk-efficient package manager

## 🏛️ Architecture Overview

### Project Structure
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout with theme provider
│   │   ├── page.tsx           # Landing page
│   │   ├── app/               # Protected app routes
│   │   │   ├── layout.tsx     # Authenticated layout with sidebar
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── employees/     # Employee management
│   │   │   ├── payroll/       # Payroll processing
│   │   │   ├── payslips/      # Payslip viewing
│   │   │   ├── leave/         # Leave requests
│   │   │   ├── profile/       # User profile
│   │   │   └── leave-management/ # Admin leave management
│   │   └── auth/              # Authentication routes
│   │       └── callback/      # OAuth callback
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components (shadcn/ui)
│   │   ├── ai/               # AI assistant components
│   │   ├── providers/        # React context providers
│   │   └── *-dialog.tsx      # Modal dialogs
│   ├── config/               # Configuration files
│   │   └── system-instructions.json # AI assistant prompts
│   ├── lib/                  # Utility libraries
│   │   ├── supabase/         # Database client setup
│   │   └── utils.ts          # Helper functions
│   └── middleware.ts         # Next.js middleware for auth
├── public/                   # Static assets
├── package.json
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── eslint.config.mjs
```

### Key Architectural Patterns

#### 1. **App Router Architecture**
- Uses Next.js 16 App Router for file-based routing
- Server Components for initial page loads and data fetching
- Client Components for interactive features
- Route Groups for organizing authenticated vs public routes

#### 2. **Authentication Flow**
```
Landing Page → Login → Supabase Auth → Middleware Check → Protected Routes
```

#### 3. **Role-Based Access Control**
- **Admin Users**: Full access to employee management, payroll processing, leave approvals
- **Employee Users**: Limited to personal payslips, leave requests, profile management
- Role determined by `profiles.role` field in Supabase

#### 4. **AI Integration Pattern**
```
User Query → Intent Detection → Context Fetching → AI Processing → Formatted Response
```

## 🔄 How It Works

### User Journey

#### For New Users:
1. **Landing Page**: Clean, modern design showcasing key features
2. **Authentication**: Supabase-powered login/signup with email verification
3. **Onboarding**: Automatic profile creation and role assignment

#### For Employees:
1. **Dashboard**: Personalized view with recent payslips and leave balance
2. **AI Assistant**: Context-aware help for payslip questions, tax advice, leave planning
3. **Self-Service**: View payslips, request leaves, update profile information

#### For Admins:
1. **Admin Dashboard**: Company-wide analytics and quick actions
2. **Employee Management**: Add/edit employees, manage payroll structures
3. **Payroll Processing**: Automated payroll runs with validation
4. **Leave Management**: Approve/reject leave requests with AI assistance

### AI Assistant Deep Dive

The AI assistant is powered by Google's Gemini 2.5 Flash and uses context-aware system instructions:

#### Intent-Based Responses
- **payslip_explain**: Analyzes payslip data and explains components in simple terms
- **leave_advice**: Provides guidance on leave policies and balances
- **payslip_tax_suggestions**: Offers tax optimization strategies under Indian tax laws
- **dashboard_insights**: Gives actionable insights from payroll data

#### Context Enrichment
For authenticated requests, the AI fetches relevant data:
- Employee profile and company information
- Recent payslips (last 12 months)
- Leave balances and history
- Payroll structures and allowances

#### Streaming Responses
- Real-time streaming using Server-Sent Events (SSE)
- Formatted output with markdown-like syntax:
  - `## Headers` for sections
  - `**Bold text**` for emphasis
  - `` `Inline code` `` for technical terms
  - ```` ``` Code blocks ```` with copy-to-clipboard
  - Multi-turn conversation history (last 8 messages)

### Data Flow Architecture

#### Frontend → Backend Communication
```
Next.js Client → Supabase Client → PostgreSQL Database
                    ↓
              FastAPI Backend → Gemini AI API
```

#### Authentication & Security
- JWT tokens managed by Supabase
- Row Level Security (RLS) policies in PostgreSQL
- Server-side session validation in middleware
- Sensitive data masking before AI processing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Supabase project with configured database
- Google AI API key (for AI features)

### Installation

1. **Clone and navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Environment setup:**
   Create `.env.local` with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Start development server:**
   ```bash
   pnpm dev
   ```

### Build for Production
```bash
pnpm build
pnpm start
```

## 🎨 UI/UX Design System

### Design Principles
- **Modern & Clean**: Minimalist design with focus on usability
- **Accessible**: WCAG compliant with keyboard navigation and screen reader support
- **Responsive**: Mobile-first design that works on all devices
- **Consistent**: Unified design language across all components

### Theme System
- **Light/Dark Mode**: Automatic system preference detection
- **CSS Variables**: Dynamic theming with CSS custom properties
- **Component Variants**: Consistent button styles, card layouts, and spacing

### Component Library
Built on Radix UI primitives with custom styling:
- **Dialogs**: Modal overlays for forms and confirmations
- **Selects**: Dropdown menus with search and keyboard navigation
- **Buttons**: Multiple variants (primary, secondary, outline, ghost)
- **Cards**: Information containers with headers and actions
- **Tables**: Data display with sorting and pagination

## 📊 Performance & Analytics

### Vercel Analytics Integration
- **User Behavior**: Track page views, user flows, and conversion analytics
- **Custom Events**: Monitor AI assistant usage, payroll processing success rates
- **Real-time Dashboard**: Live metrics in Vercel dashboard

### Speed Insights
- **Core Web Vitals**: Monitor LCP, FID, CLS metrics
- **Performance Budgets**: Track bundle size and loading times
- **Real User Monitoring**: Actual user experience data

## 🔧 Development Workflow

### Code Quality
- **TypeScript**: Strict type checking prevents runtime errors
- **ESLint**: Automated code linting with Next.js rules
- **Prettier**: Consistent code formatting (configured via ESLint)

### Component Development
- **Atomic Design**: Small, reusable components that compose together
- **Props Interface**: Well-defined TypeScript interfaces for all components
- **Storybook Ready**: Components designed for easy testing and documentation

### State Management
- **Server State**: Supabase for database state with real-time subscriptions
- **Client State**: React hooks for local component state
- **Form State**: React Hook Form for complex form handling

## 🌟 Key Features Explained

### 1. AI-Powered Assistant
- **Context Aware**: Understands user role and provides relevant information
- **Multi-turn Conversations**: Maintains conversation history for coherent responses
- **Specialized Knowledge**: Different AI personas for different use cases
- **Real-time Streaming**: Instant responses with typing indicators

### 2. Payroll Processing
- **Automated Calculations**: Intelligent payroll computation with validation
- **Bulk Processing**: Handle multiple employees simultaneously
- **Error Detection**: AI-powered anomaly detection in payroll data
- **Audit Trail**: Complete history of all payroll changes

### 3. Employee Management
- **Onboarding Flow**: Streamlined employee addition with validation
- **Profile Management**: Comprehensive employee information tracking
- **Leave Management**: Automated leave request and approval workflow
- **Document Storage**: Secure storage of employee documents

### 4. Analytics & Reporting
- **Dashboard Insights**: Key metrics and trends visualization
- **Custom Reports**: Flexible reporting with filters and exports
- **Performance Monitoring**: System health and usage analytics
- **Compliance Reporting**: Automated compliance documentation

## 🔒 Security & Compliance

### Data Protection
- **Encryption**: All data encrypted in transit and at rest
- **Access Control**: Role-based permissions with granular controls
- **Audit Logging**: Complete audit trail of all system actions
- **Data Masking**: Sensitive information masked before AI processing

### Indian Compliance
- **Tax Compliance**: Support for Indian tax laws and regulations
- **Data Localization**: Data stored in compliant regions
- **Privacy Laws**: GDPR and Indian data protection compliance
- **Financial Security**: Bank-grade security for payroll data

## 🚀 Deployment

### Vercel Deployment
1. **Connect Repository**: Link GitHub repository to Vercel
2. **Environment Variables**: Configure production environment variables
3. **Build Settings**: Automatic Next.js detection and optimization
4. **Domain Setup**: Custom domain configuration with SSL

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates active
- [ ] Analytics and monitoring enabled
- [ ] Backup systems configured
- [ ] Performance budgets set

## 🤝 Contributing

### Development Guidelines
1. **Branch Strategy**: Feature branches with descriptive names
2. **Code Reviews**: All changes require review before merge
3. **Testing**: Unit tests for critical business logic
4. **Documentation**: Update README for any architectural changes

### Code Style
- **TypeScript**: Strict mode enabled
- **Component Naming**: PascalCase for components, camelCase for utilities
- **File Organization**: Logical grouping with index files for exports
- **Commit Messages**: Conventional commits with descriptive messages

## 📈 Future Roadmap

### Planned Features
- **Mobile App**: React Native companion app
- **Advanced Analytics**: Machine learning-powered insights
- **Integration APIs**: Third-party HR system integrations
- **Multi-language Support**: Localization for different regions
- **Advanced AI Features**: Predictive analytics and automated recommendations

### Technical Improvements
- **Microservices**: Backend service decomposition for scalability
- **Edge Computing**: Global CDN deployment with Edge Functions
- **Advanced Caching**: Intelligent caching strategies for better performance
- **Real-time Collaboration**: Multi-user editing and approval workflows

---

**Payroll AI Frontend** - Revolutionizing payroll management with the power of AI and modern web technologies.
