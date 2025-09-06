import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Simple health check
    const timestamp = new Date().toISOString()
    
    return NextResponse.json({
      status: 'healthy',
      timestamp,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      message: 'BrainBerry is running successfully'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 500 }
    )
  }
}

// Keep the app warm
export async function POST() {
  return GET()
}
