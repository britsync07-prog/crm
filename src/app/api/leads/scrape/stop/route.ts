import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const job = await db.scrapeJob.findUnique({
      where: { id: jobId, userId: user.id }
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await db.scrapeJob.update({
      where: { id: jobId },
      data: { status: "Stopped" }
    });

    if (db.scrapeLog) {
      await db.scrapeLog.create({
        data: { jobId, message: "User requested to stop scraping.", level: "WARN" }
      });
    }

    return NextResponse.json({ success: true, message: "Stop request sent" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
