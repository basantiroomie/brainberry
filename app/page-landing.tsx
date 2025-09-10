"use client"

import type React from "react"
import { Suspense, memo, useCallback, lazy } from "react"
import { Calendar, MapPin } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Loading } from "@/components/ui/loading"
import { MobileNav } from "@/components/ui/mobile-nav"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { ServiceWorkerRegistration } from "@/components/ui/service-worker"

// Lazy load social icons to improve initial load
const SocialIcons = lazy(() => import("@/components/ui/social-icons"))

const BrainBerry = memo(function BrainBerry() {
  const router = useRouter()

  const goToLogin = useCallback(() => {
    router.push("/login")
  }, [router])

  return (
    <div className="min-h-screen bg-background">
      <ServiceWorkerRegistration />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black shadow-brutal-xl contain-layout">
        <div className="max-w-7xl mx-auto px-responsive">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center">
              <Image
                src="/BrainBerrylogo.png"
                alt="BrainBerry Logo"
                width={120}
                height={40}
                className="h-8 md:h-10 w-auto"
                priority
              />
            </div>
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <a href="#about" className="text-black hover:text-main font-medium transition-colors touch-manipulation">
                About
              </a>
              <a href="#programs" className="text-black hover:text-main font-medium transition-colors touch-manipulation">
                Programs
              </a>
              <a href="/community" className="text-black hover:text-main font-medium transition-colors touch-manipulation">
                Community
              </a>
              <button
                onClick={goToLogin}
                className="bg-main text-main-foreground px-4 lg:px-6 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold touch-manipulation btn-mobile"
              >
                LOGIN
              </button>
            </nav>
            {/* Mobile navigation */}
            <MobileNav onLoginClick={goToLogin} />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ pointerEvents: 'none' }}
          >
            <source 
              src="https://ik.imagekit.io/1jxk7hhig/hero.mp4?tr=orig&updatedAt=1757351084022" 
              type="video/mp4" 
            />
          </video>
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-responsive safe-area-inset">
          <div className="mb-6 md:mb-8">
            <div className="border-4 border-border shadow-brutal-3xl p-responsive transform -rotate-1 will-change-transform">
              <h1 className="text-responsive-3xl font-bold text-white mb-2 md:mb-4 leading-none">LEARN BOLD.</h1>
              <h1 className="text-responsive-3xl font-bold text-white mb-4 md:mb-6 leading-none">GROW FREE.</h1>
            </div>
          </div>
          <div>
            <div className="border-4 border-border shadow-brutal-2xl p-responsive transform rotate-1 will-change-transform">
              <p className="text-responsive-lg text-white font-medium mb-4 md:mb-6">
                Welcome to BrainBerry — therapeutic gaming designed for neurodiverse minds.
              </p>
              <button
                onClick={goToLogin}
                className="bg-chart-5 text-black px-6 md:px-8 py-3 md:py-4 border-4 border-border shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-responsive-base touch-manipulation btn-mobile"
              >
                EXPLORE PROGRAMS
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-responsive bg-background">
        <div className="max-w-7xl mx-auto px-responsive">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <div>
                <div className="bg-chart-1 border-4 border-border shadow-brutal-colored-lg p-responsive inline-block mb-6 md:mb-8 transform -rotate-1 will-change-transform">
                  <h2 className="text-responsive-2xl font-bold text-main-foreground">WHO WE ARE</h2>
                </div>
              </div>
              <div>
                <div className="space-responsive">
                  <p className="text-responsive-lg font-medium text-foreground">We game smart. We support smarter.</p>
                  <p className="text-responsive-base font-medium text-foreground">
                    BrainBerry welcomes all neurodiverse learners. From first-time players to advanced problem-solvers.
                  </p>
                  <p className="text-responsive-base font-medium text-foreground">
                    Our mission: Build confidence through personalized gaming. Push boundaries. Share success.
                  </p>
                  <div className="bg-chart-4 border-4 border-border shadow-brutal-xl p-responsive">
                    <p className="text-main-foreground font-bold text-responsive-base">
                      Rapid 2-week development for maximum therapeutic impact
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div>
                <div className="bg-black border-4 border-border shadow-brutal-3xl p-responsive transform rotate-2 hover:shadow-[24px_24px_0px_0px_var(--color-border)] transition-all duration-300 will-change-transform">
                  <OptimizedImage
                    src="/therapy-gaming-tablet.png"
                    alt="Therapeutic gaming session"
                    width={500}
                    height={400}
                    className="border-2 border-border w-full h-auto"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-responsive bg-chart-1">
        <div className="max-w-7xl mx-auto px-responsive">
          <div className="text-center mb-8 md:mb-12">
            <div className="bg-chart-5 border-4 border-border shadow-brutal-colored-xl p-responsive inline-block transform rotate-1 will-change-transform">
              <h2 className="text-responsive-2xl font-bold text-main-foreground">SEE BRAINBERRY IN ACTION</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="space-responsive">
                <div className="bg-black border-4 border-border shadow-brutal-xl p-responsive">
                  <h3 className="text-responsive-xl font-bold text-white mb-3 md:mb-4">Real Learning, Real Progress</h3>
                  <p className="text-white font-medium mb-3 md:mb-4 text-responsive-sm">
                    Watch how BrainBerry transforms learning through personalized therapeutic gaming experiences.
                  </p>
                  <ul className="space-y-1 md:space-y-2 text-white font-medium text-responsive-sm">
                    <li>• Adaptive gameplay for every learning style</li>
                    <li>• Progress tracking for parents and therapists</li>
                    <li>• Engaging, therapeutic activities</li>
                    <li>• Safe, supervised environment</li>
                  </ul>
                </div>
                <button
                  onClick={goToLogin}
                  className="bg-chart-2 text-main-foreground px-6 md:px-8 py-3 md:py-4 border-4 border-border shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-responsive-base w-full touch-manipulation btn-mobile"
                >
                  TRY IT NOW
                </button>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="bg-black border-4 border-border shadow-brutal-3xl p-2 md:p-4 transform -rotate-1 hover:shadow-[28px_28px_0px_0px_var(--color-border)] transition-all duration-300 will-change-transform">
                <div className="relative aspect-video bg-chart-3 border-2 border-border">
                  <Suspense fallback={<Loading />}>
                    <Image
                      src="/Children_happy.png"
                      alt="Children enjoying therapeutic learning with tablets"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-responsive bg-secondary-background">
        <div className="max-w-7xl mx-auto px-responsive">
          <div>
            <div className="bg-chart-2 border-4 border-border shadow-brutal-colored-xl p-responsive inline-block mb-8 md:mb-12 transform rotate-1 will-change-transform">
              <h2 className="text-responsive-2xl font-bold text-main-foreground">LEARNING PROGRAMS</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { name: "FOCUS BUILDER", date: "ONGOING", location: "ATTENTION SKILLS" },
              { name: "SOCIAL NAVIGATOR", date: "WEEKLY", location: "COMMUNICATION" },
              { name: "SENSORY EXPLORER", date: "DAILY", location: "REGULATION" },
            ].map((program, i) => (
              <div key={i} className="h-full">
                <div className="bg-black text-white border-4 border-border shadow-brutal-2xl hover:shadow-[20px_20px_0px_0px_var(--color-border)] transition-all duration-300 p-responsive h-full flex flex-col will-change-transform">
                  <h3 className="text-responsive-xl font-bold text-white mb-3 md:mb-4">{program.name}</h3>
                  <div className="flex items-center mb-2 text-responsive-sm">
                    <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-2 text-white flex-shrink-0" />
                    <span className="font-medium text-white">{program.date}</span>
                  </div>
                  <div className="flex items-center mb-4 md:mb-6 text-responsive-sm flex-grow">
                    <MapPin className="h-4 w-4 md:h-5 md:w-5 mr-2 text-white flex-shrink-0" />
                    <span className="font-medium text-white">{program.location}</span>
                  </div>
                  <button
                    onClick={goToLogin}
                    className="bg-main text-main-foreground px-4 md:px-6 py-2 md:py-3 border-2 border-border shadow-brutal hover:shadow-brutal-lg transition-all font-bold w-full text-responsive-sm touch-manipulation mt-auto btn-mobile"
                  >
                    START PROGRAM
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Game Types Section */}
      <section className="py-responsive bg-background">
        <div className="max-w-7xl mx-auto px-responsive">
          <div>
            <div className="bg-chart-5 border-4 border-border shadow-brutal-colored p-responsive inline-block mb-8 md:mb-12 will-change-transform">
              <h2 className="text-responsive-2xl font-bold text-main-foreground">THERAPEUTIC GAMES</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                title: "MEMORY MATCHING",
                desc: "Personalized card matching games for cognitive development",
                image: "/yuri-li-p0hDztR46cw-unsplash.jpg",
                alt: "Memory matching game"
              },
              {
                title: "EXPRESSION TRAINING",
                desc: "Face recognition and emotion identification activities",
                image: "/sigmund-OV44gxH71DU-unsplash.jpg",
                alt: "Expression training game"
              },
              {
                title: "CREATIVE COLORING",
                desc: "Digital canvas for creative expression and fine motor skills",
                image: "/marisa-howenstine-Cq9slNxV8YU-unsplash.jpg",
                alt: "Creative coloring game"
              },
              {
                title: "AVATAR INTERACTION",
                desc: "3D character interaction for social skill building",
                image: "/ashton-bingham-SAHBl2UpXco-unsplash.jpg",
                alt: "Avatar interaction game"
              },
            ].map((gameType, i) => (
              <div key={i} className="h-full">
                <div className="bg-black text-white border-4 border-border shadow-brutal-xl p-responsive hover:shadow-[16px_16px_0px_0px_var(--color-border)] transition-all duration-300 h-full flex flex-col will-change-transform">
                  <div className="bg-chart-1 border-2 border-border shadow-[8px_8px_0px_0px_var(--color-border)] p-2 md:p-4 mb-3 md:mb-4">
                    <Image
                      src={gameType.image}
                      alt={gameType.alt}
                      width={100}
                      height={100}
                      className="w-full h-16 md:h-20 object-cover border border-border"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-responsive-lg font-bold text-white mb-2">{gameType.title}</h3>
                  <p className="text-white font-medium flex-grow text-responsive-sm">{gameType.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-responsive bg-secondary-background">
        <div className="max-w-7xl mx-auto px-responsive">
          <div>
            <div className="bg-chart-4 border-4 border-border shadow-brutal-colored-xl p-responsive inline-block mb-8 md:mb-12 transform -rotate-1 will-change-transform">
              <h2 className="text-responsive-2xl font-bold text-main-foreground">SUCCESS STORIES</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <div className="relative bg-black border-4 border-border shadow-[24px_24px_0px_0px_var(--color-border)] overflow-hidden will-change-transform">
                <Image
                  src="/happy-child-achievement.png"
                  alt="Learning breakthrough story"
                  width={500}
                  height={300}
                  className="w-full h-48 md:h-64 object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-overlay flex items-end">
                  <div className="bg-chart-2 border-t-4 border-border p-responsive w-full">
                    <h3 className="text-responsive-lg font-bold text-main-foreground mb-2">FIRST BREAKTHROUGH MOMENT</h3>
                    <button className="text-main-foreground font-medium underline text-responsive-sm touch-manipulation btn-mobile" suppressHydrationWarning>READ MORE →</button>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="relative bg-black border-4 border-border shadow-[24px_24px_0px_0px_var(--color-border)] overflow-hidden will-change-transform">
                <Image
                  src="/parent-therapist-brainberry.png"
                  alt="Building confidence story"
                  width={500}
                  height={300}
                  className="w-full h-48 md:h-64 object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-overlay flex items-end">
                  <div className="bg-chart-3 border-t-4 border-border p-responsive w-full">
                    <h3 className="text-responsive-lg font-bold text-main-foreground mb-2">BUILDING CONFIDENCE TOGETHER</h3>
                    <button className="text-main-foreground font-medium underline text-responsive-sm touch-manipulation btn-mobile" suppressHydrationWarning>READ MORE →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section id="join" className="py-responsive bg-main">
        <div className="max-w-4xl mx-auto text-center px-responsive">
          <div>
            <div className="bg-black text-white border-4 border-border shadow-[28px_28px_0px_0px_var(--color-border)] p-responsive mb-6 md:mb-8 transform rotate-1 will-change-transform">
              <h2 className="text-responsive-3xl font-bold text-white mb-4 md:mb-6">READY TO START LEARNING?</h2>
              <p className="text-responsive-lg text-white font-medium mb-6 md:mb-8">
                Join our community of families and therapists. All learners welcome.
              </p>
              <button
                onClick={goToLogin}
                className="bg-chart-2 text-main-foreground px-8 md:px-12 py-4 md:py-6 border-4 border-border shadow-brutal-2xl hover:shadow-brutal-3xl transition-all font-bold text-responsive-xl touch-manipulation btn-mobile"
                suppressHydrationWarning
              >
                START FREE TRIAL
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-background border-t-4 border-border py-8 md:py-12 safe-area-inset-bottom">
        <div className="max-w-6xl mx-auto px-responsive">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div>
              <div>
                <div className="flex items-center mb-4">
                  <Image
                    src="/BrainBerrylogo.png"
                    alt="BrainBerry Logo"
                    width={120}
                    height={40}
                    className="h-8 md:h-10 w-auto"
                    loading="lazy"
                  />
                </div>
                <p className="text-foreground font-medium mb-4 text-responsive-sm">
                  Ramaiah Institute of Technology
                  <br />
                  Bengaluru, Karnataka, India
                </p>
                <p className="text-foreground font-medium text-responsive-sm">hello@brainberry.com</p>
              </div>
            </div>
            <div>
              <div>
                <h3 className="text-responsive-base font-bold text-foreground mb-4">NAVIGATION</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#about" className="text-foreground hover:text-main font-medium text-responsive-sm transition-colors touch-manipulation">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#programs" className="text-foreground hover:text-main font-medium text-responsive-sm transition-colors touch-manipulation">
                      Programs
                    </a>
                  </li>
                  <li>
                    <a href="/community" className="text-foreground hover:text-main font-medium text-responsive-sm transition-colors touch-manipulation">
                      Community
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">MADE BY</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-foreground font-medium">Bhaskar</span>
                    <Suspense fallback={null}>
                      <SocialIcons type="linkedin" href="https://www.linkedin.com/in/bhaskar-datta-p/" />
                    </Suspense>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-foreground font-medium">Megha</span>
                    <Suspense fallback={null}>
                      <SocialIcons type="linkedin" href="https://www.linkedin.com/in/meghaprasadd/" />
                    </Suspense>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-foreground font-medium">Siddhanth</span>
                    <Suspense fallback={null}>
                      <SocialIcons type="linkedin" href="https://www.linkedin.com/in/siddhanth-pradhan/" />
                    </Suspense>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">STAY CONNECTED</h3>
                <div className="flex space-x-3 mb-4">
                  <Suspense fallback={null}>
                    <SocialIcons type="instagram" />
                    <SocialIcons type="facebook" />
                    <SocialIcons type="twitter" />
                  </Suspense>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="flex-1 px-3 py-2 border-2 border-border bg-background text-foreground font-medium text-sm mb-2 sm:mb-0 touch-manipulation"
                    suppressHydrationWarning
                  />
                  <button className="bg-chart-1 text-main-foreground px-4 py-2 border-2 sm:border-l-0 border-border shadow-[8px_8px_0px_0px_var(--color-border)] hover:shadow-[12px_12px_0px_0px_var(--color-border)] transition-all font-bold text-sm touch-manipulation btn-mobile" suppressHydrationWarning>
                    SUBSCRIBE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
})

BrainBerry.displayName = "BrainBerry"

export default BrainBerry