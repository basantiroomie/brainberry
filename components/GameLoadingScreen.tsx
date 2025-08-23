interface GameLoadingScreenProps {
  progress: number
  total: number
  gameTitle?: string
  theme?: string
}

export default function GameLoadingScreen({ 
  progress, 
  total, 
  gameTitle = "Your Game", 
  theme = "default" 
}: GameLoadingScreenProps) {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0
  const isComplete = progress >= total && total > 0

  const getThemeEmoji = (theme: string) => {
    const themeEmojis: Record<string, string> = {
      animals: '🐾',
      family: '👨‍👩‍👧‍👦',
      toys: '🧸',
      food: '🍎',
      transportation: '🚗',
      nature: '🌳',
      space: '🚀',
      default: '🎮'
    }
    return themeEmojis[theme] || themeEmojis.default
  }

  const getLoadingMessage = (percentage: number) => {
    if (percentage < 25) return "Gathering magical ingredients..."
    if (percentage < 50) return "Creating your images..."
    if (percentage < 75) return "Adding sparkles and fun..."
    if (percentage < 100) return "Almost ready to play!"
    return "Ready to play! 🎉"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border-4 border-purple-200">
        
        {/* Theme Icon */}
        <div className="text-6xl mb-4 animate-bounce">
          {getThemeEmoji(theme)}
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Loading {gameTitle}
        </h2>
        
        {/* Loading Message */}
        <p className="text-lg text-gray-600 mb-6">
          {getLoadingMessage(percentage)}
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-purple-400 to-pink-500 h-4 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
          </div>
        </div>
        
        {/* Progress Text */}
        <div className="flex justify-between text-sm text-gray-500 mb-6">
          <span>Images loaded: {progress}/{total}</span>
          <span>{percentage}%</span>
        </div>
        
        {/* Loading Animation */}
        {!isComplete && (
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
        
        {/* Ready Message */}
        {isComplete && (
          <div className="text-green-600 font-bold text-lg animate-pulse">
            ✨ All images loaded! Game ready! ✨
          </div>
        )}
        
      </div>
    </div>
  )
}
