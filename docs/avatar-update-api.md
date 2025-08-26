# Avatar Update API Documentation

## Overview

The Avatar Update API endpoint allows children to save customizations made to their 3D avatars. This endpoint handles the complete workflow of updating avatar assets, saving changes to Ready Player Me, and updating the child's profile with new avatar URLs.

## Endpoint

```
PUT /api/avatars/update
```

## Authentication

The API uses child-specific authentication via access codes. The access code can be provided in two ways:

1. **Header** (recommended): `x-child-access-code: ABC123`
2. **Request body**: `{ "accessCode": "ABC123", ... }`

## Request Format

```typescript
{
  "childId": "uuid-string",
  "avatarConfig": {
    "id": "ready-player-me-avatar-id",
    "assets": {
      "hair": "hair_asset_id",
      "outfit": "outfit_asset_id",
      "glasses": "glasses_asset_id"
      // ... other asset categories
    },
    "morphTargets": {
      "eyeSize": 0.8,
      "noseSize": 1.2
      // ... other morph targets (optional)
    },
    "metadata": {
      "created_from_photo": true,
      "last_customized": "2025-08-26T17:31:40.791Z",
      "customization_count": 1
    }
  }
}
```

## Response Format

### Success Response
```typescript
{
  "success": true,
  "avatarUrl": "https://models.readyplayer.me/avatar-id.glb",
  "headshotUrl": "https://models.readyplayer.me/avatar-id.png"
}
```

### Error Response
```typescript
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Status Codes

- **200 OK**: Avatar updated successfully
- **400 Bad Request**: Invalid request data or validation errors
- **401 Unauthorized**: Missing child access code
- **403 Forbidden**: Invalid access code or insufficient permissions
- **500 Internal Server Error**: Server-side error (RPM API failure, database error, etc.)

## Validation Rules

### Child ID
- Must be a valid UUID string
- Must correspond to an existing child profile
- Access code must match the child's stored access code

### Avatar Configuration
- `id`: Required string (Ready Player Me avatar ID)
- `assets`: Required object with asset category -> asset ID mappings
- `morphTargets`: Optional object with morph target name -> value mappings
- `metadata`: Required object with:
  - `created_from_photo`: Boolean indicating if avatar was created from photo
  - `last_customized`: ISO timestamp string
  - `customization_count`: Non-negative integer

### Permissions
- Child must have `can_customize: true` in their avatar permissions
- Child must have an existing avatar (cannot customize non-existent avatar)

## Error Scenarios

### Common Errors

1. **Missing Access Code**
   ```json
   {
     "success": false,
     "error": "Child authentication required"
   }
   ```

2. **Invalid Access Code**
   ```json
   {
     "success": false,
     "error": "Invalid child authentication"
   }
   ```

3. **Customization Disabled**
   ```json
   {
     "success": false,
     "error": "Avatar customization is not enabled for this child"
   }
   ```

4. **No Existing Avatar**
   ```json
   {
     "success": false,
     "error": "No avatar exists for this child. Please ask your educator to create one first."
   }
   ```

5. **RPM API Failure**
   ```json
   {
     "success": false,
     "error": "Failed to update avatar customization"
   }
   ```

## Usage Example

```javascript
// Example usage from a React component
const updateAvatar = async (childId, avatarConfig, accessCode) => {
  try {
    const response = await fetch('/api/avatars/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-child-access-code': accessCode
      },
      body: JSON.stringify({
        childId,
        avatarConfig
      })
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('Avatar updated successfully!')
      console.log('New avatar URL:', result.avatarUrl)
      console.log('New headshot URL:', result.headshotUrl)
      return result
    } else {
      console.error('Avatar update failed:', result.error)
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Network error:', error)
    throw error
  }
}
```

## Integration with Ready Player Me

The API handles the complete Ready Player Me workflow:

1. **Authentication**: Creates anonymous user session with RPM
2. **Update**: Applies asset changes to the avatar using PATCH request
3. **Save**: Permanently saves the avatar using PUT request
4. **URL Generation**: Generates final .glb and .png URLs
5. **Database Update**: Updates child profile with new URLs

## Security Considerations

- All RPM API calls use server-side authentication
- Child access codes are validated against the database
- Avatar permissions are checked before allowing updates
- All requests are logged for audit purposes
- Sensitive data (API keys) are never exposed to the client

## Performance Notes

- Avatar updates typically take 2-5 seconds to complete
- The API includes comprehensive error handling and retry logic
- Generated headshot images are automatically cached by RPM's CDN
- Database updates are atomic to prevent data inconsistency