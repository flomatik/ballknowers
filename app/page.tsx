'use client'

import { useState, useEffect, useCallback } from 'react'
import LeagueSetup from '@/components/LeagueSetup'
import PlayerNaming from '@/components/PlayerNaming'
import TeamSelection from '@/components/TeamSelection'
import Standings from '@/components/Standings'
import { fetchNFLStandings } from '@/lib/nflApi'
import type { Player, NFLTeam } from '@/types'

export default function Home() {
  const [numPlayers, setNumPlayers] = useState<number>(0)
  const [players, setPlayers] = useState<Player[]>([])
  const [nflTeams, setNflTeams] = useState<NFLTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState<'setup' | 'naming' | 'selection' | 'standings'>('setup')

  const updatePlayerRecords = useCallback((teams: NFLTeam[]) => {
    setPlayers(prevPlayers => prevPlayers.map(player => {
      const selectedTeam = teams.find(t => t.abbreviation === player.selectedTeam)
      if (selectedTeam) {
        return {
          ...player,
          wins: selectedTeam.wins,
          losses: selectedTeam.losses,
          ties: selectedTeam.ties,
        }
      }
      return player
    }))
  }, [])

  const loadNFLData = useCallback(async () => {
    try {
      setLoading(true)
      const teams = await fetchNFLStandings()
      if (teams.length > 0) {
        setNflTeams(teams)
        
        // Update player records if we have players with selected teams
        setPlayers(prevPlayers => {
          if (prevPlayers.length > 0 && prevPlayers.some(p => p.selectedTeam !== null)) {
            return prevPlayers.map(player => {
              const selectedTeam = teams.find(t => t.abbreviation === player.selectedTeam)
              if (selectedTeam) {
                return {
                  ...player,
                  wins: selectedTeam.wins,
                  losses: selectedTeam.losses,
                  ties: selectedTeam.ties,
                }
              }
              return player
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

  useEffect(() => {
    loadNFLData()
  }, [loadNFLData])

  const handleSetupComplete = (count: number) => {
    setNumPlayers(count)
    const newPlayers: Player[] = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Player ${i + 1}`,
      selectedTeam: null,
      wins: 0,
      losses: 0,
      ties: 0,
    }))
    setPlayers(newPlayers)
    setCurrentStep('naming')
  }

  const handlePlayersNamed = (namedPlayers: Player[]) => {
    setPlayers(namedPlayers)
    setCurrentStep('selection')
  }

  const handleTeamSelection = (playerId: number, teamAbbr: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId 
        ? { ...p, selectedTeam: teamAbbr }
        : p
    ))
  }

  const handleStartLeague = () => {
    // Update player records based on their selected teams
    if (nflTeams.length > 0) {
      updatePlayerRecords(nflTeams)
    }
    setCurrentStep('standings')
  }

  const allPlayersSelected = players.length > 0 && players.every(p => p.selectedTeam !== null)

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
            🏈 NFL Pick'em League
          </h1>
          <p className="text-blue-200 text-lg">Track your picks and compete with friends</p>
        </div>

        {loading && currentStep === 'setup' ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-white text-xl">Loading NFL data...</div>
          </div>
        ) : (
          <>
            {currentStep === 'setup' && (
              <LeagueSetup onSetupComplete={handleSetupComplete} />
            )}

            {currentStep === 'naming' && (
              <PlayerNaming
                players={players}
                onPlayersNamed={handlePlayersNamed}
              />
            )}

            {currentStep === 'selection' && (
              <>
                {nflTeams.length === 0 ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="text-white text-xl">Loading NFL teams...</div>
                  </div>
                ) : (
                  <TeamSelection
                    players={players}
                    nflTeams={nflTeams}
                    onTeamSelection={handleTeamSelection}
                    onStartLeague={handleStartLeague}
                    allPlayersSelected={allPlayersSelected}
                  />
                )}
              </>
            )}

            {currentStep === 'standings' && (
              <Standings
                players={players}
                nflTeams={nflTeams}
                onRefresh={loadNFLData}
              />
            )}
          </>
        )}
      </div>
    </main>
  )
}

