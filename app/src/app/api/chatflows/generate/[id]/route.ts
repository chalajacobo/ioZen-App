import { createApiHandler } from '@/lib/api-utils';
import { prisma } from '@/lib/db';
import { ChatflowSchema, isChatflowSchema } from '@/types';

export const GET = createApiHandler(async (req, context) => {
    if (!context?.params) {
        throw new Error('Missing route parameters');
    }
    const { id } = await context.params;

    const chatflow = await prisma.chatflow.findUnique({
        where: { id }
    });

    if (!chatflow) {
        throw new Error('Chatflow not found');
    }

    // Check if schema is populated (not empty object)
    const schema = chatflow.schema;
    
    if (!schema || !isChatflowSchema(schema) || schema.fields.length === 0) {
        return { status: 'running' };
    }

    // At this point, schema is guaranteed to be ChatflowSchema
    // Type assertion needed for spread operator
    const validSchema: ChatflowSchema = schema;
    
    return {
        status: 'completed',
        result: {
            ...validSchema,
            name: chatflow.name
        }
    };
})
