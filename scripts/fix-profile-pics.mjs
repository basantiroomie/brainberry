#!/usr/bin/env node

/**
 * Simple script to fix missing profile pictures using ES modules
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read environment variables from .env.local
const envContent = readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMissingProfilePics() {
  try {
    console.log('🔍 Checking for children with missing profile pictures...');
    
    // Get all children who have avatars
    const { data: children, error } = await supabase
      .from('ChildProfile')
      .select('id, name, avatar_url, avatar_headshot_url');

    if (error) {
      console.error('❌ Error fetching children:', error);
      return;
    }

    if (!children || children.length === 0) {
      console.log('❌ No children found');
      return;
    }

    console.log(`📋 Found ${children.length} children:`);
    
    const childrenNeedingFix = [];
    
    children.forEach(child => {
      const hasAvatar = child.avatar_url && child.avatar_url !== 'null' && child.avatar_url.trim() !== '';
      const hasValidHeadshot = child.avatar_headshot_url && 
        child.avatar_headshot_url !== 'null' && 
        child.avatar_headshot_url.trim() !== '';
        
      console.log(`  - ${child.name} (ID: ${child.id}) - Avatar: ${hasAvatar ? '✅' : '❌'} | Headshot: ${hasValidHeadshot ? '✅' : '❌'}`);
      
      if (hasAvatar && !hasValidHeadshot) {
        childrenNeedingFix.push(child);
      }
    });

    if (childrenNeedingFix.length === 0) {
      console.log('✅ All children with avatars already have profile pictures!');
      return;
    }

    console.log(`\n🔧 Fixing ${childrenNeedingFix.length} children with missing profile pictures...`);

    // Fix profile pictures for each child
    for (const child of childrenNeedingFix) {
      console.log(`\n🎨 Fixing profile picture for ${child.name}...`);
      
      try {
        // Extract Ready Player Me ID from avatar URL
        const readyPlayerMeId = child.avatar_url.match(/\/([a-f0-9-]+)\.glb$/)?.[1];
        
        if (!readyPlayerMeId) {
          console.log(`⚠️  Could not extract Ready Player Me ID from: ${child.avatar_url}`);
          continue;
        }
        
        // Generate headshot URL from Ready Player Me
        const headshot_url = `https://models.readyplayer.me/${readyPlayerMeId}.png`;
        
        console.log(`📸 Generated headshot URL: ${headshot_url}`);
        
        // Update the child profile with the headshot URL
        const { error: updateError } = await supabase
          .from('ChildProfile')
          .update({ avatar_headshot_url: headshot_url })
          .eq('id', child.id);

        if (updateError) {
          console.error(`❌ Failed to update ${child.name}:`, updateError);
        } else {
          console.log(`✅ Profile picture fixed for ${child.name}`);
        }
        
      } catch (error) {
        console.error(`❌ Error fixing profile picture for ${child.name}:`, error.message);
      }
      
      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n🎉 Profile picture fix complete!');
    console.log('🔄 Please refresh your browser to see the updated profile pictures.');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
fixMissingProfilePics();