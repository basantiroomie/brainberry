# Avatar API Troubleshooting Guide

## Common Issues and Solutions

### 1. HTTP Method Error: "Cannot GET /v2/avatars"

**Problem**: Using GET instead of POST method
**Solution**: Always use POST method for avatar creation

```javascript
// ❌ WRONG - This will fail
fetch('https://api.readyplayer.me/v2/avatars', {
  method: 'GET'  // This is wrong!
})

// ✅ CORRECT - This will work
fetch('https://api.readyplayer.me/v2/avatars', {
  method: 'POST',  // Always use POST
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'fullbody',
    data: { /* avatar data */ }
  })
})
```

### 2. API Key Issues: "401 Unauthorized"

**Problem**: Invalid, expired, or incorrectly formatted API key
**Solutions**:

1. **Check API Key Format**:
   - Production keys start with `sk_live_`
   - Test keys start with `sk_test_`
   - Keys should be exactly 44 characters long

2. **Verify in Ready Player Me Studio**:
   - Go to https://studio.readyplayer.me/
   - Navigate to Developer → API Keys
   - Ensure the key is active and not expired
   - Generate a new key if needed

3. **Check Environment File**:
   ```bash
   # In .env.local
   RPM_API_KEY=sk_live_your_actual_key_here
   ```

### 3. Testing Your API Key

Use the provided test script to validate your API key:

```bash
node test-rpm-api-key.js
```

Expected successful output:
```
🔑 Testing Ready Player Me API Key
================================
✅ API Key found: sk_live_... (44 chars)
🌐 Testing API key with Ready Player Me...
📡 Response Status: 201 Created
✅ SUCCESS! Your API key is valid and working.
```

### 4. Request Body Format

**For v2 API** (recommended):
```javascript
{
  type: 'fullbody',
  data: {
    gender: 'masculine', // or 'feminine'
    bodyType: 'fullbody-average'
  }
}
```

**For photo-based avatars**:
```javascript
{
  data: {
    type: 'photo',
    image: 'https://your-image-url.com/photo.jpg'
  }
}
```

### 5. Common Mistakes to Avoid

1. **Don't use GET method** - Avatar creation requires POST
2. **Don't forget Authorization header** - Include `Bearer ${apiKey}`
3. **Don't use expired keys** - Check your dashboard regularly
4. **Don't mix v1/v2 API formats** - Stick to one version
5. **Don't expose API keys** - Keep them in environment variables

### 6. Error Response Codes

- `401 Unauthorized`: Invalid or expired API key
- `400 Bad Request`: Malformed request body
- `404 Not Found`: Wrong endpoint or method
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Ready Player Me service issue

### 7. Quick Fix Checklist

When avatar creation fails:

- [ ] Verify API key in .env.local file
- [ ] Check API key is active in RPM Studio
- [ ] Confirm using POST method (not GET)
- [ ] Validate request body format
- [ ] Test with the provided test script
- [ ] Check network connectivity
- [ ] Review error response for specific details

### 8. Prevention

To prevent these issues:

1. **Always test API keys** before deploying
2. **Use the provided test script** regularly
3. **Set up monitoring** for API failures
4. **Keep API keys secure** and rotate them periodically
5. **Follow this guide** when integrating new features

## Need Help?

If issues persist:
1. Run the debug script: `node debug-rpm-api.js`
2. Check Ready Player Me documentation: https://docs.readyplayer.me/
3. Contact Ready Player Me support with your account details