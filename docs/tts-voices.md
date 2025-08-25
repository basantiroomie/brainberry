# High-Quality Free System Voices Documentation

This document outlines the best free system voices available across different platforms for the avatar TTS system.

## Platform-Specific Voice Recommendations

### Windows (Microsoft Speech Platform)
**Neural Voices (Windows 10/11):**
- `Microsoft Aria Online (Natural) - English (United States)` - High quality, natural sounding
- `Microsoft Jenny Online (Natural) - English (United States)` - Child-friendly, warm tone
- `Microsoft Guy Online (Natural) - English (United States)` - Male voice option
- `Microsoft Zira - English (United States)` - Fallback option

**Legacy Voices (Windows 7/8/10):**
- `Microsoft David Desktop - English (United States)` - Male fallback
- `Microsoft Zira Desktop - English (United States)` - Female fallback

### macOS (Apple Speech Synthesis)
**High Quality Voices:**
- `Samantha` - Natural, child-friendly female voice
- `Alex` - Clear male voice
- `Victoria` - British English female
- `Daniel` - British English male
- `Ava` - Premium quality (if available)

**Enhanced Voices (macOS Monterey+):**
- `Siri Female` - Most natural sounding
- `Siri Male` - Natural male option

### Linux (eSpeak-NG / Festival)
**eSpeak-NG Voices:**
- `en+f3` - Female voice, variant 3
- `en+m3` - Male voice, variant 3
- `en-us+f3` - US English female
- `en-gb+f3` - British English female

**Festival Voices:**
- `cmu_us_slt_arctic_hts` - Female voice
- `cmu_us_bdl_arctic_hts` - Male voice

### Android (Google TTS)
**Google Text-to-Speech:**
- `en-US-language` - Standard US English
- `en-US-Wavenet-A` - High quality neural (if available)
- `en-US-Wavenet-C` - Alternative neural voice

### iOS (AVSpeechSynthesis)
**iOS Voices:**
- `com.apple.ttsbundle.Samantha-compact` - Compact Samantha
- `com.apple.ttsbundle.siri_female_en-US_compact` - Siri female
- `com.apple.voice.compact.en-US.Samantha` - Enhanced Samantha

## Voice Selection Strategy

### Priority Order:
1. **Neural/Enhanced voices** - Best quality, most natural
2. **Standard system voices** - Good quality, widely available
3. **Fallback voices** - Basic quality, maximum compatibility

### Implementation Notes:
- Always test voice availability before use
- Implement graceful fallbacks for unsupported voices
- Consider user preferences and accessibility needs
- Monitor voice quality and user feedback

### Voice Filtering Criteria:
- **Exclude robotic voices** - Filter out obviously synthetic voices
- **Prefer neural voices** - Prioritize AI-enhanced voices when available
- **Prefer local voices** - Use system voices over network-dependent options
- **Child-appropriate** - Select voices suitable for children (warm, clear, not intimidating)

## Browser Compatibility

### Chrome/Chromium:
- Supports system voices + Google voices
- Best neural voice support
- Reliable voice enumeration

### Firefox:
- System voices only
- Limited neural voice support
- Good cross-platform consistency

### Safari:
- Excellent macOS/iOS voice support
- Best Siri voice integration
- Limited on non-Apple platforms

### Edge:
- Excellent Windows voice support
- Good neural voice availability
- Microsoft voice integration

## Testing Recommendations

1. **Voice Enumeration Testing:**
   ```javascript
   const voices = speechSynthesis.getVoices();
   console.log('Available voices:', voices.map(v => ({
     name: v.name,
     lang: v.lang,
     localService: v.localService
   })));
   ```

2. **Quality Assessment:**
   - Test with child-appropriate sample text
   - Verify pronunciation of common educational terms
   - Check emotional tone and naturalness

3. **Performance Testing:**
   - Measure synthesis latency
   - Test with various text lengths
   - Monitor memory usage during playback

## Configuration Examples

### Recommended Voice Preferences:
```javascript
const voicePreferences = {
  windows: [
    'Microsoft Aria Online (Natural)',
    'Microsoft Jenny Online (Natural)',
    'Microsoft Zira'
  ],
  macos: [
    'Samantha',
    'Siri Female',
    'Alex'
  ],
  linux: [
    'en+f3',
    'en-us+f3'
  ],
  android: [
    'en-US-Wavenet-A',
    'en-US-language'
  ],
  ios: [
    'com.apple.ttsbundle.siri_female_en-US_compact',
    'com.apple.ttsbundle.Samantha-compact'
  ]
};
```

This documentation should be updated as new voices become available and based on user feedback and testing results.