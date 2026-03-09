import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const job = await db.scrapeJob.findUnique({
      where: { id: jobId, userId: user.id },
      include: {
        logs: { orderBy: { createdAt: "desc" }, take: 20 },
        leads: { select: { id: true, name: true, email: true, company: true, rating: true, website: true, source: true } }
      }
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
