# 🔧 FIXING 403 ERROR - Directory Name Mismatch

## 🎯 Root Cause

The error shows:
```
/api/integrations/supabase/.../edge_functions/make-server/deploy
```

Figma Make is trying to deploy to a function called **`make-server`**  
But your actual directory is named **`server`**

**This is why you're getting 403 - Directory name mismatch!**

---

## ✅ Solution

We need to rename the function directory from `server` to `make-server`.

### Manual Steps (EASIEST):

1. **In your file system/IDE:**
   - Navigate to `/supabase/functions/`
   - Rename the folder `server` → `make-server`

2. **Update figma.json:**
   ```json
   {
     "supabase": {
       "edgeFunctions": {
         "functionName": "make-server"  ← Change from "server"
       }
     }
   }
   ```

3. **Retry deployment** - Should work!

---

## 📋 Files to Copy

If renaming manually, these files need to be in `/supabase/functions/make-server/`:

- `index.tsx` (main function - 2500+ lines)
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

---

## 🚀 Quick Fix

**Easiest approach:**

1. Use your file explorer/IDE
2. Rename `/supabase/functions/server/` to `/supabase/functions/make-server/`
3. Update `/figma.json` to use `"functionName": "make-server"`
4. Retry deployment

---

## ⚠️ Why This Happened

The function name in Figma Make's deployment path is derived from:
- The function directory name in `/supabase/functions/`
- NOT from the PREFIX in your code (`/make-server-668731fc`)

The PREFIX is for routing AFTER deployment, but the directory name determines the deployment target.

---

## ✅ After Renaming

Update `/figma.json`:
```json
{
  "version": "1.0",
  "integrations": {
    "supabase": {
      "enabled": true,
      "projectRef": "ivohczdtuxasyfoiphqu",
      "edgeFunctions": {
        "deploy": true,
        "enabled": true,
        "functionName": "make-server"  ← UPDATE THIS
      }
    }
  },
  "deployment": {
    "skipSupabase": false
  }
}
```

Then retry deployment - should work! ✅
