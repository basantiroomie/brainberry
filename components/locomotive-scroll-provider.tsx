"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

interface LocomotiveScrollProviderProps {
  children: React.ReactNode
}

export default function LocomotiveScrollProvider({ children }: LocomotiveScrollProviderProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const locomotiveScrollRef = useRef<any>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !scrollRef.current) return

    let LocomotiveScroll: any

    const initializeScroll = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const locomotiveModule = await import("locomotive-scroll")
        LocomotiveScroll = locomotiveModule.default

        // Initialize Locomotive Scroll
        locomotiveScrollRef.current = new LocomotiveScroll({
          el: scrollRef.current,
          smooth: true,
          multiplier: 1,
          class: "is-revealed",
          scrollbarContainer: false,
          lerp: 0.1,
          smartphone: {
            smooth: false, // Disable smooth scrolling on mobile for better performance
            breakpoint: 767,
          },
          tablet: {
            smooth: true,
            breakpoint: 1024,
          },
        })

        // Update scroll on window resize
        const handleResize = () => {
          if (locomotiveScrollRef.current) {
            locomotiveScrollRef.current.update()
          }
        }

        window.addEventListener("resize", handleResize)

        // Cleanup function
        return () => {
          window.removeEventListener("resize", handleResize)
          if (locomotiveScrollRef.current) {
            locomotiveScrollRef.current.destroy()
            locomotiveScrollRef.current = null
          }
        }
      } catch (error) {
        console.warn("Failed to initialize Locomotive Scroll:", error)
        // Fallback: continue without smooth scrolling
      }
    }

    const cleanup = initializeScroll()

    return () => {
      cleanup.then((cleanupFn) => {
        if (cleanupFn) cleanupFn()
      })
    }
  }, [isClient])

  // Don't render until client-side
  if (!isClient) {
    return <div>{children}</div>
  }

  return (
    <div ref={scrollRef} data-scroll-container>
      {children}
    </div>
  )
}
