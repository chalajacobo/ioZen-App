import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateChatflowBackground } from '@/workflows/chatflow-generation'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

// Input validation schema
const generateSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  workspaceSlug: z.string().min(1, 'Workspace is required'),
})

export async function POST(req: Request) {
  try {
    const { auth, error } = await requireAuth()
    if (error) return error

    const body = await req.json()
    const { description, workspaceSlug } = generateSchema.parse(body)

    // Verify workspace membership
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

    // Create a placeholder Chatflow record
    const chatflow = await prisma.chatflow.create({
      data: {
        name: 'Untitled Chatflow',
        description: description,
        schema: {}, // Empty schema indicates "generating"
        status: 'DRAFT',
        shareUrl: Math.random().toString(36).substring(7), // Temporary random slug
        workspaceId: workspace.id,
      },
    })

    // Trigger background generation (fire and forget)
    generateChatflowBackground(chatflow.id, description).catch((err) =>
      console.error('Background generation error:', err)
    )

    return NextResponse.json({ workflowId: chatflow.id })
  } catch (error) {
    console.error('Error starting workflow:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
