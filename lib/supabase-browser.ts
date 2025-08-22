import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase env vars missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env, then restart dev server')
  }
  // Basic sanity validation to help diagnose "Invalid API key" quickly
  const problems: string[] = []
  if (!/^https:\/\/.+\.supabase\.co$/.test(url)) problems.push('URL does not look like a Supabase project URL (*.supabase.co)')
  if (!/^eyJ/.test(key)) problems.push('Anon key should start with eyJ (standard JWT base64 header). Yours starts with ' + key.slice(0,3))
  if (key.length < 100) problems.push('Anon key length seems too short (<100 chars)')
  if (problems.length && typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.error('[Supabase Env Validation]', { urlPrefix: url.slice(0,40), keyStart: key.slice(0,5), issues: problems })
  }
  return createBrowserClient(url, key)
}
