# BrainBerry Color Palette & Customization Guide

## Current Color Palette

### Primary Colors
- **Main Brand Color**: `oklch(76.89% 0.139164 219.13)` - Blue (#5B5FDB)
- **Background**: `oklch(94.61% 0.043 211.12)` - Light blue-gray
- **Secondary Background**: `oklch(100% 0 0)` - White
- **Foreground**: `oklch(0% 0 0)` - Black

### Chart/Accent Colors
- **Chart 1**: `#00c8f0` - Cyan
- **Chart 2**: `#ff7a05` - Orange  
- **Chart 3**: `#7a83ff` - Purple
- **Chart 4**: `#ff4d50` - Red
- **Chart 5**: `#facc00` - Yellow

### Border & Shadows
- **Border**: `#000000` - Black
- **Shadow**: `4px 4px 0px 0px #000000` - Black brutal shadow

## Where to Change Colors

### 1. Main Color Variables
**File**: `/app/globals.css`
**Lines**: 25-35 (Light theme) and 55-65 (Dark theme)

```css
:root {
  /* Change these variables to update your brand colors */
  --color-main: oklch(76.89% 0.139164 219.13);        /* Primary brand color */
  --color-background: oklch(94.61% 0.043 211.12);     /* Page background */
  --color-secondary-background: oklch(100% 0 0);      /* Card backgrounds */
  --color-foreground: oklch(0% 0 0);                  /* Text color */
  --color-main-foreground: oklch(0% 0 0);             /* Text on main color */
  --color-border: #000000;                            /* Border color */
  --color-overlay: oklch(0% 0 0 / 0.8);              /* Modal overlays */
  --color-ring: oklch(0% 0 0);                        /* Focus rings */
  --color-chart-1: #00c8f0;                          /* Accent color 1 */
  --color-chart-2: #ff7a05;                          /* Accent color 2 */
  --color-chart-3: #7a83ff;                          /* Accent color 3 */
  --color-chart-4: #ff4d50;                          /* Accent color 4 */
  --color-chart-5: #facc00;                          /* Accent color 5 */
  --shadow-shadow: 4px 4px 0px 0px #000000;          /* Box shadows */
}
```

### 2. Tailwind Color Extensions
**File**: `/tailwind.config.ts`
**Lines**: 56-62

These map to the CSS variables above and can be used in Tailwind classes:
- `bg-main` → Main brand color
- `bg-chart-1` → Accent color 1
- `text-main-foreground` → Text on main color
- `border-border` → Border color

### 3. Shadcn/UI Colors
**File**: `/app/globals.css`
**Lines**: 7-23 (Light theme) and 37-53 (Dark theme)

Standard UI component colors (buttons, cards, etc.):
```css
--primary: 222.2 47.4% 11.2%;      /* Primary button color */
--secondary: 210 40% 96%;          /* Secondary button color */
--accent: 210 40% 96%;             /* Accent elements */
--destructive: 0 84.2% 60.2%;      /* Error/danger color */
--muted: 210 40% 96%;              /* Muted text/backgrounds */
```

## How to Change Colors

### Option 1: Update CSS Variables (Recommended)
Edit `/app/globals.css` and change the hex/oklch values:

```css
/* Example: Change to a green theme */
--color-main: #10B981;              /* Green instead of blue */
--color-chart-1: #06D6A0;          /* Teal accent */
--color-chart-2: #F59E0B;          /* Keep orange */
```

### Option 2: Use Tailwind Classes
In components, you can override colors using Tailwind:

```tsx
<div className="bg-emerald-500 text-white">  {/* Green background */}
<Button className="bg-rose-500 hover:bg-rose-600">  {/* Red button */}
```

### Option 3: Add New Color Variables
Add new colors to both `globals.css` and `tailwind.config.ts`:

```css
/* In globals.css */
--color-new-brand: #your-color;

/* In tailwind.config.ts */
"new-brand": "var(--color-new-brand)",
```

## Logo Usage
The PNG logo is now used throughout the application via the `BrandLogo` component:
- Header navigation
- Footer
- Login page
- Child dashboard

The logo automatically scales and has hover effects. The component supports different variants:
- `default` - Black text for light backgrounds
- `child` - Orange text for child sections  
- `footer` - Foreground color for footer

## Quick Color Customization Tips

1. **For a complete rebrand**: Change `--color-main` and `--color-chart-*` variables
2. **For subtle changes**: Adjust lightness/saturation in oklch values
3. **For accessibility**: Ensure sufficient contrast between foreground/background
4. **For dark mode**: Update both light and dark theme variables

## Testing Your Changes
After making color changes:
1. Check both light and dark modes
2. Test on different pages (landing, child, educator)
3. Verify button states (hover, disabled)
4. Check form validation colors
5. Ensure logo visibility on all backgrounds
