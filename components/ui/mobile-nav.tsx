"use client"

import { useState, memo } from "react"
import { Menu, X } from "lucide-react"

interface MobileNavProps {
  onLoginClick: () => void
}

export const MobileNav = memo(function MobileNav({ onLoginClick }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* Mobile menu button */}
      <button 
        className="md:hidden p-2 touch-manipulation btn-mobile"
        onClick={toggleMenu}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={closeMenu}
          />
          <div className="fixed top-0 right-0 h-full w-64 bg-white border-l-4 border-black shadow-brutal-xl z-50 md:hidden safe-area-inset">
            <div className="p-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">Menu</h2>
                <button 
                  onClick={closeMenu}
                  className="p-2 touch-manipulation"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="space-y-4">
                <a 
                  href="#about" 
                  className="block text-black hover:text-main font-medium transition-colors touch-manipulation py-2"
                  onClick={closeMenu}
                >
                  About
                </a>
                <a 
                  href="#programs" 
                  className="block text-black hover:text-main font-medium transition-colors touch-manipulation py-2"
                  onClick={closeMenu}
                >
                  Programs
                </a>
                <a 
                  href="/community" 
                  className="block text-black hover:text-main font-medium transition-colors touch-manipulation py-2"
                  onClick={closeMenu}
                >
                  Community
                </a>
                <button
                  onClick={() => {
                    onLoginClick()
                    closeMenu()
                  }}
                  className="w-full bg-main text-main-foreground px-4 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold touch-manipulation btn-mobile mt-4"
                >
                  LOGIN
                </button>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  )
})

MobileNav.displayName = "MobileNav"