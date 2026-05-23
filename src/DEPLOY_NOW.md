# 🚀 DEPLOY YOUR FUNCTION NOW

The 403 error means **Figma Make can't deploy to Supabase**. Use this **100% reliable manual deployment** instead!

---

## ✅ FASTEST SOLUTION: Manual Deployment

### **Windows Users:**

1. **Install Supabase CLI** (one time setup):
   ```bash
   scoop install supabase
   ```
   Or download: https://github.com/supabase/cli/releases

2. **Run the deployment script:**
   - Double-click `deploy-to-supabase.bat`
   - Follow the prompts
   - Done! ✅

### **Mac/Linux Users:**

1. **Install Supabase CLI** (one time setup):
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Make script executable:**
   ```bash
   chmod +x deploy-to-supabase.sh
   ```

3. **Run the deployment script:**
   ```bash
   ./deploy-to-supabase.sh
   ```
   Done! ✅

---

## 📋 Manual Deployment (Step-by-Step)

If you prefer to run commands manually:

### **1. Install Supabase CLI**

**Windows (using Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Mac:**
```bash
brew install supabase/tap/supabase
```

**Linux:**
```bash
brew install supabase/tap/supabase
```

**Or download binary:** https://github.com/supabase/cli/releases

### **2. Login to Supabase**

```bash
supabase login
```

This opens your browser - sign in and authorize the CLI.

### **3. Link Your Project**

```bash
supabase link --project-ref ivohczdtuxasyfoiphqu
```

Enter your database password if prompted.

### **4. Deploy the Function**

```bash
supabase functions deploy make-server
```

Watch the deployment progress - should take 30-60 seconds.

### **5. Verify Deployment**

```bash
curl https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server/make-server-a35148f0/health
```

Should return: `{"status":"ok","version":"2.1-payment-flow-UPDATED"}`

---

## 🎯 Expected Output

```
Deploying function make-server...
Uploading make-server...
✓ Function make-server uploaded successfully
Deploying function make-server...
✓ Function make-server deployed successfully

Function URL: https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server
```

---

## ⚡ Quick Commands Reference

```bash
# One-time setup
supabase login
supabase link --project-ref ivohczdtuxasyfoiphqu

# Deploy anytime (after code changes)
supabase functions deploy make-server

# Test
curl https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server/make-server-a35148f0/health
```

---

## 🔧 Alternative: Fix Figma Make Integration

If you want Figma Make to deploy automatically:

### **Step 1: Disconnect Supabase**
1. Go to Figma Make settings/integrations
2. Find Supabase
3. Click Disconnect

### **Step 2: Reconnect with Full Permissions**
1. Click "Connect to Supabase"
2. Sign in to Supabase
3. **CRITICAL:** Grant ALL permissions, especially:
   - ✅ Deploy Edge Functions
   - ✅ Read/Write Database
   - ✅ Manage Storage
4. Select project: `ivohczdtuxasyfoiphqu`
5. Authorize

### **Step 3: Retry Deployment**
Should work now! ✅

---

## 💡 Why Manual Deployment Works

**Figma Make integration:**
- Requires OAuth permissions
- Can have token expiration issues
- May not have full deployment rights
- Subject to integration bugs

**Supabase CLI:**
- Direct authentication
- Full project access
- No middleware/proxy
- 100% reliable ✅

---

## 🎉 Success Indicators

After successful deployment:

✅ CLI shows "deployed successfully"  
✅ Health endpoint returns `{"status":"ok"}`  
✅ Your app can call the function  
✅ No more 403 errors  

---

## 📦 Deployment Scripts Created

I've created these scripts for you:

- **`/deploy-to-supabase.bat`** - Windows batch script
- **`/deploy-to-supabase.sh`** - Mac/Linux shell script

Both scripts handle:
- Checking if Supabase CLI is installed
- Logging in (if needed)
- Linking the project
- Deploying the function
- Testing the deployment

**Just run the script and you're done!** 🚀

---

## 🔄 Future Deployments

After initial setup, deploying is simple:

```bash
supabase functions deploy make-server
```

That's it! Takes ~30 seconds.

---

## ⚠️ Troubleshooting

### **"Command not found: supabase"**
→ Install Supabase CLI (see install steps above)

### **"Failed to link project"**
→ Make sure you have Owner/Admin access to the Supabase project

### **"Failed to deploy"**
→ Check error message for details
→ Ensure `/supabase/functions/make-server/` exists
→ Verify `deno.json` is in the function directory

### **"Authentication failed"**
→ Run `supabase login` again
→ Clear browser cache and retry

---

## 🎯 Recommended Workflow

1. **Develop** in Figma Make (for UI)
2. **Deploy** using Supabase CLI (for reliability)
3. **Test** using health endpoint
4. **Iterate** as needed

---

## ✅ Action Plan

**Choose ONE:**

**OPTION A: Use Deployment Script (Easiest)**
- [ ] Install Supabase CLI
- [ ] Run `deploy-to-supabase.bat` (Windows) or `deploy-to-supabase.sh` (Mac)
- [ ] Done! ✅

**OPTION B: Manual Commands**
- [ ] Install Supabase CLI
- [ ] `supabase login`
- [ ] `supabase link --project-ref ivohczdtuxasyfoiphqu`
- [ ] `supabase functions deploy make-server`
- [ ] Done! ✅

**OPTION C: Fix Figma Make**
- [ ] Disconnect Supabase integration
- [ ] Reconnect with full permissions
- [ ] Retry deployment
- [ ] If fails → Use Option A or B

---

## 🚀 Deploy Now!

**The deployment scripts are ready - just run them!**

Windows: Double-click `deploy-to-supabase.bat`  
Mac/Linux: Run `./deploy-to-supabase.sh`

**Your function will be deployed in ~1 minute!** ✅

---

**Stop fighting with Figma Make - deploy directly with Supabase CLI!** 🎯
