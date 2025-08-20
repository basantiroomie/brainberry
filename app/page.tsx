"use client"

import type React from "react"

import { Brain, Calendar, MapPin, Instagram, Facebook, Twitter, X, User, Users } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

type UserRole = "THERAPIST_PARENT" | "CHILD" | null
type ModalStep = "role-selection" | "login" | null

export default function BrainBerry() {
  const [modalStep, setModalStep] = useState<ModalStep>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>(null)
  const [loginData, setLoginData] = useState({ email: "", password: "", childCode: "" })

  const openTrialFlow = () => {
    setModalStep("role-selection")
    setSelectedRole(null)
  }

  const selectRole = (role: UserRole) => {
    setSelectedRole(role)
    setModalStep("login")
  }

  const closeModal = () => {
    setModalStep(null)
    setSelectedRole(null)
    setLoginData({ email: "", password: "", childCode: "" })
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle login logic here
    console.log("Login attempt:", { role: selectedRole, data: loginData })
    closeModal()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black shadow-brutal-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-black" />
              <span className="text-xl font-bold text-black">BRAINBERRY</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-black hover:text-main font-medium">
                About
              </a>
              <a href="#programs" className="text-black hover:text-main font-medium">
                Programs
              </a>
              <a href="#join" className="text-black hover:text-main font-medium">
                Get Started
              </a>
              <a href="#community" className="text-black hover:text-main font-medium">
                Community
              </a>
              <button
                onClick={openTrialFlow}
                className="bg-main text-main-foreground px-6 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
              >
                START FREE TRIAL
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/diverse-children-educational-games.png"
            alt="Children engaged in therapeutic gaming"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-overlay"></div>
        </div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <div className="border-4 border-border shadow-brutal-3xl p-8 transform -rotate-1">
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 leading-none">LEARN BOLD.</h1>
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-none">GROW FREE.</h1>
            </div>
          </div>
          <div>
            <div className="border-4 border-border shadow-brutal-2xl p-6 transform rotate-1">
              <p className="text-xl md:text-2xl text-white font-medium mb-6">
                Welcome to BrainBerry — therapeutic gaming designed for neurodiverse minds.
              </p>
              <button
                onClick={openTrialFlow}
                className="bg-chart-2 text-white px-8 py-4 border-4 border-border shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-lg"
              >
                EXPLORE PROGRAMS
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div>
                <div className="bg-chart-1 border-4 border-border shadow-brutal-colored-lg p-4 inline-block mb-8 transform -rotate-1">
                  <h2 className="text-4xl md:text-5xl font-bold text-main-foreground">WHO WE ARE</h2>
                </div>
              </div>
              <div>
                <div className="space-y-6">
                  <p className="text-xl font-medium text-foreground">We game smart. We support smarter.</p>
                  <p className="text-lg font-medium text-foreground">
                    BrainBerry welcomes all neurodiverse learners. From first-time players to advanced problem-solvers.
                  </p>
                  <p className="text-lg font-medium text-foreground">
                    Our mission: Build confidence through personalized gaming. Push boundaries. Share success.
                  </p>
                  <div className="bg-chart-4 border-4 border-border shadow-brutal-xl p-6">
                    <p className="text-main-foreground font-bold text-lg">
                      Rapid 2-week development for maximum therapeutic impact
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div>
                <div className="bg-black border-4 border-border shadow-brutal-3xl p-8 transform rotate-2 hover:shadow-[24px_24px_0px_0px_var(--color-border)] transition-all duration-300">
                  <Image
                    src="/therapy-gaming-tablet.png"
                    alt="Therapeutic gaming session"
                    width={500}
                    height={400}
                    className="border-2 border-border"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 bg-secondary-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <div className="bg-chart-2 border-4 border-border shadow-brutal-colored-xl p-4 inline-block mb-12 transform rotate-1">
              <h2 className="text-4xl md:text-5xl font-bold text-main-foreground">LEARNING PROGRAMS</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "FOCUS BUILDER", date: "ONGOING", location: "ATTENTION SKILLS" },
              { name: "SOCIAL NAVIGATOR", date: "WEEKLY", location: "COMMUNICATION" },
              { name: "SENSORY EXPLORER", date: "DAILY", location: "REGULATION" },
            ].map((program, i) => (
              <div key={i}>
                <div className="bg-black text-white border-4 border-border shadow-brutal-2xl hover:shadow-[20px_20px_0px_0px_var(--color-border)] transition-all duration-300 p-6">
                  <h3 className="text-2xl font-bold text-white mb-4">{program.name}</h3>
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 mr-2 text-white" />
                    <span className="font-medium text-white">{program.date}</span>
                  </div>
                  <div className="flex items-center mb-6">
                    <MapPin className="h-5 w-5 mr-2 text-white" />
                    <span className="font-medium text-white">{program.location}</span>
                  </div>
                  <button className="bg-main text-main-foreground px-6 py-3 border-2 border-border shadow-brutal hover:shadow-brutal-lg transition-all font-bold w-full">
                    START PROGRAM
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Game Types Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <div className="bg-chart-5 border-4 border-border shadow-brutal-colored p-4 inline-block mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-main-foreground">THERAPEUTIC GAMES</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "PUZZLE GAMES", desc: "Problem-solving and logic building" },
              { title: "SOCIAL STORIES", desc: "Interactive narrative experiences" },
              { title: "SENSORY PLAY", desc: "Regulation and calming activities" },
              { title: "SKILL BUILDERS", desc: "Personalized learning challenges" },
            ].map((gameType, i) => (
              <div key={i}>
                <div className="bg-black text-white border-4 border-border shadow-brutal-xl p-6 hover:shadow-[16px_16px_0px_0px_var(--color-border)] transition-all duration-300">
                  <div className="bg-chart-1 border-2 border-border shadow-[8px_8px_0px_0px_var(--color-border)] p-4 mb-4">
                    <Image
                      src="/placeholder-uz0c2.png"
                      alt="Educational game"
                      width={100}
                      height={100}
                      className="w-full h-20 object-cover border border-border"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{gameType.title}</h3>
                  <p className="text-white font-medium">{gameType.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-20 bg-secondary-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <div className="bg-chart-4 border-4 border-border shadow-brutal-colored-xl p-4 inline-block mb-12 transform -rotate-1">
              <h2 className="text-4xl md:text-5xl font-bold text-main-foreground">SUCCESS STORIES</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="relative bg-black border-4 border-border shadow-[24px_24px_0px_0px_var(--color-border)] overflow-hidden">
                <Image
                  src="/happy-child-achievement.png"
                  alt="Learning breakthrough story"
                  width={500}
                  height={300}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-overlay flex items-end">
                  <div className="bg-chart-2 border-t-4 border-border p-6 w-full">
                    <h3 className="text-2xl font-bold text-main-foreground mb-2">FIRST BREAKTHROUGH MOMENT</h3>
                    <button className="text-main-foreground font-medium underline">READ MORE →</button>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="relative bg-black border-4 border-border shadow-[24px_24px_0px_0px_var(--color-border)] overflow-hidden">
                <Image
                  src="/parent-therapist-brainberry.png"
                  alt="Building confidence story"
                  width={500}
                  height={300}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-overlay flex items-end">
                  <div className="bg-chart-3 border-t-4 border-border p-6 w-full">
                    <h3 className="text-2xl font-bold text-main-foreground mb-2">BUILDING CONFIDENCE TOGETHER</h3>
                    <button className="text-main-foreground font-medium underline">READ MORE →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section id="join" className="py-20 bg-main">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div>
            <div className="bg-black text-white border-4 border-border shadow-[28px_28px_0px_0px_var(--color-border)] p-8 mb-8 transform rotate-1">
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">READY TO START LEARNING?</h2>
              <p className="text-xl text-white font-medium mb-8">
                Join our community of families and therapists. All learners welcome.
              </p>
              <button
                onClick={openTrialFlow}
                className="bg-chart-2 text-main-foreground px-12 py-6 border-4 border-border shadow-brutal-2xl hover:shadow-brutal-3xl transition-all font-bold text-2xl"
              >
                START FREE TRIAL
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-background border-t-4 border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Brain className="h-8 w-8 text-foreground" />
                  <span className="text-xl font-bold text-foreground">BRAINBERRY</span>
                </div>
                <p className="text-foreground font-medium mb-4">
                  123 Learning Ave
                  <br />
                  Austin, TX 78701
                </p>
                <p className="text-foreground font-medium">hello@brainberry.com</p>
              </div>
            </div>
            <div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">NAVIGATION</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#about" className="text-foreground hover:text-main font-medium">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#programs" className="text-foreground hover:text-main font-medium">
                      Programs
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="text-foreground hover:text-main font-medium">
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a href="#contact" className="text-foreground hover:text-main font-medium">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">STAY CONNECTED</h3>
                <div className="flex space-x-4 mb-6">
                  <Instagram className="h-6 w-6 text-foreground hover:text-main cursor-pointer" />
                  <Facebook className="h-6 w-6 text-foreground hover:text-main cursor-pointer" />
                  <Twitter className="h-6 w-6 text-foreground hover:text-main cursor-pointer" />
                </div>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="flex-1 px-4 py-2 border-2 border-border bg-background text-foreground font-medium"
                  />
                  <button className="bg-main text-main-foreground px-6 py-2 border-2 border-l-0 border-border shadow-[12px_12px_0px_0px_var(--color-border)] hover:shadow-[16px_16px_0px_0px_var(--color-border)] transition-all font-bold">
                    SUBSCRIBE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {modalStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black shadow-brutal-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b-4 border-black">
              <h2 className="text-2xl font-bold">{modalStep === "role-selection" ? "Choose Your Role" : "Sign In"}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 border-2 border-black shadow-brutal">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Role Selection */}
            {modalStep === "role-selection" && (
              <div className="p-6 space-y-4">
                <p className="text-lg font-medium text-center mb-6">Select your role to get started with BrainBerry</p>

                <button
                  onClick={() => selectRole("THERAPIST_PARENT")}
                  className="w-full bg-chart-1 text-main-foreground p-6 border-4 border-black shadow-brutal hover:shadow-brutal-lg transition-all"
                >
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <Users className="h-8 w-8" />
                    <span className="text-xl font-bold">THERAPIST / PARENT</span>
                  </div>
                  <p className="text-sm font-medium">
                    Full access to create games, manage children, and view analytics
                  </p>
                </button>

                <button
                  onClick={() => selectRole("CHILD")}
                  className="w-full bg-chart-2 text-main-foreground p-6 border-4 border-black shadow-brutal hover:shadow-brutal-lg transition-all"
                >
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <User className="h-8 w-8" />
                    <span className="text-xl font-bold">CHILD</span>
                  </div>
                  <p className="text-sm font-medium">Play-only access to assigned games and activities</p>
                </button>
              </div>
            )}

            {/* Login Forms */}
            {modalStep === "login" && (
              <div className="p-6">
                <div className="mb-6 text-center">
                  <div
                    className={`inline-block px-4 py-2 border-2 border-black shadow-brutal ${
                      selectedRole === "THERAPIST_PARENT" ? "bg-chart-1" : "bg-chart-2"
                    } text-main-foreground font-bold`}
                  >
                    {selectedRole === "THERAPIST_PARENT" ? "THERAPIST / PARENT" : "CHILD"} LOGIN
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {selectedRole === "THERAPIST_PARENT" ? (
                    <>
                      <div>
                        <label className="block text-sm font-bold mb-2">Email</label>
                        <input
                          type="email"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-black shadow-brutal font-medium"
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Password</label>
                        <input
                          type="password"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-black shadow-brutal font-medium"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-bold mb-2">Child Access Code</label>
                      <input
                        type="text"
                        value={loginData.childCode}
                        onChange={(e) => setLoginData({ ...loginData, childCode: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-black shadow-brutal font-medium text-center text-2xl tracking-widest"
                        placeholder="ABC123"
                        required
                      />
                      <p className="text-sm text-gray-600 mt-2 text-center">
                        Ask your therapist or parent for your access code
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setModalStep("role-selection")}
                      className="flex-1 bg-gray-200 text-black px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
                    >
                      BACK
                    </button>
                    <button
                      type="submit"
                      className={`flex-1 px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-main-foreground ${
                        selectedRole === "THERAPIST_PARENT" ? "bg-chart-1" : "bg-chart-2"
                      }`}
                    >
                      SIGN IN
                    </button>
                  </div>
                </form>

                {selectedRole === "THERAPIST_PARENT" && (
                  <div className="mt-6 pt-4 border-t-2 border-gray-200 text-center">
                    <p className="text-sm text-gray-600 mb-2">Don't have an account?</p>
                    <button className="text-main font-bold underline">Create Free Account</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
