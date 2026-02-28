import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Pages that don't require auth
const PUBLIC_PATHS = ["/"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next()

  // Allow static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/icons") ||
    pathname.includes(".") // static files like sw.js, manifest.json
  ) {
    return NextResponse.next()
  }

  // Check auth cookie
  const userId = request.cookies.get("codemap_user_id")?.value

  if (!userId) {
    // Not logged in — redirect to landing
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Run middleware on all routes except static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}