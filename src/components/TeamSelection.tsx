

import { useState } from 'react'
import type { Player, NFLTeam } from '@/types'
import { getTeamLogoUrl } from '@/lib/teamLogos'

interface TeamSelectionProps {
  players: Player[]
  nflTeams: NFLTeam[]
  onTeamSelection: (playerId: number, teamAbbr: string, teamSlot: 1 | 2 | 3) => void
  allPlayersSelected: boolean
}

export default function TeamSelection({
  players,
  nflTeams,
  onTeamSelection,
  allPlayersSelected,
}: TeamSelectionProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(players[0]?.id || null)

  const handleTeamClick = (teamAbbr: string, teamSlot: 1 | 2 | 3, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (selectedPlayer) {
      try {
        onTeamSelection(selectedPlayer, teamAbbr, teamSlot)
      } catch (error) {
        console.error('Error selecting team:', error)
      }
    }
  }

  const getPlayerTeams = (playerId: number) => {
    const player = players.find(p => p.id === playerId)
    return {
      team_1: player?.team_1 || player?.selectedTeam || null,
      team_2: player?.team_2 || null,
      team_3: player?.team_3 || null,
    }
  }

  const isTeamSelected = (teamAbbr: string, playerId: number) => {
    const player = players.find(p => p.id === playerId)
    if (!player) return false
    return (player.team_1 === teamAbbr || player.selectedTeam === teamAbbr) ||
           player.team_2 === teamAbbr ||
           player.team_3 === teamAbbr
  }

  const isTeamSelectedByAnyPlayer = (teamAbbr: string, currentPlayerId: number) => {
    return players.some(p => 
      p.id !== currentPlayerId && (
        (p.team_1 === teamAbbr || p.selectedTeam === teamAbbr) ||
        p.team_2 === teamAbbr ||
        p.team_3 === teamAbbr
      )
    )
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Select Teams
          </h2>
          <p className="text-sm text-gray-500">Choose 3 NFL teams for each player</p>
        </div>

        {/* Player Selection */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-4 uppercase tracking-wide">
            Select a Player
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {players.map(player => {
              const isSelected = selectedPlayer === player.id
              const playerTeams = getPlayerTeams(player.id)
              const teams = [
                playerTeams.team_1 ? getTeamByAbbr(playerTeams.team_1) : null,
                playerTeams.team_2 ? getTeamByAbbr(playerTeams.team_2) : null,
                playerTeams.team_3 ? getTeamByAbbr(playerTeams.team_3) : null,
              ].filter(Boolean)

              return (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayer(player.id)}
                  className={`p-4 rounded-lg border transition-all flex flex-col items-center ${
                    isSelected
                      ? 'border-gray-900 bg-gray-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-gray-800 mb-2">{player.name}</div>
                  {teams.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap justify-center">
                      {teams.map((team, idx) => team && (
                        <div key={idx} className="flex items-center gap-1">
                          <img
                            src={getTeamLogoUrl(team.abbreviation)}
                            alt={team.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                          <div className="text-xs font-bold text-gray-700">
                            {team.abbreviation}
                          </div>
                        </div>
                      ))}
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
              {players.find(p => p.id === selectedPlayer)?.name} - Choose 3 Teams:
            </h3>
            {nflTeams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Loading NFL teams...
              </div>
            ) : (
              <>
                {/* Team Slot Indicators */}
                <div className="mb-6 flex gap-3 justify-center">
                  {[1, 2, 3].map(slot => {
                    const playerTeams = getPlayerTeams(selectedPlayer)
                    const teamAbbr = slot === 1 ? playerTeams.team_1 : slot === 2 ? playerTeams.team_2 : playerTeams.team_3
                    const team = teamAbbr ? getTeamByAbbr(teamAbbr) : null
                    return (
                      <div key={slot} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${
                        team ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 border-dashed'
                      }`}>
                        <span className="text-xs font-medium text-gray-500">Team {slot}</span>
                        {team ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={getTeamLogoUrl(team.abbreviation)}
                              alt={team.name}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                            <span className="text-sm font-semibold text-gray-900">{team.abbreviation}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Team Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  {nflTeams.map(team => {
                    const isSelectedByThisPlayer = isTeamSelected(team.abbreviation, selectedPlayer)
                    const isTakenByOtherPlayer = isTeamSelectedByAnyPlayer(team.abbreviation, selectedPlayer)
                    const logoUrl = getTeamLogoUrl(team.abbreviation)

                    return (
                  <button
                    key={team.id}
                    onClick={(e) => {
                      if (!isTakenByOtherPlayer) {
                        const playerTeams = getPlayerTeams(selectedPlayer)
                        // Find first empty slot or replace first slot
                        let slot: 1 | 2 | 3 = 1
                        if (!playerTeams.team_1) slot = 1
                        else if (!playerTeams.team_2) slot = 2
                        else if (!playerTeams.team_3) slot = 3
                        else slot = 1 // Replace first if all filled
                        
                        handleTeamClick(team.abbreviation, slot, e)
                      }
                    }}
                    disabled={isTakenByOtherPlayer}
                    type="button"
                    className={`p-3 rounded-lg border transition-all flex flex-col items-center ${
                      isSelectedByThisPlayer
                        ? 'border-gray-900 bg-gray-50 shadow-sm'
                        : isTakenByOtherPlayer
                        ? 'border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <img
                      src={logoUrl}
                      alt={team.name}
                      className="w-12 h-12 object-contain mb-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect width="48" height="48" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%236b7280" font-size="10"%3E' + team.abbreviation + '%3C/text%3E%3C/svg%3E'
                      }}
                    />
                    <div className="font-semibold text-xs text-gray-900">{team.abbreviation}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {team.wins}-{team.losses}
                      {team.ties > 0 && `-${team.ties}`}
                    </div>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Info Message */}
        {allPlayersSelected && (
          <div className="mt-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 font-medium">
                ✓ All players have selected 3 teams. Navigate to Standings to see the leaderboard.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

