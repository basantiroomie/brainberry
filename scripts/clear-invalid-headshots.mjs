import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearInvalidHeadshots() {
  console.log('Clearing invalid headshot URLs to trigger regeneration...')
  
  const { error } = await supabase
    .from('ChildProfile')
    .update({ avatar_headshot_url: null })
    .not('avatar_url', 'is', null)
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('✅ Cleared all headshot URLs. The system will now generate new ones automatically.')
  }
}

clearInvalidHeadshots().catch(console.error)