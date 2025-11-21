
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const chatflow = await prisma.chatflow.findUnique({
            where: { id }
        });

        if (!chatflow) {
            return NextResponse.json(
                { error: 'Chatflow not found' },
                { status: 404 }
            );
        }

        // Check if schema is populated (not empty object)
        const schema = chatflow.schema as Record<string, any>;
        const isGenerating = !schema || Object.keys(schema).length === 0;

        if (isGenerating) {
            return NextResponse.json({ status: 'running' });
        }

        return NextResponse.json({
            status: 'completed',
            result: {
                ...schema,
                name: chatflow.name
            }
        });

    } catch (error) {
        console.error('Error fetching workflow result:', error);
        return NextResponse.json(
            { error: 'Failed to fetch workflow status' },
            { status: 500 }
        );
    }
}
