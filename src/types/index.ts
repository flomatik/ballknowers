export interface NFLTeam {
  id: string
  name: string
  abbreviation: string
  wins: number
  losses: number
  ties: number
  winPercentage: number
  conference: string
  division: string
  logoUrl?: string
}

export interface Player {
  id: number
  name: string
  selectedTeam: string | null // Keep for backward compatibility
  team_1: string | null
  team_2: string | null
  team_3: string | null
  wins: number
  losses: number
  ties: number
}

