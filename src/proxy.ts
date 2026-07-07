import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Refreshes the Supabase session cookie and guards /admin routes.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAdminArea =
    pathname.startsWith("/oes/admin") && !pathname.startsWith("/oes/admin/login")

  if (isAdminArea && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/oes/admin/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ["/oes/admin/:path*"],
}
