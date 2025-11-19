import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

async function testClaude() {
    try {
        console.log('Testing Claude API connection...\n');

        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 100,
            messages: [{
                role: 'user',
                content: 'Say hello and confirm you are Claude in one sentence!'
            }]
        });

        console.log('✅ Claude API is working!\n');
        console.log('Response:', message.content[0].text);
        console.log('\nModel:', message.model);
        console.log('Tokens used:', message.usage.input_tokens, 'input,', message.usage.output_tokens, 'output');

    } catch (error: any) {
        console.error('❌ Claude API failed:', error.message);
        process.exit(1);
    }
}

testClaude();
