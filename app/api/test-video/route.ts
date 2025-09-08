import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const videoPath = join(process.cwd(), 'public', 'hero-video.mp4')
    
    if (!existsSync(videoPath)) {
      return NextResponse.json({ error: 'Video file not found', path: videoPath }, { status: 404 })
    }
    
    const stats = require('fs').statSync(videoPath)
    
    return NextResponse.json({ 
      message: 'Video file exists',
      size: stats.size,
      path: videoPath
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check video', details: error }, { status: 500 })
  }
}