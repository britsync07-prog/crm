import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password || password.length < 6) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetExpires: { gt: new Date() } },
    });

    if (!user) {
      return Response.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetExpires: null },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
