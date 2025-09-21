# Supabase "Failed to fetch" Troubleshooting Guide

## Error: "Failed to fetch" when trying to sign in

This error typically indicates a network connectivity issue with Supabase. Here are the steps to diagnose and fix:

### 1. Check Environment Variables
Ensure your `.env.local` file has the correct Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Verify Supabase Project Status
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Check if your project is active and not paused
3. Verify the project URL matches your `.env.local`

### 3. Check Network Connectivity
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to sign in and check for failed requests
4. Look for CORS errors or 404s

### 4. Test Direct API Access
Try accessing your Supabase REST API directly:
```bash
curl -X GET "https://your-project.supabase.co/rest/v1/" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

### 5. Browser-specific Issues
- Try in incognito/private mode
- Clear browser cache and cookies
- Disable browser extensions temporarily
- Try a different browser

### 6. Firewall/VPN Issues
- Check if corporate firewall is blocking Supabase
- Try without VPN if applicable
- Check if your ISP is blocking the domain

### 7. Supabase Configuration Issues
1. Check Auth settings in Supabase Dashboard
2. Verify Site URL is set correctly
3. Check if Auth is enabled for your project

### 8. Development vs Production
- Restart your dev server after changing `.env.local`
- Check if the issue exists in both dev and production

### Common Fixes:
1. **Restart dev server** after changing environment variables
2. **Check project billing** - paused projects can't be accessed
3. **Verify domain whitelist** in Supabase Auth settings
4. **Update Supabase client** if using an old version

### Test Connection Button
In development mode, you'll see a "Test Supabase Connection" button when login fails. Use this to diagnose connectivity issues.