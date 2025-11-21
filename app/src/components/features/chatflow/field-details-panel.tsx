"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fieldSchema, FieldFormValues } from "@/lib/form-schemas";
import { toast } from "sonner";
import { Button } from "@/ui/button";
import { Input, Label, Switch } from "@/ui/forms";
import { Separator } from "@/ui/layout";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/ui/forms";
import { RadioGroup, RadioGroupItem } from "@/ui/forms";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/ui/feedback";
import { Card } from "@/ui/data-display";
import {
    Type, Mail, Calendar, Hash, List, ToggleLeft, Phone, Link as LinkIcon,
    FileText, Image as ImageIcon, X, Plus, GripVertical, Trash2, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DndContext
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChatflowField, FieldType } from "@/types";

export type { ChatflowField as Field };

const FIELD_TYPES: { value: FieldType; label: string; icon: any; description: string }[] = [
    { value: 'text', label: 'Text', icon: Type, description: 'Short text input' },
    { value: 'email', label: 'Email', icon: Mail, description: 'Email address validation' },
    { value: 'phone', label: 'Phone', icon: Phone, description: 'Phone number input' },
    { value: 'url', label: 'URL', icon: LinkIcon, description: 'Website link' },
    { value: 'textarea', label: 'Long Text', icon: FileText, description: 'Multi-line text area' },
    { value: 'number', label: 'Number', icon: Hash, description: 'Numeric input' },
    { value: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
    { value: 'select', label: 'Dropdown', icon: List, description: 'Single choice from list' },
    { value: 'boolean', label: 'Yes/No', icon: ToggleLeft, description: 'Toggle switch' },
    { value: 'file', label: 'File Upload', icon: ImageIcon, description: 'File attachment' },
];

function SortableOption({ id, value, onRemove }: { id: string, value: string, onRemove: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 bg-neutral-950 rounded border border-neutral-800 group">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-neutral-900 rounded">
                <GripVertical className="h-4 w-4 text-neutral-600" />
            </div>
            <span className="flex-1 text-neutral-300 text-sm">{value}</span>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-6 w-6 p-0 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X className="h-3 w-3" />
            </Button>
        </div>
    );
}

export function FieldEditor({
    field,
    onSave,
    onDelete,
    onCancel,
    className
}: {
    field: ChatflowField;
    onSave: (field: ChatflowField) => void;
    onDelete: () => void;
    onCancel?: () => void;
    className?: string;
}) {
    const form = useForm<FieldFormValues>({
        resolver: zodResolver(fieldSchema),
        mode: "onChange",
        defaultValues: {
            id: field.id,
            type: field.type,
            label: field.label,
            name: field.name,
            required: field.required,
            placeholder: field.placeholder || '',
            helperText: field.helperText || '',
            options: field.options || [],
        },
    });

    const [newOption, setNewOption] = useState('');

    // Reset form when field changes
    useEffect(() => {
        form.reset({
            id: field.id,
            type: field.type,
            label: field.label,
            name: field.name,
            required: field.required,
            placeholder: field.placeholder || '',
            helperText: field.helperText || '',
            options: field.options || [],
        });
    }, [field, form]);

    const onSubmit = (data: FieldFormValues) => {
        onSave({
            ...data,
            validation: field.validation,
            type: data.type as FieldType, // Ensure type compatibility
        });
    };

    const handleAddOption = () => {
        const trimmedOption = newOption.trim();
        if (trimmedOption) {
            const currentOptions = form.getValues('options') || [];
            if (currentOptions.includes(trimmedOption)) {
                toast.error("Option already exists");
                return;
            }
            form.setValue('options', [...currentOptions, trimmedOption], { shouldDirty: true });
            setNewOption('');
        }
    };

    const handleRemoveOption = (index: number) => {
        const currentOptions = form.getValues('options') || [];
        form.setValue('options', currentOptions.filter((_, i) => i !== index), { shouldDirty: true });
    };

    const currentType = form.watch('type');
    const currentOptions = form.watch('options') || [];

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = currentOptions.indexOf(active.id as string);
            const newIndex = currentOptions.indexOf(over.id as string);

            if (oldIndex !== -1 && newIndex !== -1) {
                form.setValue('options', arrayMove(currentOptions, oldIndex, newIndex), { shouldDirty: true });
            }
        }
    };

    return (
        <div className={cn("h-full flex flex-col", className)}>
            <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-neutral-950/50">
                <div>
                    <h2 className="text-lg font-semibold text-neutral-200">Edit Field</h2>
                    <p className="text-sm text-neutral-500">Configure {field.label}</p>
                </div>
                <div className="flex items-center gap-2">
                    {onCancel && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onCancel}
                            className="text-neutral-400 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="label"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Label</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g. What is your email?" className="bg-neutral-900 border-neutral-800" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Variable Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g. user_email" className="bg-neutral-900 border-neutral-800 font-mono" />
                                        </FormControl>
                                        <FormDescription>Used to reference this field in integrations.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator className="bg-neutral-800" />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Field Type</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                        >
                                            {FIELD_TYPES.map((type) => (
                                                <FormItem key={type.value}>
                                                    <FormControl>
                                                        <RadioGroupItem value={type.value} className="sr-only" />
                                                    </FormControl>
                                                    <FormLabel className="cursor-pointer block h-full">
                                                        <Card className={cn(
                                                            "p-3 h-full transition-all duration-200 cursor-pointer relative overflow-hidden hover:scale-[1.02]",
                                                            field.value === type.value
                                                                ? "border-blue-500/50 bg-blue-500/10 ring-2 ring-blue-500/30 shadow-lg shadow-blue-900/20"
                                                                : "border-neutral-800 bg-neutral-950/50 hover:bg-neutral-900/50 hover:border-neutral-700"
                                                        )}>
                                                            {field.value === type.value && (
                                                                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-0.5 shadow-md">
                                                                    <Check className="h-3 w-3" />
                                                                </div>
                                                            )}
                                                            <div className="flex items-start gap-3">
                                                                <div className={cn(
                                                                    "p-2 rounded-md transition-all duration-200 shrink-0",
                                                                    field.value === type.value
                                                                        ? "bg-blue-500 text-white shadow-md"
                                                                        : "bg-neutral-800/50 text-neutral-400"
                                                                )}>
                                                                    <type.icon className="h-4 w-4" />
                                                                </div>
                                                                <div className="space-y-1 flex-1">
                                                                    <div className={cn(
                                                                        "font-medium text-sm leading-none transition-colors",
                                                                        field.value === type.value ? "text-blue-100" : "text-neutral-200"
                                                                    )}>
                                                                        {type.label}
                                                                    </div>
                                                                    <p className={cn(
                                                                        "text-[11px] leading-snug line-clamp-2 transition-colors",
                                                                        field.value === type.value ? "text-blue-200/60" : "text-neutral-500"
                                                                    )}>
                                                                        {type.description}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    </FormLabel>
                                                </FormItem>
                                            ))}
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {currentType === 'select' && (
                            <div className="space-y-3 bg-neutral-900/50 p-4 rounded-lg border border-neutral-800">
                                <Label>Options</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newOption}
                                        onChange={(e) => setNewOption(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddOption();
                                            }
                                        }}
                                        placeholder="Add option..."
                                        className="bg-neutral-950 border-neutral-800"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleAddOption}
                                        className="bg-neutral-800 hover:bg-neutral-700 text-white"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={currentOptions}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {currentOptions.map((opt, i) => (
                                                <SortableOption
                                                    key={opt} // Using option value as key/id since they are strings
                                                    id={opt}
                                                    value={opt}
                                                    onRemove={() => handleRemoveOption(i)}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                    {(!currentOptions || currentOptions.length === 0) && (
                                        <p className="text-xs text-neutral-500 italic">No options added yet.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <Separator className="bg-neutral-800" />

                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="placeholder"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Placeholder</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g. Enter your answer..." className="bg-neutral-900 border-neutral-800" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="required"
                                render={({ field }) => (
                                    <FormItem className={cn(
                                        "flex flex-row items-center justify-between rounded-lg border p-4 transition-all duration-300",
                                        field.value
                                            ? "border-orange-500/50 bg-orange-500/10 shadow-md shadow-orange-900/20"
                                            : "border-neutral-800 bg-neutral-900/30"
                                    )}>
                                        <div className="space-y-0.5 flex-1">
                                            <div className="flex items-center gap-2">
                                                <FormLabel className="text-base">Required Field</FormLabel>
                                                <span className={cn(
                                                    "text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all duration-300",
                                                    field.value
                                                        ? "bg-orange-500 text-white shadow-sm"
                                                        : "bg-neutral-700 text-neutral-400"
                                                )}>
                                                    {field.value ? "ON" : "OFF"}
                                                </span>
                                            </div>
                                            <FormDescription className={cn(
                                                "transition-colors duration-300",
                                                field.value ? "text-orange-200/70" : "text-neutral-500"
                                            )}>
                                                {field.value
                                                    ? "User must answer this question to proceed."
                                                    : "This field is optional."}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={(checked) => {
                                                    field.onChange(checked);
                                                    toast(checked ? "Field is now required" : "Field is now optional", {
                                                        duration: 2000,
                                                    });
                                                }}
                                                className="data-[state=checked]:bg-orange-500"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </form>
                </Form>
                <div className="pt-6 border-t border-neutral-800 flex gap-3">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 border-red-900/30 text-red-400 hover:bg-red-950 hover:text-red-300 hover:border-red-900/50"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Field
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-neutral-900 border-neutral-800">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-neutral-200">Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription className="text-neutral-400">
                                    This action cannot be undone. This will permanently delete the field <span className="text-neutral-200 font-medium">"{field.label}"</span>.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-transparent border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={onDelete}
                                    className="bg-red-900/50 text-red-200 hover:bg-red-900 border border-red-900"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button
                        type="button"
                        onClick={form.handleSubmit(onSubmit)}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Save Changes
                    </Button>
                </div>

            </div >
        </div >
    );
}

