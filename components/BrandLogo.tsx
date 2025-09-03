"use client"
import { useRouter } from 'next/navigation'
import { HTMLAttributes } from 'react'
import Image from 'next/image'

interface BrandLogoProps extends HTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'child' | 'footer'
  withTagline?: boolean
}

export function BrandLogo({ variant='default', className='', withTagline=false, ...rest }: BrandLogoProps) {
  const router = useRouter()
  
  return (
    <button
      onClick={() => router.push('/')}
      aria-label="Go to landing page"
      className={`group flex items-center focus:outline-none focus:ring-2 focus:ring-black ${className}`}
      {...rest}
    >
      <Image 
        src="/BrainBerrylogo.png" 
        alt="BrainBerry Logo" 
        width={120} 
        height={40} 
        className="h-10 w-auto group-hover:scale-110 transition-transform"
      />
      {withTagline && <span className="text-[10px] font-semibold text-gray-500 ml-2">THERAPEUTIC GAMING</span>}
    </button>
  )
}
