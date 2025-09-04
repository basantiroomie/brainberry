import { NextRequest, NextResponse } from 'next/server'

// Simple image generation proxy endpoint.
// It builds a child-friendly prompt and proxies to Pollinations for an image.
// This ensures image URLs are same-origin for reliable preloading/caching.

export const dynamic = 'force-dynamic'

function buildPrompt(prompt: string, theme?: string, style?: string) {
	const safeStyle = style || 'child_friendly, cartoon, colorful, simple background, high contrast, soft shapes'
	const base = prompt.trim()
	const full = [
		base,
		theme ? `Theme: ${theme}` : '',
		`Style: ${safeStyle}`,
		'Age: 3-12, no violence, no scary content, friendly, cute'
	].filter(Boolean).join(', ')
	return full
}

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url)
		const prompt = searchParams.get('prompt') || ''
		const theme = searchParams.get('theme') || undefined
		const style = searchParams.get('style') || undefined
		const seed = searchParams.get('seed') || undefined

		if (!prompt) {
			return NextResponse.json({ error: 'prompt required' }, { status: 400 })
		}

		const finalPrompt = buildPrompt(prompt, theme, style)
		const params = new URLSearchParams()
		params.set('width', '768')
		params.set('height', '768')
		params.set('nologo', 'true')
		params.set('enhance', 'true')
		if (seed) params.set('seed', seed)

		const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?${params.toString()}`
		const upstream = await fetch(url, { headers: { 'Accept': 'image/*' } })
		if (!upstream.ok || !upstream.body) {
			return NextResponse.json({ error: 'Failed to generate image' }, { status: 502 })
		}

		const res = new NextResponse(upstream.body, {
			headers: {
				'Content-Type': upstream.headers.get('Content-Type') || 'image/jpeg',
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		})
		return res
	} catch (e) {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}


