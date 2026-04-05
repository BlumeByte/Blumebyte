# Blumebyte Edge Functions
# These are deployed separately via Supabase CLI
# NOT deployed through Figma Make

This directory contains the `server` edge function which is already deployed to:
https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/server/

## To Update the Edge Function:

```bash
supabase functions deploy server --project-ref ivohczdtuxasyfoiphqu --no-verify-jwt
```

## Contents:
- server/ - Main edge function handling all API routes
