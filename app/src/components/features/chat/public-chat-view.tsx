"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/ui/button";
import { Input, Textarea } from "@/ui/forms";
import { Card } from "@/ui/data-display";
import { Send, Loader2, Calendar as CalendarIcon, CheckCircle2, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/forms";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/overlays";
import { Calendar } from "@/ui/data-display";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Field {
    id: string;
    name: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
    validation?: {
        minLength?: number;
        maxLength?: number;
        pattern?: string;
        min?: number;
        max?: number;
    };
}

interface Message {
    id: string;
    role: "assistant" | "user";
    content: string;
    type?: "text" | "input" | "select" | "date" | "image";
    fieldId?: string;
    options?: string[];
}

export function PublicChatView({ chatflowId, fields, chatflowName }: { chatflowId: string, fields: Field[], chatflowName: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
    const [inputValue, setInputValue] = useState("");
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isTyping, setIsTyping] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [submissionId, setSubmissionId] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Focus input after messages update
    useEffect(() => {
        scrollToBottom();
        // Focus input field after a short delay to ensure it's ready
        if (!isCompleted && !isTyping) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [messages, isTyping, isCompleted]);

    // Initial greeting
    useEffect(() => {
        if (fields.length > 0 && messages.length === 0) {
            setIsTyping(true);
            setTimeout(() => {
                setMessages([
                    {
                        id: "welcome",
                        role: "assistant",
                        content: `Welcome to ${chatflowName}! I'll help you complete this form.`
                    },
                    {
                        id: "q1",
                        role: "assistant",
                        content: fields[0].label,
                        type: getInputType(fields[0].type),
                        fieldId: fields[0].id,
                        options: fields[0].options
                    }
                ]);
                setIsTyping(false);
            }, 1000);
        }
    }, [fields, chatflowName]);

    const getInputType = (fieldType: string): Message["type"] => {
        switch (fieldType) {
            case "select": return "select";
            case "date": return "date";
            case "image":
            case "file": return "image";
            case "textarea": return "input"; // Will be handled as multiline input
            case "phone":
            case "url":
            case "email":
            case "number":
            case "text":
            default: return "input";
        }
    };

    const saveFieldToBackend = async (fieldName: string, fieldValue: string): Promise<string | null> => {
        try {
            const response = await fetch('/api/chatflows/submissions/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submissionId: submissionId,
                    chatflowId,
                    fieldName,
                    fieldValue,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save field');
            }

            const result = await response.json();
            return result.submissionId;
        } catch (error) {
            console.error('Save error:', error);
            throw error;
        }
    };

    const handleSubmit = async (value: string) => {
        if (!value.trim()) return;

        const currentField = fields[currentFieldIndex];

        // Format the display value for dates
        let displayValue = value;
        if (currentField.type === 'date' && value) {
            try {
                displayValue = format(new Date(value), "MMMM d, yyyy");
            } catch (e) {
                // If formatting fails, use original value
                displayValue = value;
            }
        }

        // Add user message
        const newMessages = [
            ...messages,
            { id: `ans-${currentField.id}`, role: "user" as const, content: displayValue }
        ];
        setMessages(newMessages);
        setInputValue("");

        // Save answer locally
        const newAnswers = { ...answers, [currentField.name]: value };
        setAnswers(newAnswers);

        // Clear any previous errors
        setSaveError(null);

        // Save to backend immediately
        setIsTyping(true);
        try {
            const newSubmissionId = await saveFieldToBackend(currentField.name, value);
            if (newSubmissionId && !submissionId) {
                setSubmissionId(newSubmissionId);
            }

            // Move to next field or finish
            const nextIndex = currentFieldIndex + 1;

            if (nextIndex < fields.length) {
                const nextField = fields[nextIndex];
                setTimeout(() => {
                    setMessages(prev => [
                        ...prev,
                        {
                            id: `q-${nextField.id}`,
                            role: "assistant",
                            content: nextField.label,
                            type: getInputType(nextField.type),
                            fieldId: nextField.id,
                            options: nextField.options
                        }
                    ]);
                    setIsTyping(false);
                    setCurrentFieldIndex(nextIndex);
                }, 800);
            } else {
                // Finish - mark submission as complete
                setTimeout(async () => {
                    setIsSubmitting(true);
                    try {
                        const response = await fetch('/api/chatflows/submit', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                submissionId,
                                chatflowId,
                                data: newAnswers,
                                status: 'COMPLETED'
                            }),
                        });

                        if (!response.ok) throw new Error('Submission failed');

                        setMessages(prev => [
                            ...prev,
                            {
                                id: "done",
                                role: "assistant",
                                content: "Thank you! Your response has been recorded."
                            }
                        ]);
                        setIsCompleted(true);
                    } catch (error) {
                        console.error(error);
                        setMessages(prev => [
                            ...prev,
                            {
                                id: "error",
                                role: "assistant",
                                content: "Sorry, something went wrong saving your response. Please try again."
                            }
                        ]);
                    } finally {
                        setIsSubmitting(false);
                        setIsTyping(false);
                    }
                }, 1000);
            }
        } catch (error) {
            // Handle save error
            setIsTyping(false);
            setSaveError("Failed to save your answer. Please try again.");
            setMessages(prev => [
                ...prev,
                {
                    id: "save-error",
                    role: "assistant",
                    content: "Sorry, I couldn't save your answer. Please check your connection and try again."
                }
            ]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(inputValue);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-2xl mx-auto bg-black border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="h-14 border-b border-neutral-800 bg-neutral-950/50 flex items-center justify-between px-6 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">{chatflowName}</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs text-neutral-400">Online</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-neutral-800" : "bg-blue-600/10"
                                }`}>
                                {msg.role === "user" ? (
                                    <User className="h-4 w-4 text-neutral-400" />
                                ) : (
                                    <Bot className="h-4 w-4 text-blue-500" />
                                )}
                            </div>
                            <div className={`space-y-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                                    ? "bg-neutral-800 text-white rounded-tr-none"
                                    : "bg-neutral-900 border border-neutral-800 text-white rounded-tl-none"
                                    }`}>
                                    {msg.content}
                                </div>

                                {/* Input Types for Assistant Messages */}
                                {msg.role === "assistant" && msg.type === "select" && !isCompleted && msg.id === messages[messages.length - 1]?.id && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {msg.options?.map((opt) => (
                                            <Button
                                                key={opt}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSubmit(opt)}
                                                className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:text-white text-neutral-300 transition-all"
                                            >
                                                {opt}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                                <Bot className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="bg-neutral-900 border border-neutral-800 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black border-t border-neutral-800">
                {isCompleted ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-2 text-green-500 animate-in fade-in slide-in-from-bottom-4">
                        <CheckCircle2 className="h-8 w-8" />
                        <span className="font-medium">Submission Received</span>
                    </div>
                ) : (
                    <div className="relative flex items-end gap-2">
                        <div className="flex-1">
                            {(() => {
                                const currentField = fields[currentFieldIndex];
                                const fieldType = getInputType(currentField.type);

                                if (fieldType === 'select') {
                                    return (
                                        <Select value={inputValue} onValueChange={setInputValue}>
                                            <SelectTrigger className="w-full bg-neutral-900 border-neutral-800 text-white h-12 rounded-lg px-4 focus:ring-blue-600">
                                                <SelectValue placeholder="Select an option" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                                {currentField.options?.map((opt) => (
                                                    <SelectItem key={opt} value={opt} className="focus:bg-neutral-800 focus:text-white cursor-pointer">
                                                        {opt}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    );
                                }

                                if (fieldType === 'date') {
                                    return (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal bg-neutral-900 border-neutral-800 text-white h-12 rounded-lg px-4 hover:bg-neutral-800 hover:text-white focus:ring-blue-600",
                                                        !inputValue && "text-neutral-500"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {inputValue ? format(new Date(inputValue), "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-800" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={inputValue ? new Date(inputValue) : undefined}
                                                    onSelect={(date) => setInputValue(date ? date.toISOString() : "")}
                                                    initialFocus
                                                    captionLayout="dropdown"
                                                    fromYear={1900}
                                                    toYear={new Date().getFullYear() + 10}
                                                    className="bg-neutral-950 text-white"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    );
                                }

                                if (currentField.type === 'textarea' || currentField.type === 'long_text') {
                                    return (
                                        <Textarea
                                            ref={inputRef as any}
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSubmit(inputValue);
                                                }
                                            }}
                                            placeholder={isTyping ? "Wait for bot..." : "Type your answer..."}
                                            disabled={isTyping || isSubmitting}
                                            className="min-h-[80px] bg-neutral-900 border-neutral-800 focus-visible:ring-blue-600 text-white rounded-lg px-4 py-3 text-base resize-none placeholder:text-neutral-500 !text-white"
                                            style={{ color: 'white' }}
                                        />
                                    );
                                }

                                return (
                                    <Input
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={isTyping ? "Wait for bot..." : "Type your answer..."}
                                        disabled={isTyping || isSubmitting}
                                        className="bg-neutral-900 border-neutral-800 focus-visible:ring-blue-600 pr-4 h-12 text-base !text-white placeholder:text-neutral-500"
                                        style={{ color: 'white' }}
                                    />
                                );
                            })()}
                        </div>
                        <Button
                            size="icon"
                            onClick={() => handleSubmit(inputValue)}
                            disabled={!inputValue.trim() || isTyping || isSubmitting}
                            className="h-12 w-12 bg-blue-600 hover:bg-blue-500 text-white transition-colors flex-shrink-0"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                )}
                <div className="text-center mt-3">
                    <span className="text-[10px] text-neutral-600 uppercase tracking-wider font-medium">Powered by IoZen</span>
                </div>
            </div>
        </div>
    );
}
