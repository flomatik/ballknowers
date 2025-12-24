import { NextResponse } from 'next/server'
import type { NFLTeam } from '@/types'

// Free NFL API endpoint - using a public API that provides NFL standings
const NFL_API_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/standings'

// Mock data as fallback
function getMockNFLTeams(): NFLTeam[] {
  const teams = [
    { name: 'Buffalo Bills', abbr: 'BUF', wins: 11, losses: 6, ties: 0 },
    { name: 'Miami Dolphins', abbr: 'MIA', wins: 11, losses: 6, ties: 0 },
    { name: 'New England Patriots', abbr: 'NE', wins: 4, losses: 13, ties: 0 },
    { name: 'New York Jets', abbr: 'NYJ', wins: 7, losses: 10, ties: 0 },
    { name: 'Baltimore Ravens', abbr: 'BAL', wins: 13, losses: 4, ties: 0 },
    { name: 'Cincinnati Bengals', abbr: 'CIN', wins: 9, losses: 8, ties: 0 },
    { name: 'Cleveland Browns', abbr: 'CLE', wins: 11, losses: 6, ties: 0 },
    { name: 'Pittsburgh Steelers', abbr: 'PIT', wins: 10, losses: 7, ties: 0 },
    { name: 'Houston Texans', abbr: 'HOU', wins: 10, losses: 7, ties: 0 },
    { name: 'Indianapolis Colts', abbr: 'IND', wins: 9, losses: 8, ties: 0 },
    { name: 'Jacksonville Jaguars', abbr: 'JAX', wins: 9, losses: 8, ties: 0 },
    { name: 'Tennessee Titans', abbr: 'TEN', wins: 6, losses: 11, ties: 0 },
    { name: 'Denver Broncos', abbr: 'DEN', wins: 8, losses: 9, ties: 0 },
    { name: 'Kansas City Chiefs', abbr: 'KC', wins: 11, losses: 6, ties: 0 },
    { name: 'Las Vegas Raiders', abbr: 'LV', wins: 8, losses: 9, ties: 0 },
    { name: 'Los Angeles Chargers', abbr: 'LAC', wins: 5, losses: 12, ties: 0 },
    { name: 'Dallas Cowboys', abbr: 'DAL', wins: 12, losses: 5, ties: 0 },
    { name: 'New York Giants', abbr: 'NYG', wins: 6, losses: 11, ties: 0 },
    { name: 'Philadelphia Eagles', abbr: 'PHI', wins: 11, losses: 6, ties: 0 },
    { name: 'Washington Commanders', abbr: 'WAS', wins: 4, losses: 13, ties: 0 },
    { name: 'Chicago Bears', abbr: 'CHI', wins: 7, losses: 10, ties: 0 },
    { name: 'Detroit Lions', abbr: 'DET', wins: 12, losses: 5, ties: 0 },
    { name: 'Green Bay Packers', abbr: 'GB', wins: 9, losses: 8, ties: 0 },
    { name: 'Minnesota Vikings', abbr: 'MIN', wins: 7, losses: 10, ties: 0 },
    { name: 'Atlanta Falcons', abbr: 'ATL', wins: 7, losses: 10, ties: 0 },
    { name: 'Carolina Panthers', abbr: 'CAR', wins: 2, losses: 15, ties: 0 },
    { name: 'New Orleans Saints', abbr: 'NO', wins: 9, losses: 8, ties: 0 },
    { name: 'Tampa Bay Buccaneers', abbr: 'TB', wins: 9, losses: 8, ties: 0 },
    { name: 'Arizona Cardinals', abbr: 'ARI', wins: 4, losses: 13, ties: 0 },
    { name: 'Los Angeles Rams', abbr: 'LAR', wins: 10, losses: 7, ties: 0 },
    { name: 'San Francisco 49ers', abbr: 'SF', wins: 12, losses: 5, ties: 0 },
    { name: 'Seattle Seahawks', abbr: 'SEA', wins: 9, losses: 8, ties: 0 },
  ]

  return teams.map((team, index) => {
    const totalGames = team.wins + team.losses + team.ties
    const winPercentage = totalGames > 0 ? team.wins / totalGames : 0

    return {
      id: `team-${index + 1}`,
      name: team.name,
      abbreviation: team.abbr,
      wins: team.wins,
      losses: team.losses,
      ties: team.ties,
      winPercentage: winPercentage,
      conference: index < 16 ? 'AFC' : 'NFC',
      division: '',
    }
  })
}

export async function GET() {
  try {
    const response = await fetch(NFL_API_URL, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error('Failed to fetch NFL standings')
    }

    const data = await response.json()
    
    // Parse ESPN API response
    const teams: NFLTeam[] = []
    
    if (data.children) {
      data.children.forEach((conference: any) => {
        if (conference.children) {
          conference.children.forEach((division: any) => {
            if (division.children) {
              division.children.forEach((team: any) => {
                const teamData = team.team
                const stats = team.stats?.find((s: any) => s.name === 'wins') || { value: 0 }
                const losses = team.stats?.find((s: any) => s.name === 'losses') || { value: 0 }
                const ties = team.stats?.find((s: any) => s.name === 'ties') || { value: 0 }
                
                const wins = stats.value || 0
                const totalGames = wins + losses.value + ties.value
                const winPercentage = totalGames > 0 ? wins / totalGames : 0

                teams.push({
                  id: teamData.id,
                  name: teamData.displayName,
                  abbreviation: teamData.abbreviation,
                  wins: wins,
                  losses: losses.value || 0,
                  ties: ties.value || 0,
                  winPercentage: winPercentage,
                  conference: conference.abbreviation || 'NFL',
                  division: division.abbreviation || '',
                })
              })
            }
          })
        }
      })
    }

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching NFL standings:', error)
    // Return mock data as fallback
    return NextResponse.json(getMockNFLTeams())
  }
}

