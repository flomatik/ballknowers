import type { Player, NFLTeam } from '@/types'
import { getTeamLogoUrl } from '@/lib/teamLogos'

interface StandingsPageProps {
  players: Player[]
  nflTeams: NFLTeam[]
}

export default function StandingsPage({ players, nflTeams }: StandingsPageProps) {
  const getTeamByAbbr = (abbr: string | null) => {
    if (!abbr) return null
    return nflTeams.find(t => t.abbreviation === abbr)
  }

  // Calculate total wins for each player (sum of all 3 teams)
  const playersWithTotals = players.map(player => {
    const team1 = getTeamByAbbr(player.team_1 || player.selectedTeam)
    const team2 = getTeamByAbbr(player.team_2)
    const team3 = getTeamByAbbr(player.team_3)
    
    const totalWins = (team1?.wins || 0) + (team2?.wins || 0) + (team3?.wins || 0)
    const totalLosses = (team1?.losses || 0) + (team2?.losses || 0) + (team3?.losses || 0)
    const totalTies = (team1?.ties || 0) + (team2?.ties || 0) + (team3?.ties || 0)
    
    return {
      ...player,
      totalWins,
      totalLosses,
      totalTies,
      team1,
      team2,
      team3,
    }
  })

  // Sort by most wins to least wins
  const sortedPlayers = [...playersWithTotals].sort((a, b) => {
    if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins
    // Tiebreaker: fewer losses
    if (a.totalLosses !== b.totalLosses) return a.totalLosses - b.totalLosses
    // Tiebreaker: more ties
    return b.totalTies - a.totalTies
  })

  // Calculate games back (GB) - difference from leader's total wins
  const leaderWins = sortedPlayers.length > 0 ? sortedPlayers[0].totalWins : 0
  const playersWithGB = sortedPlayers.map(player => ({
    ...player,
    gamesBack: leaderWins - player.totalWins
  }))

  return (
    <div className="w-full space-y-6">
      {/* Header - Hidden on mobile */}
      <div className="mb-6 hidden lg:block">
        <h2 className="text-2xl font-semibold text-gray-900">League Standings</h2>
      </div>

      {/* Standings Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900 text-white border-r border-gray-700">Rank</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900 text-white border-r border-gray-700">Player</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900 text-white border-r border-gray-700 w-80">Teams</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900 text-white border-r border-gray-700">Total Wins</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900 text-white border-r border-gray-700">Total Losses</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900 text-white border-r border-gray-700">Total Ties</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900 text-white">GB</th>
              </tr>
            </thead>
            <tbody>
              {playersWithGB.map((player, index) => (
                <tr
                  key={player.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index === 0 ? 'bg-green-100' : ''
                  }`}
                >
                  <td className="px-6 py-4 border-r border-gray-200 text-center">
                    <span className="text-lg font-semibold text-gray-400">{index + 1}.</span>
                  </td>
                  <td className="px-6 py-4 border-r border-gray-200 text-center">
                    <span className="font-medium text-gray-900">{player.name}</span>
                  </td>
                  <td className="px-6 py-4 border-r border-gray-200 w-80">
                    <div className="flex items-center justify-between w-full">
                      {[player.team1, player.team2, player.team3].map((team, idx) => (
                        team ? (
                          <div key={idx} className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-200 w-20 h-12">
                            <img
                              src={getTeamLogoUrl(team.abbreviation)}
                              alt={team.name}
                              className="w-6 h-6 object-contain flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                            <div className="min-w-0 flex-shrink">
                              <div className="font-semibold text-xs text-gray-900 truncate">{team.abbreviation}</div>
                              <div className="text-xs text-gray-500 truncate">
                                {team.wins}-{team.losses}
                                {team.ties > 0 && `-${team.ties}`}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div key={idx} className="text-gray-300 text-xs px-2 py-1 w-20 h-12 flex items-center justify-center border border-gray-200 rounded bg-gray-50">
                            —
                          </div>
                        )
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center border-r border-gray-200">
                    <span className="text-lg font-semibold text-gray-900">{player.totalWins}</span>
                  </td>
                  <td className="px-6 py-4 text-center border-r border-gray-200">
                    <span className="text-base font-medium text-gray-600">{player.totalLosses}</span>
                  </td>
                  <td className="px-6 py-4 text-center border-r border-gray-200">
                    <span className="text-base font-medium text-gray-600">{player.totalTies}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-base font-medium text-gray-600">
                      {player.gamesBack === 0 ? '—' : player.gamesBack}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

