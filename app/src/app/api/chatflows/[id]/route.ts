import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { ChatflowStatus, Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/api-auth';
import { ChatflowSchema, isChatflowSchema } from '@/types';

const updateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    schema: z.custom<ChatflowSchema>((val) => isChatflowSchema(val)).optional(),
    status: z.nativeEnum(ChatflowStatus).optional(),
});

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { auth, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    try {
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
            return NextResponse.json(
                { error: 'Chatflow not found' },
                { status: 404 }
            );
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
            return NextResponse.json(
                { error: 'Chatflow not found' },
                { status: 404 }
            );
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

        return NextResponse.json({ chatflow: formattedChatflow });

    } catch (error) {
        console.error('Failed to fetch chatflow:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { auth, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    try {
        const body = await req.json();
        const validatedData = updateSchema.parse(body);

        // Check if chatflow exists and user has access
        const existingChatflow = await prisma.chatflow.findUnique({
            where: { id }
        });

        if (!existingChatflow) {
            return NextResponse.json(
                { error: 'Chatflow not found' },
                { status: 404 }
            );
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
            return NextResponse.json(
                { error: 'Chatflow not found' },
                { status: 404 }
            );
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

        return NextResponse.json({
            success: true,
            chatflow: updatedChatflow
        });

    } catch (error) {
        console.error('Failed to update chatflow:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
