# 🚨 URGENT: Fix 403 Error - 2 Simple Steps

## 🎯 The Problem

Figma Make is looking for: `/edge_functions/make-server/`  
But your function is in: `/supabase/functions/server/`

**Directory name mismatch = 403 error!**

---

## ✅ THE FIX (2 Simple Steps)

### **Step 1: Rename the Directory**

**Using File Explorer/Finder:**
1. Navigate to your project folder
2. Go to `/supabase/functions/`
3. Right-click the `server` folder
4. Rename it to `make-server`
5. Done!

**Or using Terminal/Command Prompt:**
```bash
# Windows
cd supabase\functions
rename server make-server

# Mac/Linux
cd supabase/functions
mv server make-server
```

### **Step 2: Update figma.json**

The file has already been updated to:
```json
{
  "supabase": {
    "enabled": true,
    "projectRef": "ivohczdtuxasyfoiphqu",
    "edgeFunctions": {
      "deploy": true,
      "enabled": true,
      "functionName": "make-server"  ✅ READY
    }
  }
}
```

---

## 🚀 That's It!

After renaming the folder:
1. **Retry deployment** in Figma Make
2. **Should work immediately!** ✅

---

## 📋 What Gets Renamed

The `/supabase/functions/server/` directory contains:
- `index.tsx` (main function)
- `kv_store.tsx`
- `license-routes.tsx`
- `company-utils.tsx`
- `currency-utils.tsx`
- `sync-company-stats.tsx`
- `production-cleanup.tsx`
- `migration-company-keys.tsx`
- `user-creation-fixed.tsx`
- `debug-subscription.tsx`
- `deno.json`
- `APPLY_THIS_FIX.md`

**Just rename the parent folder** - all files inside stay the same!

---

## ⚠️ Why This Works

- **Deployment path**: Based on directory name (`make-server`)
- **Runtime path**: Based on PREFIX in code (`/make-server-668731fc`)
- **Your frontend**: Already calls correct path (`/make-server-668731fc`)

Everything else is already correct! Just the directory name needed to match.

---

## ✅ After Renaming

Your folder structure should look like:
```
/supabase/
  /functions/
    /make-server/      ✅ RENAMED
      index.tsx
      kv_store.tsx
      ...other files...
    /.env.example
```

Then retry deployment - **should work!** 🎉

---

## 🔍 Verify Success

After deployment works, test:
```
https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server/make-server-668731fc/health
```

Should return:
```json
{"status":"ok","version":"2.1-payment-flow-UPDATED"}
```

---

**TL;DR:** Rename `/supabase/functions/server/` to `/supabase/functions/make-server/` then retry deployment. That's it! ✅
