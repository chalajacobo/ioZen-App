import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { generateChatflowWorkflow } from '@/workflows/generate-chatflow';

const generateChatflowSchema = z.object({
    description: z.string().min(10, 'Description must be at least 10 characters'),
});

function generateShareUrl(): string {
    // Generate a random 8-character alphanumeric string
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { description } = generateChatflowSchema.parse(body);

        // TODO: Get user ID from session (Supabase Auth)
        const userId = 'temp-user-id';

        // Trigger the AI workflow to generate chatflow schema
        const schema = await generateChatflowWorkflow(description);

        // Create the chatflow in the database
        const chatflow = await prisma.chatflow.create({
            data: {
                name: schema.name,
                description,
                schema: schema as any, // Prisma Json type
                userId,
                shareUrl: generateShareUrl(),
                status: 'DRAFT',
            },
        });

        return NextResponse.json(chatflow, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Error generating chatflow:', error);
        return NextResponse.json(
            { error: 'Failed to generate chatflow', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
