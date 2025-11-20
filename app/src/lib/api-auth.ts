import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/db'

/**
 * API authentication and workspace validation helper.
 * Use this in API routes to get the authenticated user and workspace.
 */

export interface AuthContext {
  user: {
    id: string
    email: string
  }
  profile: {
    id: string
    email: string
    name: string | null
  }
}

export interface WorkspaceContext extends AuthContext {
  workspace: {
    id: string
    name: string
    slug: string
  }
  membership: {
    role: 'OWNER' | 'ADMIN' | 'MEMBER'
  }
}

/**
 * Get the authenticated user from the request.
 * Returns null if not authenticated.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  })

  if (!profile) {
    return null
  }

  return {
    user: {
      id: user.id,
      email: user.email!,
    },
    profile: {
      id: profile.id,
      email: profile.email,
      name: profile.name,
    },
  }
}

/**
 * Get the workspace context from the request.
 * Validates that the user is a member of the workspace.
 */
export async function getWorkspaceContext(
  workspaceSlug: string
): Promise<WorkspaceContext | null> {
  const auth = await getAuthContext()

  if (!auth) {
    return null
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })

  if (!workspace) {
    return null
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      profileId_workspaceId: {
        profileId: auth.user.id,
        workspaceId: workspace.id,
      },
    },
  })

  if (!membership) {
    return null
  }

  return {
    ...auth,
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    membership: {
      role: membership.role,
    },
  }
}

/**
 * Require authentication - returns error response if not authenticated.
 */
export async function requireAuth(): Promise<
  { auth: AuthContext; error?: never } | { auth?: never; error: NextResponse }
> {
  const auth = await getAuthContext()

  if (!auth) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }

  return { auth }
}

/**
 * Require workspace membership - returns error response if not authorized.
 */
export async function requireWorkspace(
  workspaceSlug: string
): Promise<
  { context: WorkspaceContext; error?: never } | { context?: never; error: NextResponse }
> {
  const context = await getWorkspaceContext(workspaceSlug)

  if (!context) {
    const auth = await getAuthContext()

    if (!auth) {
      return {
        error: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ),
      }
    }

    return {
      error: NextResponse.json(
        { error: 'Forbidden - not a member of this workspace' },
        { status: 403 }
      ),
    }
  }

  return { context }
}

/**
 * Require specific role in workspace.
 */
export async function requireRole(
  workspaceSlug: string,
  requiredRole: 'OWNER' | 'ADMIN' | 'MEMBER'
): Promise<
  { context: WorkspaceContext; error?: never } | { context?: never; error: NextResponse }
> {
  const result = await requireWorkspace(workspaceSlug)

  if (result.error) {
    return result
  }

  const roleHierarchy = { OWNER: 3, ADMIN: 2, MEMBER: 1 }
  const hasRole =
    roleHierarchy[result.context.membership.role] >= roleHierarchy[requiredRole]

  if (!hasRole) {
    return {
      error: NextResponse.json(
        { error: `Forbidden - requires ${requiredRole} role or higher` },
        { status: 403 }
      ),
    }
  }

  return result
}

/**
 * Log an API action to the audit log.
 */
export async function logApiAction(
  userId: string | null,
  action: string,
  tableName: string,
  recordId?: string,
  data?: { old?: unknown; new?: unknown }
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        tableName,
        recordId,
        oldData: data?.old as object,
        newData: data?.new as object,
      },
    })
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Failed to log audit action:', error)
  }
}
