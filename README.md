# Payroll AI - Complete Setup Guide

AI-powered payroll management system with sleek minimalist dark/light/system theme support. Ready for deployment!

## 📋 Overview

This project implements a complete full-stack payroll management system with:
- **Frontend**: Next.js with TypeScript, Tailwind CSS, and Shadcn UI
- **Backend**: Python FastAPI for AI services
- **Database**: Supabase (PostgreSQL with Auth)
- **AI**: Google Gemini API integration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- Supabase account
- Google Gemini API key

### 1. Database Setup (Supabase)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migrations in the SQL Editor:
   - Execute `supabase/migrations/20251023000001_initial_schema.sql`
   - Execute `supabase/migrations/20251023000002_rls_policies.sql`
3. Note your project URL and API keys from Settings > API

### 2. Backend Setup (Render)

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
GEMINI_API_KEY=your_gemini_api_key
CORS_ORIGINS=http://localhost:3000,https://your-vercel-domain.vercel.app
```

4. Test locally:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

5. Deploy to Render:
   - Connect your GitHub repository
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Add all environment variables
   - Deploy!

### 3. Frontend Setup (Vercel)

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Create `.env.local` file:
```bash
cp .env.example .env.local
```

3. Update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

4. Test locally:
```bash
npm install
npm run dev
```

5. Deploy to Vercel:
   - Import your GitHub repository
   - Set root directory to `frontend`
   - Add environment variables
   - Deploy!

### 4. Post-Deployment Configuration

1. **Update Supabase Auth URLs**:
   - Go to Authentication > URL Configuration
   - Add your Vercel URL to "Site URL"
   - Add `https://your-app.vercel.app/auth/callback` to "Redirect URLs"

2. **Create Admin User**:
   - Sign up through your application
   - In Supabase SQL Editor, run:
   ```sql
   -- Create a company first
   INSERT INTO companies (name, pay_cycle) VALUES ('Your Company', 'monthly') RETURNING id;
   
   -- Update user to admin (replace IDs)
   UPDATE profiles SET role = 'admin', company_id = 'company-id-from-above' 
   WHERE id = 'your-user-id-from-auth-users';
   ```

## 📁 Project Structure

```
Payroll-AI-webapp/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core configuration
│   │   ├── models/         # Pydantic models
│   │   └── services/       # Business logic
│   ├── requirements.txt
│   └── README.md
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # App routes
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities
│   ├── package.json
│   └── README.md
├── supabase/              # Database migrations
│   ├── migrations/
│   └── README.md
├── PLAN.md                # Detailed project plan
└── README.md              # This file
```

## 🎨 Features

### Theme System
- **Dark Mode**: Eye-friendly dark theme
- **Light Mode**: Clean, bright interface
- **System Mode**: Automatically matches OS preference

Toggle themes using the button in the header!

### Admin Features
- Dashboard with organization overview
- Employee management (add, edit, view)
- Payroll processing and history
- Leave request approval
- AI-powered payroll analysis

### Employee Features
- Personal dashboard
- View and download payslips
- Submit leave requests
- Profile management
- AI assistant for payroll queries

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- JWT-based authentication
- API keys stored securely in environment variables
- PII sanitization before AI processing
- Audit logging for sensitive operations

## 🤖 AI Integration

The system includes:
- **Chat Assistant**: Context-aware AI help for users
- **Payroll Analysis**: Anomaly detection in payroll runs
- **Smart Insights**: AI-powered recommendations

## 📊 Database Schema

Core tables:
- `companies` - Organization information
- `profiles` - User profiles (extends auth.users)
- `employees` - Employee records
- `salary_structures` - Salary templates
- `payrolls` - Payroll runs
- `payslips` - Individual payslips
- `leave_periods` - Leave periods
- `employee_leave_balances` - Leave balances
- `leave_requests` - Leave requests

See `supabase/migrations/` for complete schema.

## 🔧 Development

### Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm run dev
```

App available at: `http://localhost:3000`

## 📝 Environment Variables

### Backend (.env)
```env
SUPABASE_URL=              # Your Supabase project URL
SUPABASE_ANON_KEY=         # Supabase anonymous key
SUPABASE_SERVICE_KEY=      # Supabase service role key (keep secret!)
GEMINI_API_KEY=            # Google Gemini API key
ENVIRONMENT=production
CORS_ORIGINS=              # Comma-separated list of allowed origins
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=      # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anonymous key
NEXT_PUBLIC_API_URL=           # Backend API URL
```

## 🐛 Troubleshooting

### Backend won't start
- Check Python version (3.9+)
- Verify all environment variables are set
- Check Supabase credentials

### Frontend won't connect to Supabase
- Verify Supabase URL and anon key
- Check auth callback URL in Supabase settings
- Clear browser cache and cookies

### Migrations fail
- Ensure you run migrations in order
- Check Supabase connection
- Verify you have sufficient permissions

### Theme not switching
- Ensure `ThemeProvider` is in root layout
- Check `suppressHydrationWarning` on `<html>` tag
- Clear browser cache

## 📚 Documentation

- [Backend README](backend/README.md) - Backend setup and API docs
- [Frontend README](frontend/README.md) - Frontend setup and deployment
- [Database README](supabase/README.md) - Database schema and migrations
- [PLAN.md](PLAN.md) - Detailed project specifications

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the detailed documentation
3. Check environment variables
4. Verify all services are running

## 📄 License

See LICENSE file for details.

---

**Built with ❤️ using Next.js, FastAPI, Supabase, and Gemini AI**
