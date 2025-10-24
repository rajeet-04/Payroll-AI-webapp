# 🚀 Deployment Guide

Complete step-by-step guide to deploy the Payroll AI application to production.

## Prerequisites

Before deploying, ensure you have:
- ✅ Supabase account ([sign up](https://supabase.com))
- ✅ Google Gemini API key ([get key](https://makersuite.google.com/app/apikey))
- ✅ Render account ([sign up](https://render.com))
- ✅ Vercel account ([sign up](https://vercel.com))
- ✅ GitHub repository with this code

## 📋 Deployment Checklist

- [ ] Set up Supabase database
- [ ] Deploy backend to Render
- [ ] Deploy frontend to Vercel
- [ ] Create admin user
- [ ] Test application

---

## Part 1: Supabase Setup (10 minutes)

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in project details:
   - **Name**: Payroll AI
   - **Database Password**: (generate a strong password)
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 minutes)

### 1.2 Run Database Migrations

1. In your Supabase project, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `supabase/migrations/20251023000001_initial_schema.sql`
4. Click "Run"
5. Create another new query
6. Copy and paste the contents of `supabase/migrations/20251023000002_rls_policies.sql`
7. Click "Run"

### 1.3 Get API Keys

1. Go to **Settings** → **API**
2. Note down:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

---

## Part 2: Backend Deployment to Render (15 minutes)

### 2.1 Prepare for Deployment

1. Push your code to GitHub if not already done
2. Make sure the `backend/` directory is in your repository

### 2.2 Create Web Service on Render

1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `payroll-ai-backend`
   - **Region**: Choose closest to you
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 2.3 Add Environment Variables

Click "Advanced" and add the following environment variables:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
GEMINI_API_KEY=your_gemini_api_key_here
ENVIRONMENT=production
CORS_ORIGINS=http://localhost:3000
```

**Note**: We'll update `CORS_ORIGINS` after deploying the frontend.

### 2.4 Deploy

1. Click "Create Web Service"
2. Wait for deployment (~5-10 minutes)
3. Once deployed, note your service URL (e.g., `https://payroll-ai-backend.onrender.com`)
4. Test the API:
   - Visit `https://your-backend-url.onrender.com/`
   - You should see: `{"status":"healthy",...}`

---

## Part 3: Frontend Deployment to Vercel (10 minutes)

### 3.1 Prepare for Deployment

Create a `.env.local` file in the `frontend/` directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

### 3.2 Deploy to Vercel

#### Option A: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (leave as default)
   - **Output Directory**: `.next` (leave as default)

5. Add Environment Variables:
   - Click "Environment Variables"
   - Add the three variables from your `.env.local` file
   - Make sure to add them for **Production**, **Preview**, and **Development**

6. Click "Deploy"
7. Wait for deployment (~5 minutes)

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from frontend directory
cd frontend
vercel

# Follow the prompts and add environment variables when asked
```

### 3.3 Note Your Frontend URL

After deployment, you'll get a URL like: `https://payroll-ai-abc123.vercel.app`

---

## Part 4: Connect Everything (5 minutes)

### 4.1 Update Backend CORS

1. Go back to Render dashboard
2. Find your backend service
3. Click "Environment"
4. Update `CORS_ORIGINS` to include your Vercel URL:
   ```
   CORS_ORIGINS=https://your-frontend-url.vercel.app,http://localhost:3000
   ```
5. Save changes (service will redeploy automatically)

### 4.2 Update Supabase Auth URLs

1. Go to your Supabase project
2. Navigate to **Authentication** → **URL Configuration**
3. Update:
   - **Site URL**: `https://your-frontend-url.vercel.app`
   - **Redirect URLs**: Add `https://your-frontend-url.vercel.app/auth/callback`
4. Click "Save"

---

## Part 5: Create Admin User (5 minutes)

### 5.1 Sign Up Through App

1. Visit your Vercel URL
2. Click "Get Started" or "Sign Up"
3. Create an account with your email and password
4. You'll be logged in, but with employee role

### 5.2 Promote to Admin

1. Go to Supabase project → **SQL Editor**
2. Get your user ID:
   ```sql
   SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;
   ```
3. Create a company:
   ```sql
   INSERT INTO companies (name, pay_cycle) 
   VALUES ('Your Company Name', 'monthly') 
   RETURNING id;
   ```
4. Promote user to admin (replace IDs):
   ```sql
   UPDATE profiles 
   SET role = 'admin', company_id = 'company-id-from-step-3'
   WHERE id = 'user-id-from-step-2';
   ```
5. Refresh your app - you should now see admin features!

---

## Part 6: Test the Application (10 minutes)

### 6.1 Test Admin Features

1. **Dashboard**: Should show organization overview
2. **Employees**: Try adding a test employee
3. **Payroll**: View payroll interface
4. **Leave Management**: Check leave approval interface
5. **Theme Toggle**: Switch between light/dark/system modes

### 6.2 Test Employee Features

Create a second account to test employee features:

1. Sign out from admin account
2. Sign up with different email
3. Go to Supabase SQL Editor and create employee record:
   ```sql
   INSERT INTO employees (profile_id, company_id, designation, join_date, is_active)
   VALUES (
     'new-user-id',
     'your-company-id',
     'Software Engineer',
     CURRENT_DATE,
     true
   );
   ```
4. Refresh app - employee should see their dashboard
5. Test viewing payslips (won't have any yet) and profile

---

## 🎉 Deployment Complete!

Your application is now live! Here's what you have:

- ✅ **Frontend**: Running on Vercel with elegant theme support
- ✅ **Backend**: AI-powered API on Render
- ✅ **Database**: Secure PostgreSQL on Supabase
- ✅ **Admin Access**: Ready to manage your organization

## 📝 Next Steps

1. **Customize**: Update company name and branding
2. **Add Employees**: Start adding your team members
3. **Configure Salary Structures**: Set up salary templates
4. **AI Integration**: Test the AI features (chat, analysis)
5. **Security**: Review and test RLS policies

## 🔧 Troubleshooting

### Build Fails on Vercel

**Problem**: Build fails with Supabase error  
**Solution**: Make sure all environment variables are set in Vercel dashboard

### Can't Sign In

**Problem**: Authentication not working  
**Solution**: 
- Check redirect URLs in Supabase
- Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

### Backend Not Accessible

**Problem**: Frontend can't reach backend  
**Solution**:
- Check CORS_ORIGINS in Render includes your Vercel URL
- Verify backend is running at the URL you specified

### Theme Not Working

**Problem**: Dark mode not switching  
**Solution**: Clear browser cache and cookies, then refresh

### Admin Features Not Showing

**Problem**: Signed in but see employee view  
**Solution**: Run the SQL commands to promote user to admin role

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

## 🆘 Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Review application logs in Render and Vercel dashboards
3. Verify all environment variables are correct
4. Check Supabase logs for database errors

---

**Built with ❤️ - Ready to revolutionize payroll management!**
