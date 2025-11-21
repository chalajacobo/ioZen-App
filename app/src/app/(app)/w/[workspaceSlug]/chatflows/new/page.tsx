"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import { Card } from "@/ui/data-display";
import { Textarea } from "@/ui/forms";
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { toast } from "sonner";
import { generateChatflowAction } from "@/app/actions/chatflow";
import { Container, PageHeader } from "@/components/layout";

export default function CreateChatflowPage() {
    const params = useParams();
    const router = useRouter();
    const workspaceSlug = params.workspaceSlug as string;

    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        try {
            const formData = new FormData();
            formData.append('description', prompt);
            formData.append('workspaceSlug', workspaceSlug);

            const result = await generateChatflowAction(formData);

            if (result.success) {
                toast.success("Chatflow generated successfully!");
                router.push(`/w/${workspaceSlug}/chatflows/${result.chatflowId}`);
            } else {
                toast.error(result.error || "Failed to generate chatflow");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSkip = async () => {
        // Create a blank chatflow?
        // We can reuse the action with a generic description or create a specific "create blank" action.
        // For now, let's use the generate action with a generic prompt to get a basic structure,
        // or we could add a separate "createBlank" action.
        // To keep it simple and reuse existing logic, I'll send a generic prompt.
        // Or better, I'll just use a "Blank Chatflow" description which the AI might handle or we can handle in action.
        // Actually, the plan didn't specify "Skip" behavior in detail, but `AdminView` had `onSkip` which just went to edit with empty schema.
        // But here we need a DB record to edit.
        // So we MUST create a record.
        // I'll use the same action with a default prompt like "A blank contact form".

        setIsGenerating(true);
        try {
            const formData = new FormData();
            formData.append('description', "Create a simple contact form with name, email and message.");
            formData.append('workspaceSlug', workspaceSlug);

            const result = await generateChatflowAction(formData);
            if (result.success) {
                router.push(`/w/${workspaceSlug}/chatflows/${result.chatflowId}`);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Container>
            <PageHeader
                title="Create New Chatflow"
                description="Use AI to generate a form structure or start from scratch."
                backUrl={`/w/${workspaceSlug}/dashboard`}
            />

            <div className="max-w-3xl mx-auto mt-8">
                <Card className="bg-black border-neutral-800 relative overflow-hidden transition-colors duration-300 hover:border-neutral-700">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

                    <div className="flex flex-col items-center justify-center min-h-[400px] max-w-2xl mx-auto text-center space-y-8 animate-in zoom-in-95 duration-500 p-8">
                        <div className="space-y-4">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center mx-auto shadow-2xl shadow-blue-900/20 transition-transform duration-500 hover:scale-110 hover:rotate-3">
                                <Sparkles className="h-10 w-10 text-white" />
                            </div>
                            <h2 className="text-3xl font-semibold tracking-tight">Describe your ideal chatflow</h2>
                            <p className="text-neutral-400 max-w-md mx-auto">
                                Our AI will generate the perfect structure for your needs. You can customize it later.
                            </p>
                        </div>

                        <div className="w-full space-y-4">
                            <Textarea
                                placeholder="e.g. I need a chatflow for collecting car insurance claims. It should ask for policy number, incident date, and photos of the damage."
                                className="min-h-[120px] bg-neutral-900 border-neutral-800 text-lg p-4 resize-none focus-visible:ring-blue-600 transition-shadow duration-200 focus:shadow-lg focus:shadow-blue-900/20"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !prompt.trim()}
                                    size="lg"
                                    className="w-full bg-white text-black hover:bg-neutral-200 font-medium h-12 text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Generating Structure...
                                        </>
                                    ) : (
                                        <>
                                            Generate with AI
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={handleSkip}
                                    disabled={isGenerating}
                                    className="text-neutral-500 hover:text-neutral-300"
                                >
                                    Skip and use default template
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </Container>
    );
}

