import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const instance = await prisma.onboardingInstance.findUnique({
      where: { id },
      select: { id: true, secureToken: true, tokenExpiresAt: true, status: true },
    });

    if (!instance) {
      return NextResponse.json({ success: false, error: "Instance not found" }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const portalUrl = `${baseUrl}/onboarding/portal/${instance.secureToken}`;

    return NextResponse.json({
      success: true,
      portalUrl,
      token: instance.secureToken,
      expiresAt: instance.tokenExpiresAt,
      isExpired: new Date() > new Date(instance.tokenExpiresAt),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return GET(req, { params });
}
