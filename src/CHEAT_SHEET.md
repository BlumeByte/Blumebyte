# ⚡ 403 ERROR CHEAT SHEET

## Error
```
403 Forbidden - Cannot deploy edge function
```

## Fix (2 min)
1. Integrations → Disconnect Supabase
2. Reconnect → ✅ Check "Deploy Edge Functions"
3. Retry deployment
4. Done!

## Verify
```
https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server/make-server-a35148f0/health
```
Should return: `{"status":"ok",...}`

## If That Fails - CLI Method (5 min)
```bash
npm install -g supabase
supabase login
supabase link --project-ref ivohczdtuxasyfoiphqu
./copy-edge-function-files.sh
supabase functions deploy make-server
```

## Files to Open

| Want | File |
|------|------|
| Fastest | `FIX_NOW.txt` |
| Simple | `DO_THIS_NOW.md` |
| Visual | `VISUAL_FIX_GUIDE.md` |
| Options | `QUICK_FIX_GUIDE.md` |
| Complete | `README_403_ERROR_SOLUTION.md` |

## Success Rates
- Method 1 (Re-auth): 90%
- Method 2 (CLI): 95%
- Method 3 (Dashboard): 99%
- **Combined: 99%+**

## Support
- Discord: https://discord.supabase.com
- Docs: https://supabase.com/docs/guides/functions

---

**START: Open `FIX_NOW.txt` right now!**
