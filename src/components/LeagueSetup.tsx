

import { useState } from 'react'

interface LeagueSetupProps {
  onSetupComplete: (numPlayers: number) => void
}

export default function LeagueSetup({ onSetupComplete }: LeagueSetupProps) {
  const [numPlayers, setNumPlayers] = useState<number>(10)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (numPlayers >= 10 && numPlayers <= 12) {
      onSetupComplete(numPlayers)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Set Up Your League
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="players" className="block text-lg font-semibold text-gray-700 mb-3">
              Number of Players
            </label>
            <input
              type="number"
              id="players"
              min="10"
              max="12"
              value={numPlayers}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 10
                if (value >= 10 && value <= 12) {
                  setNumPlayers(value)
                }
              }}
              className="w-full px-4 py-3 text-2xl text-center border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-2 text-center">
              Choose between 10 and 12 players
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Start League Setup
          </button>
        </form>
      </div>
    </div>
  )
}

