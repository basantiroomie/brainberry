import { NextRequest, NextResponse } from 'next/server'

// Static expression images available in the public/expressions folder
const EXPRESSION_IMAGES = {
  happy: '/expressions/happy.jpg',
  sad: '/expressions/sad.jpg',
  angry: '/expressions/angry.jpeg',
  surprised: '/expressions/surprised.jpeg'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { expressions, emotions } = body
    
    console.log('Generate expression images request:', body)
    
    // Return static image paths instead of generating new images
    const imageResults = []
    
    // Handle both 'expressions' and 'emotions' field names
    const requestedExpressions = expressions || emotions
    
    if (requestedExpressions && Array.isArray(requestedExpressions)) {
      for (const expression of requestedExpressions) {
        const expressionKey = expression.toLowerCase()
        if (EXPRESSION_IMAGES[expressionKey as keyof typeof EXPRESSION_IMAGES]) {
          imageResults.push({
            expression: expression,
            imageUrl: EXPRESSION_IMAGES[expressionKey as keyof typeof EXPRESSION_IMAGES],
            success: true
          })
        } else {
          imageResults.push({
            expression: expression,
            imageUrl: null,
            success: false,
            error: `No static image available for expression: ${expression}`
          })
        }
      }
    } else {
      // If no specific expressions requested, return all available images
      Object.entries(EXPRESSION_IMAGES).forEach(([expression, imageUrl]) => {
        imageResults.push({
          expression: expression,
          imageUrl: imageUrl,
          success: true
        })
      })
    }
    
    return NextResponse.json({
      success: true,
      images: imageResults,
      message: 'Static expression images retrieved successfully'
    }, { status: 200 })
    
  } catch (error) {
    console.error('Error in generate-expression-images:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Return all available static expression images
  const allImages = Object.entries(EXPRESSION_IMAGES).map(([expression, imageUrl]) => ({
    expression,
    imageUrl,
    available: true
  }))
  
  return NextResponse.json({
    success: true,
    availableExpressions: allImages,
    message: 'Available static expression images'
  }, { status: 200 })
}
