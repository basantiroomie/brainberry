import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) { return req.cookies.get(name)?.value },
      set(name: string, value: string, options: any) { res.cookies.set({ name, value, ...options }) },
      remove(name: string, options: any) { res.cookies.delete({ name, ...options }) }
    }
  })
  const { data: { user } } = await supabase.auth.getUser()
  const path = req.nextUrl.pathname
  const isApi = path.startsWith('/api')
  const publicPaths = ['/', '/login']
  const isPublic = publicPaths.includes(path) || path.startsWith('/api/auth/') || path === '/api/child-auth' || path === '/api/child-assignments' || path === '/api/child-analytics' || path === '/api/test-db' || path.startsWith('/api/personalized-molds') || path.startsWith('/api/customization-requests') || path === '/api/child-molds' || path === '/api/child-personalized-molds' || path === '/api/generate-image' || path === '/api/generate-expression-images' || path === '/api/debug-children' || path === '/api/avatars/save-headshot' || path === '/api/child-avatar' || path.startsWith('/api/chat')
  
  if (!user && (path.startsWith('/educator') || (isApi && !isPublic))) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return res
}

export const config = {
  matcher: ['/educator/:path*','/api/:path*']
}
