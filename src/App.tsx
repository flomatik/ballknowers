import { useState, useEffect, useCallback } from 'react'
import PlayerNaming from '@/components/PlayerNaming'
import TeamSelection from '@/components/TeamSelection'
import StandingsPage from '@/components/StandingsPage'
import SideNav from '@/components/SideNav'
import { fetchNFLStandings } from '@/lib/nflApi'
import { saveLeagueData, loadLeagueData } from '@/lib/leagueData'
import type { Player, NFLTeam } from '@/types'

function App() {
  const [players, setPlayers] = useState<Player[]>([])
  const [nflTeams, setNflTeams] = useState<NFLTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState<'naming' | 'selection' | 'standings'>('naming')
  const [currentPage, setCurrentPage] = useState<'draft' | 'standings'>('draft')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)


  const loadNFLData = useCallback(async () => {
    try {
      setLoading(true)
      const teams = await fetchNFLStandings()
      if (teams.length > 0) {
        setNflTeams(teams)
        
        // Update player records if we have players with selected teams
        setPlayers(prevPlayers => {
          if (prevPlayers.length > 0 && prevPlayers.some(p => 
            p.selectedTeam !== null || p.team_1 !== null || p.team_2 !== null || p.team_3 !== null
          )) {
            return prevPlayers.map(player => {
              // Calculate total wins/losses/ties from all 3 teams
              const team1 = player.team_1 || player.selectedTeam ? teams.find(t => t.abbreviation === (player.team_1 || player.selectedTeam)) : null
              const team2 = player.team_2 ? teams.find(t => t.abbreviation === player.team_2) : null
              const team3 = player.team_3 ? teams.find(t => t.abbreviation === player.team_3) : null
              
              const totalWins = (team1?.wins || 0) + (team2?.wins || 0) + (team3?.wins || 0)
              const totalLosses = (team1?.losses || 0) + (team2?.losses || 0) + (team3?.losses || 0)
              const totalTies = (team1?.ties || 0) + (team2?.ties || 0) + (team3?.ties || 0)
              
              return {
                ...player,
                wins: totalWins,
                losses: totalLosses,
                ties: totalTies,
              }
            })
          }
          return prevPlayers
        })
      }
    } catch (error) {
      console.error('Error loading NFL data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-refresh NFL data every 4 hours
  useEffect(() => {
    const interval = setInterval(() => {
      loadNFLData()
    }, 4 * 60 * 60 * 1000) // 4 hours in milliseconds

    return () => clearInterval(interval)
  }, [loadNFLData])

  useEffect(() => {
    // Load saved league data first, then load NFL data
    loadLeagueData().then(savedPlayers => {
      if (savedPlayers.length > 0) {
        console.log('Loaded saved players from Supabase:', savedPlayers.length)
        setPlayers(savedPlayers)
        // If we have saved data, go to selection or standings
        const hasAnyTeams = savedPlayers.some(p => 
          p.selectedTeam !== null || p.team_1 !== null || p.team_2 !== null || p.team_3 !== null
        )
        const allTeamsSelected = savedPlayers.every(p => 
          (p.team_1 !== null || p.selectedTeam !== null) && 
          p.team_2 !== null && 
          p.team_3 !== null
        )
        
        if (hasAnyTeams) {
          if (allTeamsSelected) {
            setCurrentStep('standings')
            setCurrentPage('standings')
          } else {
            setCurrentStep('selection')
            setCurrentPage('draft')
          }
        } else {
          // Have names but no teams selected yet
          setCurrentStep('selection')
          setCurrentPage('draft')
        }
      } else {
        console.log('No saved data found, initializing with 10 default players')
        // Initialize with exactly 10 players
        const defaultPlayers: Player[] = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Player ${i + 1}`,
          selectedTeam: null,
          team_1: null,
          team_2: null,
          team_3: null,
          wins: 0,
          losses: 0,
          ties: 0,
        }))
        setPlayers(defaultPlayers)
        // Don't save default players to Supabase until they're named
      }
    })
    
    // Load NFL data
    loadNFLData()
  }, [loadNFLData])

  const handlePlayersNamed = async (namedPlayers: Player[]) => {
    setPlayers(namedPlayers)
    // Save player names to Supabase immediately
    await saveLeagueData(namedPlayers)
    setCurrentStep('selection')
    setCurrentPage('draft')
  }

  const handleTeamSelection = async (playerId: number, teamAbbr: string, teamSlot: 1 | 2 | 3) => {
    setPlayers(prev => {
      const updated = prev.map(p => {
        if (p.id === playerId) {
          const updatedPlayer = { ...p }
          if (teamSlot === 1) {
            updatedPlayer.team_1 = teamAbbr
            updatedPlayer.selectedTeam = teamAbbr // Keep for backward compatibility
          } else if (teamSlot === 2) {
            updatedPlayer.team_2 = teamAbbr
          } else if (teamSlot === 3) {
            updatedPlayer.team_3 = teamAbbr
          }
          
          // Update records immediately if NFL teams are loaded
          if (nflTeams.length > 0) {
            const team1 = updatedPlayer.team_1 || updatedPlayer.selectedTeam ? nflTeams.find(t => t.abbreviation === (updatedPlayer.team_1 || updatedPlayer.selectedTeam)) : null
            const team2 = updatedPlayer.team_2 ? nflTeams.find(t => t.abbreviation === updatedPlayer.team_2) : null
            const team3 = updatedPlayer.team_3 ? nflTeams.find(t => t.abbreviation === updatedPlayer.team_3) : null
            
            updatedPlayer.wins = (team1?.wins || 0) + (team2?.wins || 0) + (team3?.wins || 0)
            updatedPlayer.losses = (team1?.losses || 0) + (team2?.losses || 0) + (team3?.losses || 0)
            updatedPlayer.ties = (team1?.ties || 0) + (team2?.ties || 0) + (team3?.ties || 0)
          }
          
          return updatedPlayer
        }
        return p
      })
      
      // Auto-save to Supabase when a team is selected (debounced to prevent rapid saves)
      // Use a small delay to batch multiple rapid selections
      clearTimeout((window as any).saveTimeout)
      ;(window as any).saveTimeout = setTimeout(() => {
        saveLeagueData(updated).catch(err => console.error('Error auto-saving:', err))
      }, 500) // Wait 500ms after last selection before saving
      
      return updated
    })
  }


  const allPlayersSelected = players.length > 0 && players.every(p => 
    (p.team_1 !== null || p.selectedTeam !== null) && 
    p.team_2 !== null && 
    p.team_3 !== null
  )

  const handlePageNavigate = (page: 'draft' | 'standings') => {
    setCurrentPage(page)
    if (page === 'draft') {
      // If going to draft and we're still in naming step, stay there
      // Otherwise go to selection
      if (currentStep === 'naming') {
        // Stay in naming
      } else {
        setCurrentStep('selection')
      }
    } else if (page === 'standings') {
      setCurrentStep('standings')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex">
      {/* Side Navigation */}
      <SideNav 
        currentPage={currentPage} 
        onNavigate={handlePageNavigate}
        players={players}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile Header with Hamburger */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">NFL Pick'em</h1>
          <div className="w-6" /> {/* Spacer for centering */}
        </div>
        
        <div className="w-full px-4 lg:px-8 py-4 lg:py-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-600 text-sm">Loading NFL data...</div>
            </div>
          ) : (
            <>
              {currentStep === 'naming' && (
                <div>
                  <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-1">Welcome</h1>
                    <p className="text-sm text-gray-500">Get started by naming your players</p>
                  </div>
                  <PlayerNaming
                    players={players}
                    onPlayersNamed={handlePlayersNamed}
                  />
                </div>
              )}

              {currentStep === 'selection' && currentPage === 'draft' && (
                <>
                  <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-1">Draft</h1>
                    <p className="text-sm text-gray-500">Select 3 teams for each player</p>
                  </div>
                  {nflTeams.length === 0 ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="text-gray-600 text-sm">Loading NFL teams...</div>
                    </div>
                  ) : (
                    <TeamSelection
                      players={players}
                      nflTeams={nflTeams}
                      onTeamSelection={handleTeamSelection}
                      allPlayersSelected={allPlayersSelected}
                    />
                  )}
                </>
              )}

              {currentStep === 'standings' && currentPage === 'standings' && (
                <StandingsPage
                  players={players}
                  nflTeams={nflTeams}
                />
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default App
