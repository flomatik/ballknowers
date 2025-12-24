

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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Name Your Players
          </h2>
          <p className="text-sm text-gray-500">Enter names for all 10 players</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map(player => (
              <div key={player.id}>
                <label htmlFor={`player-${player.id}`} className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
                  Player {player.id}
                </label>
                <input
                  type="text"
                  id={`player-${player.id}`}
                  value={playerNames[player.id] || ''}
                  onChange={(e) => handleNameChange(player.id, e.target.value)}
                  placeholder={`Enter name for Player ${player.id}`}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 text-sm"
                  required
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={!allNamesFilled}
            className={`w-full font-medium py-2.5 px-4 rounded-lg text-sm transition-all duration-200 ${
              allNamesFilled
                ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-sm hover:shadow'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue to Team Selection
          </button>
        </form>
      </div>
    </div>
  )
}

