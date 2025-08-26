# Avatar Customization System Guide

## Overview

The Avatar Customization System allows children to personalize their 3D avatars by selecting different hair styles, outfits, and accessories. This system integrates with Ready Player Me's avatar platform to provide real-time 3D preview and customization capabilities.

## Features Implemented

### 1. MyAvatarTab Component
- **Location**: `app/child/components/MyAvatarTab.tsx`
- **Purpose**: Main interface for avatar customization
- **Features**:
  - Real-time 3D avatar preview using AvatarViewer
  - Asset selection grids for different categories (hair, outfit, glasses)
  - Save/Cancel functionality
  - Loading states and error handling
  - Back navigation to main MyStuffTab

### 2. Avatar Customization Hook
- **Location**: `hooks/use-avatar-customization.ts`
- **Purpose**: Manages avatar asset loading and selection state
- **Features**:
  - Asset category management
  - Selected asset tracking
  - Mock data for development/testing
  - Error handling and loading states

### 3. Avatar Update API
- **Location**: `app/api/avatars/update/route.ts`
- **Purpose**: Server-side endpoint for saving avatar customizations
- **Features**:
  - Validates request data using Zod schemas
  - Integrates with Ready Player Me API
  - Updates child profile in database
  - Generates 2D headshot images
  - Proper authentication and authorization

### 4. Integration with MyStuffTab
- **Location**: `app/child/components/MyStuffTab.tsx`
- **Purpose**: Navigation between overview and avatar customization
- **Features**:
  - Section-based navigation
  - Avatar Creator card with customization button
  - Seamless transition to MyAvatarTab

## How to Use

### For Children
1. Navigate to the child interface
2. Click on the "MY STUFF" tab
3. Find the "Avatar Creator" card
4. Click the "CUSTOMIZE" button
5. Select different hair styles, outfits, and accessories
6. See real-time preview of changes in the 3D viewer
7. Click "SAVE CHANGES" to keep your customizations
8. Click "CANCEL" to revert to the original avatar
9. Use the "BACK" button to return to the main MY STUFF page

### For Educators
- Avatars must be created first using the photo-to-avatar system
- Avatar permissions can be managed through the educator interface
- Customization activity is tracked in analytics

## Technical Implementation

### Environment Variables Required
```bash
# Ready Player Me Configuration
RPM_API_KEY="your-readyplayer-me-api-key"
RPM_APP_ID="your-readyplayer-me-app-id"
RPM_SUBDOMAIN="your-subdomain.readyplayer.me"
NEXT_PUBLIC_RPM_SUBDOMAIN="your-subdomain"
```

### Database Schema
The system extends the existing `ChildProfile` table with:
- `avatar_url`: URL to the 3D avatar GLB file
- `avatar_headshot_url`: URL to the 2D profile picture
- `avatar_permissions`: JSON object with customization permissions

### API Endpoints
- `PUT /api/avatars/update`: Save avatar customizations

### Components Architecture
```
MyStuffTab
├── MyAvatarTab (when activeSection === 'avatar')
│   ├── AvatarViewer (3D preview)
│   ├── useAvatarCustomization (asset management)
│   └── Asset selection grids
└── Overview cards (default view)
```

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

### Requirement 2.1 ✅
- Child can access avatar customization interface
- Current 3D avatar is displayed in viewer

### Requirement 2.2 ✅
- Customization categories are displayed (hair, clothing, accessories)
- Available options are shown for each category

### Requirement 2.3 ✅
- Real-time avatar updates when selecting customization options
- Changes are immediately visible in the 3D viewer

### Requirement 2.4 ✅
- Save functionality updates avatar URL in database
- API endpoint handles avatar configuration updates

### Requirement 2.5 ✅
- Message displayed when no avatar exists
- Proper fallback handling for missing avatars

## Testing

Run the test script to verify the implementation:
```bash
node test-avatar-customization.js
```

## Future Enhancements

1. **Real-time Preview**: Currently uses mock data - integrate with actual Ready Player Me asset API
2. **More Asset Categories**: Add support for shoes, accessories, facial features
3. **Undo/Redo**: Implement history for customization changes
4. **Preset Combinations**: Allow saving and loading of favorite combinations
5. **Social Features**: Share avatar customizations with friends
6. **Seasonal Content**: Add holiday-themed assets and decorations

## Troubleshooting

### Common Issues

1. **Avatar not loading**: Check that avatar_url is properly set in child profile
2. **Customization not saving**: Verify API endpoint authentication and database permissions
3. **Assets not displaying**: Check Ready Player Me API key configuration
4. **3D viewer errors**: Ensure WebGL is supported in the browser

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify environment variables are properly set
3. Test API endpoints using the test script
4. Check database for proper avatar URL storage
5. Verify Ready Player Me API key permissions

## Support

For technical support or questions about the avatar customization system, refer to:
- Ready Player Me documentation: https://docs.readyplayer.me/
- BrainBerry development team
- System logs and error tracking