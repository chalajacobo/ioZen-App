import { Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';
import { ChatflowSchema, isChatflowSchema, ChatflowField } from '@/types';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

import { prisma } from '@/lib/db';

export async function generateChatflowBackground(chatflowId: string, description: string) {
    try {
        // Step 1: Analyze and get suggested name
        const { analysis, suggestedName } = await analyzeRequestStep(description);

        // Step 2: Generate
        const schema = await generateSchemaStep(description, analysis);

        // Step 3: Validate
        const validatedSchema = await validateSchemaStep(schema);

        // Update DB with schema and name
        await prisma.chatflow.update({
            where: { id: chatflowId },
            data: {
                schema: validatedSchema as unknown as object, // Cast for Prisma Json
                name: suggestedName
            }
        });

    } catch (error) {
        console.error("Background generation failed:", error);
        throw error;
    }
}

async function analyzeRequestStep(description: string): Promise<{ analysis: string; suggestedName: string }> {

    console.log('[analyzeRequestStep] Starting analysis...');
    console.log('[analyzeRequestStep] API Key present:', !!process.env.ANTHROPIC_API_KEY);
    console.log('[analyzeRequestStep] API Key length:', process.env.ANTHROPIC_API_KEY?.length || 0);

    if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('[analyzeRequestStep] No API key found, using mock data');
        return {
            analysis: "Mock analysis: User wants a form for " + description,
            suggestedName: "Untitled Chatflow"
        };
    }

    try {
        console.log('[analyzeRequestStep] Calling Anthropic API...');
        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 500,
            temperature: 0,
            system: `You are an expert form designer. Analyze the user's request to:
1. Identify the core purpose and target audience
2. Suggest a clear, professional name for the chatflow (2-5 words)
3. Identify key data points needed

Return a JSON object with this structure:
{
  "suggestedName": "Professional Chatflow Name",
  "analysis": "Brief analysis of the request..."
}`,
            messages: [
                {
                    role: "user",
                    content: `Analyze this chatflow request: "${description}"`
                }
            ]
        });

        const textContent = response.content[0].type === 'text' ? response.content[0].text : '';
        const jsonString = textContent.replace(/```json\n?|\n?```/g, '').trim();
        const result = JSON.parse(jsonString);
        return {
            analysis: result.analysis || textContent,
            suggestedName: result.suggestedName || "Untitled Chatflow"
        };
    } catch (error) {
        console.error("AI Analysis failed, using mock:", error);
        return {
            analysis: "Mock analysis: User wants a form for " + description,
            suggestedName: "Untitled Chatflow"
        };
    }
}

async function generateSchemaStep(description: string, analysis: string): Promise<ChatflowSchema> {

    console.log('[generateSchemaStep] Starting schema generation...');
    console.log('[generateSchemaStep] API Key present:', !!process.env.ANTHROPIC_API_KEY);

    if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('[generateSchemaStep] No API key found, using mock data');
        return {
            fields: [
                { id: "f1", name: "field1", label: "Mock Question 1", type: "text", required: true, options: [] },
                { id: "f2", name: "field2", label: "Mock Question 2", type: "select", required: false, options: ["Option A", "Option B"] }
            ] as ChatflowField[]
        };
    }

    try {
        const systemPrompt = `You are an expert form designer. Generate a JSON schema for a data collection chatflow.

The schema should have a "fields" array. Each field object must have:
- id: unique string (e.g., "field_1")
- name: camelCase field name for data storage (e.g., "fullName", "emailAddress")
- label: user-friendly question (e.g., "What is your full name?")
- type: one of "text", "email", "number", "date", "select", "boolean", "textarea", "phone", "url", "file"
- required: boolean
- placeholder: (optional) helpful placeholder text
- options: (optional) array of strings, ONLY for "select" type
- validation: (optional) object with rules like { "minLength": 5, "maxLength": 100, "pattern": "regex" }

Field type guidelines:
- "text": short text (name, title, etc.)
- "textarea": long text (descriptions, comments, etc.)
- "email": email addresses (includes validation)
- "phone": phone numbers
- "url": website URLs
- "number": numeric values
- "date": date selection
- "select": multiple choice with options array
- "boolean": yes/no questions
- "file": file uploads (images, documents)

Example output:
{
  "fields": [
    { 
      "id": "f1", 
      "name": "fullName",
      "label": "What is your full name?", 
      "type": "text", 
      "required": true,
      "placeholder": "John Doe",
      "validation": { "minLength": 2, "maxLength": 100 }
    },
    { 
      "id": "f2", 
      "name": "serviceRating",
      "label": "How would you rate our service?", 
      "type": "select", 
      "required": true, 
      "options": ["Excellent", "Good", "Fair", "Poor"] 
    },
    {
      "id": "f3",
      "name": "additionalComments",
      "label": "Any additional comments?",
      "type": "textarea",
      "required": false,
      "placeholder": "Share your thoughts..."
    }
  ]
}

Return ONLY the JSON object. Do not include markdown formatting or explanations.`;

        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 2048,
            temperature: 0,
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: `Description: ${description}\n\nAnalysis: ${analysis}\n\nGenerate the JSON schema with 5-12 relevant fields.`
                }
            ]
        });

        const textContent = response.content[0].type === 'text' ? response.content[0].text : '';
        const jsonString = textContent.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("AI Generation failed, using mock:", error);
        return {
            fields: [
                { id: "f1", name: "field1", label: "Mock Question 1", type: "text", required: true, options: [] },
                { id: "f2", name: "field2", label: "Mock Question 2", type: "select", required: false, options: ["Option A", "Option B"] }
            ] as ChatflowField[]
        };
    }
}

async function validateSchemaStep(schema: unknown): Promise<ChatflowSchema> {

    const fieldSchema = z.object({
        id: z.string(),
        name: z.string(),
        label: z.string(),
        type: z.enum(["text", "email", "number", "date", "select", "boolean", "textarea", "phone", "url", "file"]),
        required: z.boolean(),
        placeholder: z.string().optional(),
        helperText: z.string().optional(),
        options: z.array(z.string()).optional(),
        validation: z.object({
            minLength: z.number().optional(),
            maxLength: z.number().optional(),
            pattern: z.string().optional(),
            min: z.number().optional(),
            max: z.number().optional(),
            message: z.string().optional(),
        }).optional(),
    });

    const chatflowSchema = z.object({
        fields: z.array(fieldSchema),
        settings: z.object({
            theme: z.enum(['light', 'dark']).optional(),
            submitButtonText: z.string().optional(),
            successMessage: z.string().optional(),
        }).optional(),
    });

    return chatflowSchema.parse(schema);
}

