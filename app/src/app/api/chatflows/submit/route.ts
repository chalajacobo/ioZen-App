import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/api-utils';
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

export const POST = createApiHandler(async (req: NextRequest) => {
    const body = await req.json();
    const { submissionId, chatflowId, data, status } = submissionSchema.parse(body);

    // Verify chatflow exists
    const chatflow = await prisma.chatflow.findUnique({
        where: { id: chatflowId },
    });

    if (!chatflow) {
        throw new Error('Chatflow not found');
    }

    // Security check: Only allow submissions to PUBLISHED chatflows
    // OR if user is authenticated and a workspace member (for testing drafts)
    if (chatflow.status !== 'PUBLISHED') {
        const auth = await getAuthContext();

        if (!auth) {
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

    return { submissionId: submission.id };
})

