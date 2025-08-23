import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, requireEducator } from '@/lib/supabase-server'
import { childCreateSchema } from '@/lib/schemas'
import { 
  createSuccessResponse, 
  handleApiError, 
  withErrorHandling,
  validateRequestBody,
  handleDatabaseError,
  UnauthorizedError,
  NotFoundError
} from '@/utils/validation'
import { logger } from '@/utils/logger'

export const GET = withErrorHandling(async () => {
  const { user } = await requireEducator()
  if (!user) throw new UnauthorizedError()
  
  logger.api('GET', '/api/children', 200)
  
  const supabase = await createSupabaseServerClient()
  
  const { data: children, error } = await supabase
    .from('ChildProfile')
    .select('*')
    .eq('educator_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    handleDatabaseError(error)
  }
  
  logger.info('Successfully fetched children', 'API', { count: children?.length || 0 })
  return createSuccessResponse(children || [])
})

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { user } = await requireEducator()
  if (!user) throw new UnauthorizedError()
  
  const validatedData = await validateRequestBody(req, childCreateSchema, 'CREATE_CHILD')
  
  const supabase = await createSupabaseServerClient()

  // Ensure EducatorAccount exists
  const { error: educatorError } = await supabase
    .from('EducatorAccount')
    .select('id')
    .eq('id', user.id)
    .single()
  
  if (educatorError && educatorError.code === 'PGRST116') {
    // EducatorAccount doesn't exist, create it
    const { error: createError } = await supabase
      .from('EducatorAccount')
      .insert({ 
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0]
      })
    
    if (createError) {
      handleDatabaseError(createError)
    }
  }
  
  // Create the child profile  
  const { data: newChild, error: childError } = await supabase
    .from('ChildProfile')
    .insert({
      name: validatedData.name,
      age: validatedData.age,
      diagnosis: validatedData.diagnosis,
      notes: validatedData.notes,
      access_code: validatedData.access_code,
      educator_id: user.id
    })
    .select()
    .single()

  if (childError) {
    handleDatabaseError(childError)
  }
  
  logger.info('Child profile created successfully', 'API', { 
    childId: newChild.id,
    childName: newChild.name 
  })
  
  return createSuccessResponse(newChild, 201)
})
