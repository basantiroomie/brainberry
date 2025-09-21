"use client"

import { useEffect } from "react"

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in development and in browser
    if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return

    // Monitor Core Web Vitals
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "measure") {
              console.log(`${entry.name}: ${entry.duration}ms`)
            }
          }
        })

        observer.observe({ entryTypes: ["measure", "navigation"] })

        return () => observer.disconnect()
      } catch (error) {
        console.log("Performance monitoring not available:", error)
      }
    }

    // Monitor LCP, FID, CLS (optional - only if web-vitals is installed)
    try {
      // Type-safe dynamic import for optional web-vitals
      import("web-vitals" as any).then((webVitals: any) => {
        if (webVitals) {
          const { getCLS, getFID, getFCP, getLCP, getTTFB } = webVitals
          getCLS(console.log)
          getFID(console.log)
          getFCP(console.log)
          getLCP(console.log)
          getTTFB(console.log)
        }
      }).catch(() => {
        // web-vitals not installed, skip
      })
    } catch (error) {
      // web-vitals not available, skip
    }
  }, [])

  return null
}