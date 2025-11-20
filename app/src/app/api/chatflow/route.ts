import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

/**
 * GET /api/chatflow
 * Get all chatflows for the authenticated user's workspaces.
 *
 * Query params:
 * - workspaceSlug: Filter by specific workspace (optional)
 */
export async function GET(request: Request) {
  try {
    const { auth, error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(request.url)
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
      return NextResponse.json({ chatflows: [] })
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

    return NextResponse.json({ chatflows: formattedChatflows })
  } catch (error) {
    console.error('Failed to fetch chatflows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chatflows' },
      { status: 500 }
    )
  }
}
