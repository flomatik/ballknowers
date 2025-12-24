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
    <div className="w-full space-y-6 lg:space-y-6 -mt-4 lg:mt-0">
      {/* Header - Hidden on mobile */}
      <div className="mb-6 hidden lg:block">
        <h2 className="text-2xl font-semibold text-gray-900">League Standings</h2>
      </div>

      {/* Standings Table */}
      <div className="bg-white lg:rounded-xl border border-gray-200 shadow-sm overflow-hidden -mx-4 lg:mx-0">
        <div className="overflow-x-auto pt-11 lg:pt-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900 text-white border-r border-gray-700 w-16 hidden lg:table-cell">Rank</th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900 text-white lg:border-r lg:border-gray-700 lg:px-6 lg:w-auto w-20">Rank</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900 text-white border-r border-gray-700 hidden lg:table-cell">Player</th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900 text-white lg:border-r lg:border-gray-700 w-64 lg:w-80">Team Selections</th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900 text-white lg:border-r lg:border-gray-700 lg:px-6 w-16">Wins</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900 text-white border-r border-gray-700 hidden lg:table-cell">Total Losses</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900 text-white border-r border-gray-700 hidden lg:table-cell">Total Ties</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-900 text-white hidden lg:table-cell">GB</th>
              </tr>
            </thead>
            <tbody>
              {playersWithGB.map((player, index) => (
                <tr
                  key={player.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                    index === 0 ? 'bg-green-100' : ''
                  }`}
                >
                  <td className="px-3 py-4 border-r border-gray-200 text-center w-16 hidden lg:table-cell">
                    <span className="text-lg font-semibold text-gray-400">{index + 1}.</span>
                  </td>
                  <td className="px-3 py-4 lg:border-r lg:border-gray-200 text-center lg:hidden w-24">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-sm font-semibold text-gray-400">{index + 1}.</span>
                      <span className="text-xs font-medium text-gray-900 truncate w-full">{player.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-r border-gray-200 text-center hidden lg:table-cell">
                    <span className="font-medium text-gray-900">{player.name}</span>
                  </td>
                  <td className="px-2 py-4 lg:border-r lg:border-gray-200 w-64 lg:px-6 lg:w-80 text-center">
                    <div className="flex items-center justify-center w-full gap-1 lg:gap-0 lg:justify-between">
                      {[player.team1, player.team2, player.team3].map((team, idx) => (
                        team ? (
                          <div key={idx} className="flex items-center gap-1 bg-gray-50 px-1.5 py-1 rounded border border-gray-200 w-20 h-12 flex-shrink-0">
                            <img
                              src={getTeamLogoUrl(team.abbreviation)}
                              alt={team.name}
                              className="w-5 h-5 lg:w-6 lg:h-6 object-contain flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-xs text-gray-900 leading-tight">{team.abbreviation}</div>
                              <div className="text-xs text-gray-500 leading-tight">
                                {team.wins}-{team.losses}
                                {team.ties > 0 && `-${team.ties}`}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div key={idx} className="text-gray-300 text-xs px-1.5 py-1 w-20 h-12 flex items-center justify-center border border-gray-200 rounded bg-gray-50 flex-shrink-0">
                            —
                          </div>
                        )
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-4 text-center lg:border-r lg:border-gray-200 lg:px-6 w-16">
                    <span className="text-base lg:text-lg font-semibold text-gray-900">{player.totalWins}</span>
                  </td>
                  <td className="px-6 py-4 text-center border-r border-gray-200 hidden lg:table-cell">
                    <span className="text-base font-medium text-gray-600">{player.totalLosses}</span>
                  </td>
                  <td className="px-6 py-4 text-center border-r border-gray-200 hidden lg:table-cell">
                    <span className="text-base font-medium text-gray-600">{player.totalTies}</span>
                  </td>
                  <td className="px-6 py-4 text-center hidden lg:table-cell">
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

