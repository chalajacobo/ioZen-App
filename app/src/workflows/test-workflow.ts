import { sleep } from 'workflow';

interface ProcessedMessage {
    original: string;
    processed: string;
    timestamp: string;
}

/**
 * Test workflow to verify Vercel Workflow is working correctly
 * This is a simple example that demonstrates workflow and step directives
 */
export async function testWorkflow(message: string) {
    'use workflow';

    console.log('Starting test workflow...');

    // Step 1: Process message
    const processed = await processMessage(message);

    // Step 2: Sleep for 2 seconds (zero resource consumption)
    await sleep('2s');

    // Step 3: Finalize
    const result = await finalizeWorkflow(processed);

    console.log('Test workflow complete! Run npx workflow web to inspect');

    return result;
}

async function processMessage(message: string): Promise<ProcessedMessage> {
    'use step';

    console.log(`Processing message: ${message}`);

    return {
        original: message,
        processed: message.toUpperCase(),
        timestamp: new Date().toISOString(),
    };
}

async function finalizeWorkflow(data: ProcessedMessage) {
    'use step';

    console.log('Finalizing workflow...');

    return {
        ...data,
        status: 'completed',
        workflowVersion: '1.0.0',
    };
}

