"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useParallax } from "@/hooks/use-parallax"

interface ParallaxElementProps {
  children: React.ReactNode
  speed?: number
  className?: string
}

export default function ParallaxElement({ children, speed = 0.5, className = "" }: ParallaxElementProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [elementTop, setElementTop] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const scrollY = useParallax()

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
        if (entry.isIntersecting) {
          setElementTop(element.offsetTop)
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const transform = isVisible ? `translateY(${(scrollY - elementTop) * speed}px)` : "translateY(0px)"

  return (
    <div ref={elementRef} className={className} style={{ transform, willChange: "transform" }}>
      {children}
    </div>
  )
}
