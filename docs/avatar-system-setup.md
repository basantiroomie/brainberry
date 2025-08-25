# 3D Avatar System Setup Guide

This guide covers the setup and configuration of the 3D Avatar System for BrainBerry, including dependencies, environment variables, and initial configuration.

## Overview

The 3D Avatar System integrates Ready Player Me's avatar platform to provide:
- Photo-to-avatar conversion for educators
- Real-time 3D avatar customization for children
- Interactive 3D chatbot with lip-sync animations
- High-quality text-to-speech integration

## Dependencies Installed

### Core 3D and Avatar Libraries
- `@readyplayerme/react-avatar-creator` - Ready Player Me React components
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helpers for React Three Fiber
- `three` - 3D graphics library
- `@types/three` - TypeScript definitions for Three.js

### Package Versions
```json
{
  "@readyplayerme/react-avatar-creator": "^0.5.0",
  "@react-three/fiber": "^9.3.0",
  "@react-three/drei": "^10.7.4",
  "three": "^0.179.1",
  "@types/three": "^0.179.0"
}
```

## Environment Configuration

### Required Environment Variables

Add these to your `.env.local` file:

```bash
# Ready Player Me Configuration (FREE!)
READYPLAYER_ME_APP_ID=your-readyplayer-me-app-id-here
READYPLAYER_ME_API_KEY=your-readyplayer-me-api-key-here

# Supabase Configuration (already configured)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Optional Environment Variables

```bash
# ElevenLabs TTS Configuration (FREE TIER: 10k chars/month)
ELEVENLABS_API_KEY=your-elevenlabs-api-key-optional
```

## Getting API Keys

### Ready Player Me (Free)

1. Visit [Ready Player Me Developer Portal](https://docs.readyplayer.me/)
2. Create a free developer account
3. Create a new application
4. Copy your App ID and API Key
5. Add them to your `.env.local` file

**Free Tier Includes:**
- Unlimited avatar creation
- Full customization features
- Commercial usage allowed

### ElevenLabs (Optional - Free Tier)

1. Visit [ElevenLabs](https://elevenlabs.io/)
2. Create a free account
3. Navigate to your profile settings
4. Copy your API key
5. Add it to your `.env.local` file

**Free Tier Includes:**
- 10,000 characters per month
- High-quality neural voices
- Commercial usage allowed

## File Structure

The avatar system adds the following files:

```
brainberry/
├── types/
│   └── avatar.ts                    # Avatar-related TypeScript types
├── lib/
│   ├── tts-config.ts               # TTS configuration and voice selection
│   └── avatar-env-config.ts        # Environment validation utilities
├── docs/
│   ├── avatar-system-setup.md      # This setup guide
│   └── tts-voices-guide.md         # Comprehensive TTS voice documentation
└── .env.example                    # Updated with avatar environment variables
```

## TypeScript Configuration

The system includes comprehensive TypeScript definitions for:

- **Avatar Components**: Props and interfaces for 3D avatar components
- **Ready Player Me API**: Request/response types for avatar operations
- **TTS System**: Configuration types for text-to-speech
- **Database Extensions**: Avatar fields for child profiles
- **Performance Monitoring**: Metrics and error tracking types

## Text-to-Speech Configuration

### High-Quality Free Voices

The system prioritizes high-quality, child-appropriate voices:

**Tier 1 (Neural/Enhanced)**:
- Google US English (Chrome)
- Microsoft Zira (Windows)
- Alex, Samantha (macOS)

**Tier 2 (High Quality)**:
- Google UK English Female
- Microsoft David, Hazel
- Victoria, Karen (macOS)

**Fallback**:
- System default voices
- Basic synthesis engines

### Voice Selection Strategy

1. **Quality First**: Prioritize neural and enhanced voices
2. **Child-Appropriate**: Select warm, friendly tones
3. **Reliability**: Prefer local voices over network-dependent ones
4. **Performance**: Optimize for low latency and memory usage

## Validation and Testing

### Environment Validation

Use the built-in validation utility:

```typescript
import { validateAvatarEnvConfig, logAvatarEnvStatus } from '@/lib/avatar-env-config'

// Check configuration status
logAvatarEnvStatus()

// Validate in production
const validation = validateAvatarEnvConfig()
if (!validation.isValid) {
  console.error('Missing environment variables:', validation.missingVars)
}
```

### Voice Testing

Test TTS functionality:

```typescript
import { selectBestVoice, isVoiceWorking } from '@/lib/tts-config'

// Get best available voice
const voice = selectBestVoice()

// Test voice functionality
const isWorking = await isVoiceWorking(voice)
console.log('Voice working:', isWorking)
```

## Security Considerations

### API Key Security
- Store all API keys in environment variables
- Never commit API keys to version control
- Use different keys for development and production
- Rotate keys regularly

### File Upload Security
- Validate file types (JPEG, PNG only)
- Limit file sizes (10MB maximum)
- Scan uploads for malicious content
- Store in secure, private buckets

### Data Privacy
- Encrypt avatar configuration data
- Implement proper access controls
- Log all avatar operations for audit
- Comply with COPPA regulations

## Performance Optimization

### 3D Rendering
- Use Level of Detail (LOD) for distant avatars
- Implement texture compression
- Cache avatar models in browser storage
- Dispose of unused 3D resources

### Network Optimization
- Serve assets from CDN
- Use progressive loading
- Implement retry mechanisms
- Compress 3D models with GLTF-Draco

### Memory Management
- Monitor WebGL memory usage
- Implement avatar caching strategies
- Clean up unused resources
- Set performance budgets

## Troubleshooting

### Common Issues

**Avatar not loading**:
- Check Ready Player Me API key
- Verify network connectivity
- Check browser WebGL support
- Review console for errors

**TTS not working**:
- Verify browser speech synthesis support
- Check voice availability
- Test with different voices
- Review audio permissions

**Performance issues**:
- Monitor memory usage
- Check frame rates
- Optimize 3D model complexity
- Reduce concurrent operations

### Debug Tools

Enable development logging:

```typescript
// In development environment
if (process.env.NODE_ENV === 'development') {
  logAvatarEnvStatus()
}
```

## Next Steps

After completing this setup:

1. **Database Migration**: Extend ChildProfile table with avatar fields
2. **Component Development**: Create AvatarViewer, AvatarCustomizer components
3. **API Implementation**: Build avatar creation and update endpoints
4. **UI Integration**: Add avatar features to educator and child interfaces
5. **Testing**: Implement comprehensive test suite

## Support and Resources

### Documentation
- [Ready Player Me Docs](https://docs.readyplayer.me/)
- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Three.js Documentation](https://threejs.org/docs/)
- [ElevenLabs API Docs](https://docs.elevenlabs.io/)

### Community
- [Ready Player Me Discord](https://discord.gg/readyplayerme)
- [React Three Fiber Discord](https://discord.gg/poimandres)
- [Three.js Forum](https://discourse.threejs.org/)

### Monitoring
- Monitor API usage limits
- Track performance metrics
- Log error rates and types
- Review user engagement analytics