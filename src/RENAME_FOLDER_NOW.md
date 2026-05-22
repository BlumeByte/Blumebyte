# 🎯 SIMPLE FIX - Rename One Folder!

## The 403 Error is a Simple Directory Name Problem

**Figma Make expects:** `make-server`  
**Your folder is named:** `server`  
**Solution:** Rename it!

---

## 📁 Visual Guide

### Current (Wrong):
```
/supabase/
  /functions/
    /server/  ❌ WRONG NAME
      index.tsx
      kv_store.tsx
      ... (other files)
```

### After Fix (Correct):
```
/supabase/
  /functions/
    /make-server/  ✅ CORRECT NAME
      index.tsx
      kv_store.tsx
      ... (same files, just folder renamed)
```

---

## 🖱️ How to Rename

### **Windows:**
1. Open File Explorer
2. Navigate to your project folder
3. Go to `supabase` → `functions`
4. Right-click the `server` folder
5. Click "Rename"
6. Type: `make-server`
7. Press Enter
8. Done! ✅

### **Mac:**
1. Open Finder
2. Navigate to your project folder
3. Go to `supabase` → `functions`
4. Right-click the `server` folder
5. Click "Rename"
6. Type: `make-server`
7. Press Enter
8. Done! ✅

### **VS Code:**
1. Open VS Code
2. In the file explorer sidebar
3. Navigate to `supabase/functions`
4. Right-click the `server` folder
5. Click "Rename"
6. Type: `make-server`
7. Press Enter
8. Done! ✅

### **Terminal/Command Line:**

**Windows (Command Prompt or PowerShell):**
```bash
cd supabase\functions
rename server make-server
```

**Mac/Linux (Terminal):**
```bash
cd supabase/functions
mv server make-server
```

---

## ✅ After Renaming

1. **Check** that `/supabase/functions/make-server/` now exists
2. **Check** that all files are inside (index.tsx, kv_store.tsx, etc.)
3. **Retry deployment** in Figma Make
4. **Should work!** 🎉

---

## 🔍 Why This Works

The error message shows:
```
/api/integrations/supabase/.../edge_functions/make-server/deploy
                                              ^^^^^^^^^^^
```

Figma Make is looking for a function called **`make-server`** based on the deployment configuration, but it can't find it because your folder is named `server`.

Once you rename the folder, Figma Make will find it and deployment will succeed!

---

## ⚡ Configuration Already Updated

I've already updated your `/figma.json` to:
```json
{
  "supabase": {
    "enabled": true,
    "edgeFunctions": {
      "deploy": true,
      "enabled": true,
      "functionName": "make-server"  ✅
    }
  }
}
```

**You just need to rename the folder to match!**

---

## 🚀 Quick Checklist

- [ ] Navigate to `/supabase/functions/`
- [ ] Find the `server` folder
- [ ] Rename it to `make-server`
- [ ] Verify the rename worked
- [ ] Retry deployment in Figma Make
- [ ] Deployment should succeed! ✅

---

## 💡 Common Questions

**Q: Will this break my code?**  
A: No! The folder name is just for deployment. Your code uses `/make-server-a35148f0` which is the PREFIX, not the folder name.

**Q: Do I need to change any imports?**  
A: No! All imports use relative paths (`./kv_store.tsx`) which work regardless of the parent folder name.

**Q: Will this affect my frontend?**  
A: No! Your frontend calls `/make-server-a35148f0` which is the runtime path, not the folder name.

**Q: What if I don't have access to rename the folder?**  
A: You can copy all files from `/supabase/functions/server/` to a new folder `/supabase/functions/make-server/`, then delete the old `server` folder.

---

## ✅ Success Indicator

After deployment succeeds, this URL should work:
```
https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server/make-server-a35148f0/health
```

Returns:
```json
{
  "status": "ok",
  "version": "2.1-payment-flow-UPDATED"
}
```

---

## 🎉 Summary

**Problem:** Folder name mismatch  
**Solution:** Rename `server` to `make-server`  
**Time:** 30 seconds  
**Difficulty:** Very Easy ✅  
**Confidence:** This will fix the 403 error! 🚀

---

**Now go rename that folder and retry deployment!** 🎯
