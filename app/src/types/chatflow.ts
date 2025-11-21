import type { Chatflow, ChatflowSubmission, Workspace } from '@prisma/client'

/**
 * Chatflow with submission count
 */
export type ChatflowWithCount = Chatflow & {
  _count: {
    submissions: number
  }
}

/**
 * Chatflow with workspace details
 */
export type ChatflowWithWorkspace = Chatflow & {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
}

/**
 * Chatflow with full details (workspace + count)
 */
export type ChatflowWithDetails = Chatflow & {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
  _count: {
    submissions: number
  }
}

/**
 * Field types supported by IoZen chatflows
 */
export type FieldType = 
  | 'text'
  | 'email'
  | 'phone'
  | 'url'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'boolean'
  | 'file'

/**
 * Field validation rules
 */
export interface FieldValidation {
  min?: number
  max?: number
  pattern?: string
  message?: string
}

/**
 * Individual chatflow field definition
 */
export interface ChatflowField {
  id: string
  type: FieldType
  label: string
  name: string
  required: boolean
  placeholder?: string
  helperText?: string
  options?: string[]
  validation?: FieldValidation
}

/**
 * Complete chatflow schema structure
 */
export interface ChatflowSchema {
  fields: ChatflowField[]
  settings?: {
    theme?: 'light' | 'dark'
    submitButtonText?: string
    successMessage?: string
  }
}

/**
 * Valid field types for runtime validation
 */
const VALID_FIELD_TYPES: readonly FieldType[] = [
  'text',
  'email',
  'phone',
  'url',
  'textarea',
  'number',
  'date',
  'select',
  'boolean',
  'file'
] as const

/**
 * Type guard to check if a string is a valid FieldType
 */
function isValidFieldType(type: unknown): type is FieldType {
  return typeof type === 'string' && VALID_FIELD_TYPES.includes(type as FieldType)
}

/**
 * Type guard to check if an object is a valid ChatflowSchema
 */
export function isChatflowSchema(obj: unknown): obj is ChatflowSchema {
  if (!obj || typeof obj !== 'object') return false
  const schema = obj as Partial<ChatflowSchema>
  return (
    Array.isArray(schema.fields) &&
    schema.fields.every((field: unknown) => {
      if (!field || typeof field !== 'object') return false
      const f = field as Partial<ChatflowField>
      return (
        typeof f.id === 'string' &&
        isValidFieldType(f.type) &&  // Now validates against allowed FieldType values
        typeof f.label === 'string' &&
        typeof f.name === 'string' &&
        typeof f.required === 'boolean'
      )
    })
  )
}

/**
 * Submission data record (dynamic keys based on field names)
 */
export type SubmissionData = Record<string, string | number | boolean | string[] | null>

/**
 * Submission with all conversation messages
 */
export type SubmissionWithMessages = ChatflowSubmission & {
  messages: Array<{
    id: string
    role: 'AI' | 'USER'
    content: string
    fieldName: string | null
    createdAt: Date
  }>
}

