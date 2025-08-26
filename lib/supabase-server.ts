import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      }
    }
  })
}

export function createSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function requireEducator() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  logger.debug('Auth check', 'SUPABASE', { userId: user?.id, hasError: !!error })
  
  if (!user || error) {
    logger.warn('Authentication failed - no user or error', undefined, 'SUPABASE')
    return { user: null }
  }
  return { user }
}

export async function requireChild(childId: string, accessCode: string) {
  const supabase = createSupabaseServiceClient()
  
  const { data: child, error } = await supabase
    .from('ChildProfile')
    .select('id, name, access_code, avatar_url, avatar_permissions, educator_id')
    .eq('id', childId)
    .eq('access_code', accessCode)
    .single()

  if (error || !child) {
    logger.warn('Child authentication failed', 'SUPABASE', { 
      childId, 
      error: error?.message 
    })
    return { child: null }
  }

  logger.debug('Child auth check successful', 'SUPABASE', { 
    childId: child.id, 
    childName: child.name 
  })
  
  return { child }
}
