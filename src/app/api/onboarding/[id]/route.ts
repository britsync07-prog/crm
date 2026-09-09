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
      include: {
        client: true,
        deal: true,
        template: true,
        owner: { select: { id: true, name: true, email: true } },
        actions: { orderBy: { createdAt: "asc" } },
        documents: {
          include: { versions: { orderBy: { versionNumber: "desc" } } },
        },
        signatureRequests: {
          include: { signatories: true },
        },
        responses: { orderBy: { submittedAt: "desc" } },
        exceptions: { orderBy: { detectedAt: "desc" } },
      },
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, error: "Onboarding instance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, instance });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
