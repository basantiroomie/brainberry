"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Brain, User, Users, X } from "lucide-react"
import Link from "next/link"

type UserRole = "THERAPIST_PARENT" | "CHILD" | null
type ModalStep = "role-selection" | "login" | null

export default function LoginPage() {
  const router = useRouter()
  const [modalStep, setModalStep] = useState<ModalStep>("role-selection")
  const [selectedRole, setSelectedRole] = useState<UserRole>(null)
  const [loginData, setLoginData] = useState({ email: "", password: "", childCode: "" })

  const selectRole = (role: UserRole) => {
    setSelectedRole(role)
    setModalStep("login")
  }

  const goBack = () => {
    if (modalStep === "login") {
      setModalStep("role-selection")
      setSelectedRole(null)
    } else {
      router.push("/")
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Handle login logic here
    console.log("Login attempt:", { role: selectedRole, data: loginData })
    
    // Redirect based on role
    if (selectedRole === "CHILD") {
      router.push("/child")
    } else if (selectedRole === "THERAPIST_PARENT") {
      router.push("/parent")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-white border-b-4 border-black shadow-brutal-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-black" />
              <span className="text-xl font-bold text-black">BRAINBERRY</span>
            </Link>
            <Link 
              href="/"
              className="text-black hover:text-main font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      <div className="w-full max-w-md mx-auto p-4">
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {modalStep === "role-selection" ? "Choose Your Role" : "Sign In"}
            </h2>
            <button onClick={goBack} className="text-gray-500 hover:text-black">
              <X className="h-6 w-6" />
            </button>
          </div>

          {modalStep === "role-selection" && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-gray-600">Select your role to continue</p>
              </div>
              <button
                onClick={() => selectRole("THERAPIST_PARENT")}
                className="w-full p-4 border-2 border-black bg-chart-1 text-white hover:shadow-brutal transition-all flex items-center justify-center space-x-3"
              >
                <Users className="h-6 w-6" />
                <span className="font-medium">PARENT / THERAPIST</span>
              </button>
              <button
                onClick={() => selectRole("CHILD")}
                className="w-full p-4 border-2 border-black bg-chart-2 text-white hover:shadow-brutal transition-all flex items-center justify-center space-x-3"
              >
                <User className="h-6 w-6" />
                <span className="font-medium">CHILD</span>
              </button>
            </div>
          )}

          {modalStep === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              {selectedRole === "THERAPIST_PARENT" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="w-full p-3 border-2 border-black focus:outline-none focus:shadow-brutal"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <input
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="w-full p-3 border-2 border-black focus:outline-none focus:shadow-brutal"
                      required
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">Child Access Code</label>
                  <input
                    type="text"
                    value={loginData.childCode}
                    onChange={(e) => setLoginData({ ...loginData, childCode: e.target.value })}
                    className="w-full p-3 border-2 border-black focus:outline-none focus:shadow-brutal text-center text-lg font-mono"
                    placeholder="Enter your code"
                    required
                  />
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-main text-main-foreground py-3 px-6 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
              >
                SIGN IN
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
