# Deployment Guide - Vercel

## Prerequisites
1. A Vercel account (sign up at https://vercel.com)
2. Your Supabase project set up and running
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Repository

1. Initialize git (if not already done):
```bash
cd erp-app
git init
git add .
git commit -m "Initial commit - ERP App"
```

2. Create a repository on GitHub/GitLab/Bitbucket and push your code:
```bash
git remote add origin YOUR_REPOSITORY_URL
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Configure your project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `erp-app` (if your repo has multiple folders)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)

5. Add Environment Variables (IMPORTANT):
   Click "Environment Variables" and add these:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://idjounuezdqtltdzalrf.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkam91bnVlemRxdGx0ZHphbHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTg4NzYsImV4cCI6MjA5MDM3NDg3Nn0.vxtO_9JIQxdtxvZzWiy39JcN7EQ_hYAQIt6cgBQdD4Q
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkam91bnVlemRxdGx0ZHphbHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDc5ODg3NiwiZXhwIjoyMDkwMzc0ODc2fQ.6lDE1_rw6SMTdtI2SB2rxj4tMlTbyp1E-hfdp8EUxmM
   ```

6. Click "Deploy"
7. Wait for the build to complete (usually 2-5 minutes)
8. Your app will be live at `https://your-project-name.vercel.app`

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from the erp-app directory:
```bash
cd erp-app
vercel
```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - What's your project's name? **erp-app** (or your preferred name)
   - In which directory is your code located? **./**
   - Want to override settings? **N**

5. Add environment variables:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

6. Deploy to production:
```bash
vercel --prod
```

## Step 3: Verify Deployment

1. Visit your deployed URL
2. Test login with: `superadmin` / `superadmin123`
3. Check all modules are working
4. Verify database connections

## Step 4: Configure Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set correctly

### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Ensure RLS policies allow access

### 404 Errors
- Clear Vercel cache and redeploy
- Check file paths are correct (case-sensitive)

## Continuous Deployment

Once connected to Git:
- Every push to `main` branch automatically deploys to production
- Pull requests create preview deployments
- Rollback to previous deployments anytime from Vercel dashboard

## Important Notes

1. **Environment Variables**: Never commit `.env.local` to Git
2. **Database**: Ensure your Supabase database has all required tables and columns
3. **Performance**: Vercel automatically optimizes your Next.js app
4. **Monitoring**: Use Vercel Analytics to monitor performance

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
