'use client'

import * as React from 'react'

export interface Team {
  name: string
  logo: React.ElementType
  plan: string
  value: 'admin' | 'manager' | 'staff'
  description: string
  route: string
}

interface TeamContextType {
  selectedTeam: Team | null
  setSelectedTeam: (team: Team) => void
  availableTeams: Team[]
}

const TeamContext = React.createContext<TeamContextType | undefined>(undefined)

export function TeamProvider({
  children,
  availableTeams,
  defaultTeam,
}: {
  children: React.ReactNode
  availableTeams: Team[]
  defaultTeam: Team
}) {
  const [selectedTeam, setSelectedTeam] = React.useState<Team>(defaultTeam)

  return (
    <TeamContext.Provider
      value={{
        selectedTeam,
        setSelectedTeam,
        availableTeams,
      }}
    >
      {children}
    </TeamContext.Provider>
  )
}

export function useTeam() {
  const context = React.useContext(TeamContext)
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider')
  }
  return context
}
