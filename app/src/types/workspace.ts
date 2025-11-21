import type { Workspace, WorkspaceMember, Profile, WorkspaceRole } from '@prisma/client'

/**
 * Workspace with member count
 */
export type WorkspaceWithCount = Workspace & {
  _count: {
    members: number
    chatflows: number
  }
}

/**
 * Workspace member with profile details
 */
export type WorkspaceMemberWithProfile = WorkspaceMember & {
  profile: Pick<Profile, 'id' | 'email' | 'name' | 'avatarUrl'>
}

/**
 * Auth context returned by requireAuth()
 */
export interface AuthContext {
  user: {
    id: string
    email: string
  }
  workspaceId?: string
}

/**
 * Workspace context with membership
 */
export interface WorkspaceContext {
  workspace: Workspace
  membership: WorkspaceMember
  profile: Profile
}

/**
 * Role permission levels
 */
export const RolePermissions: Record<WorkspaceRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
}

/**
 * Check if user has minimum required role
 */
export function hasMinimumRole(
  userRole: WorkspaceRole,
  requiredRole: WorkspaceRole
): boolean {
  return RolePermissions[userRole] >= RolePermissions[requiredRole]
}

