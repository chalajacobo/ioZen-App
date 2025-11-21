import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { ChatflowStatus, Prisma } from '@prisma/client';
import { createApiHandler } from '@/lib/api-utils';
import { requireAuth } from '@/lib/api-auth';
import { ChatflowSchema, isChatflowSchema } from '@/types';

const updateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    schema: z.custom<ChatflowSchema>((val) => isChatflowSchema(val)).optional(),
    status: z.nativeEnum(ChatflowStatus).optional(),
});

export const GET = createApiHandler(async (req, context) => {
    const { auth, error } = await requireAuth();
    if (error) throw new Error('Unauthorized');

    if (!context?.params) {
        throw new Error('Missing route parameters');
    }
    const { id } = await context.params;

    // First find the chatflow and verify workspace membership
    const chatflow = await prisma.chatflow.findUnique({
        where: { id },
        include: {
            workspace: true,
            _count: {
                select: { submissions: true }
            }
        }
    });

    if (!chatflow) {
        throw new Error('Chatflow not found');
    }

    // Verify user is a member of the workspace
    const membership = await prisma.workspaceMember.findUnique({
        where: {
            profileId_workspaceId: {
                profileId: auth.user.id,
                workspaceId: chatflow.workspaceId
            }
        }
    });

    if (!membership) {
        throw new Error('Chatflow not found');
    }

    // Format the response to match the expected structure
    const formattedChatflow = {
        id: chatflow.id,
        name: chatflow.name,
        description: chatflow.description,
        schema: chatflow.schema,
        status: chatflow.status,
        shareUrl: chatflow.shareUrl,
        submissions: chatflow._count.submissions,
        createdAt: chatflow.createdAt,
        updatedAt: chatflow.updatedAt,
    };

    return { chatflow: formattedChatflow };
})

export const PATCH = createApiHandler(async (req, context) => {
    const { auth, error } = await requireAuth();
    if (error) throw new Error('Unauthorized');

    if (!context?.params) {
        throw new Error('Missing route parameters');
    }
    const { id } = await context.params;

    const body = await req.json();
    const validatedData = updateSchema.parse(body);

    // Check if chatflow exists and user has access
    const existingChatflow = await prisma.chatflow.findUnique({
        where: { id }
    });

    if (!existingChatflow) {
        throw new Error('Chatflow not found');
    }

    // Verify user is a member of the workspace
    const membership = await prisma.workspaceMember.findUnique({
        where: {
            profileId_workspaceId: {
                profileId: auth.user.id,
                workspaceId: existingChatflow.workspaceId
            }
        }
    });

    if (!membership) {
        throw new Error('Chatflow not found');
    }

    // Update the chatflow
    // Destructure to separate schema from other fields
    const { schema, ...otherData } = validatedData;
    
    const updatedChatflow = await prisma.chatflow.update({
        where: { id },
        data: {
            ...otherData,
            // Cast schema to Prisma.InputJsonValue if present
            ...(schema && { 
                schema: schema as unknown as Prisma.InputJsonValue 
            })
        },
    });

    return { chatflow: updatedChatflow };
})
