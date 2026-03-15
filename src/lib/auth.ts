import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = "secret"; // In prod, use process.env.JWT_SECRET
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function login(user: any) {
  const session = await encrypt({ id: user.id, email: user.email, role: user.role });
  const cookieStore = await cookies();
  
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", { expires: new Date(0), path: "/" });
}

export async function getSession(req?: NextRequest) {
  // 1. Try to get session from Authorization header (External API) - Prioritize for speed/reliability
  if (req) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = await decrypt(token);
        if (decoded) return decoded;
      } catch (e) {
        console.error("[Auth] Invalid Bearer token", e);
      }
    }

    // 2. Global API Key support
    const apiKey = req.headers.get("x-api-key");
    const globalApiKey = process.env.GLOBAL_API_KEY || "nexus_super_secret_key";
    
    if (apiKey && apiKey === globalApiKey.trim()) {
      return { id: "system", email: "system@nexus.ai", role: "ADMIN" };
    }
  }

  // 3. Try to get session from cookie (Browser)
  try {
    const cookieStore = await cookies();
    const cookieSession = cookieStore.get("session")?.value;
    if (cookieSession) return await decrypt(cookieSession);
  } catch (e) {
    // cookies() might throw in certain non-request contexts
  }

  return null;
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;

  // Refresh the session so it doesn't expire
  const parsed = await decrypt(session);
  parsed.expires = new Date(Date.now() + 60 * 60 * 24 * 1000);
  const res = NextResponse.next();
  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires,
  });
  return res;
}
