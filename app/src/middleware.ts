import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Middleware for authentication and route protection.
 *
 * Protected routes:
 * - /w/* - Workspace routes (dashboard, chatflows, settings)
 *
 * Public routes:
 * - / - Landing page
 * - /login - Login page
 * - /signup - Signup page
 * - /c/* - Public chatflow pages
 * - /auth/* - Auth callbacks
 */
export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const { pathname } = request.nextUrl

  // Define route patterns
  const isProtectedRoute = pathname.startsWith('/w')
  const isAuthRoute = pathname === '/login' || pathname === '/signup'
  const isPublicChatflow = pathname.startsWith('/c/')
  const isAuthCallback = pathname.startsWith('/auth/')

  // Allow public routes without modification
  if (isPublicChatflow || isAuthCallback) {
    return supabaseResponse
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    const redirectUrl = new URL('/w', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect unauthenticated users to login for protected routes
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    // Store the original URL to redirect back after login
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
