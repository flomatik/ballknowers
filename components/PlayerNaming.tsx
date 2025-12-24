'use client'

import { useState } from 'react'
import type { Player } from '@/types'

interface PlayerNamingProps {
  players: Player[]
  onPlayersNamed: (players: Player[]) => void
}

export default function PlayerNaming({ players, onPlayersNamed }: PlayerNamingProps) {
  const [playerNames, setPlayerNames] = useState<Record<number, string>>(
    players.reduce((acc, p) => {
      acc[p.id] = p.name
      return acc
    }, {} as Record<number, string>)
  )

  const handleNameChange = (playerId: number, name: string) => {
    setPlayerNames(prev => ({
      ...prev,
      [playerId]: name
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const updatedPlayers = players.map(p => ({
      ...p,
      name: playerNames[p.id] || p.name
    }))
    onPlayersNamed(updatedPlayers)
  }

  const allNamesFilled = players.every(p => playerNames[p.id] && playerNames[p.id].trim().length > 0)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Name Your Players
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map(player => (
              <div key={player.id}>
                <label htmlFor={`player-${player.id}`} className="block text-sm font-semibold text-gray-700 mb-2">
                  Player {player.id}
                </label>
                <input
                  type="text"
                  id={`player-${player.id}`}
                  value={playerNames[player.id] || ''}
                  onChange={(e) => handleNameChange(player.id, e.target.value)}
                  placeholder={`Enter name for Player ${player.id}`}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={!allNamesFilled}
            className={`w-full font-bold py-4 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg ${
              allNamesFilled
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue to Team Selection
          </button>
        </form>
      </div>
    </div>
  )
}

