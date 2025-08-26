// Check ChildProfile schema and guide manual migration
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkSchema() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('🔍 Checking ChildProfile table schema...');
  
  try {
    // Try to select from ChildProfile to see current structure
    const { data, error } = await supabase
      .from('ChildProfile')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing ChildProfile table:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('✅ Current ChildProfile columns:', columns);
      
      if (columns.includes('avatar_url')) {
        console.log('✅ avatar_url column already exists!');
        console.log('   The database migration is complete.');
      } else {
        console.log('❌ avatar_url column is missing');
        console.log('');
        console.log('🔧 MANUAL MIGRATION REQUIRED:');
        console.log('');
        console.log('1. Go to your Supabase Dashboard:');
        console.log(`   ${supabaseUrl.replace('/rest/v1', '')}/project/zdlyowgbwooplxzkdfhp/sql`);
        console.log('');
        console.log('2. Run this SQL command:');
        console.log('');
        console.log('   ALTER TABLE public."ChildProfile" ADD COLUMN avatar_url TEXT;');
        console.log('');
        console.log('3. Click "Run" to execute the migration');
        console.log('');
        console.log('4. Re-run this script to verify the column was added');
      }
    } else {
      console.log('⚠️  ChildProfile table exists but has no data');
      console.log('   Cannot determine current schema from empty table');
      
      // Try to insert a test record to see what columns are required
      console.log('');
      console.log('🔧 MANUAL MIGRATION REQUIRED:');
      console.log('');
      console.log('Please add the avatar_url column manually:');
      console.log('ALTER TABLE public."ChildProfile" ADD COLUMN avatar_url TEXT;');
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkSchema();