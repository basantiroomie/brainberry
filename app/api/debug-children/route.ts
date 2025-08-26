import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get all children to see their structure
    const { data: children, error } = await supabase
      .from('ChildProfile')
      .select('*')
      .limit(5)
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error', details: error }, { status: 500 })
    }
    
    // Also get table schema info
    const { data: tableInfo, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'ChildProfile' })
      .single()
    
    return NextResponse.json({ 
      children, 
      tableInfo,
      schemaError,
      count: children?.length || 0 
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Failed to debug children', details: error }, { status: 500 })
  }
}