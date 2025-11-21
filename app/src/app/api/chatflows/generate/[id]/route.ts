import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ChatflowSchema, isChatflowSchema } from '@/types';

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
        const schema = chatflow.schema;
        
        if (!schema || !isChatflowSchema(schema) || schema.fields.length === 0) {
            return NextResponse.json({ status: 'running' });
        }

        // At this point, schema is guaranteed to be ChatflowSchema
        // Type assertion needed for spread operator
        const validSchema: ChatflowSchema = schema;
        
        return NextResponse.json({
            status: 'completed',
            result: {
                ...validSchema,
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
