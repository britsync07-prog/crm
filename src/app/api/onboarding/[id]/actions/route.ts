import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actions = await prisma.aIAction.findMany({
      where: { onboardingId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, actions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
