import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import type { ApiResponse, ApiError } from '@/types'

/**
 * Creates a standardized API route handler with automatic error handling.
 * 
 * @template T - The type of data returned on success
 * @param handler - Async function containing the route logic
 * @returns Next.js route handler with automatic error handling
 * 
 * @example
 * ```typescript
 * export const GET = createApiHandler(async (req, { params }) => {
 *   const { auth } = await requireAuth()
 *   const { id } = await params
 *   const chatflow = await prisma.chatflow.findUnique({ where: { id } })
 *   return chatflow  // ✅ Returns plain data
 * })
 * // Final response: { success: true, data: chatflow }
 * ```
 * 
 * **IMPORTANT**: Do NOT include `success: true` in your return value.
 * The handler automatically wraps your return value as:
 * `{ success: true, data: <your return value> }`
 * 
 * ❌ BAD:  return { success: true, chatflow }  // Double-wrapped!
 * ✅ GOOD: return { chatflow }                 // Correctly wrapped
 * 
 * Error handling priority:
 * 1. Zod validation errors → 400 Bad Request with field details
 * 2. Prisma known errors → Specific status codes (404, 409, etc.)
 * 3. Application errors → 500 with error message
 * 4. Unknown errors → 500 Generic "Internal server error"
 */
export function createApiHandler<T>(
  handler: (
    req: NextRequest,
    context?: { params?: Promise<Record<string, string>> }
  ) => Promise<T>
) {
  return async (
    req: NextRequest,
    context?: { params?: Promise<Record<string, string>> }
  ): Promise<NextResponse<ApiResponse<T> | ApiError>> => {
    try {
      const data = await handler(req, context)
      return NextResponse.json({
        success: true,
        data
      } as ApiResponse<T>)
    } catch (error) {
      console.error('[API Error]', error)

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: error.errors
          } as ApiError,
          { status: 400 }
        )
      }

      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            return NextResponse.json(
              {
                success: false,
                error: 'A record with this value already exists'
              } as ApiError,
              { status: 409 }
            )
          
          case 'P2025': // Record not found
            return NextResponse.json(
              {
                success: false,
                error: 'Record not found'
              } as ApiError,
              { status: 404 }
            )
          
          case 'P2003': // Foreign key constraint violation
            return NextResponse.json(
              {
                success: false,
                error: 'Invalid reference to related record'
              } as ApiError,
              { status: 400 }
            )
          
          default:
            return NextResponse.json(
              {
                success: false,
                error: 'Database error occurred'
              } as ApiError,
              { status: 500 }
            )
        }
      }

      // Handle application errors
      if (error instanceof Error) {
        return NextResponse.json(
          {
            success: false,
            error: error.message
          } as ApiError,
          { status: 500 }
        )
      }

      // Handle unknown errors
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error'
        } as ApiError,
        { status: 500 }
      )
    }
  }
}

