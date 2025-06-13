import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    let user = null;

    try {
      // Use getUser() for better security - it verifies the token with Supabase servers
      const { data, error } = await supabase.auth.getUser();

      if (!error) {
        user = data.user;
      }
    } catch {
      // Handle auth errors gracefully - user not authenticated
    }

    const { pathname } = request.nextUrl;

    // Protected routes
    const protectedRoutes = ["/dashboard", "/reports"];
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // Auth routes - only /login and /register
    const authRoutes = ["/login", "/register"];
    const isAuthRoute = authRoutes.includes(pathname);

    // Redirect homepage to login page
    if (pathname === "/") {
      if (user) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    // If accessing protected route without authentication, redirect to login
    if (!user && isProtectedRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // If accessing auth route with valid authentication, redirect to dashboard
    if (user && isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return supabaseResponse;
  } catch (error) {
    console.error("Middleware error:", error);
    return supabaseResponse;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
