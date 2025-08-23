// Centralized validation and error handling utilities
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { logger } from './logger'

export type ValidationError = {
  field: string
  message: string
}

export type ApiError = {
  success: false
  error: string
  message: string
  code?: string
  details?: any
  timestamp: string
}

export type ApiSuccess<T = any> = {
  success: true
  data: T
  timestamp: string
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError

// Error classes for better error handling
export class ValidationException extends Error {
  constructor(
    public errors: ValidationError[],
    message = 'Validation failed'
  ) {
    super(message)
    this.name = 'ValidationException'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends Error {
  constructor(message = 'Resource conflict') {
    super(message)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message)
    this.name = 'RateLimitError'
  }
}

// Validation utilities
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }))
      
      logger.warn('Validation failed', context, validationErrors)
      throw new ValidationException(validationErrors)
    }
    
    logger.error('Unexpected validation error', error, context)
    throw error
  }
}

export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
  context?: string
): Promise<T> {
  try {
    const body = await request.json()
    return validateRequest(schema, body, context)
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ValidationException([
        { field: 'body', message: 'Invalid JSON format' }
      ])
    }
    throw error
  }
}

export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>,
  context?: string
): T {
  const params = Object.fromEntries(searchParams.entries())
  return validateRequest(schema, params, context)
}

// Response utilities
export function createSuccessResponse<T>(
  data: T,
  status = 200
): NextResponse<ApiSuccess<T>> {
  const response: ApiSuccess<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json(response, { status })
}

export function createErrorResponse(
  error: string | Error,
  status = 500,
  code?: string,
  details?: any
): NextResponse<ApiError> {
  const errorMessage = error instanceof Error ? error.message : error
  const errorName = error instanceof Error ? error.name : 'Error'
  
  const response: ApiError = {
    success: false,
    error: errorName,
    message: errorMessage,
    code,
    details,
    timestamp: new Date().toISOString()
  }
  
  // Log error for monitoring
  logger.error(`API Error: ${errorMessage}`, error instanceof Error ? error : undefined, 'API')
  
  return NextResponse.json(response, { status })
}

// Error handler for API routes
export function handleApiError(
  error: unknown,
  context?: string
): NextResponse<ApiError> {
  logger.error('API error occurred', error, context)
  
  if (error instanceof ValidationException) {
    return createErrorResponse(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      error.errors
    )
  }
  
  if (error instanceof NotFoundError) {
    return createErrorResponse(error.message, 404, 'NOT_FOUND')
  }
  
  if (error instanceof UnauthorizedError) {
    return createErrorResponse(error.message, 401, 'UNAUTHORIZED')
  }
  
  if (error instanceof ForbiddenError) {
    return createErrorResponse(error.message, 403, 'FORBIDDEN')
  }
  
  if (error instanceof ConflictError) {
    return createErrorResponse(error.message, 409, 'CONFLICT')
  }
  
  if (error instanceof RateLimitError) {
    return createErrorResponse(error.message, 429, 'RATE_LIMIT_EXCEEDED')
  }
  
  // Generic error
  const message = error instanceof Error ? error.message : 'Internal server error'
  return createErrorResponse(message, 500, 'INTERNAL_ERROR')
}

// Async error wrapper for API routes
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse<ApiError>> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error, 'API_HANDLER')
    }
  }
}

// Database error utilities
export function handleDatabaseError(error: any): never {
  logger.error('Database error', error, 'DATABASE')
  
  // Handle common database errors
  if (error?.code === '23505') {
    throw new ConflictError('Resource already exists')
  }
  
  if (error?.code === '23503') {
    throw new ValidationException([
      { field: 'reference', message: 'Referenced resource does not exist' }
    ])
  }
  
  if (error?.code === '42P01') {
    throw new Error('Database schema error: table does not exist')
  }
  
  throw new Error('Database operation failed')
}

// Type guards
export function isApiError(response: any): response is ApiError {
  return response && typeof response === 'object' && response.success === false
}

export function isApiSuccess<T>(response: any): response is ApiSuccess<T> {
  return response && typeof response === 'object' && response.success === true
}

// Utility for safe async operations
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T,
  context?: string
): Promise<T | undefined> {
  try {
    return await operation()
  } catch (error) {
    logger.error(`Safe async operation failed: ${context}`, error, 'SAFE_ASYNC')
    return fallback
  }
}

// Utility for retrying operations
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
  context?: string
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      logger.warn(`Retry attempt ${attempt}/${maxRetries} failed: ${context}`, context, error)
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }
  
  logger.error(`All retry attempts failed: ${context}`, lastError, 'RETRY')
  throw lastError
}

// Environment validation
export function validateEnvironment(required: string[]): void {
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`
    logger.error(message, undefined, 'ENV')
    throw new Error(message)
  }
}
