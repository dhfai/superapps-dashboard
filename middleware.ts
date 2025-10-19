import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Daftar routes yang memerlukan autentikasi
const protectedRoutes = ['/dashboard']

// Daftar routes yang hanya untuk guest (tidak boleh diakses saat sudah login)
const authRoutes = ['/login', '/register', '/forgot-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get token from cookie (kita akan set cookie saat login)
  const token = request.cookies.get('auth_token')?.value

  // Cek apakah user sudah login
  const isAuthenticated = !!token

  // Proteksi routes yang memerlukan login
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Routes untuk guest only (login, register, dll)
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Jika mengakses protected route tanpa login, redirect ke login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Jika sudah login dan mengakses auth routes (login/register), redirect ke dashboard
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Config untuk matcher - tentukan routes mana yang akan di-check oleh middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|images|logos|.*\\..*$).*)',
  ],
}
