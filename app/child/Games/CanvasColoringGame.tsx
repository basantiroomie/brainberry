"use client"

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Upload, Shuffle, Palette, Download } from 'lucide-react'

interface CanvasColoringGameProps {
  onBack: () => void
}

export default function CanvasColoringGame({ onBack }: CanvasColoringGameProps) {
  const [mode, setMode] = useState<'select' | 'coloring'>('select')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState('#FF0000')
  const [brushSize, setBrushSize] = useState(5)
  const [savedCanvases, setSavedCanvases] = useState<string[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Random coloring images - simple shapes for children
  const randomImages = [
    'data:image/svg+xml;base64,' + btoa(`
      <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <circle cx="150" cy="150" r="100" fill="none" stroke="black" stroke-width="3"/>
        <circle cx="130" cy="130" r="10" fill="black"/>
        <circle cx="170" cy="130" r="10" fill="black"/>
        <path d="M 120 180 Q 150 200 180 180" fill="none" stroke="black" stroke-width="3"/>
        <text x="150" y="280" text-anchor="middle" font-family="Arial" font-size="16">Happy Face</text>
      </svg>
    `),
    'data:image/svg+xml;base64,' + btoa(`
      <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <circle cx="150" cy="200" r="80" fill="none" stroke="black" stroke-width="3"/>
        <path d="M 150 120 Q 130 100 140 80 Q 150 60 160 80 Q 170 100 150 120" fill="none" stroke="black" stroke-width="3"/>
        <circle cx="150" cy="80" r="8" fill="black"/>
        <text x="150" y="280" text-anchor="middle" font-family="Arial" font-size="16">Apple</text>
      </svg>
    `)
  ]

  const colors = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#000000',
    'eraser' // Special eraser tool
  ]

  // Load saved canvases from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('coloringCanvases')
    if (saved) {
      setSavedCanvases(JSON.parse(saved))
    }
  }, [])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          convertToColoring(img)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRandomImage = () => {
    const randomIndex = Math.floor(Math.random() * randomImages.length)
    const img = new Image()
    img.onload = () => {
      setImageUrl(randomImages[randomIndex])
      setOriginalImageUrl(randomImages[randomIndex])
      setMode('coloring')
      setTimeout(() => setupCanvas(img), 100)
    }
    img.src = randomImages[randomIndex]
  }

  const convertToColoring = (img: HTMLImageElement) => {
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    tempCanvas.width = 400
    tempCanvas.height = 400

    // Draw the image
    tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height)

    // Convert to black and white outline
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      const edge = gray < 128 ? 0 : 255
      data[i] = edge     // Red
      data[i + 1] = edge // Green
      data[i + 2] = edge // Blue
      // Alpha stays the same
    }

    tempCtx.putImageData(imageData, 0, 0)
    const outlineUrl = tempCanvas.toDataURL()
    setImageUrl(outlineUrl)
    setOriginalImageUrl(outlineUrl)
    setMode('coloring')
    
    setTimeout(() => {
      const newImg = new Image()
      newImg.onload = () => setupCanvas(newImg)
      newImg.src = outlineUrl
    }, 100)
  }

  const setupCanvas = (img: HTMLImageElement) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 400
    canvas.height = 400

    // Fill with white background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw the coloring image as base layer
    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  }

  const redrawOutline = () => {
    if (!originalImageUrl) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      // Draw the outline on top of colors with multiply blend for black lines
      ctx.globalCompositeOperation = 'multiply'
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'source-over'
    }
    img.src = originalImageUrl
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (selectedColor === 'eraser') {
      // Eraser functionality - erase to white
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(x, y, brushSize, 0, Math.PI * 2)
      ctx.fill()
      
      // Redraw outline after erasing
      redrawOutline()
    } else {
      // Draw color normally
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = selectedColor
      ctx.beginPath()
      ctx.arc(x, y, brushSize, 0, Math.PI * 2)
      ctx.fill()

      // Keep the outline visible on top
      redrawOutline()
    }
  }

  const clearCanvas = () => {
    if (!originalImageUrl) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear the canvas and redraw the original outline
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    img.src = originalImageUrl
  }

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataURL = canvas.toDataURL()
    
    // Save to localStorage
    const newSavedCanvases = [...savedCanvases, dataURL]
    setSavedCanvases(newSavedCanvases)
    localStorage.setItem('coloringCanvases', JSON.stringify(newSavedCanvases))

    // Download the image
    const link = document.createElement('a')
    link.download = `my-coloring-${Date.now()}.png`
    link.href = dataURL
    link.click()
  }

  const deleteCanvas = (index: number) => {
    const newSavedCanvases = savedCanvases.filter((_, i) => i !== index)
    setSavedCanvases(newSavedCanvases)
    localStorage.setItem('coloringCanvases', JSON.stringify(newSavedCanvases))
  }

  const editCanvas = (canvasData: string) => {
    const img = new Image()
    img.onload = () => {
      setImageUrl(canvasData)
      setMode('coloring')
      setTimeout(() => setupCanvas(img), 100)
    }
    img.src = canvasData
  }

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="relative flex items-center justify-center mb-8">
            <button
              onClick={onBack}
              className="absolute left-0 flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>BACK</span>
            </button>
            <div className="inline-block transform -rotate-1">
              <div className="bg-chart-4 text-white px-8 py-4 border-4 border-black shadow-brutal-xl font-bold text-3xl">
                CANVAS COLORING
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto mb-12">
            {/* Upload Photo Option */}
            <div className="bg-white border-4 border-black shadow-brutal-xl p-8">
              <div className="text-center">
                <div className="bg-chart-1 text-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Upload Photo</h3>
                <p className="text-gray-600 mb-6">Turn your own photo into a coloring page!</p>
                <label className="bg-chart-1 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold cursor-pointer inline-block">
                  CHOOSE PHOTO
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Random Image Option */}
            <div className="bg-white border-4 border-black shadow-brutal-xl p-8">
              <div className="text-center">
                <div className="bg-chart-2 text-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Shuffle className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Random Image</h3>
                <p className="text-gray-600 mb-6">Get a fun random picture to color!</p>
                <button
                  onClick={handleRandomImage}
                  className="bg-chart-2 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
                >
                  GET RANDOM
                </button>
              </div>
            </div>
          </div>

          {/* Previously Colored Canvases */}
          {savedCanvases.length > 0 && (
            <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
              <h2 className="text-2xl font-bold mb-6 text-center">Your Amazing Artwork!</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {savedCanvases.map((canvasData, index) => (
                  <div key={index} className="bg-white border-2 border-black shadow-brutal p-2 relative group">
                    <img 
                      src={canvasData} 
                      alt={`Colored canvas ${index + 1}`}
                      className="w-full h-32 object-cover border border-gray-300"
                    />
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => editCanvas(canvasData)}
                        className="bg-chart-1 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-black"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteCanvas(index)}
                        className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-black"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-center mt-2">
                      <a
                        href={canvasData}
                        download={`artwork-${index + 1}.png`}
                        className="text-xs bg-chart-3 text-white px-2 py-1 border border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold inline-block"
                      >
                        DOWNLOAD
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              {savedCanvases.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No artwork yet! Start coloring to see your creations here.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setMode('select')}
            className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>BACK</span>
          </button>
          <h1 className="text-3xl font-bold text-chart-3">🎨 Color Your Picture! 🎨</h1>
          <button
            onClick={downloadImage}
            className="flex items-center space-x-2 bg-chart-2 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
          >
            <Download className="h-4 w-4" />
            <span>SAVE</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Color Palette */}
          <div className="bg-white border-4 border-black shadow-brutal-xl p-4">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Palette className="h-5 w-5 mr-2" />
              Colors
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center ${
                    selectedColor === color ? 'ring-4 ring-yellow-400' : ''
                  }`}
                  style={{ backgroundColor: color === 'eraser' ? '#f0f0f0' : color }}
                  title={color === 'eraser' ? 'Eraser' : `Color: ${color}`}
                >
                  {color === 'eraser' && <span className="text-sm">🧽</span>}
                </button>
              ))}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Brush Size</label>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm mt-1">{brushSize}px</div>
            </div>
            <button
              onClick={clearCanvas}
              className="w-full bg-red-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold mb-2"
            >
              🗑️ CLEAR ALL
            </button>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-3 bg-white border-4 border-black shadow-brutal-xl p-4">
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseMove={draw}
              onMouseLeave={stopDrawing}
              className="border-2 border-gray-300 cursor-crosshair mx-auto block"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
