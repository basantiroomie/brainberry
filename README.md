# BrainBerry - Personalized Therapeutic Learning Games

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
git clone [<your-repo-url>](https://github.com/basantiroomie/brainberry.git)
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

## 📄 License

**Internal/Restricted** - Please add explicit license before open sourcing.

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
