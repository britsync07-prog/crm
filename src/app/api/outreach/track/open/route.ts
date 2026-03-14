import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const ONE_BY_ONE_GIF = Buffer.from(
  "R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
  "base64"
);

export async function GET(request: NextRequest) {
  try {
    const clid = request.nextUrl.searchParams.get("clid");
    if (clid) {
      await prisma.campaignLead.updateMany({
        where: {
          id: clid,
          openedAt: null,
        },
        data: {
          openedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("[OutreachTrack] Open pixel error:", error);
  }

  return new Response(ONE_BY_ONE_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(ONE_BY_ONE_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
