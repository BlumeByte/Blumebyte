# Supabase Edge Function Deployment Troubleshooting

## 403 Forbidden Error - Solutions

If you're still experiencing 403 errors after the code fixes, try these solutions:

### 1. Check Supabase Project Permissions
- Go to https://supabase.com/dashboard
- Select your project: `ivohczdtuxasyfoiphqu`
- Navigate to Settings → API
- Verify you're logged in with an account that has deployment permissions

### 2. Verify Environment Variables
The edge functions need these environment variables set:
- `SUPABASE_URL`: https://ivohczdtuxasyfoiphqu.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY`: (Your service role key)

To set them:
1. Go to Supabase Dashboard
2. Navigate to Edge Functions → Settings
3. Add/verify environment variables

### 3. Check Supabase CLI Authentication
If deploying via CLI:
```bash
# Re-authenticate
supabase login

# Link your project
supabase link --project-ref ivohczdtuxasyfoiphqu

# Deploy functions
supabase functions deploy server
supabase functions deploy make-server
```

### 4. Verify Project Access Token
If using access tokens:
- Generate a new access token from Supabase Dashboard
- Navigate to Account → Access Tokens
- Create a new token with deployment permissions
- Use it in your deployment process

### 5. Check Organization/Team Permissions
If the project is under an organization:
- Verify you're a member with deployment permissions
- Contact the organization owner if needed
- Check if there are any project-level restrictions

### 6. Browser Extension Conflicts
If deploying through the browser:
- Disable ad blockers or privacy extensions temporarily
- Try in an incognito/private window
- Clear browser cache and cookies

### 7. Supabase Platform Status
Check if there are any ongoing issues:
- Visit https://status.supabase.com/
- Look for any Edge Functions deployment issues

### 8. File Size Limits
Verify your edge function isn't too large:
- Each function should be under 50MB
- Check if node_modules are being bundled accidentally

### 9. Manual Deployment via Dashboard
As an alternative:
1. Go to Supabase Dashboard → Edge Functions
2. Click "Deploy new function"
3. Upload your function code manually
4. Set environment variables

### 10. Contact Supabase Support
If all else fails:
- Visit https://supabase.com/support
- Provide your project ID: `ivohczdtuxasyfoiphqu`
- Mention the 403 error during edge function deployment

## Code Fixes Already Applied ✅

The following code issues have been fixed:
- ✅ Changed `export default` to `Deno.serve()` in make-server
- ✅ Created missing dependency files (license-routes, production-cleanup, migration-company-keys)
- ✅ Added tax-configurations CRUD endpoint
- ✅ Verified all imports and dependencies exist

## Deployment Command

After authentication is resolved, deploy with:
```bash
supabase functions deploy make-server
supabase functions deploy server
```

Or through Figma Make's deployment interface.
