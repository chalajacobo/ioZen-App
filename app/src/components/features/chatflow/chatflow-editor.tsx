"use client";

import { useState, useEffect } from "react";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/data-display";
import { Input, Label } from "@/ui/forms";
import { Separator } from "@/ui/layout";
import { ChatView } from "@/features/chat";
import {
    Plus, Check, ExternalLink, PlayCircle, Settings2, Hash, Calendar,
    Type, ImageIcon, ChevronDown, Save, FileText, MoreHorizontal, MessageSquare,
    Loader2, GripVertical, Copy, CheckCircle2, LucideIcon
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/ui/overlays";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/layout";
import { FieldEditor, ChatflowMonitor } from "@/features/chatflow";
import { toast } from "sonner";
import { updateChatflowAction, publishChatflowAction } from "@/app/actions/chatflow";
import { Chatflow, ChatflowField, isChatflowSchema } from "@/types";
import { cn } from "@/lib/utils";

export function ChatflowEditor({ chatflow }: { chatflow: Chatflow }) {
    const [activeTab, setActiveTab] = useState<"config" | "preview">("config");
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [chatflowName, setChatflowName] = useState(chatflow.name);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [publishedUrl, setPublishedUrl] = useState("");

    // Initialize fields from chatflow schema
    const [fields, setFields] = useState<ChatflowField[]>(() => {
        if (isChatflowSchema(chatflow.schema)) {
            return chatflow.schema.fields;
        }
        return [];
    });

    // Sync state with props when server data updates (via router.refresh)
    useEffect(() => {
        setChatflowName(chatflow.name);
        if (isChatflowSchema(chatflow.schema)) {
            setFields(chatflow.schema.fields);
        }
    }, [chatflow]);

    const selectedField = fields.find(f => f.id === selectedFieldId);

    const handleUpdateField = (id: string, updates: Partial<ChatflowField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const handleSaveClick = async () => {
        setIsSaving(true);
        try {
            const result = await updateChatflowAction({
                id: chatflow.id,
                name: chatflowName,
                schema: { fields } as object,
            });

            if (!result.success) throw new Error(result.error);

            toast.success("Chatflow saved successfully");
        } catch (error) {
            console.error('Save error:', error);
            toast.error(error instanceof Error ? error.message : "Failed to save chatflow");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublishClick = async () => {
        setIsPublishing(true);
        try {
            // First save
            const saveResult = await updateChatflowAction({
                id: chatflow.id,
                name: chatflowName,
                schema: { fields } as object,
            });
            if (!saveResult.success) throw new Error(saveResult.error);

            // Then publish
            const publishResult = await publishChatflowAction(chatflow.id);
            if (!publishResult.success) throw new Error(publishResult.error);

            const origin = window.location.origin;
            const shareUrl = `${origin}/c/${chatflow.shareUrl}`;

            // Show success dialog
            setPublishedUrl(shareUrl);
            setShowSuccessDialog(true);
            toast.success("Chatflow published successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Failed to publish chatflow");
        } finally {
            setIsPublishing(false);
        }
    };

    const getIconForType = (type: string): LucideIcon => {
        switch (type) {
            case 'text': return Type;
            case 'textarea': return FileText;
            case 'number': return Hash;
            case 'date': return Calendar;
            case 'email': return MessageSquare;
            case 'select': return MoreHorizontal;
            case 'boolean': return Check;
            case 'file': return ImageIcon;
            default: return Type;
        }
    };

    const handleAddField = () => {
        const newField: ChatflowField = {
            id: `field_${Date.now()}`,
            name: `field_${fields.length + 1}`,
            label: "New Field",
            type: "text",
            required: false,
            placeholder: "",
            helperText: "",
            options: []
        };
        setFields([...fields, newField]);
        setSelectedFieldId(newField.id);
    };

    const handleDeleteField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
        if (selectedFieldId === id) {
            setSelectedFieldId(null);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = fields.findIndex((f) => f.id === active.id);
            const newIndex = fields.findIndex((f) => f.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                setFields((items) => arrayMove(items, oldIndex, newIndex));
            }
        }
    };

    return (
        <div className="space-y-6">
            <ChatflowMonitor chatflowId={chatflow.id} />
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Configure Fields</h2>
                    <p className="text-neutral-400">Manage the fields and structure of your chatflow.</p>
                </div>
                <div className="inline-flex rounded-lg bg-neutral-900 p-1 border border-neutral-800">
                    <button
                        onClick={() => setActiveTab("config")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "config"
                            ? "bg-neutral-800 text-white"
                            : "text-neutral-400 hover:text-neutral-200"
                            }`}
                    >
                        Configuration
                    </button>
                    <button
                        onClick={() => setActiveTab("preview")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "preview"
                            ? "bg-neutral-800 text-white"
                            : "text-neutral-400 hover:text-neutral-200"
                            }`}
                    >
                        Preview
                    </button>
                </div>
            </div>

            {/* Content */}
            <div>
                {activeTab === "config" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Panel - Fields List */}
                        <div className={`lg:col-span-4 ${selectedFieldId ? 'hidden lg:block' : ''}`}>
                            <Card className="bg-black border-neutral-800">
                                <CardHeader className="space-y-4 pb-4">
                                    <div className="space-y-2">
                                        <Label className="text-neutral-300 text-sm font-medium">Chatflow Name</Label>
                                        <div className="relative">
                                            <Input
                                                value={chatflowName}
                                                onChange={(e) => setChatflowName(e.target.value)}
                                                className={cn(
                                                    "bg-neutral-950 border-neutral-800 text-neutral-200 pr-10",
                                                    chatflowName === "Generating Chatflow..." && "animate-pulse text-neutral-400"
                                                )}
                                                placeholder="My Awesome Chatflow"
                                                disabled={chatflowName === "Generating Chatflow..."}
                                            />
                                            {chatflowName === "Generating Chatflow..." && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                                </div>
                                            )}
                                        </div>
                                        {chatflowName === "Generating Chatflow..." && (
                                            <p className="text-xs text-blue-400 animate-pulse">
                                                AI is generating your chatflow structure...
                                            </p>
                                        )}
                                    </div>
                                    <Separator className="bg-neutral-800" />
                                    <div className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg">Fields</CardTitle>
                                            <CardDescription className="text-neutral-500 text-sm">Manage your fields.</CardDescription>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleAddField}
                                            className="text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800 transition-colors"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Field
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-1.5 p-3">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={fields.map(f => f.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {fields.map((field) => (
                                                <SortableFieldItem
                                                    key={field.id}
                                                    field={field}
                                                    isSelected={selectedFieldId === field.id}
                                                    onSelect={() => setSelectedFieldId(field.id)}
                                                    IconComponent={getIconForType(field.type)}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Panel - Field Editor or Empty State */}
                        <div className="lg:col-span-8 hidden lg:block">
                            {selectedField ? (
                                <Card className="bg-black border-neutral-800 h-full overflow-hidden">
                                    <FieldEditor
                                        field={selectedField}
                                        onSave={(updatedField) => {
                                            handleUpdateField(updatedField.id, updatedField);
                                            toast.success("Field updated");
                                        }}
                                        onDelete={() => {
                                            handleDeleteField(selectedField.id);
                                            toast.success("Field deleted");
                                        }}
                                        onCancel={() => setSelectedFieldId(null)}
                                    />
                                </Card>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-neutral-800 rounded-lg bg-neutral-950/50 border-dashed">
                                    <div className="h-12 w-12 rounded-full bg-neutral-900 flex items-center justify-center mb-4">
                                        <Settings2 className="h-6 w-6 text-neutral-500" />
                                    </div>
                                    <h3 className="text-lg font-medium text-neutral-200">No Field Selected</h3>
                                    <p className="text-neutral-500 max-w-xs mt-2">
                                        Select a field from the list on the left to edit its properties, or add a new field.
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={handleAddField}
                                        className="mt-6 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add New Field
                                    </Button>
                                </div>
                            )}
                        </div>

                    </div >
                ) : (
                    <div className="w-full">
                        {/* Chat Interface with integrated header */}
                        <div className="flex flex-col h-[calc(100vh-420px)] w-full max-w-5xl mx-auto bg-black border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
                            {/* Integrated Header with Chat Preview title and actions */}
                            <div className="h-14 border-b border-neutral-800 bg-neutral-950/50 flex items-center justify-between px-4 md:px-6 backdrop-blur-sm flex-shrink-0">
                                <h3 className="text-base font-semibold text-neutral-200">Chat Preview</h3>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800"
                                        >
                                            Actions
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 bg-neutral-900 border-neutral-700">
                                        <DropdownMenuItem
                                            onClick={handleSaveClick}
                                            disabled={isSaving}
                                            className="cursor-pointer text-neutral-200 hover:text-white hover:bg-neutral-800 focus:bg-neutral-800 focus:text-white"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="mr-2 h-4 w-4" />
                                            )}
                                            <span>{isSaving ? "Saving..." : "Save Draft"}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                const origin = window.location.origin;
                                                const shareUrl = `${origin}/c/${chatflow.shareUrl}`;
                                                navigator.clipboard.writeText(shareUrl);
                                                toast.success("Link copied to clipboard");
                                            }}
                                            className="cursor-pointer text-neutral-200 hover:text-white hover:bg-neutral-800 focus:bg-neutral-800 focus:text-white"
                                        >
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            <span>Copy Share Link</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={handlePublishClick}
                                            disabled={isPublishing}
                                            className="cursor-pointer text-neutral-200 hover:text-white hover:bg-neutral-800 focus:bg-neutral-800 focus:text-white"
                                        >
                                            {isPublishing ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <PlayCircle className="mr-2 h-4 w-4" />
                                            )}
                                            <span>{isPublishing ? "Publishing..." : "Publish Chatflow"}</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Chat Content */}
                            <div className="flex-1 overflow-hidden">
                                <ChatView fields={fields} />
                            </div>
                        </div>
                    </div>
                )}
            </div >

            {/* Success Dialog */}
            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent className="bg-neutral-900 border-neutral-800 max-w-md">
                    <DialogHeader>
                        <div className="flex items-center justify-center mb-4">
                            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                        <DialogTitle className="text-center text-xl text-neutral-100">
                            Chatflow Published Successfully!
                        </DialogTitle>
                        <DialogDescription className="text-center text-neutral-400">
                            Your chatflow is now live and ready to receive submissions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-sm text-neutral-400">Share URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={publishedUrl}
                                    readOnly
                                    className="bg-neutral-950 border-neutral-800 text-neutral-300 font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                        navigator.clipboard.writeText(publishedUrl);
                                        toast.success("Link copied to clipboard!");
                                    }}
                                    className="border-neutral-800 hover:bg-neutral-800 hover:text-white"
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowSuccessDialog(false)}
                            className="flex-1 border-neutral-800 hover:bg-neutral-800 hover:text-white"
                        >
                            Close
                        </Button>
                        <Button
                            onClick={() => {
                                window.open(publishedUrl, '_blank');
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Link
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

function SortableFieldItem({
    field,
    isSelected,
    onSelect,
    IconComponent
}: {
    field: ChatflowField,
    isSelected: boolean,
    onSelect: () => void,
    IconComponent: LucideIcon
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-1.5">
            <button
                onClick={onSelect}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group relative ${isSelected
                    ? 'bg-blue-500/10 border-blue-500/50 shadow-sm'
                    : 'bg-neutral-950/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/50'
                    }`}
            >
                <div className="flex items-center gap-3">
                    {/* Drag Handle */}
                    <div {...attributes} {...listeners} suppressHydrationWarning className="cursor-grab active:cursor-grabbing p-1 hover:bg-neutral-900 rounded text-neutral-600 hover:text-neutral-400" onClick={(e) => e.stopPropagation()}>
                        <GripVertical className="h-4 w-4" />
                    </div>

                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                        ? 'bg-blue-500/20 border border-blue-500/30'
                        : 'bg-neutral-900 border border-neutral-800'
                        }`}>
                        <IconComponent className={`h-4 w-4 ${isSelected ? 'text-blue-400' : 'text-neutral-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm ${isSelected ? 'text-blue-100' : 'text-neutral-200'}`}>
                            {field.label}
                        </div>
                        <div className="text-xs text-neutral-500 font-mono truncate mt-0.5">
                            {field.name}
                        </div>
                    </div>
                    {field.required && (
                        <div className="flex-shrink-0">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                                Required
                            </span>
                        </div>
                    )}
                </div>
            </button>
        </div>
    );
}

