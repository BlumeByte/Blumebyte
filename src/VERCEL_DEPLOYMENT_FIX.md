# Vercel Deployment Fix Guide

## 🔧 Problem

Vercel deployment was failing with error:
```
npm error Invalid package name "node:crypto" of package "node:crypto@*"
```

**Root Cause**: Vercel's build process was trying to analyze server-side Deno code (Supabase Edge Functions) which uses Node.js built-in module imports with the `node:` prefix. These should NOT be processed by Vercel since they're deployed separately to Supabase.

---

## ✅ Solution Applied

### 1. Created `.vercelignore`
Explicitly excludes server-side code from Vercel builds:
```
supabase/
.supabase/
**/supabase/functions/**
```

### 2. Updated `vercel.json`
```json
{
  "buildCommand": "npm run vercel-build",
  "installCommand": "npm install --legacy-peer-deps",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### 3. Updated `package.json`
Added dedicated Vercel build script:
```json
{
  "scripts": {
    "vercel-build": "vite build"
  }
}
```

### 4. Created `.npmrc`
Ensures clean dependency resolution during Vercel builds.

### 5. Updated `vite.config.ts` (Already configured)
Already has `external: [/^node:/]` to exclude Node.js built-ins from bundling.

---

## 🚀 Deployment Instructions

### Step 1: Verify Local Build
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Test build locally
npm run build

# Verify dist folder was created
ls -la dist/
```

### Step 2: Commit Changes
```bash
git add .vercelignore vercel.json package.json .npmrc VERCEL_DEPLOYMENT_FIX.md
git commit -m "fix: Vercel deployment error - exclude server code"
git push origin main
```

### Step 3: Redeploy on Vercel
Vercel will automatically detect the push and trigger a new deployment.

**Expected build output:**
```
✅ Installing dependencies
✅ Running vercel-build
✅ Building with Vite
✅ Build completed
✅ Uploading dist/ folder
✅ Deployment successful
```

---

## 🔍 Verification

### 1. Check Vercel Build Logs
Look for these success indicators:
- ✅ `npm install` completes without errors
- ✅ `vite build` creates `dist/` folder
- ✅ No references to `supabase/functions/` in build
- ✅ No `node:crypto` errors

### 2. Test Deployed Application
```bash
# Replace with your Vercel URL
curl https://your-app.vercel.app

# Should return your React app HTML
```

### 3. Test API Endpoints
Your API should still work via Supabase (not affected by Vercel):
```bash
# Test health endpoint
curl https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/server/make-server-668731fc/health

# Expected response:
# {"status":"ok","version":"2.1-payment-flow-UPDATED"}
```

---

## 📂 File Structure

```
project-root/
├── .vercelignore          ← NEW: Exclude server code
├── vercel.json            ← UPDATED: Build configuration
├── .npmrc                 ← NEW: NPM configuration
├── package.json           ← UPDATED: Added vercel-build script
├── vite.config.ts         ← Already correct
├── tsconfig.json          ← Already excludes supabase/
│
├── src/                   ← React app (deployed to Vercel)
├── components/            ← React components (deployed to Vercel)
├── public/               ← Static assets (deployed to Vercel)
│
└── supabase/             ← Server code (deployed to Supabase, NOT Vercel)
    └── functions/
        └── server/       ← Edge Functions (uses node:crypto)
```

---

## 🎯 Key Principles

### What Gets Deployed to Vercel?
✅ React frontend code  
✅ Static assets (images, fonts)  
✅ Built JavaScript bundles  
✅ HTML files  

### What Gets Deployed to Supabase?
✅ Edge Functions (`supabase/functions/`)  
✅ Server-side logic  
✅ API endpoints  
✅ Database operations  

### What NEVER Goes to Vercel?
❌ `supabase/` directory  
❌ Server-side TypeScript with `node:` imports  
❌ Deno-specific code  
❌ Edge Function code  

---

## 🐛 Troubleshooting

### Error: Still getting `node:crypto` error
**Solution**: Clear Vercel build cache
1. Go to Vercel Dashboard → Project Settings
2. Click "Clear Cache and Redeploy"
3. Or add `VERCEL_FORCE_NO_BUILD_CACHE=1` environment variable

### Error: `Module not found` for frontend code
**Solution**: Check imports use relative paths
```typescript
// ✅ Correct
import { api } from './lib/api-client';
import { Button } from './components/ui/button';

// ❌ Wrong (requires path alias setup)
import { api } from '@/lib/api-client';
```

### Error: Build succeeds but app shows blank page
**Solution**: Check browser console for errors
```bash
# Common causes:
# 1. Missing environment variables in Vercel
# 2. Incorrect API endpoint URLs
# 3. CORS issues
```

### Error: API calls fail after deployment
**Solution**: Verify environment variables in Vercel
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add these variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - Any other `VITE_` prefixed variables your app uses

---

## 🔐 Environment Variables

### Required Vercel Environment Variables
```bash
# Supabase (Public - safe to expose)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Note: NEVER add service role key to Vercel
# It should only exist in Supabase Edge Function secrets
```

### Required Supabase Secrets (Already configured)
```bash
# These are ONLY in Supabase Edge Functions (not Vercel)
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PAYSTACK_SECRET_KEY
PAYSTACK_PUBLIC_KEY
GEMINI_API_KEY
DEEPSEEK_API_KEY
```

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│                    USER                         │
└────────────┬────────────────────────────────────┘
             │
             │ HTTPS
             │
        ┌────▼────┐
        │ VERCEL  │  (React Frontend)
        │         │  - Serves HTML/CSS/JS
        └────┬────┘  - Static hosting
             │
             │ API Calls
             │
      ┌──────▼────────┐
      │   SUPABASE    │  (Backend)
      │ Edge Functions│  - REST API
      │               │  - Auth
      │               │  - Database
      └───────────────┘
```

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Vercel build completes without errors
- [ ] No `node:crypto` or `node:*` errors in Vercel logs
- [ ] React app loads in browser
- [ ] Login page is accessible
- [ ] API calls work (check Network tab)
- [ ] User authentication works
- [ ] Multi-tenant data isolation works
- [ ] All routes are accessible
- [ ] Static assets load (images, fonts)
- [ ] No console errors in browser

---

## 📝 Next Steps

1. ✅ Commit all changes to GitHub
2. ✅ Push to main branch
3. ✅ Verify Vercel auto-deploys
4. ✅ Test deployed application
5. ✅ Configure custom domain (if needed)
6. ✅ Set up monitoring (Vercel Analytics)

---

## 🆘 Need Help?

If deployment still fails:

1. Check Vercel build logs for specific errors
2. Verify all files are committed to Git
3. Try clearing Vercel cache
4. Contact support with:
   - Build log URL
   - Error message
   - Repository name

---

**Deployment Status**: 🟢 READY TO DEPLOY

Last Updated: January 2025
