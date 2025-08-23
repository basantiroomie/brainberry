"use client"
import { Brain } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { HTMLAttributes } from 'react'

interface BrandLogoProps extends HTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'child' | 'footer'
  withTagline?: boolean
}

export function BrandLogo({ variant='default', className='', withTagline=false, ...rest }: BrandLogoProps) {
  const router = useRouter()
  const colorMap: Record<string,string> = {
    default: 'text-black',
    child: 'text-chart-2',
    footer: 'text-foreground'
  }
  return (
    <button
      onClick={() => router.push('/')}
      aria-label="Go to landing page"
      className={`group flex items-center space-x-2 font-bold focus:outline-none focus:ring-2 focus:ring-black ${className}`}
      {...rest}
    >
      <Brain className={`h-8 w-8 ${colorMap[variant]} group-hover:rotate-6 transition-transform`} />
      <span className={`text-xl font-bold tracking-wide ${colorMap[variant]}`}>BRAINBERRY</span>
      {withTagline && <span className="text-[10px] font-semibold text-gray-500">THERAPEUTIC GAMING</span>}
    </button>
  )
}
