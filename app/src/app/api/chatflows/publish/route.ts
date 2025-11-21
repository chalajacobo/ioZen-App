import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { z } from 'zod'
import { requireAuth, logApiAction } from '@/lib/api-auth'
import { ChatflowField } from '@/types'

const publishSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  workspaceSlug: z.string().min(1, 'Workspace is required'),
  schema: z.object({
    fields: z.array(z.custom<ChatflowField>()),
  }),
})

function generateSlug(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * POST /api/chatflows/publish
 * Create and publish a new chatflow.
 */
export async function POST(req: Request) {
  try {
    const { auth, error } = await requireAuth()
    if (error) return error

    const body = await req.json()
    const { name, description, workspaceSlug, schema } = publishSchema.parse(body)

    // Verify user is a member of the workspace
    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
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
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      )
    }

    // Generate unique shareUrl
    let shareUrl = generateSlug()
    let isUnique = false
    while (!isUnique) {
      const existing = await prisma.chatflow.findUnique({
        where: { shareUrl },
      })
      if (!existing) {
        isUnique = true
      } else {
        shareUrl = generateSlug()
      }
    }

    const chatflow = await prisma.chatflow.create({
      data: {
        name,
        description: description || '',
        schema: schema as unknown as object,
        status: 'PUBLISHED',
        shareUrl,
        workspaceId: workspace.id,
      },
    })

    // Log the action
    await logApiAction(
      auth.user.id,
      'CREATE',
      'chatflows',
      chatflow.id,
      { new: { name, workspaceId: workspace.id } }
    )

    return NextResponse.json(chatflow)
  } catch (error) {
    console.error('Error publishing chatflow:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

