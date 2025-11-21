import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getAuthContext } from '@/lib/api-auth';
import { SubmissionData } from '@/types';

const submissionSchema = z.object({
    submissionId: z.string().optional(),
    chatflowId: z.string(),
    data: z.record(z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.string()),
        z.null()
    ])) as z.ZodType<SubmissionData>,
    status: z.enum(['IN_PROGRESS', 'COMPLETED', 'ABANDONED']).default('COMPLETED'),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { submissionId, chatflowId, data, status } = submissionSchema.parse(body);

        // Verify chatflow exists
        const chatflow = await prisma.chatflow.findUnique({
            where: { id: chatflowId },
        });

        if (!chatflow) {
            return NextResponse.json(
                { error: "Chatflow not found" },
                { status: 404 }
            );
        }

        // Security check: Only allow submissions to PUBLISHED chatflows
        // OR if user is authenticated and a workspace member (for testing drafts)
        if (chatflow.status !== 'PUBLISHED') {
            const auth = await getAuthContext();

            if (!auth) {
                return NextResponse.json(
                    { error: "Chatflow not found" },
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
                    { error: "Chatflow not found" },
                    { status: 404 }
                );
            }
        }

        let submission;

        if (submissionId) {
            // Update existing submission to mark as complete
            submission = await prisma.chatflowSubmission.update({
                where: { id: submissionId },
                data: {
                    data,
                    status,
                    completedAt: status === 'COMPLETED' ? new Date() : null,
                },
            });
        } else {
            // Create new submission (backward compatibility)
            submission = await prisma.chatflowSubmission.create({
                data: {
                    chatflowId,
                    data,
                    status,
                    completedAt: status === 'COMPLETED' ? new Date() : null,
                },
            });
        }

        return NextResponse.json({
            success: true,
            submissionId: submission.id
        });

    } catch (error) {
        console.error("Submission failed:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid submission data", details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

