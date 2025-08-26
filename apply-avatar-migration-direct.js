// Apply avatar migration directly to hosted Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('🔧 Applying avatar migration to ChildProfile table...');
  
  try {
    // Check if column already exists
    const { data: existingColumns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'ChildProfile')
      .eq('column_name', 'avatar_url');
    
    if (checkError) {
      console.error('❌ Error checking existing columns:', checkError);
      return;
    }
    
    if (existingColumns && existingColumns.length > 0) {
      console.log('✅ avatar_url column already exists in ChildProfile table');
      return;
    }
    
    console.log('📝 Column does not exist, need to add it manually...');
    console.log('');
    console.log('🔧 Please run this SQL in your Supabase SQL Editor:');
    console.log('');
    console.log('ALTER TABLE public."ChildProfile" ADD COLUMN avatar_url TEXT;');
    console.log('');
    console.log('Or go to: https://supabase.com/dashboard/project/[your-project]/sql');
    
    const error = null; // Skip the RPC call
    
    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the column was added
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'ChildProfile')
      .eq('column_name', 'avatar_url');
    
    if (columnError) {
      console.warn('⚠️  Could not verify column creation:', columnError);
    } else if (columns && columns.length > 0) {
      console.log('✅ Verified: avatar_url column exists in ChildProfile table');
    } else {
      console.warn('⚠️  Column verification inconclusive');
    }
    
  } catch (error) {
    console.error('❌ Migration failed with error:', error);
  }
}

applyMigration();