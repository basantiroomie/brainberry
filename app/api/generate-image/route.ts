import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai-generation-service'

// Enhanced image generation using Google Imagen with Pollinations fallback
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const prompt = searchParams.get('prompt')
    const rawStyle = searchParams.get('style') || 'cartoon'
    const theme = searchParams.get('theme') || 'general'
    const childAge = parseInt(searchParams.get('age') || '6')

    // Map legacy style names to new style names
    const styleMap: Record<string, 'cartoon' | 'realistic' | 'watercolor' | 'digital-art'> = {
      'child_friendly': 'cartoon',
      'cartoon': 'cartoon',
      'realistic': 'realistic',
      'watercolor': 'watercolor',
      'digital-art': 'digital-art'
    }
    
    const style = styleMap[rawStyle] || 'cartoon'

    if (!prompt) {
      return NextResponse.json({ error: 'prompt parameter required' }, { status: 400 })
    }

    console.log(`Image generation request: ${prompt} (style: ${style}, theme: ${theme}, age: ${childAge})`)

    try {
      // Use the AI service to generate a single card
      const cards = await aiService.generatePersonalizedCards({
        theme,
        userPrompt: prompt,
        cardCount: 1,
        childAge,
        style,
        safetyLevel: 'strict'
      })

      if (cards.length > 0 && cards[0].imageUrl) {
        const card = cards[0]
        const imageUrl = card.imageUrl!
        
        // If it's a data URL (base64), convert to response
        if (imageUrl.startsWith('data:image/')) {
          const base64Data = imageUrl.split(',')[1]
          const imageBuffer = Buffer.from(base64Data, 'base64')
          
          return new NextResponse(new Uint8Array(imageBuffer), {
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=31536000'
            }
          })
        } else {
          // If it's a regular URL, redirect to it
          return NextResponse.redirect(imageUrl)
        }
      }
    } catch (aiError) {
      console.error('AI service failed, using fallback:', aiError)
    }

    // Fallback: Direct Pollinations API call
    try {
      const enhancedPrompt = `${prompt}, child-friendly ${style} style, bright colors, simple design, educational illustration, safe for children, cute, colorful, happy`
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=512&height=512&seed=${Math.floor(Math.random() * 1000000)}`
      
      console.log(`Using direct Pollinations fallback: ${pollinationsUrl}`)
      return NextResponse.redirect(pollinationsUrl)
      
    } catch (pollinationsError) {
      console.log('Direct Pollinations failed, trying Hugging Face...', pollinationsError)
    }

    // Method 2: Try Hugging Face Inference API (free with rate limits)
    const hfApiKey = process.env.HUGGINGFACE_API_KEY
    if (hfApiKey) {
      try {
        const enhancedPrompt = `${prompt}, child-friendly ${style} style, bright colors, simple design, educational illustration, safe for children, cute, colorful, happy`
        const hfResponse = await fetch(
          'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${hfApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: enhancedPrompt,
              parameters: {
                width: 512,
                height: 512,
                num_inference_steps: 20
              }
            }),
            signal: AbortSignal.timeout(10000) // 10 second timeout
          }
        )

        if (hfResponse.ok) {
          const imageBlob = await hfResponse.blob()
          const imageBuffer = await imageBlob.arrayBuffer()
          
          return new NextResponse(imageBuffer, {
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=31536000'
            }
          })
        }
      } catch (hfError) {
        console.log('Hugging Face failed, using fallback...', hfError)
      }
    }
    // Method 3: Enhanced placeholder as final fallback
    const keywords = (prompt || '').toLowerCase()
      .replace(/cartoon illustration of/g, '')
      .replace(/a |an |the /g, '')
      .split(' ')
      .filter((word: string) => word.length > 2)
      .slice(0, 3)
      .join(',')
    
    // Use a more attractive placeholder service
    const placeholderUrl = `https://via.placeholder.com/512x512/FF6B6B/FFFFFF?text=${encodeURIComponent(keywords || 'image')}`
    console.log(`Using placeholder fallback: ${placeholderUrl}`)
    return NextResponse.redirect(placeholderUrl)

  } catch (error) {
    console.error('Image generation error:', error)
    
    // Final emergency fallback
    const emergencyUrl = 'https://via.placeholder.com/512x512/cccccc/666666?text=Error'
    return NextResponse.redirect(emergencyUrl)
  }
}
