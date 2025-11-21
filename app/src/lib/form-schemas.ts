import * as z from "zod"

export const fieldSchema = z.object({
    id: z.string(),
    type: z.enum([
        "text",
        "email",
        "phone",
        "url",
        "textarea",
        "number",
        "date",
        "select",
        "boolean",
        "file"
    ]),
    label: z.string().min(1, "Label is required"),
    name: z.string().min(1, "Variable name is required").regex(/^[a-zA-Z0-9_]+$/, "Variable name must contain only letters, numbers, and underscores"),
    required: z.boolean(),
    placeholder: z.string().optional(),
    helperText: z.string().optional(),
    options: z.array(z.string()).optional(),
})

export type FieldFormValues = z.infer<typeof fieldSchema>
