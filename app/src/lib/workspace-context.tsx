'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Workspace, WorkspaceMember, Profile } from '@prisma/client'

export interface WorkspaceContextValue {
  workspace: Workspace
  membership: WorkspaceMember
  profile: Profile
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

interface WorkspaceProviderProps {
  children: ReactNode
  value: WorkspaceContextValue
}

export function WorkspaceProvider({ children, value }: WorkspaceProviderProps) {
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)

  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }

  return context
}

/**
 * Check if the current user has at least the specified role.
 */
export function useHasRole(requiredRole: 'OWNER' | 'ADMIN' | 'MEMBER') {
  const { role } = useWorkspace()

  const roleHierarchy = { OWNER: 3, ADMIN: 2, MEMBER: 1 }
  return roleHierarchy[role] >= roleHierarchy[requiredRole]
}
