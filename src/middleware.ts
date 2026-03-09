import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

// 1. Specify protected and public routes
const protectedRoutes = ["/", "/customers", "/leads", "/tasks", "/campaigns", "/team", "/calls", "/automations", "/finder", "/deals", "/settings"];
const publicRoutes = ["/login", "/signup", "/landing"];

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  
  // Check if it's an exact public route
  const isPublicRoute = publicRoutes.includes(path);
  
  // Check if it's a protected route or a sub-route of one
  const isProtectedRoute = protectedRoutes.some(route => 
    path === route || (route !== "/" && path.startsWith(route + "/"))
  ) || (path === "/");

  // 3. Decrypt the session from the cookie
  const cookie = req.cookies.get("session")?.value;
  const session = cookie ? await decrypt(cookie).catch(() => null) : null;

  // 4. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !session && !isPublicRoute) {
    return NextResponse.redirect(new URL("/landing", req.nextUrl));
  }

  // 5. Redirect to / if the user is authenticated and trying to access public routes (except landing)
  if (
    isPublicRoute &&
    session &&
    path !== "/landing"
  ) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\.png$).*)"],
};
