# Payroll AI - Frontend

Modern Next.js frontend for the AI-powered payroll management system with elegant dark/light/system theme support.

## Features

- 🎨 **Sleek UI**: Minimalist design with Shadcn UI components
- 🌓 **Theme Support**: Dark, light, and system theme modes
- 🔐 **Authentication**: Secure Supabase authentication
- 📊 **Dashboards**: Separate admin and employee dashboards
- 👥 **Employee Management**: CRUD operations for employees (admin)
- 💰 **Payroll Processing**: Manage payroll runs and view payslips
- 📅 **Leave Management**: Request and approve leave
- 🤖 **AI Assistant**: Context-aware AI chat (integration ready)

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Theme**: next-themes

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account and project

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
cp .env.example .env.local
```

Update the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Get these from your Supabase project:
1. Go to Project Settings > API
2. Copy the Project URL and anon/public key

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Deployment to Vercel

### Quick Deploy

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Set root directory to `frontend`
4. Add environment variables
5. Deploy!

See full deployment guide in the documentation.

## License

See LICENSE file in root directory.
