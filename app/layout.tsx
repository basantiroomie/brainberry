import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "BrainBerry - Neurodiverse Learning Platform",
  description:
    "Therapeutic gaming system designed for neurodiverse children. Personalized learning experiences configured by therapists and educators.",
  generator: "v0.app",
  keywords: "neurodiverse, learning, therapeutic gaming, children, education, therapy",
  authors: [{ name: "BrainBerry Team" }],
  robots: "index, follow",
  openGraph: {
    title: "BrainBerry - Neurodiverse Learning Platform",
    description: "Therapeutic gaming system designed for neurodiverse children",
    type: "website",
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://js.puter.com" />
        <script src="https://js.puter.com/v2/" defer></script>
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* PWA Support */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BrainBerry" />
        <link rel="apple-touch-icon" href="/BrainBerrylogo.png" />
        
        {/* Performance hints */}
        <link rel="preload" href="/BrainBerrylogo.png" as="image" />
        <link rel="preload" href="/landingpage.jpg" as="image" />
        

      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}