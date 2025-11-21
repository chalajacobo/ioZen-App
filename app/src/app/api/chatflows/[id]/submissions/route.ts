import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { auth, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    try {
        // First verify user has access to this chatflow
        const chatflow = await prisma.chatflow.findUnique({
            where: { id }
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

        const submissions = await prisma.chatflowSubmission.findMany({
            where: { chatflowId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                messages: true
            }
        });

        return NextResponse.json({ submissions });
    } catch (error) {
        console.error("Failed to fetch submissions:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
