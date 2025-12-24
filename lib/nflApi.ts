import type { NFLTeam } from '@/types'

// Fetch NFL standings from our API route
export async function fetchNFLStandings(): Promise<NFLTeam[]> {
  try {
    const response = await fetch('/api/nfl', {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch NFL standings')
    }

    const teams: NFLTeam[] = await response.json()
    return teams
  } catch (error) {
    console.error('Error fetching NFL standings:', error)
    // Return empty array on error - the API route will handle fallback
    return []
  }
}

