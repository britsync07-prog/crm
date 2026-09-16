/**
 * Route utility functions for BritCRM.
 * Central single source of truth for classifying public vs. authenticated dashboard routes.
 */

/**
 * Determines whether a given pathname belongs to a public or standalone page
 * that must NEVER display internal CRM navigation (Sidebar, TopNavbar, TrialGate, Spacers).
 */
export function isStandalonePublicRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;

  // Normalize: remove query params / hashes if any, trim trailing slashes, lowercase
  const cleanPath = pathname.split("?")[0].split("#")[0].trim().toLowerCase();
  const normalized = cleanPath === "/" ? "/" : cleanPath.replace(/\/+$/, "");

  // Root landing or marketing
  if (normalized === "" || normalized === "/" || normalized === "/landing") {
    return true;
  }

  // Exact public marketing & auth routes
  const exactPublicRoutes = new Set([
    "/login",
    "/signup",
    "/pricing",
    "/contact",
    "/terms",
    "/privacy",
    "/forgot-password",
    "/unsubscribe",
    "/portal",
    "/social",
  ]);

  if (exactPublicRoutes.has(normalized)) {
    return true;
  }

  // Prefix matches for public standalone flows
  const prefixPublicRoutes = [
    "/f/",                 // Public forms (e.g. /f/123)
    "/f",                  // Public form root
    "/book/",              // Calendly public scheduling (e.g. /book/nafis, /book/nafis/30-min-meeting)
    "/book",               // Booking root
    "/meet/",              // Public video rooms (e.g. /meet/0unei6kv)
    "/meet",               // Meeting root
    "/invite/",            // Workspace & org invites (e.g. /invite/abc, /invite/org/xyz)
    "/reset-password/",    // Password reset with token
    "/reset-password",     // Password reset root
    "/onboarding/portal/", // Client onboarding portal (tokenized)
    "/onboarding/sign/",   // Client document e-signing (tokenized)
    "/oauth/authorize",    // OAuth consent screen
    "/mcp/docs",           // Public MCP developer documentation
    "/features/",          // Marketing feature tours
    "/solutions/",         // Marketing solutions
    "/vision/",            // Vision & manifesto
    "/admin",              // Admin panel (has dedicated AdminSidebar & AdminLayout)
  ];

  return prefixPublicRoutes.some((prefix) => normalized.startsWith(prefix));
}
