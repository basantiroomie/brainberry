// Setup avatar storage buckets if they don't exist
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

async function setupAvatarStorage() {
  console.log('Setting up avatar storage buckets...')
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Check existing buckets
    console.log('\n1. Checking existing buckets:')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return
    }
    
    console.log('Existing buckets:', buckets.map(b => b.id))
    
    // Create avatar-photos bucket if it doesn't exist
    const avatarPhotosExists = buckets.some(b => b.id === 'avatar-photos')
    if (!avatarPhotosExists) {
      console.log('\n2. Creating avatar-photos bucket...')
      const { data: photoBucket, error: photoError } = await supabase.storage.createBucket('avatar-photos', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      })
      
      if (photoError) {
        console.error('Error creating avatar-photos bucket:', photoError)
      } else {
        console.log('✓ avatar-photos bucket created successfully')
      }
    } else {
      console.log('✓ avatar-photos bucket already exists')
    }
    
    // Create avatar-headshots bucket if it doesn't exist
    const avatarHeadshotsExists = buckets.some(b => b.id === 'avatar-headshots')
    if (!avatarHeadshotsExists) {
      console.log('\n3. Creating avatar-headshots bucket...')
      const { data: headshotBucket, error: headshotError } = await supabase.storage.createBucket('avatar-headshots', {
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      })
      
      if (headshotError) {
        console.error('Error creating avatar-headshots bucket:', headshotError)
      } else {
        console.log('✓ avatar-headshots bucket created successfully')
      }
    } else {
      console.log('✓ avatar-headshots bucket already exists')
    }
    
    // Verify final state
    console.log('\n4. Final verification:')
    const { data: finalBuckets } = await supabase.storage.listBuckets()
    const avatarBuckets = finalBuckets.filter(b => b.id.includes('avatar'))
    console.log('Avatar-related buckets:', avatarBuckets.map(b => `${b.id} (${b.public ? 'public' : 'private'})`))
    
    console.log('\n✅ Avatar storage setup completed!')

  } catch (error) {
    console.error('Setup error:', error)
  }
}

setupAvatarStorage().catch(console.error)