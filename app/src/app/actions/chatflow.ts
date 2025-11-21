'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { createObjectAction } from '@/lib/action-utils'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'
import { generateChatflowBackground } from '@/workflows/chatflow-generation'

// Schema for generating chatflow
const generateSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  workspaceSlug: z.string().min(1, 'Workspace is required'),
})

// Schema for updating chatflow
const updateSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  schema: z.record(z.unknown()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
})

export async function generateChatflowAction(formData: FormData) {
  const description = formData.get('description') as string
  const workspaceSlug = formData.get('workspaceSlug') as string

  try {
    // Validation
    const validated = generateSchema.parse({ description, workspaceSlug })

    // Auth check
    const { auth, error } = await requireAuth()
    if (error) throw new Error('Unauthorized')

    // Get workspace and verify membership
    const workspace = await prisma.workspace.findUnique({
      where: { slug: validated.workspaceSlug },
    })

    if (!workspace) throw new Error('Workspace not found')

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        profileId_workspaceId: {
          profileId: auth.user.id,
          workspaceId: workspace.id,
        },
      },
    })

    if (!membership) throw new Error('Not a member of this workspace')

    // Create initial record
    const chatflow = await prisma.chatflow.create({
      data: {
        name: 'Generating Chatflow...',
        description: validated.description,
        schema: {},
        status: 'DRAFT',
        shareUrl: Math.random().toString(36).substring(7),
        workspaceId: workspace.id,
      },
    })

    // Trigger background generation (fire and forget)
    // In Server Actions, we can just call it. Vercel functions might time out if this takes too long,
    // but since we are redirecting immediately, it should be fine if it runs in background?
    // Actually, for Server Actions, we generally want to await if we want to ensure it started.
    // But since `generateChatflowBackground` is async, we can await it or let it float. 
    // Ideally we'd use a queue, but for now we'll stick to the existing pattern.
    // However, to prevent holding up the response too long if it's slow, we might not await?
    // But `AdminView` was polling. Here we want to redirect to the edit page.
    // If we redirect immediately, the user might see an empty chatflow.
    // Better to await the initial generation step or at least part of it if it's fast.
    // Looking at `chatflow-generation.ts`, it does multiple AI calls. It might be slow (10s+).
    // We should probably just start it and let the user land on the edit page which handles "loading/generating" state?
    // The plan says: "On success, redirect to /w/[slug]/chatflows/[id]".
    // If we redirect immediately, the `schema` will be empty. The Edit page needs to handle "empty schema/generating" state.
    // For now, I will await it to keep it simple, as Next.js server actions can run for a bit.
    // If it times out, we might need a better background job strategy.

    // Optimization: Fire and forget to avoid timeout, let the UI show "Generating..." based on empty schema.
    generateChatflowBackground(chatflow.id, validated.description).catch(console.error)

    return { success: true, chatflowId: chatflow.id }
  } catch (error) {
    console.error('Generate action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate chatflow'
    }
  }
}

export const updateChatflowAction = createObjectAction(
  updateSchema,
  async (validated) => {
    const { auth, error } = await requireAuth()
    if (error) throw new Error('Unauthorized')

    // Check ownership via workspace
    const chatflow = await prisma.chatflow.findUnique({
      where: { id: validated.id },
      include: { workspace: true }
    })

    if (!chatflow) throw new Error('Chatflow not found')

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        profileId_workspaceId: {
          profileId: auth.user.id,
          workspaceId: chatflow.workspaceId,
        },
      },
    })

    if (!membership) throw new Error('Unauthorized access to workspace')

    // Update - Cast schema to Prisma InputJsonValue
    const updateData: Prisma.ChatflowUpdateInput = {
      ...(validated.name && { name: validated.name }),
      ...(validated.schema && { schema: validated.schema as Prisma.InputJsonValue }),
      ...(validated.status && { status: validated.status }),
    }

    await prisma.chatflow.update({
      where: { id: validated.id },
      data: updateData,
    })

    revalidatePath(`/w/${chatflow.workspace.slug}/chatflows/${validated.id}`)
    return { success: true }
  }
)

export async function publishChatflowAction(id: string) {
  try {
    return await updateChatflowAction({ id, status: 'PUBLISHED' })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish chatflow'
    }
  }
}

