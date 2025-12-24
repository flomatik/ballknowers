'use client'

import { useState } from 'react'
import type { Player, NFLTeam } from '@/types'
import { getTeamLogoUrl } from '@/lib/teamLogos'

interface TeamSelectionProps {
  players: Player[]
  nflTeams: NFLTeam[]
  onTeamSelection: (playerId: number, teamAbbr: string) => void
  onStartLeague: () => void
  allPlayersSelected: boolean
}

export default function TeamSelection({
  players,
  nflTeams,
  onTeamSelection,
  onStartLeague,
  allPlayersSelected,
}: TeamSelectionProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(players[0]?.id || null)

  const handleTeamClick = (teamAbbr: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (selectedPlayer) {
      try {
        onTeamSelection(selectedPlayer, teamAbbr)
      } catch (error) {
        console.error('Error selecting team:', error)
      }
    }
  }

  const getPlayerTeam = (playerId: number) => {
    return players.find(p => p.id === playerId)?.selectedTeam
  }

  const isTeamSelected = (teamAbbr: string) => {
    return players.some(p => p.selectedTeam === teamAbbr)
  }

  const getTeamByAbbr = (abbr: string) => {
    return nflTeams.find(t => t.abbreviation === abbr)
  }

  // Debug: Log teams when component renders
  if (typeof window !== 'undefined' && nflTeams.length > 0) {
    console.log('NFL Teams loaded:', nflTeams.length)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-2xl p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Select Teams
        </h2>

        {/* Player Selection */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Select a Player:
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {players.map(player => {
              const isSelected = selectedPlayer === player.id
              const playerTeam = getPlayerTeam(player.id)
              const team = playerTeam ? getTeamByAbbr(playerTeam) : null

              return (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayer(player.id)}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <div className="font-semibold text-gray-800 mb-2">{player.name}</div>
                  {team && (
                    <div className="flex items-center gap-2">
                      <img
                        src={getTeamLogoUrl(team.abbreviation)}
                        alt={team.name}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                      <div className="text-sm font-bold text-gray-700">
                        {team.abbreviation}
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Team Selection */}
        {selectedPlayer && (
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              {players.find(p => p.id === selectedPlayer)?.name} - Choose Your Team:
            </h3>
            {nflTeams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Loading NFL teams...
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {nflTeams.map(team => {
                const isSelected = getPlayerTeam(selectedPlayer) === team.abbreviation
                const isTaken = isTeamSelected(team.abbreviation) && !isSelected
                const logoUrl = getTeamLogoUrl(team.abbreviation)

                return (
                  <button
                    key={team.id}
                    onClick={(e) => !isTaken && handleTeamClick(team.abbreviation, e)}
                    disabled={isTaken}
                    type="button"
                    className={`p-4 rounded-lg border-2 transition-all transform hover:scale-105 flex flex-col items-center ${
                      isSelected
                        ? 'border-blue-600 bg-blue-100 shadow-md scale-105'
                        : isTaken
                        ? 'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <img
                      src={logoUrl}
                      alt={team.name}
                      className="w-16 h-16 object-contain mb-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect width="64" height="64" fill="%23ccc"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3E' + team.abbreviation + '%3C/text%3E%3C/svg%3E'
                      }}
                    />
                    <div className="font-bold text-sm text-gray-800">{team.abbreviation}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {team.wins}-{team.losses}
                      {team.ties > 0 && `-${team.ties}`}
                    </div>
                  </button>
                )
              })}
              </div>
            )}
          </div>
        )}

        {/* Start League Button */}
        {allPlayersSelected && (
          <div className="mt-8 text-center">
            <button
              onClick={onStartLeague}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Start League! 🏈
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

