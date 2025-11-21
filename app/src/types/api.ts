/**
 * Standard API response wrapper for successful responses
 */
export interface ApiResponse<T = unknown> {
  success: true
  data?: T
}

/**
 * Standard API error response
 */
export interface ApiError {
  success: false
  error: string
  details?: unknown
}

/**
 * Union type for all API responses
 */
export type ApiResult<T = unknown> = ApiResponse<T> | ApiError

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

