#!/usr/bin/env node

/**
 * Script to generate missing profile pictures for children who have avatars
 * but are missing their headshot/profile pictures
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateMissingProfilePics() {
  try {
    console.log('🔍 Checking for children with missing profile pictures...');
    
    // Get all children who have avatars but missing headshots
    const { data: children, error } = await supabase
      .from('child_profiles')
      .select('id, name, avatar_url, avatar_headshot_url')
      .not('avatar_url', 'is', null)
      .is('avatar_headshot_url', null);

    if (error) {
      console.error('❌ Error fetching children:', error);
      return;
    }

    if (!children || children.length === 0) {
      console.log('✅ All children with avatars already have profile pictures!');
      return;
    }

    console.log(`📸 Found ${children.length} children needing profile pictures:`);
    children.forEach(child => {
      console.log(`  - ${child.name} (ID: ${child.id})`);
    });

    // Generate profile pictures for each child
    for (const child of children) {
      console.log(`\n🎨 Generating profile picture for ${child.name}...`);
      
      try {
        // Call the save-snapshot API to generate the profile picture
        const response = await fetch(`http://localhost:3000/api/avatars/save-snapshot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            childId: child.id,
            avatarUrl: child.avatar_url
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Profile picture generated for ${child.name}: ${result.headshot_url}`);
        } else {
          const error = await response.text();
          console.error(`❌ Failed to generate profile picture for ${child.name}: ${error}`);
        }
      } catch (error) {
        console.error(`❌ Error generating profile picture for ${child.name}:`, error.message);
      }
      
      // Add a small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 Profile picture generation complete!');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
generateMissingProfilePics();