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
  selectedTeam: string | null
  wins: number
  losses: number
  ties: number
}

