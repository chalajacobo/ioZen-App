import { start } from 'workflow/api';
import { NextResponse } from 'next/server';
// import { testWorkflow } from '@/workflows/test-workflow';

export async function GET() {
    // Temporarily disabled for deployment
    return NextResponse.json({
        message: 'Test workflow endpoint disabled',
    });

    // const run = await testWorkflow.start();

    // return NextResponse.json({
    //     message: 'Test workflow started',
    //     workflowId: run.id,
    // });
}
