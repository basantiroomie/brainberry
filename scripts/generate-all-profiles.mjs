import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

const supabase = createClient(supabaseUrl, supabaseKey)

// Generate a consistent color based on the child's name
function generateColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 50%)`
}

// Get initials from name
function getInitials(name) {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

// Generate profile picture using Canvas API (Node.js)
async function generateProfilePicture(childName, size = 256) {
  // For Node.js, we'll create a simple data URL
  const initials = getInitials(childName)
  const bgColor = generateColor(childName)
  
  // Create a simple SVG-based profile picture
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${bgColor}"/>
      <text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="middle" 
            font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white">
        ${initials}
      </text>
    </svg>
  `
  
  // Convert SVG to data URL
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  return dataUrl
}

async function generateAllProfiles() {
  console.log('🎨 Generating profile pictures for all children...\n')
  
  const { data: children, error } = await supabase
    .from('ChildProfile')
    .select('id, name, avatar_url, avatar_headshot_url')
  
  if (error) {
    console.error('Error fetching children:', error)
    return
  }
  
  console.log(`Found ${children.length} children`)
  
  for (const child of children) {
    console.log(`\n${child.name}:`)
    
    // Generate profile picture
    try {
      const profileDataUrl = await generateProfilePicture(child.name)
      
      // Update the child's headshot URL
      const { error: updateError } = await supabase
        .from('ChildProfile')
        .update({ avatar_headshot_url: profileDataUrl })
        .eq('id', child.id)
      
      if (updateError) {
        console.log(`  ❌ Error updating: ${updateError.message}`)
      } else {
        console.log(`  ✅ Generated profile picture`)
      }
    } catch (error) {
      console.log(`  ❌ Error generating profile: ${error.message}`)
    }
  }
  
  console.log('\n✅ Profile picture generation complete!')
  console.log('🔄 Refresh your browser to see the new profile pictures!')
}

generateAllProfiles().catch(console.error)