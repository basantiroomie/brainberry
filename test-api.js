const { createClient } = require('@supabase/supabase-js')

// Test database connection directly
const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzcxNDQsImV4cCI6MjA3MTQ1MzE0NH0.o01tj8WOBJVYGx5hpS1xKESNa66JbJiBqNhh2zVAvlU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  console.log('Testing Supabase connection...')
  
  // Test 1: Check if we can query the ChildProfile table
  console.log('\n1. Querying ChildProfile table:')
  const { data: children, error: childError } = await supabase
    .from('ChildProfile')
    .select('*')
  
  if (childError) {
    console.error('Error querying children:', childError)
  } else {
    console.log('Children found:', children.length)
    console.log('Children:', children)
  }
  
  // Test 2: Check if we can query the EducatorAccount table
  console.log('\n2. Querying EducatorAccount table:')
  const { data: educators, error: educatorError } = await supabase
    .from('EducatorAccount')
    .select('*')
  
  if (educatorError) {
    console.error('Error querying educators:', educatorError)
  } else {
    console.log('Educators found:', educators.length)
    console.log('Educators:', educators)
  }
  
  // Test 3: Check authentication
  console.log('\n3. Testing authentication:')
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError) {
    console.error('Auth error:', authError)
  } else {
    console.log('Current user:', user?.id ? `${user.id} (${user.email})` : 'Not authenticated')
  }
}

testDatabase().catch(console.error)
