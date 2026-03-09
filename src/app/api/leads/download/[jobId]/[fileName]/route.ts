import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import axios from "axios";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string; fileName: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, fileName } = await params;
    const EXTERNAL_API_BASE_URL = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3000';
    const API_KEY = process.env.EXTERNAL_API_KEY;

    // Call the external scraper securely from the backend
    const response = await axios({
      method: 'get',
      url: `${EXTERNAL_API_BASE_URL}/api/external/jobs/${jobId}/download/${fileName}`,
      headers: {
        'x-api-key': API_KEY,
      },
      responseType: 'stream',
    });

    // Pass through the headers from the scraper (Content-Type, Content-Disposition, etc.)
    const headers = new Headers();
    headers.set("Content-Type", response.headers["content-type"] || "application/octet-stream");
    headers.set("Content-Disposition", response.headers["content-disposition"] || `attachment; filename="${fileName}"`);

    // Return the stream directly to the user
    return new NextResponse(response.data, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Proxy download error:", error.message);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: error.response?.status || 500 }
    );
  }
}
