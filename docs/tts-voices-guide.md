# TTS Voices Guide for Avatar System

This guide documents the available high-quality free system voices for the avatar chatbot feature.

## Browser Speech Synthesis API (Free)

The avatar system uses the browser's built-in Speech Synthesis API as the primary TTS engine. This provides free, high-quality voices without any API costs.

### Recommended Voices by Platform

#### macOS Voices (Highest Quality)
- **Alex** - Natural male voice, excellent for children
- **Samantha** - Warm female voice, very natural sounding
- **Karen** - Clear female voice, good pronunciation
- **Daniel** - Professional male voice
- **Fiona** - Scottish accent, engaging for children
- **Moira** - Irish accent, storytelling voice

#### Windows Voices
- **Microsoft Zira** - Natural female voice (English US)
- **Microsoft David** - Clear male voice (English US)
- **Microsoft Mark** - Professional male voice (English US)
- **Microsoft Hazel** - British female voice (English UK)

#### Google Chrome Voices
- **Google US English** - High-quality neural voice
- **Google UK English Female** - British accent, natural
- **Google UK English Male** - British male voice
- **Google Deutsch** - German voice (if needed)

#### Firefox Voices
- **Microsoft Zira** - Available on Windows
- **eSpeak NG** - Open source, lower quality but reliable

## Voice Selection Algorithm

The system automatically selects the best available voice using this scoring system:

1. **Google/Microsoft voices**: +10/+8 points (usually highest quality)
2. **Local voices**: +5 points (faster, more reliable)
3. **English voices**: +3 points
4. **Neural/Natural voices**: +6-7 points
5. **Robotic voices**: -5 points (avoided)

## ElevenLabs Integration (Premium Option)

For premium quality, the system supports ElevenLabs API:

- **Free Tier**: 10,000 characters per month
- **Voice**: Adam (natural male voice)
- **Model**: eleven_monolingual_v1 (free model)
- **Quality**: Professional-grade neural TTS

### Setup ElevenLabs (Optional)

1. Sign up at [elevenlabs.io](https://elevenlabs.io/)
2. Get your free API key
3. Add to `.env.local`:
   ```
   ELEVENLABS_API_KEY=your_api_key_here
   ```

## Voice Configuration

### Default Settings
```typescript
{
  rate: 0.9,        // Slightly slower for comprehension
  pitch: 1.1,       // Higher pitch for child appeal
  volume: 0.8,      // Comfortable volume level
}
```

### Child-Friendly Optimizations
- **Slower speech rate** (0.9) for better comprehension
- **Higher pitch** (1.1) for more engaging, child-friendly sound
- **Clear pronunciation** prioritized over speed
- **Emotional variation** through pitch and rate adjustments

## Testing Voice Quality

Use the browser console to test available voices:

```javascript
// List all available voices
speechSynthesis.getVoices().forEach((voice, index) => {
  console.log(`${index}: ${voice.name} (${voice.lang}) - Local: ${voice.localService}`)
})

// Test a specific voice
const utterance = new SpeechSynthesisUtterance("Hello, I'm your avatar friend!")
utterance.voice = speechSynthesis.getVoices()[0] // Use first voice
speechSynthesis.speak(utterance)
```

## Troubleshooting

### Common Issues

1. **No voices available**
   - Wait for `speechSynthesis.onvoiceschanged` event
   - Some browsers load voices asynchronously

2. **Robotic/poor quality voices**
   - System automatically filters out low-quality voices
   - Prefers Google/Microsoft neural voices when available

3. **Voice not speaking**
   - Check browser permissions for audio
   - Ensure user interaction before TTS (browser security requirement)

4. **Inconsistent voice selection**
   - Different browsers/OS combinations have different voices
   - System falls back gracefully to available options

### Browser Compatibility

- **Chrome**: Excellent support, Google neural voices
- **Safari**: Good support, macOS system voices
- **Firefox**: Basic support, limited voice options
- **Edge**: Good support, Microsoft voices

## Performance Considerations

- **Local voices** are preferred for speed and reliability
- **Network voices** may have latency but often higher quality
- **Caching** is handled automatically by the browser
- **Memory usage** is minimal for speech synthesis

## Future Enhancements

1. **Voice cloning** for personalized avatars
2. **Emotion detection** for dynamic voice modulation
3. **Multi-language support** for diverse users
4. **Custom voice training** for therapeutic applications