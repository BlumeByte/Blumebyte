# 🚨 FIX 403 DEPLOYMENT ERROR - QUICK GUIDE

## The Error
```
Error while deploying: XHR failed with status 403
```

## The Fix (Choose One)

### ⚡ FASTEST: Re-authenticate
1. Figma Make → Supabase Integration
2. Disconnect → Reconnect
3. Grant ALL permissions
4. Retry deployment

### 🔧 MOST RELIABLE: Manual Deploy

**Windows:**
```bash
# Double-click this file:
deploy-phase-11.bat
```

**Mac/Linux:**
```bash
chmod +x deploy-phase-11.sh
./deploy-phase-11.sh
```

**Need CLI?**
```bash
npm install -g supabase
```

## Verify Success

**Open this URL:**
```
https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/server/make-server-a35148f0/health
```

**Should return:**
```json
{"status":"ok","version":"2.1-payment-flow-UPDATED"}
```

## Test Branding

1. Log in as SuperAdmin
2. Settings → Company Branding
3. Enter company name
4. Save
5. Page reloads
6. Sidebar shows your company name ✅

## Console Debug

**When saving, you'll see:**
```
💾 Saving branding settings: {...}
✅ Branding save response: {...}
🔄 Reloading page...
🎨 Branding data fetched: {...}
```

## Still Broken?

**Check:**
- [ ] Supabase project is Active
- [ ] Billing is current  
- [ ] Edge Functions enabled
- [ ] Browser cache cleared (Ctrl+Shift+R)

**View logs:**
https://supabase.com/dashboard/project/ivohczdtuxasyfoiphqu/functions

## Important

✅ **Code is correct** - This is ONLY a deployment permissions issue  
✅ **Branding backend already works** - Phase 11 just adds debug logs  
✅ **Most changes work without redeploy** - Only backend logs need deployment

## Full Docs

- `/START_HERE_PHASE_11.md` - Complete guide
- `/PHASE_11_DEPLOYMENT_FIX.md` - Detailed troubleshooting  
- `/BRANDING_FIX_GUIDE.md` - Branding system details

---

**TL;DR:** Re-auth Supabase OR run `deploy-phase-11.bat/.sh` ✅
