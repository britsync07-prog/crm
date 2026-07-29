import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return Response.json({ valid: false }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetExpires: { gt: new Date() } },
      select: { id: true },
    });

    return Response.json({ valid: !!user });
  } catch {
    return Response.json({ valid: false }, { status: 500 });
  }
}
