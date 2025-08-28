# Voice Chat Debugging Guide

## Quick Tests to Diagnose Voice Chat Issues

### 1. **Check Browser Console**
Open browser developer tools (F12) and look for:
- **Red errors** in console
- **Network tab** for failed API calls
- **Security warnings** about microphone access

### 2. **Common Issues & Solutions**

#### **Microphone Permission Issues**
- Browser shows microphone permission dialog
- User must **allow** microphone access
- Check browser settings if permission was denied

#### **MediaRecorder Support**
```javascript
// Test in browser console:
console.log('MediaRecorder supported:', !!window.MediaRecorder)
console.log('getUserMedia supported:', !!navigator.mediaDevices?.getUserMedia)
```

#### **API Endpoint Issues**
- Check if `/api/chat/voice-live-continuous` returns 200 status
- Verify GEMINI_API_KEY is set in environment variables
- Look for CORS or network errors

### 3. **Expected Console Output**
When voice chat works correctly, you should see:
```
🎤 Starting voice conversation...
🎤 Requesting microphone access...
🎤 Microphone access granted
🎤 Audio analysis setup complete
🎤 Using mime type: audio/webm
🎤 Starting continuous recording...
🎤 Voice conversation started successfully
🎤 Starting new audio chunk recording
🎤 Audio data available, size: [number]
🎤 Stopping audio chunk recording
🎤 MediaRecorder stopped, processing chunks: 1
🎤 Processing audio chunk, size: [number] bytes
🎤 Sending audio to API...
🎤 API Response status: 200
🎤 API Response data: {...}
🤖 Avatar response: [response text]
```

### 4. **Debug Steps**

1. **Test Microphone Access**
   - Click "Start Voice Chat"
   - Look for browser permission prompt
   - Grant microphone access

2. **Check Recording**
   - Speak into microphone
   - Watch for "listening" state changes
   - Check console for audio data messages

3. **Test API Connection**
   - Open Network tab in dev tools
   - Look for POST requests to `/api/chat/voice-live-continuous`
   - Check response status and data

4. **Verify Environment**
   - Ensure GEMINI_API_KEY is set
   - Check server logs for API errors
   - Verify Gemini Live models are accessible

### 5. **Common Error Messages**

- **"Your browser does not support audio recording"**
  → Use Chrome, Firefox, or Safari (latest versions)

- **"Failed to access microphone"**
  → Check browser permissions, ensure HTTPS

- **"Failed to process voice input"**
  → Check API endpoint and Gemini API key

- **"Recording error occurred"**
  → Browser MediaRecorder issue, try different browser

### 6. **Fallback Testing**
If voice chat fails, test text chat to verify:
- Basic chat functionality works
- API endpoints are responding
- Avatar animations work
- TTS system functions

This helps isolate if the issue is voice-specific or general chat problems.
