import { supabase } from './supabase'
import type { Player } from '@/types'

export interface LeagueEntry {
  id?: number
  username?: string
  team_1?: string | null
  team_2?: string | null
  team_3?: string | null
}

// Save player selections to Supabase
export async function saveLeagueData(players: Player[]): Promise<boolean> {
  try {
    // Limit to 10 players max
    const limitedPlayers = players.slice(0, 10)
    
    if (players.length > 10) {
      console.warn(`Attempted to save ${players.length} players, limiting to 10`)
    }

    // Delete all existing entries first
    // First, get all existing IDs to delete them
    const { data: existingRows, error: selectError } = await supabase
      .from('2025_season')
      .select('id')
    
    if (selectError) {
      console.error('Error fetching existing rows:', selectError)
    } else if (existingRows && existingRows.length > 0) {
      const idsToDelete = existingRows.map(row => row.id).filter(Boolean)
      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('2025_season')
          .delete()
          .in('id', idsToDelete)
        
        if (deleteError) {
          console.error('Error deleting existing rows:', deleteError)
          // If delete fails, don't proceed with insert to avoid duplicates
          return false
        }
        console.log(`Deleted ${idsToDelete.length} existing rows`)
      }
    }

    // Only insert if we have players to save
    if (limitedPlayers.length === 0) {
      console.log('No players to save')
      return true
    }

    // Insert all player data (max 10)
    const entries: LeagueEntry[] = limitedPlayers.map(player => ({
      username: player.name,
      team_1: player.team_1 || player.selectedTeam || null,
      team_2: player.team_2 || null,
      team_3: player.team_3 || null,
    }))

    const { error: insertError } = await supabase
      .from('2025_season')
      .insert(entries)

    if (insertError) {
      console.error('Error saving league data:', insertError)
      return false
    }

    console.log(`Successfully saved ${entries.length} players to Supabase (max 10)`)
    return true
  } catch (error) {
    console.error('Error saving league data:', error)
    return false
  }
}

// Load player selections from Supabase
export async function loadLeagueData(): Promise<Player[]> {
  try {
    console.log('Loading league data from Supabase...')
    const { data, error } = await supabase
      .from('2025_season')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error('Error loading league data:', error)
      console.error('Error details:', error.message, error.details, error.hint)
      return []
    }

    if (!data || data.length === 0) {
      console.log('No data found in 2025_season table')
      return []
    }

    console.log(`Loaded ${data.length} players from Supabase:`, data)

    // Limit to 10 players max (league requirement)
    const limitedData = data.slice(0, 10)
    
    if (data.length > 10) {
      console.warn(`Found ${data.length} players in Supabase, limiting to 10. Cleaning up extra players...`)
      // Delete extra players from database
      const idsToDelete = data.slice(10).map((entry: LeagueEntry) => entry.id).filter(Boolean)
      if (idsToDelete.length > 0) {
        await supabase
          .from('2025_season')
          .delete()
          .in('id', idsToDelete)
        console.log(`Deleted ${idsToDelete.length} extra players from database`)
      }
    }

    // Transform Supabase data to Player format
    const players = limitedData.map((entry: LeagueEntry, index: number) => ({
      id: index + 1,
      name: entry.username || `Player ${index + 1}`,
      selectedTeam: entry.team_1 || null, // Keep for backward compatibility
      team_1: entry.team_1 || null,
      team_2: entry.team_2 || null,
      team_3: entry.team_3 || null,
      wins: 0, // Will be updated from NFL standings
      losses: 0,
      ties: 0,
    }))
    
    console.log('Transformed players:', players)
    return players
  } catch (error) {
    console.error('Error loading league data:', error)
    return []
  }
}

