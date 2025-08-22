interface EducatorGateProps {
  isVisible: boolean
  counter: number
}

export default function EducatorGate({ isVisible, counter }: EducatorGateProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-4 border-black shadow-brutal-xl p-8 text-center">
        <h3 className="text-2xl font-bold mb-4">Hold On...</h3>
        <div className="text-6xl font-bold text-chart-2 mb-4">{counter}</div>
        <p className="text-gray-600">Keep holding to access educator controls</p>
      </div>
    </div>
  )
}
