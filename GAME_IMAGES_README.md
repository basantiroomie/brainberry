# Game Images System

This document explains the image system implemented for different game types in the PlayTab component.

## Directory Structure

```
public/
└── games/
    ├── memory-game.jpg          # Memory/Matching games
    ├── sorting-game.jpg         # Sorting games  
    ├── expression-game.jpg      # Expression/Emotion games
    ├── puzzle-game.jpg          # Puzzle games
    ├── math-game.jpg            # Math games
    ├── reading-game.jpg         # Reading games
    ├── creativity-game.jpg      # Creativity games
    ├── default-game.jpg         # Default fallback for games
    ├── memory-template.jpg      # Memory game templates
    ├── creativity-template.jpg  # Creativity game templates
    ├── puzzle-template.jpg      # Puzzle game templates
    ├── reading-template.jpg     # Reading game templates
    ├── math-template.jpg        # Math game templates
    ├── expression-template.jpg  # Expression game templates
    ├── default-template.jpg     # Default fallback for templates
    └── canvas-coloring.jpg      # Canvas coloring game
```

## How It Works

### 1. Game Type Detection
The system uses two helper functions to determine the appropriate image:

- `getGameImage(gameType)` - For personalized games based on their game type
- `getMoldImage(category)` - For game templates based on their category

### 2. Fallback System
If an image fails to load, the system gracefully falls back to:
1. Hide the broken image
2. Show a colored gradient background
3. Display the appropriate game icon

### 3. Color-Coded Gradients
Each game type has its own color scheme:

- **Memory/Matching**: Purple to Indigo
- **Sorting**: Green to Emerald  
- **Expression**: Pink to Rose
- **Puzzle**: Orange to Amber
- **Math**: Blue to Cyan
- **Reading**: Teal to Green
- **Creativity**: Pink to Orange
- **Default**: Gray to Slate

## Adding New Game Types

To add a new game type:

1. Add the new case to `getGameImage()` function
2. Add the new case to `getGameGradient()` function  
3. Add the new case to `getGameIcon()` function
4. Add the corresponding image file to `/public/games/`
5. Update this documentation

## Image Specifications

### Recommended Image Properties:
- **Format**: JPG or PNG
- **Dimensions**: 400x300px (4:3 aspect ratio)
- **File Size**: < 200KB for optimal loading
- **Style**: Bright, colorful, child-friendly

### Content Guidelines:
- **Memory Games**: Brain icons, cards, matching elements
- **Sorting Games**: Categories, organization, colorful objects
- **Expression Games**: Emotions, faces, hearts
- **Puzzle Games**: Jigsaw pieces, brain teasers
- **Math Games**: Numbers, calculations, counting objects
- **Reading Games**: Books, letters, storytelling elements
- **Creativity Games**: Art supplies, colors, imagination themes

## Implementation Details

The image system is implemented in:
- **File**: `/app/child/components/PlayTab.tsx`
- **Functions**: 
  - `getGameImage(gameType: string)`
  - `getMoldImage(category: string)`
  - `getGameGradient(gameType: string)`
  - `getMoldGradient(category: string)`

## Current Status

🟡 **Placeholder Phase**: Currently using placeholder text files
✅ **Structure Ready**: Complete image mapping system implemented
🎯 **Next Step**: Replace placeholder files with actual game images

## Maintenance

When updating images:
1. Replace the placeholder files in `/public/games/`
2. Keep the same filenames for automatic mapping
3. Test the fallback system by temporarily breaking image links
4. Ensure images are optimized for web delivery

---

*Last Updated: August 28, 2025*
