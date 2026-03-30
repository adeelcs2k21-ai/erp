# Deployment Checklist ✅

Use this checklist before deploying to Vercel.

## Pre-Deployment

- [ ] All code changes committed to Git
- [ ] `.env.local` is in `.gitignore` (never commit secrets!)
- [ ] Database schema is up to date in Supabase
- [ ] All SQL migrations have been run:
  - [ ] `supabase-schema.sql`
  - [ ] `database-updates.sql`
- [ ] Test the app locally with `npm run dev`
- [ ] Test all critical features:
  - [ ] Login/Logout
  - [ ] Create client order
  - [ ] Fulfill order
  - [ ] Inventory updates
  - [ ] Product history

## Git Setup

- [ ] Repository created on GitHub/GitLab/Bitbucket
- [ ] Code pushed to repository:
  ```bash
  git init
  git add .
  git commit -m "Ready for deployment"
  git remote add origin YOUR_REPO_URL
  git push -u origin main
  ```

## Vercel Setup

- [ ] Vercel account created
- [ ] Project imported from Git repository
- [ ] Environment variables added in Vercel:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Build settings verified:
  - Framework: Next.js ✓
  - Build Command: `npm run build` ✓
  - Output Directory: `.next` ✓
  - Install Command: `npm install` ✓

## Post-Deployment

- [ ] Deployment successful (check Vercel dashboard)
- [ ] Visit deployed URL
- [ ] Test login with superadmin credentials
- [ ] Verify database connection works
- [ ] Test creating a client
- [ ] Test creating an order
- [ ] Test fulfilling an order
- [ ] Check inventory updates
- [ ] Check product history
- [ ] Test all modules:
  - [ ] Dashboard
  - [ ] CRM
  - [ ] Inventory
  - [ ] Finance
  - [ ] Purchase
  - [ ] Manufacturing
  - [ ] Documentation
  - [ ] Website
  - [ ] HR

## Optional

- [ ] Custom domain configured
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Analytics enabled
- [ ] Error monitoring set up

## Troubleshooting

If deployment fails:
1. Check build logs in Vercel
2. Verify all environment variables are set
3. Ensure Supabase project is active
4. Check for TypeScript errors: `npm run build` locally
5. Verify all dependencies are in package.json

## Quick Deploy Command

```bash
# From erp-app directory
vercel --prod
```

## Rollback

If something goes wrong:
1. Go to Vercel dashboard
2. Navigate to Deployments
3. Find previous working deployment
4. Click "..." → "Promote to Production"

---

**Ready to deploy?** Follow the detailed guide in [DEPLOYMENT.md](./DEPLOYMENT.md)
