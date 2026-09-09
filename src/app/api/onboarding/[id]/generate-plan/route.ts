import { NextResponse } from "next/server";
import { generateOnboardingPlan } from "@/lib/onboarding/ai-engine";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const instance = await prisma.onboardingInstance.findUnique({
      where: { id },
    });
    if (!instance) {
      return NextResponse.json({ success: false, error: "Instance not found" }, { status: 404 });
    }

    const details = body.details || (instance.commercialDetails ? JSON.parse(instance.commercialDetails) : {});
    const plan = await generateOnboardingPlan(id, details);

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
