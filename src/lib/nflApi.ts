import type { NFLTeam } from '@/types'

// Cache for NFL data to avoid rate limits (using localStorage for persistence)
const CACHE_KEY = 'nfl_teams_cache'
const CACHE_TIMESTAMP_KEY = 'nfl_teams_cache_timestamp'
const CACHE_DURATION = 4 * 60 * 60 * 1000 // 4 hours in milliseconds

function getCachedTeams(): NFLTeam[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    
    if (cached && timestamp) {
      const cacheTime = parseInt(timestamp, 10)
      const now = Date.now()
      
      if ((now - cacheTime) < CACHE_DURATION) {
        const teams = JSON.parse(cached)
        // Check if all records are 0-0 (invalid cache)
        const allZeroRecords = teams.every((team: NFLTeam) => 
          team.wins === 0 && team.losses === 0 && team.ties === 0
        )
        
        if (allZeroRecords && teams.length > 0) {
          console.log('Cache contains invalid data (all 0-0 records), clearing cache')
          clearNFLCache()
          return null
        }
        
        // Check if this is mock data (has specific mock team names/records)
        // Mock data has teams like "Buffalo Bills" with specific 2024 records
        const isMockData = teams.some((team: NFLTeam) => 
          (team.name === 'Buffalo Bills' && team.wins === 11 && team.losses === 6) ||
          (team.name === 'Miami Dolphins' && team.wins === 11 && team.losses === 6)
        )
        
        if (isMockData) {
          console.log('Cache contains mock data, clearing cache')
          clearNFLCache()
          return null
        }
        
        console.log('Using cached NFL data from localStorage')
        return teams
      } else {
        console.log('Cache expired, fetching new data')
      }
    }
  } catch (error) {
    console.warn('Error reading cache:', error)
  }
  return null
}

function setCachedTeams(teams: NFLTeam[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(teams))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    console.log('Cached NFL data to localStorage')
  } catch (error) {
    console.warn('Error saving cache:', error)
  }
}

// Function to clear cache (for debugging)
export function clearNFLCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_TIMESTAMP_KEY)
    console.log('Cleared NFL cache')
  } catch (error) {
    console.warn('Error clearing cache:', error)
  }
}


export async function fetchNFLStandings(): Promise<NFLTeam[]> {
  try {
    // Check cache first (persistent across page refreshes)
    const cached = getCachedTeams()
    if (cached) {
      return cached
    }
    
    const seasonYear = 2025
    
    console.log('=== FETCHING NFL STANDINGS ===')
    console.log('Target: Current 2025 NFL season standings')
    
    // Focus on endpoints that should return current season standings
    // Try in order of most likely to have correct data
    const endpoints = [
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/standings`, // Current season standings
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/standings?seasontype=2`, // Regular season only
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams`, // All teams (might have records)
    ]
    
    let data: any = null
    let lastError: any = null
    
    for (const url of endpoints) {
      try {
        console.log('Trying ESPN API endpoint:', url)
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        })
        
        if (!response.ok) {
          console.log(`Endpoint failed with status ${response.status}`)
          continue
        }
        
        const responseData = await response.json()
        
        // Check if this response has team/standings data
        // Teams endpoint has sports[0].leagues[0].teams structure
        const hasData = (
          (responseData.children && responseData.children.length > 0) ||
          (responseData.items && responseData.items.length > 0) ||
          (responseData.entries && responseData.entries.length > 0) ||
          (responseData.teams && responseData.teams.length > 0) ||
          (responseData.standings && responseData.standings.length > 0) ||
          (responseData.sports && responseData.sports[0]?.leagues?.[0]?.teams?.length > 0)
        )
        
        if (hasData) {
          data = responseData
          console.log(`✓ Successfully fetched from: ${url}`)
          break
        } else {
          console.log(`✗ No team data in response from: ${url}`)
        }
      } catch (err) {
        lastError = err
        console.log(`✗ Error with ${url}:`, err)
        continue
      }
    }
    
    if (!data) {
      // Try to use expired cache if available
      try {
        const expiredCache = localStorage.getItem(CACHE_KEY)
        if (expiredCache) {
          const teams = JSON.parse(expiredCache)
          if (!teams.every((t: NFLTeam) => t.wins === 0 && t.losses === 0 && t.ties === 0)) {
            console.log('Using expired cache due to API error')
            return teams
          }
        }
      } catch (e) {
        // Ignore
      }
      throw new Error(`Failed to fetch from any ESPN endpoint. Last error: ${lastError?.message || 'Unknown'}`)
    }
    
    // Debug: Log the full response structure
    console.log('ESPN API Full Response:', JSON.stringify(data, null, 2).substring(0, 2000))
    console.log('ESPN API Response structure:', {
      keys: Object.keys(data),
      hasChildren: !!data.children,
      childrenCount: data.children?.length,
      sampleChild: data.children?.[0],
      fullViewLink: data.fullViewLink,
      season: data.season,
      leagues: data.leagues
    })
    
    // ESPN API structure: Try multiple possible structures
    const teams: NFLTeam[] = []
    
    // Structure 0: Teams endpoint (sports[0].leagues[0].teams) - might have records
    if (data.sports && data.sports[0]?.leagues?.[0]?.teams && Array.isArray(data.sports[0].leagues[0].teams)) {
      console.log('=== PARSING TEAMS ENDPOINT ===')
      const teamsData = data.sports[0].leagues[0].teams
      
      // Log full structure of first team to see where records might be
      if (teamsData.length > 0) {
        console.log('Full first team structure:', JSON.stringify(teamsData[0], null, 2))
      }
      
      teamsData.forEach((teamItem: any) => {
        const team = teamItem.team || teamItem
        
        // Log what fields are available
        if (teams.length === 0) {
          console.log('Team object keys:', Object.keys(team))
          console.log('TeamItem object keys:', Object.keys(teamItem))
        }
        
        // Try to extract record from team data
        let wins = 0, losses = 0, ties = 0
        
        // Check multiple possible locations for records
        if (team.record?.items?.[0]?.summary) {
          const recordStr = team.record.items[0].summary
          const parts = recordStr.split('-').map((p: string) => parseInt(p.trim()) || 0)
          if (parts.length >= 2) {
            wins = parts[0]
            losses = parts[1]
            if (parts.length === 3) ties = parts[2]
          }
        }
        
        // Try stats array
        if ((wins === 0 && losses === 0) && team.stats && Array.isArray(team.stats)) {
          const winsStat = team.stats.find((s: any) => s.name === 'wins' || s.displayName === 'Wins')
          const lossesStat = team.stats.find((s: any) => s.name === 'losses' || s.displayName === 'Losses')
          const tiesStat = team.stats.find((s: any) => s.name === 'ties' || s.displayName === 'Ties')
          
          wins = parseInt(winsStat?.value || winsStat?.displayValue || '0') || 0
          losses = parseInt(lossesStat?.value || lossesStat?.displayValue || '0') || 0
          ties = parseInt(tiesStat?.value || tiesStat?.displayValue || '0') || 0
        }
        
        const teamId = team.id?.toString() || team.id
        const teamName = team.displayName || team.name || team.shortDisplayName || 'Unknown'
        const abbreviation = team.abbreviation || team.abbr || team.shortDisplayName || 'UNK'
        const totalGames = wins + losses + ties
        const winPercentage = totalGames > 0 ? wins / totalGames : 0
        
        if (teamId) {
          teams.push({
            id: teamId,
            name: teamName,
            abbreviation: abbreviation,
            wins: wins,
            losses: losses,
            ties: ties,
            winPercentage: winPercentage,
            conference: team.conference || 'NFL',
            division: team.division || '',
          })
        }
      })
      
      if (teams.length > 0) {
        const teamsWithRecords = teams.filter(t => t.wins > 0 || t.losses > 0 || t.ties > 0).length
        console.log(`✓ Parsed ${teams.length} teams from teams endpoint, ${teamsWithRecords} have records`)
        
        // If no records found, try fetching records for each team individually
        if (teamsWithRecords === 0) {
          console.log('No records in teams endpoint, fetching records for each team individually...')
          
          // Fetch records for each team
          const teamsWithRecordsPromises = teams.map(async (team) => {
            try {
              const teamUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${team.id}`
              const response = await fetch(teamUrl, {
                headers: { 'Accept': 'application/json' }
              })
              
              if (response.ok) {
                const teamData = await response.json()
                // Try to extract record from team data
                const teamObj = teamData.team || teamData
                
                if (teamObj.record?.items?.[0]?.summary) {
                  const recordStr = teamObj.record.items[0].summary
                  const parts = recordStr.split('-').map((p: string) => parseInt(p.trim()) || 0)
                  if (parts.length >= 2) {
                    team.wins = parts[0]
                    team.losses = parts[1]
                    if (parts.length === 3) team.ties = parts[2]
                    team.winPercentage = (team.wins + team.losses + team.ties) > 0 
                      ? team.wins / (team.wins + team.losses + team.ties) 
                      : 0
                  }
                }
              }
            } catch (err) {
              console.warn(`Failed to fetch record for ${team.name}:`, err)
            }
            return team
          })
          
          const updatedTeams = await Promise.all(teamsWithRecordsPromises)
          const finalTeamsWithRecords = updatedTeams.filter(t => t.wins > 0 || t.losses > 0 || t.ties > 0).length
          
          console.log(`✓ Fetched records for ${finalTeamsWithRecords} teams`)
          
          if (finalTeamsWithRecords > 0) {
            // Log all records for verification
            console.log('=== ALL TEAM RECORDS (verify against Google) ===')
            updatedTeams.forEach(t => {
              console.log(`${t.name} (${t.abbreviation}): ${t.wins}-${t.losses}-${t.ties}`)
            })
            
            setCachedTeams(updatedTeams)
            return updatedTeams
          }
        } else {
          // Log all records for verification
          console.log('=== ALL TEAM RECORDS (verify against Google) ===')
          teams.forEach(t => {
            console.log(`${t.name} (${t.abbreviation}): ${t.wins}-${t.losses}-${t.ties}`)
          })
          
          setCachedTeams(teams)
          return teams
        }
      }
    }
    
    // Structure 0.5: Check if this is the site API standings (different structure)
    // The site API might return data directly without $ref
    if (data.children && Array.isArray(data.children) && data.children.length > 0) {
      // Check if first child has team data directly
      const firstChild = data.children[0]
      if (firstChild.children && Array.isArray(firstChild.children)) {
        const firstDivision = firstChild.children[0]
        if (firstDivision.children && Array.isArray(firstDivision.children)) {
          const firstTeam = firstDivision.children[0]
          if (firstTeam.team) {
            // This is the site API structure with teams directly
            console.log('Using site API structure with direct team data')
          }
        }
      }
    }
    
    // Structure 1: children (conferences) -> children (divisions) -> children (teams)
    // This is the STANDINGS endpoint structure
    if (teams.length === 0 && data.children && Array.isArray(data.children)) {
      console.log('=== PARSING STANDINGS ENDPOINT (children structure) ===')
      console.log(`Found ${data.children.length} conferences/divisions`)
      data.children.forEach((conference: any) => {
        if (conference.children && Array.isArray(conference.children)) {
          conference.children.forEach((division: any) => {
            if (division.children && Array.isArray(division.children)) {
              division.children.forEach((team: any) => {
                const teamData = team.team
                
                // Parse record from team.record.items[0].summary (format: "W-L-T")
                let wins = 0
                let losses = 0
                let ties = 0
                
                if (team.record?.items && team.record.items.length > 0) {
                  const recordItem = team.record.items[0]
                  const recordStr = recordItem.summary || recordItem.displayValue || ''
                  
                  if (recordStr && typeof recordStr === 'string') {
                    const parts = recordStr.split('-').map((p: string) => parseInt(p.trim()) || 0)
                    if (parts.length >= 2) {
                      wins = parts[0]
                      losses = parts[1]
                      if (parts.length === 3) {
                        ties = parts[2]
                      }
                    }
                  }
                }
                
                // Fallback: Try stats array
                if ((wins === 0 && losses === 0) && team.stats && Array.isArray(team.stats)) {
                  const winsStat = team.stats.find((s: any) => 
                    s.name === 'wins' || s.shortDisplayName === 'W'
                  )
                  const lossesStat = team.stats.find((s: any) => 
                    s.name === 'losses' || s.shortDisplayName === 'L'
                  )
                  const tiesStat = team.stats.find((s: any) => 
                    s.name === 'ties' || s.shortDisplayName === 'T'
                  )
                  
                  if (winsStat) wins = parseInt(winsStat.value) || parseInt(winsStat.displayValue) || 0
                  if (lossesStat) losses = parseInt(lossesStat.value) || parseInt(lossesStat.displayValue) || 0
                  if (tiesStat) ties = parseInt(tiesStat.value) || parseInt(tiesStat.displayValue) || 0
                }
                
                const totalGames = wins + losses + ties
                const winPercentage = totalGames > 0 ? wins / totalGames : 0
                
                teams.push({
                  id: teamData.id?.toString() || `team-${teams.length + 1}`,
                  name: teamData.displayName || teamData.name || teamData.shortDisplayName || 'Unknown',
                  abbreviation: teamData.abbreviation || teamData.shortDisplayName || 'UNK',
                  wins: wins,
                  losses: losses,
                  ties: ties,
                  winPercentage: winPercentage,
                  conference: conference.abbreviation || conference.name || 'NFL',
                  division: division.abbreviation || division.name || '',
                })
              })
            }
          })
        }
      })
      
      if (teams.length > 0) {
        const teamsWithRecords = teams.filter(t => t.wins > 0 || t.losses > 0 || t.ties > 0).length
        console.log(`✓ Parsed ${teams.length} teams from standings endpoint`)
        console.log(`✓ ${teamsWithRecords} teams have records`)
        
        // Log ALL records for verification against Google standings
        console.log('=== ALL TEAM RECORDS (verify against Google) ===')
        teams.forEach(t => {
          console.log(`${t.name} (${t.abbreviation}): ${t.wins}-${t.losses}-${t.ties}`)
        })
        
        if (teamsWithRecords > 0) {
          setCachedTeams(teams)
          return teams
        }
      }
    }
    
    // Structure 2: items array with $ref links (from core API standings endpoint)
    // Need to follow the $ref to get actual standings data
    if (teams.length === 0 && data.items && Array.isArray(data.items)) {
      // Find the "overall" standings (id: "0")
      const overallStandings = data.items.find((item: any) => item.id === '0' || item.name === 'overall')
      
      if (overallStandings && overallStandings.$ref) {
        console.log('Following $ref to get actual standings:', overallStandings.$ref)
        try {
          const standingsResponse = await fetch(overallStandings.$ref, {
            headers: {
              'Accept': 'application/json',
            },
          })
          
          if (!standingsResponse.ok) {
            console.log(`Standings $ref returned status ${standingsResponse.status}, will try fallback`)
            throw new Error(`Standings endpoint returned ${standingsResponse.status}`)
          }
          
          const standingsData = await standingsResponse.json()
          console.log('Standings data structure:', {
            keys: Object.keys(standingsData),
            hasEntries: !!standingsData.entries,
            entriesCount: standingsData.entries?.length,
            sampleEntry: standingsData.entries?.[0],
            fullResponse: JSON.stringify(standingsData, null, 2).substring(0, 1000)
          })
            
          // Parse entries from standings
          if (standingsData.entries && Array.isArray(standingsData.entries)) {
              standingsData.entries.forEach((entry: any) => {
                const team = entry.team || entry
                const teamData = team
                
                let wins = 0
                let losses = 0
                let ties = 0
                
                // Get record from entry.stats
                if (entry.stats && Array.isArray(entry.stats)) {
                  const winsStat = entry.stats.find((s: any) => 
                    s.name === 'wins' || s.shortDisplayName === 'W' || s.displayName === 'Wins'
                  )
                  const lossesStat = entry.stats.find((s: any) => 
                    s.name === 'losses' || s.shortDisplayName === 'L' || s.displayName === 'Losses'
                  )
                  const tiesStat = entry.stats.find((s: any) => 
                    s.name === 'ties' || s.shortDisplayName === 'T' || s.displayName === 'Ties'
                  )
                  
                  if (winsStat) wins = parseInt(winsStat.value) || parseInt(winsStat.displayValue) || 0
                  if (lossesStat) losses = parseInt(lossesStat.value) || parseInt(lossesStat.displayValue) || 0
                  if (tiesStat) ties = parseInt(tiesStat.value) || parseInt(tiesStat.displayValue) || 0
                }
                
                // Also try record.summary format
                if ((wins === 0 && losses === 0) && entry.record) {
                  const recordStr = entry.record.summary || entry.record.displayValue || ''
                  if (recordStr && typeof recordStr === 'string' && recordStr.includes('-')) {
                    const parts = recordStr.split('-').map((p: string) => parseInt(p.trim()) || 0)
                    if (parts.length >= 2) {
                      wins = parts[0]
                      losses = parts[1]
                      if (parts.length === 3) {
                        ties = parts[2]
                      }
                    }
                  }
                }
                
                const totalGames = wins + losses + ties
                const winPercentage = totalGames > 0 ? wins / totalGames : 0
                
                // Get team abbreviation - try multiple fields
                const abbreviation = teamData.abbreviation || 
                                   teamData.abbr || 
                                   teamData.shortDisplayName ||
                                   (teamData.name ? teamData.name.split(' ').map((w: string) => w[0]).join('').toUpperCase() : 'UNK')
                
                teams.push({
                  id: teamData.id?.toString() || `team-${teams.length + 1}`,
                  name: teamData.displayName || teamData.name || teamData.shortDisplayName || 'Unknown',
                  abbreviation: abbreviation,
                  wins: wins,
                  losses: losses,
                  ties: ties,
                  winPercentage: winPercentage,
                  conference: entry.conference?.abbreviation || entry.conference?.name || standingsData.conference?.abbreviation || 'NFL',
                  division: entry.division?.abbreviation || entry.division?.name || standingsData.division?.abbreviation || '',
                })
              })
            }
        } catch (err) {
          console.error('Error fetching standings from $ref (500 error - 2025 season may not be available in ESPN API):', err)
          // If $ref fails with 500, try fetching teams and games to calculate records
          console.log('Trying alternative: fetch teams and calculate records from 2025 games...')
          
          try {
            // Get all teams first
            const teamsResponse = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams`, {
              headers: {
                'Accept': 'application/json',
              },
            })
            
            if (teamsResponse.ok) {
              const teamsData = await teamsResponse.json()
              console.log('Teams data structure:', {
                keys: Object.keys(teamsData),
                hasTeams: !!teamsData.teams,
                teamsCount: teamsData.teams?.length,
                hasSports: !!teamsData.sports,
                fullResponse: JSON.stringify(teamsData, null, 2).substring(0, 1500)
              })
              
              // ESPN teams endpoint might return data in different structures
              let allTeams: any[] = []
              
              if (teamsData.sports && teamsData.sports[0]?.leagues?.[0]?.teams) {
                // Structure: sports[0].leagues[0].teams
                allTeams = teamsData.sports[0].leagues[0].teams
                console.log('Using sports[0].leagues[0].teams structure')
              } else if (teamsData.teams && Array.isArray(teamsData.teams)) {
                allTeams = teamsData.teams
                console.log('Using teams array structure')
              } else if (teamsData.items && Array.isArray(teamsData.items)) {
                allTeams = teamsData.items.map((item: any) => item.team || item)
                console.log('Using items array structure')
              }
              
              // If teams have $ref links, we might need to follow them
              if (allTeams.length > 0 && allTeams[0].$ref && !allTeams[0].id) {
                console.log('Teams have $ref links, need to fetch individually')
                // For now, try to extract data from the $ref or use the team object directly
                allTeams = allTeams.map((item: any) => {
                  // If it's just a $ref, we can't use it easily, so skip for now
                  // Otherwise use the team data if available
                  return item.team || item
                }).filter((t: any) => t && (t.id || t.name))
              }
              
              if (allTeams.length > 0) {
                console.log(`Found ${allTeams.length} teams, fetching games...`)
                // Get games for 2025 season to calculate records
                // Try multiple endpoints to get all season games
                const gamesUrls = [
                  `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`, // Current games
                  `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${seasonYear}`, // 2025 games
                  `https://site.api.espn.com/apis/site/v2/sports/football/nfl/schedule?dates=${seasonYear}`, // 2025 schedule
                  `https://site.api.espn.com/apis/site/v2/sports/football/nfl/schedule?seasontype=2&dates=${seasonYear}`, // Regular season only
                ]
                
                let gamesData: any = null
                let allGames: any[] = []
                
                // Try to fetch from multiple endpoints and combine games
                for (const gamesUrl of gamesUrls) {
                  console.log('Fetching games from:', gamesUrl)
                  try {
                    const gamesResponse = await fetch(gamesUrl, {
                      headers: {
                        'Accept': 'application/json',
                      },
                    })
                    
                    if (gamesResponse.ok) {
                      const tempData = await gamesResponse.json()
                      // Check if this is scoreboard format (has events) or schedule format (has events or leagues)
                      if (tempData.events && Array.isArray(tempData.events)) {
                        console.log(`✓ Got ${tempData.events.length} games from ${gamesUrl}`)
                        allGames = allGames.concat(tempData.events)
                      } else if (tempData.leagues && Array.isArray(tempData.leagues)) {
                        // Schedule format - extract games from leagues
                        tempData.leagues.forEach((league: any) => {
                          if (league.calendar && Array.isArray(league.calendar)) {
                            league.calendar.forEach((week: any) => {
                              if (week.events && Array.isArray(week.events)) {
                                console.log(`✓ Got ${week.events.length} games from week ${week.label}`)
                                allGames = allGames.concat(week.events)
                              }
                            })
                          }
                        })
                      }
                    }
                  } catch (err) {
                    console.warn(`Failed to fetch from ${gamesUrl}:`, err)
                  }
                }
                
                // Remove duplicates based on event ID
                const uniqueGames = allGames.filter((game, index, self) => 
                  index === self.findIndex((g) => g.id === game.id)
                )
                
                console.log(`Total unique games found: ${uniqueGames.length}`)
                
                if (uniqueGames.length > 0) {
                  gamesData = { events: uniqueGames }
                  console.log('Games data structure:', {
                    keys: Object.keys(gamesData),
                    hasEvents: !!gamesData.events,
                    eventsCount: gamesData.events?.length
                  })
                  
                  // Calculate records from games
                  const teamRecords: Record<string, { wins: number; losses: number; ties: number }> = {}
                  
                  // First, build a map of all team IDs from the teams data
                  const teamIdMap: Record<string, string> = {} // Maps team ID to itself
                  allTeams.forEach((teamItem: any) => {
                    const team = teamItem.team || teamItem
                    const teamId = team.id?.toString() || team.id
                    if (teamId) {
                      teamRecords[teamId] = { wins: 0, losses: 0, ties: 0 }
                      teamIdMap[teamId] = teamId
                    }
                  })
                  
                  console.log(`Initialized ${Object.keys(teamRecords).length} team records`)
                  
                  let processedGames = 0
                  let matchedGames = 0
                  
                  if (gamesData.events && Array.isArray(gamesData.events)) {
                    gamesData.events.forEach((event: any) => {
                      // Check the date - 2025 NFL season runs roughly Sept 2025 - Jan 2026
                      const gameDate = event.date || event.competitions?.[0]?.date
                      let is2025Season = true
                      if (gameDate) {
                        const date = new Date(gameDate)
                        // NFL 2025 season: September 2025 to January 2026
                        // But we'll be more lenient: August 2025 to February 2026
                        if (date.getFullYear() === 2025 || (date.getFullYear() === 2026 && date.getMonth() < 2)) {
                          is2025Season = true
                        } else if (date.getFullYear() < 2025 || (date.getFullYear() === 2026 && date.getMonth() >= 2)) {
                          is2025Season = false
                        }
                      }
                      
                      if (event.competitions && Array.isArray(event.competitions)) {
                        event.competitions.forEach((competition: any) => {
                          // Filter to only regular season games (not preseason/postseason)
                          const seasonType = event.season?.type || 
                                           event.seasonType || 
                                           competition.season?.type ||
                                           competition.seasonType
                          const isRegularSeason = seasonType === 2 || // 2 = regular season
                                                seasonType === '2' ||
                                                event.season?.slug?.includes('regular') ||
                                                (!event.season?.slug?.includes('preseason') &&
                                                 !event.season?.slug?.includes('postseason') &&
                                                 !event.season?.slug?.includes('playoff'))
                          
                          // Check multiple status types for completed games
                          const isCompleted = competition.status?.type?.completed || 
                                            competition.status?.type?.name === 'STATUS_FINAL' ||
                                            competition.status?.type?.name === 'STATUS_FINAL_OVERTIME' ||
                                            competition.status?.type?.id === '3' || // 3 = final
                                            competition.status?.type?.id === 3 ||
                                            competition.status?.type?.name === 'STATUS_FINAL' ||
                                            competition.status?.completed === true
                          
                          // Only process regular season, completed games from 2025 season
                          // If we can't determine season type, default to including it if it's 2025
                          const shouldInclude = isCompleted && 
                                              is2025Season && 
                                              (isRegularSeason !== false) && // Include if we can't determine
                                              competition.competitors
                          
                          if (shouldInclude) {
                            processedGames++
                            const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home')
                            const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away')
                            
                            if (homeTeam && awayTeam) {
                              // Try multiple ways to get team ID
                              const homeId = homeTeam.team?.id?.toString() || 
                                           homeTeam.id?.toString() || 
                                           homeTeam.team?.id
                              const awayId = awayTeam.team?.id?.toString() || 
                                           awayTeam.id?.toString() || 
                                           awayTeam.team?.id
                              
                              // Try to get scores - check multiple possible fields
                              const homeScore = parseInt(homeTeam.score?.toString() || 
                                                       homeTeam.team?.score?.toString() || 
                                                       competition.homeTeam?.score?.toString() || 
                                                       '0') || 0
                              const awayScore = parseInt(awayTeam.score?.toString() || 
                                                       awayTeam.team?.score?.toString() || 
                                                       competition.awayTeam?.score?.toString() || 
                                                       '0') || 0
                              
                              // Only count games with actual scores (both > 0 or at least one > 0)
                              if (homeId && awayId && teamRecords[homeId] && teamRecords[awayId] && (homeScore > 0 || awayScore > 0)) {
                                matchedGames++
                                if (homeScore > awayScore) {
                                  teamRecords[homeId].wins++
                                  teamRecords[awayId].losses++
                                } else if (awayScore > homeScore) {
                                  teamRecords[awayId].wins++
                                  teamRecords[homeId].losses++
                                } else {
                                  teamRecords[homeId].ties++
                                  teamRecords[awayId].ties++
                                }
                              } else {
                                // Log first few mismatches for debugging
                                if (matchedGames < 3) {
                                  console.log('Game filtered out:', {
                                    homeId,
                                    awayId,
                                    homeIdInRecords: !!teamRecords[homeId],
                                    awayIdInRecords: !!teamRecords[awayId],
                                    homeScore,
                                    awayScore,
                                    isRegularSeason,
                                    is2025Season,
                                    seasonType: event.season?.type
                                  })
                                }
                              }
                            }
                          }
                        })
                      }
                    })
                  }
                  
                  console.log(`Processed ${processedGames} completed games, matched ${matchedGames} games to teams`)
                  
                  // Log detailed records for all teams
                  console.log('=== TEAM RECORDS ===')
                  Object.keys(teamRecords).forEach(id => {
                    const record = teamRecords[id]
                    if (record.wins > 0 || record.losses > 0 || record.ties > 0) {
                      // Find team name for this ID
                      const teamItem = allTeams.find((t: any) => {
                        const team = t.team || t
                        return (team.id?.toString() || team.id) === id
                      })
                      const teamName = teamItem ? (teamItem.team || teamItem).displayName || (teamItem.team || teamItem).name : 'Unknown'
                      console.log(`Team ${id} (${teamName}): ${record.wins}-${record.losses}-${record.ties}`)
                    }
                  })
                  
                  // Log sample records
                  const sampleTeamIds = Object.keys(teamRecords).slice(0, 5)
                  sampleTeamIds.forEach(id => {
                    const record = teamRecords[id]
                    const teamItem = allTeams.find((t: any) => {
                      const team = t.team || t
                      return (team.id?.toString() || team.id) === id
                    })
                    const teamName = teamItem ? (teamItem.team || teamItem).displayName || (teamItem.team || teamItem).name : 'Unknown'
                    console.log(`Sample: Team ${id} (${teamName}) record:`, record)
                  })
                  
                  // Build teams array with calculated records
                  // Team name to abbreviation mapping (fallback)
                  const teamNameToAbbr: Record<string, string> = {
                    'Buffalo Bills': 'BUF',
                    'Miami Dolphins': 'MIA',
                    'New England Patriots': 'NE',
                    'New York Jets': 'NYJ',
                    'Baltimore Ravens': 'BAL',
                    'Cincinnati Bengals': 'CIN',
                    'Cleveland Browns': 'CLE',
                    'Pittsburgh Steelers': 'PIT',
                    'Houston Texans': 'HOU',
                    'Indianapolis Colts': 'IND',
                    'Jacksonville Jaguars': 'JAX',
                    'Tennessee Titans': 'TEN',
                    'Denver Broncos': 'DEN',
                    'Kansas City Chiefs': 'KC',
                    'Las Vegas Raiders': 'LV',
                    'Los Angeles Chargers': 'LAC',
                    'Dallas Cowboys': 'DAL',
                    'New York Giants': 'NYG',
                    'Philadelphia Eagles': 'PHI',
                    'Washington Commanders': 'WAS',
                    'Chicago Bears': 'CHI',
                    'Detroit Lions': 'DET',
                    'Green Bay Packers': 'GB',
                    'Minnesota Vikings': 'MIN',
                    'Atlanta Falcons': 'ATL',
                    'Carolina Panthers': 'CAR',
                    'New Orleans Saints': 'NO',
                    'Tampa Bay Buccaneers': 'TB',
                    'Arizona Cardinals': 'ARI',
                    'Los Angeles Rams': 'LAR',
                    'San Francisco 49ers': 'SF',
                    'Seattle Seahawks': 'SEA',
                  }
                  
                  allTeams.forEach((teamItem: any) => {
                    // Team data is nested inside a "team" property
                    const team = teamItem.team || teamItem
                    
                    const teamId = team.id?.toString() || team.id
                    const record = teamRecords[teamId] || { wins: 0, losses: 0, ties: 0 }
                    const totalGames = record.wins + record.losses + record.ties
                    const winPercentage = totalGames > 0 ? record.wins / totalGames : 0
                    
                    const teamName = team.displayName || team.name || team.shortDisplayName || 'Unknown'
                    
                    // Get abbreviation - try multiple possible fields, then fallback to name mapping
                    let abbreviation = team.abbreviation || 
                                       team.abbr || 
                                       team.shortDisplayName ||
                                       team.shortName ||
                                       teamNameToAbbr[teamName] ||
                                       'UNK'
                    
                    // Log first team to debug
                    if (teams.length === 0) {
                      console.log('Sample team from ESPN (full object):', JSON.stringify(teamItem, null, 2).substring(0, 1000))
                      console.log('Extracted team data:', {
                        id: teamId,
                        name: teamName,
                        displayName: team.displayName,
                        abbreviation: abbreviation,
                        record: record
                      })
                    }
                    
                    teams.push({
                      id: teamId || `team-${teams.length + 1}`,
                      name: teamName,
                      abbreviation: abbreviation,
                      wins: record.wins,
                      losses: record.losses,
                      ties: record.ties,
                      winPercentage: winPercentage,
                      conference: team.conference || 'NFL',
                      division: team.division || '',
                    })
                  })
                  
                  if (teams.length > 0) {
                    console.log(`✓ Calculated records for ${teams.length} teams from ${gamesData.events?.length || 0} games`)
                  }
                }
              }
            }
          } catch (fallbackErr) {
            console.error('Fallback method failed:', fallbackErr)
          }
        }
      }
    }
    
    // Structure 3: entries array
    if (teams.length === 0 && data.entries && Array.isArray(data.entries)) {
      data.entries.forEach((entry: any) => {
        const team = entry.team || entry
        const teamData = team
        
        let wins = 0
        let losses = 0
        let ties = 0
        
        if (entry.stats) {
          const winsStat = entry.stats.find((s: any) => s.name === 'wins' || s.shortDisplayName === 'W')
          const lossesStat = entry.stats.find((s: any) => s.name === 'losses' || s.shortDisplayName === 'L')
          const tiesStat = entry.stats.find((s: any) => s.name === 'ties' || s.shortDisplayName === 'T')
          
          if (winsStat) wins = parseInt(winsStat.value) || parseInt(winsStat.displayValue) || 0
          if (lossesStat) losses = parseInt(lossesStat.value) || parseInt(lossesStat.displayValue) || 0
          if (tiesStat) ties = parseInt(tiesStat.value) || parseInt(tiesStat.displayValue) || 0
        }
        
        const totalGames = wins + losses + ties
        const winPercentage = totalGames > 0 ? wins / totalGames : 0
        
        teams.push({
          id: teamData.id?.toString() || `team-${teams.length + 1}`,
          name: teamData.displayName || teamData.name || teamData.shortDisplayName || 'Unknown',
          abbreviation: teamData.abbreviation || teamData.shortDisplayName || 'UNK',
          wins: wins,
          losses: losses,
          ties: ties,
          winPercentage: winPercentage,
          conference: entry.conference?.abbreviation || entry.conference?.name || 'NFL',
          division: entry.division?.abbreviation || entry.division?.name || '',
        })
      })
    }
    
    // Structure 4: teams array (from teams endpoint)
    if (teams.length === 0 && data.teams && Array.isArray(data.teams)) {
      // If we got teams but no records, we'd need to fetch stats separately
      // For now, just return teams with 0-0 records
      data.teams.forEach((team: any) => {
        const teamData = team
        teams.push({
          id: teamData.id?.toString() || `team-${teams.length + 1}`,
          name: teamData.displayName || teamData.name || teamData.shortDisplayName || 'Unknown',
          abbreviation: teamData.abbreviation || teamData.shortDisplayName || 'UNK',
          wins: 0,
          losses: 0,
          ties: 0,
          winPercentage: 0,
          conference: teamData.conference || 'NFL',
          division: teamData.division || '',
        })
      })
    }
    
    if (teams.length === 0) {
      // Try to use expired cache if available
      try {
        const expiredCache = localStorage.getItem(CACHE_KEY)
        if (expiredCache) {
          const cachedTeams = JSON.parse(expiredCache)
          if (!cachedTeams.every((t: NFLTeam) => t.wins === 0 && t.losses === 0 && t.ties === 0)) {
            console.log('No teams parsed, using expired cache')
            return cachedTeams
          }
        }
      } catch (e) {
        // Ignore
      }
      throw new Error('No teams found in ESPN API response')
    }
    
    console.log(`✓ Parsed ${teams.length} teams from ESPN standings`)
    
    if (teams.length === 0) {
      // No teams parsed - try expired cache
      try {
        const expiredCache = localStorage.getItem(CACHE_KEY)
        if (expiredCache) {
          const cachedTeams = JSON.parse(expiredCache)
          if (!cachedTeams.every((t: NFLTeam) => t.wins === 0 && t.losses === 0 && t.ties === 0)) {
            console.log('No teams parsed, using expired cache')
            return cachedTeams
          }
        }
      } catch (e) {
        // Ignore
      }
      throw new Error('No teams found in ESPN API response and no valid cache available')
    }
    
    // Cache the result (persistent across page refreshes)
    setCachedTeams(teams)
    
    return teams
  } catch (error) {
    console.error('Error fetching NFL standings:', error)
    
    // If we have cached data (even expired), use it as fallback
    const cached = getCachedTeams()
    if (cached) {
      console.log('Using cached data (even if expired) due to API error')
      return cached
    }
    
    // Try to get from localStorage even if timestamp check failed
    try {
      const expiredCache = localStorage.getItem(CACHE_KEY)
      if (expiredCache) {
        const cachedTeams = JSON.parse(expiredCache)
        // Only use cache if it has valid records (not all 0-0)
        if (!cachedTeams.every((t: NFLTeam) => t.wins === 0 && t.losses === 0 && t.ties === 0)) {
          console.log('Using expired cache from localStorage as last resort')
          return cachedTeams
        }
      }
    } catch (e) {
      // Ignore
    }
    
    // No valid data available - return empty array (app will show error or use cached data)
    console.error('No valid NFL data available and no cache. Returning empty array.')
    return []
  }
}
