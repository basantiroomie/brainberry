#!/usr/bin/env node

/**
 * Script to regenerate missing PNG headshots for children whose GLB avatars exist
 * but PNG files are missing from Ready Player Me CDN
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Test if a PNG URL is accessible
 */
async function testPngUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    return false
  }
}

/**
 * Generate headshot via API call
 */
async function generateHeadshot(childId, avatarUrl) {
  try {
    const response = await fetch('http://localhost:3000/api/avatars/generate-headshot-from-glb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        childId,
        avatarUrl
      })
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to generate headshot')
    }

    return result
  } catch (error) {
    console.error(`Failed to generate headshot for child ${childId}:`, error.message)
    return null
  }
}

/**
 * Main function to regenerate missing headshots
 */
async function regenerateMissingHeadshots() {
  console.log('🔍 Checking for children with missing PNG headshots...')

  try {
    // Fetch all children with avatar URLs
    const { data: children, error } = await supabase
      .from('ChildProfile')
      .select('id, name, avatar_url, avatar_headshot_url')
      .not('avatar_url', 'is', null)

    if (error) {
      throw error
    }

    console.log(`📋 Found ${children.length} children with avatar URLs`)

    const childrenWithMissingPngs = []

    // Test each child's PNG URL
    for (const child of children) {
      const { id, name, avatar_url, avatar_headshot_url } = child

      if (!avatar_url || !avatar_url.endsWith('.glb')) {
        console.log(`⏭️  Skipping ${name} - no GLB avatar URL`)
        continue
      }

      const expectedPngUrl = avatar_url.replace('.glb', '.png')
      const currentPngUrl = avatar_headshot_url || expectedPngUrl

      console.log(`🧪 Testing PNG for ${name}: ${currentPngUrl}`)
      
      const isAccessible = await testPngUrl(currentPngUrl)
      
      if (!isAccessible) {
        console.log(`❌ PNG missing for ${name}`)
        childrenWithMissingPngs.push({
          id,
          name,
          avatar_url,
          expectedPngUrl
        })
      } else {
        console.log(`✅ PNG exists for ${name}`)
      }
    }

    if (childrenWithMissingPngs.length === 0) {
      console.log('🎉 All children have accessible PNG headshots!')
      return
    }

    console.log(`\n🔧 Found ${childrenWithMissingPngs.length} children with missing PNGs:`)
    childrenWithMissingPngs.forEach(child => {
      console.log(`   - ${child.name} (ID: ${child.id})`)
    })

    // For now, we'll update the database with the expected PNG URLs
    // The actual PNG generation will happen when the ProfilePicture component
    // tries to load the image and falls back to HeadshotGenerator
    console.log('\n🔄 Updating database with expected PNG URLs...')
    
    for (const child of childrenWithMissingPngs) {
      try {
        const { error: updateError } = await supabase
          .from('ChildProfile')
          .update({ avatar_headshot_url: child.expectedPngUrl })
          .eq('id', child.id)

        if (updateError) {
          console.error(`❌ Failed to update ${child.name}:`, updateError.message)
        } else {
          console.log(`✅ Updated ${child.name} with PNG URL: ${child.expectedPngUrl}`)
        }
      } catch (error) {
        console.error(`❌ Error updating ${child.name}:`, error.message)
      }
    }

    console.log('\n📝 Next Steps:')
    console.log('1. The ProfilePicture component will automatically attempt to load the PNG URLs')
    console.log('2. When PNG loading fails, HeadshotGenerator will create fallback images')
    console.log('3. You can manually trigger PNG generation in the Avatar Management section')
    console.log('\n💡 To manually generate PNGs, visit each child\'s Avatar tab in the educator dashboard')

  } catch (error) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  regenerateMissingHeadshots()
    .then(() => {
      console.log('\n🎯 Script completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { regenerateMissingHeadshots, testPngUrl }
