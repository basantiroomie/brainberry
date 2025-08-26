"use client"

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, ArrowLeft } from 'lucide-react'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface ChatAssistantProps {
  onBack: () => void
}

export default function ChatAssistant({ onBack }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there! I'm your friendly chat assistant! 🤖 I'm here to help you with your learning journey. What would you like to talk about today?",
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()
    
    // Simple response patterns for a children's educational app
    if (lowerMessage.includes('help') || lowerMessage.includes('stuck')) {
      return "Don't worry! I'm here to help! 😊 What are you having trouble with? Remember, it's okay to make mistakes - that's how we learn!"
    }
    
    if (lowerMessage.includes('game') || lowerMessage.includes('play')) {
      return "Games are so much fun! 🎮 I love how you're learning while playing. Which game is your favorite so far?"
    }
    
    if (lowerMessage.includes('avatar') || lowerMessage.includes('character')) {
      return "Your avatar looks amazing! 🦸‍♀️ I love how creative you are. Have you tried customizing different parts?"
    }
    
    if (lowerMessage.includes('learn') || lowerMessage.includes('study')) {
      return "Learning is like going on an adventure! 📚✨ Every new thing you discover makes you stronger and smarter. What's the coolest thing you've learned recently?"
    }
    
    if (lowerMessage.includes('tired') || lowerMessage.includes('break')) {
      return "It's great that you know when to take breaks! 🌟 Rest is super important for learning. Maybe do some stretches or drink some water?"
    }
    
    if (lowerMessage.includes('friend') || lowerMessage.includes('lonely')) {
      return "I'm always here as your friend! 🤗 And remember, every time you learn something new, you're getting ready to make even more friends who share your interests!"
    }
    
    if (lowerMessage.includes('difficult') || lowerMessage.includes('hard')) {
      return "I know it feels challenging sometimes, but you're doing great! 💪 Every expert was once a beginner. Take it one step at a time!"
    }
    
    if (lowerMessage.includes('thank')) {
      return "You're so welcome! 😊 It makes me happy to help such an awesome learner like you!"
    }
    
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return "Goodbye for now! 👋 Remember, I'm always here when you need a friend to chat with. Keep being amazing!"
    }
    
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
      return "Hello there, superstar! 🌟 It's wonderful to see you! How are you feeling today?"
    }
    
    // Default encouraging responses
    const defaultResponses = [
      "That's really interesting! Tell me more about that! 🤔",
      "Wow, you're such a curious learner! I love that about you! ✨",
      "That's a great question! What do you think about it? 🌟",
      "You're doing amazing! Keep up the fantastic work! 🎉",
      "I can tell you're really thinking hard about this! That's awesome! 🧠"
    ]
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Simulate thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateResponse(userMessage.text),
        isUser: false,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 1000 + Math.random() * 1500) // Random delay between 1-2.5 seconds
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
        >
          <ArrowLeft className="h-4 w-4 inline mr-2" />
          BACK
        </button>
        <div className="inline-block transform -rotate-1">
          <div className="bg-chart-5 text-white px-8 py-4 border-4 border-black shadow-brutal-xl font-bold text-3xl">
           CHAT WITH ME!
          </div>
        </div>
      </div>
      
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6 max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <div className="bg-chart-5 text-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Chat Assistant</h2>
          <p className="text-gray-600">Ask me anything! I'm here to help you learn and have fun!</p>
        </div>
        
        <div className="bg-gray-100 border-2 border-black p-4 rounded-lg mb-4 h-96 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg border-2 border-black shadow-brutal ${
                  message.isUser
                    ? 'bg-chart-3 text-white'
                    : 'bg-white text-black'
                }`}
              >
                <p className="font-bold">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="mb-4 flex justify-start">
              <div className="bg-white text-black px-4 py-2 rounded-lg border-2 border-black shadow-brutal">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600 ml-2">I'm thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="flex gap-2">
          <input 
            ref={inputRef}
            type="text" 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="flex-1 px-4 py-3 border-2 border-black font-bold text-lg focus:outline-none focus:ring-2 focus:ring-chart-5"
            disabled={isTyping}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-chart-5 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
