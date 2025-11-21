import { NextRequest } from 'next/server'
import { createApiHandler } from '@/lib/api-utils'
import { requireAuth } from '@/lib/api-auth'
import prisma from '@/lib/db'

/**
 * GET /api/chatflows
 * Get all chatflows for the authenticated user's workspaces.
 *
 * Query params:
 * - workspaceSlug: Filter by specific workspace (optional)
 */
export const GET = createApiHandler(async (req: NextRequest) => {
  const { auth, error } = await requireAuth()
  if (error) throw new Error('Unauthorized')

  const { searchParams } = new URL(req.url)
  const workspaceSlug = searchParams.get('workspaceSlug')

  // Get user's workspace IDs
  const memberships = await prisma.workspaceMember.findMany({
    where: { profileId: auth.user.id },
    select: { workspaceId: true, workspace: { select: { slug: true } } },
  })

  const workspaceIds = workspaceSlug
    ? memberships
        .filter((m) => m.workspace.slug === workspaceSlug)
        .map((m) => m.workspaceId)
    : memberships.map((m) => m.workspaceId)

  if (workspaceIds.length === 0) {
    return { chatflows: [] }
  }

  const chatflows = await prisma.chatflow.findMany({
    where: {
      workspaceId: { in: workspaceIds },
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      _count: {
        select: { submissions: true },
      },
      workspace: {
        select: { name: true, slug: true },
      },
    },
  })

  const formattedChatflows = chatflows.map((cf) => ({
    id: cf.id,
    name: cf.name || 'Untitled Chatflow',
    status: cf.status,
    submissions: cf._count.submissions,
    workspaceName: cf.workspace.name,
    workspaceSlug: cf.workspace.slug,
    date: new Date(cf.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    rawDate: cf.createdAt,
  }))

  return { chatflows: formattedChatflows }
})
