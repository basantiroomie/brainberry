#!/usr/bin/env node

/**
 * Script to check the actual profile picture URLs
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

async function checkProfilePics() {
  try {
    console.log('🔍 Checking profile picture URLs...');
    
    // Get all children
    const { data: children, error } = await supabase
      .from('ChildProfile')
      .select('id, name, avatar_url, avatar_headshot_url')
      .order('name');

    if (error) {
      console.error('❌ Error fetching children:', error);
      return;
    }

    if (!children || children.length === 0) {
      console.log('❌ No children found');
      return;
    }

    console.log(`\n📋 Found ${children.length} children:\n`);
    
    children.forEach((child, index) => {
      console.log(`${index + 1}. ${child.name} (ID: ${child.id})`);
      console.log(`   Avatar URL: ${child.avatar_url || 'None'}`);
      console.log(`   Headshot URL: ${child.avatar_headshot_url || 'None'}`);
      
      if (child.avatar_headshot_url) {
        // Check if it's a Ready Player Me URL
        if (child.avatar_headshot_url.includes('readyplayer.me')) {
          console.log(`   📸 Type: Ready Player Me PNG`);
        } else if (child.avatar_headshot_url.includes('supabase')) {
          console.log(`   📸 Type: Custom Supabase Upload`);
        } else {
          console.log(`   📸 Type: Other`);
        }
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
checkProfilePics();