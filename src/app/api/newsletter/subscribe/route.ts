import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { newsletterOptedIn: true },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Subscribe error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
