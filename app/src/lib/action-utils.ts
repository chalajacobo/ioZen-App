import { z } from 'zod'

/**
 * Result type for server actions - can be either success or error
 */
export type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Creates a type-safe server action with automatic validation and error handling.
 * 
 * @template TSchema - Zod schema type for validation
 * @template TResult - Return type on success
 * @param schema - Zod schema to validate input against
 * @param handler - Async function containing the action logic
 * @returns Server action with automatic FormData parsing and error handling
 * 
 * @example
 * ```typescript
 * const updateSchema = z.object({
 *   id: z.string(),
 *   name: z.string().min(1)
 * })
 * 
 * export const updateChatflowAction = createAction(
 *   updateSchema,
 *   async ({ id, name }) => {
 *     const chatflow = await prisma.chatflow.update({
 *       where: { id },
 *       data: { name }
 *     })
 *     return { chatflowId: chatflow.id }
 *   }
 * )
 * ```
 * 
 * Error handling:
 * - Zod validation errors → Returns validation error message
 * - Application errors → Returns error.message
 * - Unknown errors → Returns generic error message
 */
export function createAction<
  TSchema extends z.ZodType,
  TResult
>(
  schema: TSchema,
  handler: (data: z.infer<TSchema>) => Promise<TResult>
): (formData: FormData) => Promise<ActionResult<TResult>> {
  return async (formData: FormData): Promise<ActionResult<TResult>> => {
    try {
      // Extract data from FormData
      const rawData: Record<string, unknown> = {}
      
      for (const [key, value] of formData.entries()) {
        // Handle multiple values for the same key
        if (key in rawData) {
          const existing = rawData[key]
          if (Array.isArray(existing)) {
            existing.push(value)
          } else {
            rawData[key] = [existing, value]
          }
        } else {
          rawData[key] = value
        }
      }

      // Validate data against schema
      const validated = schema.parse(rawData)

      // Execute handler with validated data
      const result = await handler(validated)

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('[Action Error]', error)

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0]
        return {
          success: false,
          error: firstError 
            ? `${firstError.path.join('.')}: ${firstError.message}`
            : 'Validation failed'
        }
      }

      // Handle application errors
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message
        }
      }

      // Handle unknown errors
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }
}

/**
 * Creates a type-safe server action that accepts a plain object instead of FormData.
 * Useful for programmatic calls from client components.
 * 
 * @template TSchema - Zod schema type for validation
 * @template TResult - Return type on success
 * @param schema - Zod schema to validate input against
 * @param handler - Async function containing the action logic
 * @returns Server action with automatic validation and error handling
 * 
 * @example
 * ```typescript
 * export const updateChatflowAction = createObjectAction(
 *   updateSchema,
 *   async (data) => {
 *     const chatflow = await prisma.chatflow.update({
 *       where: { id: data.id },
 *       data: { name: data.name }
 *     })
 *     return { chatflowId: chatflow.id }
 *   }
 * )
 * 
 * // Usage in client component:
 * await updateChatflowAction({ id: '123', name: 'New Name' })
 * ```
 */
export function createObjectAction<
  TSchema extends z.ZodType,
  TResult
>(
  schema: TSchema,
  handler: (data: z.infer<TSchema>) => Promise<TResult>
): (data: unknown) => Promise<ActionResult<TResult>> {
  return async (data: unknown): Promise<ActionResult<TResult>> => {
    try {
      // Validate data against schema
      const validated = schema.parse(data)

      // Execute handler with validated data
      const result = await handler(validated)

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('[Action Error]', error)

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0]
        return {
          success: false,
          error: firstError 
            ? `${firstError.path.join('.')}: ${firstError.message}`
            : 'Validation failed'
        }
      }

      // Handle application errors
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message
        }
      }

      // Handle unknown errors
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }
}

