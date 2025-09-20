# 🍓 BrainBerry - Personalized Therapeutic Learning Games

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-powered-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## 📖 Overview

BrainBerry is a GenAI-assisted therapeutic mini-game platform that empowers educators to create safe, personalized cognitive and developmental training experiences for children. The platform uses immutable "Game Molds" (evidence-informed templates) that AI fills with child-relevant content while preserving pedagogical integrity.

### 🎯 Target Audience
- **Neurodiverse children** (early childhood to pre-teen) needing engaging repetition & adaptive reinforcement
- **Educators/Therapists/Caregivers** supervising therapeutic or learning sessions
- **Product teams** exploring structured + AI hybrid content delivery for pediatric interventions

### ✨ Key Features
- 🧩 **Immutable Game Molds** - Evidence-based templates (Matching Cards, Sorting Challenges, etc.)
- 🤖 **AI Personalization** - Child-specific themed content generation via Google Gemini
- 🎮 **Polymorphic Game Player** - Dynamic routing to appropriate mini-game implementations
- 👥 **Role-Based Access** - Educator/Child separation with Row Level Security
- ⚡ **Performance Optimized** - Image preloading, caching, and smart rendering
- 🛡️ **COPPA Compliant** - Built-in safety and privacy protections
- 📊 **Analytics Ready** - Longitudinal tracking and progress monitoring

### 🏗️ Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | Next.js 15 (App Router) | Full-stack React with Edge compatibility |
| **Language** | TypeScript 5 | Type-safe development |
| **Backend** | Supabase | PostgreSQL, Auth, RLS, Storage |
| **Authentication** | Supabase Auth | Email/password with middleware protection |
| **Database** | PostgreSQL | Relational data with advanced features |
| **AI/ML** | Google Gemini API | Content generation and personalization |
| **Avatar/3D** | Ready Player Me | 3D avatar creation and customization |
| **TTS** | ElevenLabs (optional) | Text-to-speech for accessibility |
| **UI/Styling** | Tailwind CSS, Radix UI | Modern, accessible component system |
| **Validation** | Zod | Runtime type validation |
| **Charts** | Recharts | Data visualization |
| **Package Manager** | pnpm | Fast, efficient dependency management |

### 🔄 Architecture Flow
```
Educator → Game Mold → Child Interest Input → AI Content Generation → Personalized Game → Play Session → Analytics
```

## 🚀 Quick Start (TL;DR)

```bash
# 1. Clone and install dependencies
git clone <your-repo-url>
cd brainberry
npm install -g pnpm
pnpm install

# 2. Setup environment
cp .env.local.example .env.local
# Edit .env.local with your API keys (see setup guide below)

# 3. Start development server
pnpm dev
# Open http://localhost:3000
```

## 🛠️ Prerequisites

Before setting up BrainBerry, ensure you have:

| Requirement | Version | Installation | Purpose |
|------------|---------|--------------|---------|
| **Node.js** | 18+ (20 LTS recommended) | [Download](https://nodejs.org/) | JavaScript runtime |
| **pnpm** | Latest | `npm install -g pnpm` | Fast package manager |
| **Git** | Latest | [Download](https://git-scm.com/) | Version control |

### Optional Dependencies
| Tool | Purpose | Installation |
|------|---------|--------------|
| **Supabase CLI** | Local database management | `npm install -g supabase` |
| **VS Code** | Recommended editor | [Download](https://code.visualstudio.com/) |

## ⚙️ Environment Setup

### Step 1: Create Environment File
```bash
# Copy the example environment file
cp .env.local.example .env.local
```

### Step 2: Configure Required Variables

Edit `.env.local` with your preferred text editor:

```bash
# Open with VS Code (recommended)
code .env.local

# Or with nano
nano .env.local

# Or with vim
vim .env.local
```

### Step 3: Fill in the Variables

#### 🔐 Required Variables (Minimum to run)

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-from-supabase-dashboard"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-from-supabase-dashboard"

# Environment
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### 🤖 AI Features (Recommended)

```bash
# Google Gemini API (FREE tier available)
GEMINI_API_KEY="your-gemini-api-key"
# Get from: https://makersuite.google.com/app/apikey
```

#### 🎭 Avatar Features (Optional)

```bash
# Ready Player Me (FREE tier available)
RPM_API_KEY="your-readyplayer-me-api-key"
RPM_APP_ID="your-readyplayer-me-app-id"
RPM_SUBDOMAIN="your-subdomain.readyplayer.me"
NEXT_PUBLIC_RPM_SUBDOMAIN="your-subdomain"
# Get from: https://readyplayer.me/developers
```

#### 🔊 Text-to-Speech (Optional)

```bash
# ElevenLabs TTS (Optional - has paid tiers)
ELEVENLABS_API_KEY="your-elevenlabs-api-key"
# Get from: https://elevenlabs.io/
```

#### 🔒 Security & Compliance

```bash
# JWT Secret (IMPORTANT: Generate a strong secret)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# COPPA Compliance (Legal requirement for children's apps)
COPPA_COMPLIANCE_ENABLED=true
PARENTAL_CONSENT_REQUIRED=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 🔑 How to Get API Keys

<details>
<summary><strong>Supabase Setup (REQUIRED)</strong></summary>

1. Go to [supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Click "New Project"
4. Choose organization and fill project details
5. Wait for database setup (2-3 minutes)
6. Go to Settings → API
7. Copy your Project URL and anon public key
8. Copy your service_role secret key ⚠️ (Keep this secure!)

</details>

<details>
<summary><strong>Google Gemini API (FREE)</strong></summary>

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

</details>

<details>
<summary><strong>Ready Player Me (FREE tier)</strong></summary>

1. Go to [Ready Player Me Developers](https://readyplayer.me/developers)
2. Sign up for a developer account
3. Create a new application
4. Get your App ID and API key from the dashboard
5. Set up your subdomain

</details>

### 🧪 Validate Your Setup

Run this command to check if your environment is properly configured:

```bash
# Check environment variables
pnpm run type-check

# Start development server
pnpm dev
```

If you see errors, check the troubleshooting section below.

## 🏗️ Development Commands

### 📦 Package Management
```bash
# Install all dependencies
pnpm install

# Add a new dependency
pnpm add <package-name>

# Add a dev dependency
pnpm add -D <package-name>

# Update dependencies
pnpm update

# Check for outdated packages
pnpm outdated
```

### 🚀 Development Server
```bash
# Start development server (with hot reload)
pnpm dev

# Start on custom port
PORT=3001 pnpm dev

# Start with verbose logging
DEBUG=* pnpm dev
```

### 🔨 Build Commands
```bash
# Type check without building
pnpm type-check

# Build for production
pnpm build

# Start production server (after build)
pnpm start

# Analyze bundle size
pnpm analyze

# Lint code
pnpm lint

# Fix linting issues
pnpm lint --fix
```

### 🗄️ Database Management
```bash
# Start local Supabase (requires Supabase CLI)
supabase start

# Stop local Supabase
supabase stop

# Reset local database with seed data
supabase db reset

# Apply migrations to remote database
supabase db push

# Generate TypeScript types from database
supabase gen types typescript --local > types/database.types.ts

# View local database in browser
supabase studio
```

### 🚀 Deployment Commands
```bash
# Deploy to Vercel
pnpm deploy:vercel

# Deploy to Railway
pnpm deploy:railway

# Optimize images
pnpm optimize
```

## 📁 Project Structure

```
brainberry/
├── 📱 app/                     # Next.js App Router
│   ├── 🔐 api/                # API endpoints
│   ├── 👨‍🏫 educator/            # Educator interface
│   ├── 👶 child/               # Child interface
│   ├── 🏠 community/           # Community features
│   └── 📄 (auth)/              # Authentication pages
├── 🧩 components/              # Reusable UI components
│   ├── 🎭 Avatar*.tsx         # Avatar-related components
│   ├── 🎮 Game*.tsx           # Game components
│   ├── 🎨 Mold*.tsx           # Game mold components
│   └── 🎯 ui/                 # Base UI components
├── 🎣 hooks/                   # Custom React hooks
├── 📚 lib/                     # Utility libraries
│   ├── 🤖 ai-generation-service.ts
│   ├── 🎭 avatar-*.ts         # Avatar management
│   ├── 🗃️ supabase-*.ts       # Database clients
│   └── 🛡️ *-error-*.ts        # Error handling
├── 🔧 scripts/                # Build and utility scripts
├── 🗃️ supabase/               # Database migrations & config
├── 🏷️ types/                   # TypeScript type definitions
└── 🎨 public/                 # Static assets
```

## 📊 Data Sources & Open Source Components

### 🔗 External APIs & Services

| Service | Purpose | Cost | Documentation |
|---------|---------|------|---------------|
| **Supabase** | Backend-as-a-Service | Free tier available | [docs.supabase.com](https://docs.supabase.com) |
| **Google Gemini** | AI content generation | Free tier: 60 req/min | [ai.google.dev](https://ai.google.dev) |
| **Ready Player Me** | 3D avatar creation | Free tier available | [docs.readyplayer.me](https://docs.readyplayer.me) |
| **ElevenLabs** | Text-to-speech | Paid service | [elevenlabs.io/docs](https://elevenlabs.io/docs) |

### 📚 Open Source Libraries

<details>
<summary><strong>Core Framework & Language</strong></summary>

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type-safe JavaScript

</details>

<details>
<summary><strong>UI & Styling</strong></summary>

- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **next-themes** - Theme switching
- **class-variance-authority** - Component variants

</details>

<details>
<summary><strong>Data & Validation</strong></summary>

- **Zod** - Runtime type validation
- **React Hook Form** - Form handling
- **@hookform/resolvers** - Form validation integration

</details>

<details>
<summary><strong>3D & Animation</strong></summary>

- **Three.js** - 3D graphics library
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Three.js helpers
- **face-api.js** - Face detection and recognition

</details>

<details>
<summary><strong>Audio & Media</strong></summary>

- **wavefile** - WAV file manipulation
- **wawa-lipsync** - Lip sync animation
- **ffmpeg-static** - Video/audio processing

</details>

<details>
<summary><strong>Development & Testing</strong></summary>

- **ESLint** - Code linting
- **Playwright** - End-to-end testing
- **Vitest** - Unit testing
- **Testing Library** - React component testing

</details>

### 🎮 Game Data & Assets

- **Educational Content**: Evidence-based therapeutic game templates
- **Default Assets**: CC0 licensed images and sounds from:
  - [Unsplash](https://unsplash.com) - Stock photography
  - [Freesound](https://freesound.org) - Audio samples
  - [OpenGameArt](https://opengameart.org) - Game assets

### 🔒 Privacy & Compliance

- **COPPA Compliance**: Built-in child privacy protections
- **GDPR Ready**: Data export and deletion capabilities
- **SOC 2**: Supabase provides enterprise-grade security

## 🎮 Usage Guide

### 👥 User Roles

| Role | Access | Capabilities |
|------|--------|--------------|
| **Educator** | Full platform access | Create child profiles, manage games, view analytics, assign personalized content |
| **Child** | Simplified interface | Play assigned games, customize avatars, track progress |

### 🚀 Getting Started Workflow

1. **Setup Account**
   ```bash
   # Navigate to your local instance
   open http://localhost:3000
   ```
   - Sign up as an educator
   - Complete profile setup

2. **Create Child Profiles**
   - Add children to your classroom/therapy group
   - Set learning goals and preferences
   - Configure safety and privacy settings

3. **Explore Game Molds**
   - Browse evidence-based game templates
   - Preview: Matching Cards, Sorting Challenges, Pattern Recognition
   - Understand pedagogical objectives

4. **Generate Personalized Content**
   - Input child interests (dinosaurs, space, animals, etc.)
   - AI generates themed content using safe, validated prompts
   - Review and approve generated materials

5. **Launch Game Sessions**
   - Assign games to specific children
   - Monitor real-time progress
   - Collect performance analytics

### 🎯 Current Features

| Feature | Status | Description |
|---------|--------|-------------|
| ✅ **Game Molds** | Live | Matching Cards, Sorting Challenges |
| ✅ **AI Personalization** | Live | Gemini-powered content generation |
| ✅ **Avatar System** | Live | Ready Player Me integration |
| ✅ **Progress Tracking** | Live | Basic analytics and scoring |
| 🚧 **Advanced Analytics** | In Progress | Detailed learning insights |
| 📋 **Workflow Management** | Planned | Async content generation queue |

### 🔮 Planned Features

- **Additional Game Types**: Puzzle games, drawing challenges, storytelling
- **Advanced Personalization**: Learning style adaptation, difficulty adjustment
- **Collaborative Features**: Multiplayer games, peer learning
- **Accessibility**: Screen reader support, motor accessibility options
- **Integration**: LMS connectivity, progress reporting APIs

## 🛠️ Troubleshooting

### 🚨 Common Issues & Solutions

<details>
<summary><strong>❌ "401 Unauthorized" Errors</strong></summary>

**Problem**: Authentication failures or expired sessions

**Solutions**:
```bash
# Clear browser cookies and localStorage
# In browser dev tools console:
localStorage.clear()
# Then refresh page

# Check your environment variables
grep -E "SUPABASE|AUTH" .env.local

# Verify Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
     "https://YOUR_PROJECT.supabase.co/rest/v1/rpc/version"
```

</details>

<details>
<summary><strong>❌ Environment Variable Errors</strong></summary>

**Problem**: Missing or incorrect environment variables

**Solutions**:
```bash
# Check if .env.local exists
ls -la .env.local

# Verify required variables are set
node -e "
const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
required.forEach(key => {
  if (!process.env[key]) console.log('Missing:', key);
  else console.log('Found:', key);
});
"

# Restart development server after changes
pnpm dev
```

</details>

<details>
<summary><strong>❌ Database Connection Issues</strong></summary>

**Problem**: Cannot connect to Supabase or database errors

**Solutions**:
```bash
# Test database connection
npx supabase status

# Reset local database
npx supabase db reset

# Check migration status
npx supabase migration list

# Manual database inspection
npx supabase studio
```

</details>

<details>
<summary><strong>❌ AI Generation Failures</strong></summary>

**Problem**: Gemini API errors or content generation issues

**Solutions**:
```bash
# Verify API key is valid
curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=YOUR_API_KEY"

# Check API quota/limits in Google Cloud Console
# Ensure content policies are being followed
```

</details>

<details>
<summary><strong>❌ Build or TypeScript Errors</strong></summary>

**Problem**: Compilation failures or type errors

**Solutions**:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check TypeScript config
pnpm type-check

# Update dependencies
pnpm update
```

</details>

<details>
<summary><strong>❌ Avatar/3D Rendering Issues</strong></summary>

**Problem**: Ready Player Me avatars not loading or 3D errors

**Solutions**:
```bash
# Check WebGL support in browser
# Go to: chrome://gpu/ or about:support in Firefox

# Verify Ready Player Me configuration
node -e "console.log(process.env.RPM_SUBDOMAIN)"

# Clear avatar cache
localStorage.removeItem('rpm-avatar-cache')
```

</details>

### 📊 Debug Information

```bash
# Generate debug report
echo "=== BrainBerry Debug Report ===" > debug-report.txt
echo "Date: $(date)" >> debug-report.txt
echo "Node Version: $(node --version)" >> debug-report.txt
echo "pnpm Version: $(pnpm --version)" >> debug-report.txt
echo "Environment Variables:" >> debug-report.txt
env | grep -E "(NEXT_|SUPABASE|GEMINI)" >> debug-report.txt
echo "Package.json:" >> debug-report.txt
cat package.json >> debug-report.txt
```

### 🆘 Getting Help

1. **Check Logs**: Browser console, terminal output, Supabase logs
2. **Documentation**: Component READMEs in `/components` and `/lib`
3. **Issues**: Create detailed bug reports with debug information
4. **Community**: Supabase Discord, Next.js discussions

## 🗺️ Roadmap

### 🎯 Current Sprint (v0.2)
- [ ] Async content generation workflow
- [ ] Enhanced error handling and recovery
- [ ] Performance optimization for 3D rendering
- [ ] Mobile responsiveness improvements

### 🚀 Next Quarter (v0.3)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Additional game molds (puzzles, drawing)
- [ ] Accessibility improvements (WCAG 2.1 AA)

### 🔮 Future Vision (v1.0+)
- [ ] Machine learning for adaptive difficulty
- [ ] Integration with educational platforms
- [ ] Advanced collaboration features
- [ ] Offline mode support

## 📄 License

**Internal/Restricted** - Please add explicit license before open sourcing.

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### 🔄 Development Workflow

1. **Fork & Clone**
   ```bash
   git fork https://github.com/basantiroomie/brainberry
   git clone https://github.com/YOUR_USERNAME/brainberry
   cd brainberry
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

3. **Follow Code Standards**
   ```bash
   # Type-safe development
   pnpm type-check
   
   # Code formatting
   pnpm lint
   
   # Test your changes
   pnpm test
   ```

4. **Database Changes**
   ```bash
   # Create migration for schema changes
   npx supabase migration new your_migration_name
   
   # Test migration
   npx supabase db reset
   ```

5. **Submit Pull Request**
   - Provide clear description of changes
   - Include screenshots for UI changes
   - Ensure all tests pass
   - Update documentation if needed

### 📋 Code Guidelines

- **TypeScript**: Use strict typing, avoid `any`
- **Components**: Follow existing patterns in `/components`
- **Logging**: Use structured logging with context
- **Error Handling**: Implement proper error boundaries
- **Performance**: Consider image optimization and caching

---

## 🎉 Quick Start Commands Summary

```bash
# Essential setup
git clone <repo-url> && cd brainberry
npm install -g pnpm && pnpm install
cp .env.local.example .env.local
# Edit .env.local with your API keys
pnpm dev

# Development commands
pnpm type-check    # Type checking
pnpm lint         # Code linting  
pnpm build        # Production build
pnpm analyze      # Bundle analysis

# Database commands
supabase start    # Local database
supabase studio   # Database UI
supabase db reset # Reset with seed data
```

**Happy building & personalizing!** 🍓
