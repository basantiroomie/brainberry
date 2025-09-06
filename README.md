# 🧠 BrainBerry - Neurodiverse Learning Platform

> **Therapeutic gaming system designed for neurodiverse children. Personalized learning experiences configured by therapists and educators.**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## 🌟 Overview

BrainBerry is a cutting-edge therapeutic gaming platform that creates personalized learning experiences for neurodiverse children. Built with modern web technologies, it provides a safe, engaging environment where children can learn and grow through interactive games and AI-powered avatars.

### ✨ Key Features

- **🎮 Therapeutic Gaming**: Personalized games designed for cognitive development
- **🤖 AI-Powered Avatars**: Interactive 3D avatars with voice and text chat capabilities
- **👩‍🏫 Educator Dashboard**: Comprehensive tools for therapists and educators
- **📊 Progress Tracking**: Real-time analytics and progress monitoring
- **🎨 Creative Tools**: Avatar customization and creative expression games
- **📱 Mobile Responsive**: Optimized for all devices and screen sizes
- **♿ Accessibility**: WCAG 2.1 AA compliant design

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/brainberry.git
   cd brainberry
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
brainberry/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── child/             # Child dashboard
│   ├── educator/          # Educator dashboard
│   ├── community/         # Community features
│   └── login/             # Authentication
├── components/            # Reusable React components
│   └── ui/               # UI components
├── lib/                   # Utility libraries
├── types/                 # TypeScript type definitions
├── public/               # Static assets
├── supabase/             # Database migrations
└── hooks/                # Custom React hooks
```

## 🎯 Core Features

### For Children
- **Interactive Games**: Memory matching, expression training, creative coloring
- **Avatar Interaction**: 3D character interaction for social skill building
- **Progress Tracking**: Visual progress indicators and achievements
- **Safe Environment**: Supervised and secure gaming experience

### For Educators & Therapists
- **Mold Studio**: Create custom therapeutic games and activities
- **Analytics Dashboard**: Track child progress and engagement
- **Child Management**: Manage multiple children and their profiles
- **Customization Tools**: Personalize experiences for each child

### For Parents
- **Progress Reports**: View detailed progress and achievements
- **Community Access**: Connect with other families and resources
- **Safe Communication**: Secure messaging with educators

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.5.2** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Three.js** - 3D graphics and avatar rendering
- **Framer Motion** - Smooth animations

### Backend
- **Supabase** - Database and authentication
- **Next.js API Routes** - Server-side functionality
- **Gemini AI** - AI-powered conversations
- **ElevenLabs** - Text-to-speech synthesis

### Performance & Optimization
- **Image Optimization** - WebP/AVIF formats with lazy loading
- **Code Splitting** - Dynamic imports and bundle optimization
- **PWA Support** - Service worker and offline capabilities
- **Mobile-First** - Responsive design with touch optimization

## 🎨 Design System

BrainBerry uses a custom design system with:
- **Brutal Design Language**: Bold, accessible, and engaging
- **High Contrast**: WCAG AA compliant color schemes
- **Touch-Friendly**: 44px minimum touch targets
- **Responsive Typography**: Fluid scaling across devices

## 📱 Mobile Experience

- **Progressive Web App** (PWA) capabilities
- **Touch Optimizations** for mobile interactions
- **Responsive Design** that works on all screen sizes
- **Offline Support** for core functionality

## 🔒 Security & Privacy

- **Data Encryption** - All sensitive data encrypted at rest
- **Secure Authentication** - Supabase Auth with RLS policies
- **GDPR Compliant** - Privacy-first approach
- **Child Safety** - Supervised environment with content filtering

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run deploy:vercel
```

### Railway
```bash
npm run deploy:railway
```

### Manual Build
```bash
npm run build
npm start
```

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Core Web Vitals**: Optimized for LCP, FID, and CLS
- **Bundle Size**: Optimized with code splitting
- **Image Loading**: 50% faster with modern formats

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Bhaskar** - [LinkedIn](https://www.linkedin.com/in/bhaskar-datta-p/)
- **Megha** - [LinkedIn](https://www.linkedin.com/in/meghaprasadd/)
- **Siddhanth** - [LinkedIn](https://www.linkedin.com/in/siddhanth-pradhan/)

## 🏫 Institution

**Ramaiah Institute of Technology**  
Bengaluru, Karnataka, India

## 📞 Contact

- **Email**: hello@brainberry.com
- **Website**: [brainberry.com](https://brainberry.com)

## 🙏 Acknowledgments

- ReadyPlayer.me for avatar technology
- Supabase for backend infrastructure
- The neurodiverse community for inspiration and feedback

---

**Made with ❤️ for neurodiverse learners everywhere**