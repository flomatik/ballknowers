

import { useState } from 'react'
import type { Player, NFLTeam } from '@/types'
import { getTeamLogoUrl } from '@/lib/teamLogos'

interface StandingsProps {
  players: Player[]
  nflTeams: NFLTeam[]
  onRefresh: () => void
}

export default function Standings({ players, nflTeams, onRefresh }: StandingsProps) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    // Update player records based on their selected teams
    setTimeout(() => setRefreshing(false), 1000)
  }

  const getTeamByAbbr = (abbr: string | null) => {
    if (!abbr) return null
    return nflTeams.find(t => t.abbreviation === abbr)
  }

  // Sort players by win percentage, then wins
  const sortedPlayers = [...players].sort((a, b) => {
    const aWinPct = a.wins / (a.wins + a.losses + a.ties) || 0
    const bWinPct = b.wins / (b.wins + b.losses + b.ties) || 0
    if (bWinPct !== aWinPct) return bWinPct - aWinPct
    return b.wins - a.wins
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-bold text-white">League Standings</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-white hover:bg-gray-100 text-blue-600 font-semibold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : '🔄 Refresh Records'}
        </button>
      </div>

      {/* Player Standings */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left font-bold">Rank</th>
                <th className="px-6 py-4 text-left font-bold">Player</th>
                <th className="px-6 py-4 text-left font-bold">Teams</th>
                <th className="px-6 py-4 text-center font-bold">Wins</th>
                <th className="px-6 py-4 text-center font-bold">Losses</th>
                <th className="px-6 py-4 text-center font-bold">Ties</th>
                <th className="px-6 py-4 text-center font-bold">Win %</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => {
                const team1 = getTeamByAbbr(player.team_1 || player.selectedTeam)
                const team2 = getTeamByAbbr(player.team_2)
                const team3 = getTeamByAbbr(player.team_3)
                const winPct = player.wins + player.losses + player.ties > 0
                  ? ((player.wins / (player.wins + player.losses + player.ties)) * 100).toFixed(1)
                  : '0.0'

                return (
                  <tr
                    key={player.id}
                    className={`border-b hover:bg-gray-50 transition-colors ${
                      index === 0 ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className={`text-2xl font-bold ${
                        index === 0 ? 'text-yellow-500' : 'text-gray-400'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{player.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        {[team1, team2, team3].map((team, idx) => (
                          team ? (
                            <div key={idx} className="flex items-center gap-2">
                              <img
                                src={getTeamLogoUrl(team.abbreviation)}
                                alt={team.name}
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none'
                                }}
                              />
                              <div>
                                <div className="font-bold text-sm text-blue-600">{team.abbreviation}</div>
                                <div className="text-xs text-gray-500">
                                  {team.wins}-{team.losses}
                                  {team.ties > 0 && `-${team.ties}`}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div key={idx} className="text-gray-300 text-xs italic">
                              Team {idx + 1}
                            </div>
                          )
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-green-600">{player.wins}</td>
                    <td className="px-6 py-4 text-center font-semibold text-red-600">{player.losses}</td>
                    <td className="px-6 py-4 text-center font-semibold text-gray-600">{player.ties}</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-800">{winPct}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* NFL Team Records */}
      <div className="bg-white rounded-2xl shadow-2xl p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">NFL Team Records</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {nflTeams
            .sort((a, b) => {
              if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage
              return b.wins - a.wins
            })
            .map(team => {
              const isSelected = players.some(p => 
                (p.team_1 === team.abbreviation || p.selectedTeam === team.abbreviation) ||
                p.team_2 === team.abbreviation ||
                p.team_3 === team.abbreviation
              )
              
              return (
                <div
                  key={team.id}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <img
                    src={getTeamLogoUrl(team.abbreviation)}
                    alt={team.name}
                    className="w-12 h-12 object-contain mb-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect width="48" height="48" fill="%23ccc"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="10"%3E' + team.abbreviation + '%3C/text%3E%3C/svg%3E'
                    }}
                  />
                  <div className="font-bold text-sm text-gray-800">{team.abbreviation}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {team.wins}-{team.losses}
                    {team.ties > 0 && `-${team.ties}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(team.winPercentage * 100).toFixed(1)}%
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

